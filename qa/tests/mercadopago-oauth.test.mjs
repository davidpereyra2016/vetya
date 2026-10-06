// Real local HTTP/MongoDB, mocked Mercado Pago SDK. Never uses backend/.env.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

for (const key of Object.keys(process.env)) if (/MONGO|REDIS|UPSTASH|^MP_|MERCADOPAGO|CLOUDINARY|RESEND|EMAIL_/.test(key)) delete process.env[key];
Object.assign(process.env, { NODE_ENV: 'production', JWT_SECRET: randomBytes(32).toString('hex'),
  MP_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('hex'), MP_ACCESS_TOKEN: 'TEST-mock-platform',
  MP_CLIENT_ID: 'isolated-app', MP_CLIENT_SECRET: 'isolated-secret', MP_REDIRECT_URI: 'https://example.invalid/api/pagos/mercadopago/connect',
  BACKEND_URL: 'https://example.invalid', MP_WEBHOOK_SECRET: randomBytes(32).toString('hex') });
const require = createRequire(import.meta.url);
const { MongoMemoryServer } = require(process.env.QA_MONGO_MODULE || join(tmpdir(), 'vetya-qa-tools/node_modules/mongodb-memory-server'));
const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
const express = (await import('../../backend/node_modules/express/index.js')).default;
const jwt = (await import('../../backend/node_modules/jsonwebtoken/index.js')).default;
const { OAuth, Preference, MerchantOrder, Payment } = await import('../../backend/node_modules/mercadopago/dist/index.js');
const User = (await import('../../backend/src/models/User.js')).default;
const Provider = (await import('../../backend/src/models/Prestador.js')).default;
const Pago = (await import('../../backend/src/models/Pago.js')).default;
const State = (await import('../../backend/src/models/MercadoPagoOAuthState.js')).default;
const router = (await import('../../backend/src/routes/pagoRoutes.js')).default;
const mp = await import('../../backend/src/lib/mercadopago.js');
const { sellerCredential } = await import('../../backend/src/services/mercadoPagoSellerService.js');
const { createServiceCheckout, reconcilePayment, notificationUrl } = await import('../../backend/src/services/mercadoPagoService.js');

test('OAuth, seller isolation, refresh and Checkout Pro reconciliation', async t => {
  mock.method(console, 'log', () => {}); mock.method(console, 'info', () => {}); mock.method(console, 'error', () => {});
  let mongo, server, refreshCount = 0, refreshMode = 'ok';
  const tokenCalls = [], checkoutTokens = [], orders = new Map(), payments = new Map();
  const credentials = id => ({ access_token: `seller-token-${id}`, refresh_token: `seller-refresh-${id}`,
    user_id: id, expires_in: 3600, scope: 'read write offline_access', live_mode: false, token_type: 'bearer' });
  mock.method(OAuth.prototype, 'create', async ({ body }) => {
    tokenCalls.push(body); return credentials(body.code === 'seller-b' ? '222' : '111');
  });
  mock.method(OAuth.prototype, 'refresh', async ({ body }) => {
    refreshCount++; await new Promise(resolve => setTimeout(resolve, 100));
    if (refreshMode === 'fail') throw { status: 400, error: 'invalid_grant' };
    const id = body.refresh_token.includes('222') ? '222' : '111';
    return { ...credentials(refreshMode === 'wrong-seller' ? '333' : id), access_token: `renewed-${id}`, refresh_token: `rotated-${id}` };
  });
  mock.method(Preference.prototype, 'create', async function({ body }) {
    checkoutTokens.push({ token: this.config.accessToken, fee: body.marketplace_fee });
    return { id: randomUUID(), init_point: 'https://example.invalid/checkout' };
  });
  mock.method(MerchantOrder.prototype, 'get', async ({ merchantOrderId }) => orders.get(String(merchantOrderId)));
  mock.method(Payment.prototype, 'get', async ({ id }) => payments.get(String(id)));
  try {
    mongo = await MongoMemoryServer.create({ instance: { dbName: 'mp_oauth_disposable', ip: '127.0.0.1' } });
    assert.match(mongo.getUri(), /^mongodb:\/\/127\.0\.0\.1:/);
    await mongoose.connect(mongo.getUri());
    await Promise.all([State.init(), Provider.init(), Pago.init()]);
    const app = express(); app.use(express.json()); app.use('/api/pagos', router);
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/pagos/mercadopago`;
    const user = () => User.create({ username: randomUUID(), email: `${randomUUID()}@example.invalid`,
      password: randomBytes(20).toString('hex'), role: 'provider', emailVerified: true });
    const a = await user(), b = await user();
    const providerA = await Provider.create({ usuario: a._id, nombre: 'QA A', tipo: 'Veterinario' });
    const providerB = await Provider.create({ usuario: b._id, nombre: 'QA B', tipo: 'Veterinario' });
    const request = async (who, path, options = {}) => {
      const r = await fetch(base + path, { redirect: 'manual', ...options, headers: { 'Content-Type': 'application/json',
        ...(who ? { Authorization: `Bearer ${jwt.sign({ userId: String(who._id) }, process.env.JWT_SECRET)}` } : {}), ...options.headers } });
      const raw = await r.text(); let data; try { data = JSON.parse(raw); } catch { data = raw; }
      return { status: r.status, data };
    };
    const start = async who => { const r = await request(who, '/connect-url'); assert.equal(r.status, 200); return new URL(r.data.authorizationUrl); };
    const callback = (url, code = 'seller-a') => request(null, `/connect?${new URLSearchParams({ state: url.searchParams.get('state'), code })}`);
    await t.test('start requires authentication', async () => assert.equal((await request(null, '/connect-url')).status, 401));
    let urlA;
    await t.test('OAuth uses exact HTTPS callback and S256 PKCE', async () => {
      urlA = await start(a); assert.equal(urlA.searchParams.get('redirect_uri'), process.env.MP_REDIRECT_URI);
      assert.equal(urlA.searchParams.get('code_challenge_method'), 'S256');
      const stored = await State.collection.findOne({ prestadorId: providerA._id });
      assert.match(stored.codeVerifier, /^mpenc:v1:/); assert.equal(String(stored.usuarioId), String(a._id));
    });
    await t.test('state survives a fresh module instance', async () => {
      const url = new URL(await mp.getMercadoPagoAuthorizationUrl({ prestadorId: providerA._id }));
      const fresh = await import(`../../backend/src/lib/mercadopago.js?restart=${randomUUID()}`);
      assert.equal((await fresh.resolveMercadoPagoOAuthState(url.searchParams.get('state'))).prestadorId, String(providerA._id));
    });
    await t.test('tampered state cannot exchange a code', async () => {
      const count = tokenCalls.length;
      assert.equal((await request(null, '/connect?code=bad&state=invalid')).status, 400); assert.equal(tokenCalls.length, count);
    });
    await t.test('callback persists seller credentials encrypted and hides them from JSON', async () => {
      assert.equal((await callback(urlA)).status, 200);
      const seller = await Provider.findById(providerA._id).select('+mercadoPago.accessToken +mercadoPago.refreshToken');
      assert.equal(seller.mercadoPago.accessToken, 'seller-token-111');
      assert.equal(seller.mercadoPago.userId, '111'); assert.equal(seller.mercadoPago.conectado, true);
      const raw = await Provider.collection.findOne({ _id: providerA._id }); assert.match(raw.mercadoPago.accessToken, /^mpenc:v1:/);
      assert.equal(seller.toJSON().mercadoPago.accessToken, undefined);
      assert.equal(tokenCalls.at(-1).redirect_uri, process.env.MP_REDIRECT_URI);
      assert.equal(typeof tokenCalls.at(-1).code_verifier, 'string');
    });
    await t.test('callback is single-use', async () => assert.equal((await callback(urlA)).status, 400));
    await t.test('second provider connects an independent seller', async () => {
      assert.equal((await callback(await start(b), 'seller-b')).status, 200);
      assert.equal((await sellerCredential(providerB._id)).mercadoPago.accessToken, 'seller-token-222');
    });
    await t.test('cannot assign the same seller to a second provider', async () => {
      assert.equal((await callback(await start(b), 'seller-a')).status, 409);
      assert.equal((await Provider.findById(providerB._id)).mercadoPago.userId, '222');
    });
    await t.test('latest OAuth attempt invalidates earlier authorization', async () => {
      const old = await start(a), latest = await start(a);
      assert.equal((await callback(old)).status, 409); assert.equal((await callback(latest)).status, 200);
    });
    await t.test('authorization denial is reported without token exchange', async () => {
      const url = await start(a), count = tokenCalls.length;
      const r = await request(null, '/connect?' + new URLSearchParams({ state: url.searchParams.get('state'), error: 'access_denied' }));
      assert.equal(r.status, 400); assert.equal(r.data.code, 'access_denied'); assert.equal(tokenCalls.length, count);
    });
    await t.test('unlink invalidates outstanding callbacks and blocks new charges', async () => {
      const pending = await start(a);
      assert.equal((await request(a, '/disconnect', { method: 'POST' })).status, 200);
      assert.equal((await callback(pending)).status, 409);
      await assert.rejects(() => sellerCredential(providerA._id, { requireConnected: true }), { status: 409 });
      assert.equal((await request(a, '/connect-status')).data.conectado, false);
    });
    await t.test('reconnection updates frontend connection status', async () => {
      assert.equal((await callback(await start(a))).status, 200);
      const r = await request(a, '/connect-status'); assert.equal(r.data.conectado, true);
      assert.equal(r.data.mercadoPago.accessToken, undefined);
    });
    await t.test('concurrent requests rotate tokens only once', async () => {
      await Provider.updateOne({ _id: providerA._id }, { $set: { 'mercadoPago.expiresAt': new Date(Date.now() - 1000) } });
      const before = refreshCount;
      const results = await Promise.all([sellerCredential(providerA._id), sellerCredential(providerA._id)]);
      assert.equal(refreshCount - before, 1); assert.ok(results.every(s => s.mercadoPago.accessToken === 'renewed-111'));
      assert.equal((await sellerCredential(providerA._id)).mercadoPago.refreshToken, 'rotated-111');
    });
    await t.test('failed refresh preserves credentials and releases the lock', async () => {
      await Provider.updateOne({ _id: providerB._id }, { $set: { 'mercadoPago.expiresAt': new Date(Date.now() - 1000) } });
      refreshMode = 'fail'; await assert.rejects(() => sellerCredential(providerB._id), { status: 503 });
      const raw = await Provider.collection.findOne({ _id: providerB._id }); assert.equal(raw.mercadoPago.refreshLockId, undefined);
      assert.match(raw.mercadoPago.accessToken, /^mpenc:v1:/); refreshMode = 'ok';
    });
    await t.test('refresh cannot replace seller identity', async () => {
      refreshMode = 'wrong-seller'; await assert.rejects(() => sellerCredential(providerB._id), { status: 503 });
      assert.equal((await Provider.findById(providerB._id)).mercadoPago.userId, '222'); refreshMode = 'ok';
      await sellerCredential(providerB._id);
    });
    await t.test('cita and emergencia use their respective seller tokens and 30% fee', async () => {
      for (const [provider, tipo, token] of [[providerA, 'Cita', 'renewed-111'], [providerB, 'Emergencia', 'renewed-222']]) {
        const id = new mongoose.Types.ObjectId();
        await createServiceCheckout({ prestador: provider, preferenceData: { items: [{ unit_price: 10000, quantity: 1 }], external_reference: String(id) },
          pagoData: { usuario: a._id, prestador: provider._id, referencia: { tipo, id }, concepto: tipo, monto: 10000, metodoPago: 'MercadoPago' } });
        assert.deepEqual(checkoutTokens.at(-1), { token, fee: 3000 });
      }
    });
    const pago = await Pago.findOne({ prestador: providerA._id });
    const payment = { id: '501', order: { id: '601', type: 'mercadopago' }, collector_id: 111,
      transaction_amount: 10000, currency_id: 'ARS', live_mode: false, external_reference: pago.mercadoPago.externalReference,
      status: 'approved', date_last_updated: new Date().toISOString(), transaction_details: { net_received_amount: 6500 },
      fee_details: [{ type: 'application_fee', amount: 3000 }, { type: 'mercadopago_fee', amount: 500 }] };
    orders.set('601', { preference_id: pago.mercadoPago.preferenceId, external_reference: pago.mercadoPago.externalReference, payments: [{ id: '501' }] });
    await t.test('real Payments API shape resolves preference through merchant order', async () => {
      const result = await reconcilePayment(payment); assert.equal(result.estado, 'Pagado');
      assert.equal(result.mercadoPago.netReceivedAmount, 6500); assert.equal(result.mercadoPago.marketplaceFee, 3000);
    });
    await t.test('duplicate notification does not duplicate financial evidence', async () => {
      await reconcilePayment(payment); assert.equal((await Pago.findById(pago._id)).paymentEvidence.length, 1);
    });
    await t.test('wrong merchant order is rejected', async () => {
      orders.set('601', { preference_id: 'wrong', external_reference: pago.mercadoPago.externalReference, payments: [{ id: '501' }] });
      await assert.rejects(() => reconcilePayment(payment), { status: 409 });
      orders.get('601').preference_id = pago.mercadoPago.preferenceId;
    });
    await t.test('valid signed webhook reconciles refund', async () => {
      payments.set('501', { ...payment, status: 'refunded', date_last_updated: new Date(Date.now() + 1000).toISOString() });
      const ts = String(Math.floor(Date.now() / 1000)), requestId = randomUUID();
      const signature = createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(`id:501;request-id:${requestId};ts:${ts};`).digest('hex');
      const r = await request(null, '/webhook?data.id=501', { method: 'POST', body: JSON.stringify({ type: 'payment', user_id: 111, data: { id: '501' } }),
        headers: { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${signature}` } });
      assert.equal(r.status, 200); assert.equal((await Pago.findById(pago._id)).estado, 'Reembolsado');
    });
    await t.test('public webhook uses APP_URL when local BACKEND_URL is HTTP', async () => {
      const old = process.env.BACKEND_URL; process.env.BACKEND_URL = 'http://localhost:3000'; process.env.APP_URL = 'https://example.invalid';
      assert.equal(notificationUrl(), 'https://example.invalid/api/pagos/mercadopago/webhook');
      process.env.BACKEND_URL = old; delete process.env.APP_URL;
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect(); if (mongo) await mongo.stop(); mock.restoreAll();
  }
});
