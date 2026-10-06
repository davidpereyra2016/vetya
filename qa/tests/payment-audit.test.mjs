// node --test qa/tests/payment-audit.test.mjs
// Real HTTP/JWT/MongoDB; Mercado Pago SDK responses are MOCKED. Never a live-payment test.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync } from 'node:fs';
process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
for (const key of Object.keys(process.env)) if (/MONGO|REDIS|UPSTASH|^MP_|MERCADOPAGO|CLOUDINARY|RESEND|EMAIL_/.test(key)) delete process.env[key];
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.MP_ACCESS_TOKEN = 'TEST-isolated-never-network';
process.env.MP_CLIENT_ID = 'qa-local-application';
process.env.MP_REDIRECT_URI = 'https://example.invalid/oauth';
process.env.BACKEND_URL = 'https://example.invalid';
process.env.MP_WEBHOOK_SECRET = randomBytes(32).toString('hex');
const require = createRequire(import.meta.url);
const { MongoMemoryReplSet } = require(resolve(process.env.QA_MONGO_MODULE || join(tmpdir(), 'vetya-qa-tools/node_modules/mongodb-memory-server')));
const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
const express = (await import('../../backend/node_modules/express/index.js')).default;
const jwt = (await import('../../backend/node_modules/jsonwebtoken/index.js')).default;
const { Preference, Payment: MPPayment } = await import('../../backend/node_modules/mercadopago/dist/index.js');
const User = (await import('../../backend/src/models/User.js')).default;
const Pet = (await import('../../backend/src/models/Mascota.js')).default;
const Provider = (await import('../../backend/src/models/Prestador.js')).default;
const Emergency = (await import('../../backend/src/models/Emergencia.js')).default;
const Appointment = (await import('../../backend/src/models/Cita.js')).default;
const Service = (await import('../../backend/src/models/Servicio.js')).default;
const Availability = (await import('../../backend/src/models/Disponibilidad.js')).default;
const Payment = (await import('../../backend/src/models/Pago.js')).default;
const Idempotency = (await import('../../backend/src/models/IdempotencyKey.js')).default;
const mp = await import('../../backend/src/lib/mercadopago.js');
const paymentRouter = (await import('../../backend/src/routes/pagoRoutes.js')).default;
const appointmentRouter = (await import('../../backend/src/routes/citaRoutes.js')).default;
const emergencyRouter = (await import('../../backend/src/routes/emergenciaRoutes.js')).default;
const { sanitizeRequest } = await import('../../backend/src/utils/routePerformance.js');
const evidence = { environment: 'ephemeral localhost; Mercado Pago mocked', cases: [], ids: [] };

test('payment audit - real local DB and routes, mocked payment provider', async t => {
  mock.method(console, 'log', () => {});
  mock.method(console, 'info', () => {});
  mock.method(console, 'error', () => {});
  const calls = [];
  const payments = new Map();
  mock.method(Preference.prototype, 'create', async function ({ body }) {
    calls.push(body);
    await new Promise(r => setTimeout(r, 30));
    return { id: `mock-pref-${randomUUID()}`, init_point: 'https://example.invalid/mock-checkout', collector_id: 2261865975 };
  });
  mock.method(MPPayment.prototype, 'get', async ({ id }) => {
    if (!payments.has(String(id))) throw new Error('MOCK_PAYMENT_NOT_FOUND');
    return payments.get(String(id));
  });
  mock.method(MPPayment.prototype, 'search', async ({ options }) => ({ results: [...payments.values()].filter(p => p.external_reference === options.external_reference).map(p => ({ id: p.id })) }));
  let mongo, server;
  try {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, dbName: 'vetya_payment_qa_disposable', ip: '127.0.0.1' } });
    assert.match(mongo.getUri(), /^mongodb:\/\/127\.0\.0\.1:/);
    await mongoose.connect(mongo.getUri());
    await Promise.all([Payment.init(), Idempotency.init(), Provider.init(), Service.init(), Appointment.init(), Availability.init()]);
    const app = express(); app.use(express.json()); app.use(sanitizeRequest);
    app.use('/api/pagos', paymentRouter); app.use('/api/citas', appointmentRouter); app.use('/api/emergencias', emergencyRouter);
    server = app.listen(0, '127.0.0.1');
    await new Promise(r => server.once('listening', r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const user = role => User.create({ username: `qa-${randomUUID()}`, email: `${randomUUID()}@example.invalid`, password: randomBytes(20).toString('hex'), role, emailVerified: true });
    const buyer = await user('client'), seller = await user('provider'), outsider = await user('client');
    const provider = await Provider.create({ usuario: seller._id, nombre: 'Prestador QA aislado', tipo: 'Veterinario', estadoValidacion: 'aprobado', precioEmergencia: 10000, mercadoPago: { conectado: true, accessToken: 'TEST-mock-seller', userId: '2261865975', liveMode: false }, horarios: Array.from({ length: 7 }, (_, dia) => ({ dia, manana: { activo: true, apertura: '08:00', cierre: '12:00' }, tarde: { activo: true, apertura: '14:00', cierre: '20:00' } })) });
    const pet = await Pet.create({ propietario: buyer._id, nombre: 'Mascota QA', tipo: 'Perro', raza: 'Mestizo', edad: '3', genero: 'Macho' });
    const service = await Service.create({ nombre: 'Consulta QA', descripcion: 'Prueba aislada', precio: 10000, duracion: 30, tipoPrestador: 'Veterinario', prestadorId: provider._id });
    const api = async (who, path, method = 'GET', body, key = randomUUID(), headers = {}) => {
      const r = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(who ? { Authorization: `Bearer ${jwt.sign({ userId: String(who._id) }, process.env.JWT_SECRET, { expiresIn: '5m' })}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
      const raw = await r.text(); let data; try { data = JSON.parse(raw); } catch { data = raw; }
      return { status: r.status, data };
    };
    const check = (name, fn) => t.test(name, async () => {
      try { const detail = await fn(); evidence.cases.push({ name, result: 'PASS', detail }); }
      catch (e) { evidence.cases.push({ name, result: 'FAIL', actual: e.actual, expected: e.expected, message: e.message }); throw e; }
    });
    const reference = async type => {
      if (type === 'Emergencia') return Emergency.create({ usuario: buyer._id, mascota: pet._id, veterinario: provider._id, descripcion: 'Prueba de pago aislada', tipoEmergencia: 'Otro', estado: 'Asignada', costoTotal: 10000, ubicacion: { direccion: 'Lugar sintetico QA', ciudad: 'Formosa', coordenadas: { lat: -26, lng: -58 } } });
      return Appointment.create({ usuario: buyer._id, mascota: pet._id, prestador: provider._id, servicio: service._id, fecha: new Date(Date.now() + 86400000), horaInicio: '10:00', horaFin: '10:30', estado: 'Confirmada', costoEstimado: 10000, metodoPago: 'MercadoPago' });
    };
    const prefer = (ref, type, amount = 10000, who = buyer, key = randomUUID()) => api(who, '/api/pagos/mercadopago/create-preference', 'POST', { [type === 'Cita' ? 'citaId' : 'emergenciaId']: String(ref._id), monto: amount }, key);
    const pending = async type => { const ref = await reference(type); const r = await prefer(ref, type); assert.equal(r.status, 201); evidence.ids.push({ type, referenceId: String(ref._id), paymentId: r.data.pago._id, preferenceId: r.data.preferenceId, providerId: String(provider._id), synthetic: true }); return { ref, pago: r.data.pago }; };
    const notify = async (pago, status, changes = {}, signed = true) => {
      const id = String(changes.id || `mock-pay-${randomUUID()}`);
      payments.set(id, { id, date_last_updated: new Date().toISOString(), status, status_detail: status === 'approved' ? 'accredited' : status, transaction_amount: 10000, currency_id: 'ARS', collector_id: 2261865975, payer: { id: 2265061648 }, external_reference: `${pago.referencia.tipo}_${pago.referencia.id}_${buyer._id}`, preference_id: pago.mercadoPago.preferenceId, live_mode: false, ...changes });
      const requestId = randomUUID(), ts = String(Math.floor(Date.now() / 1000));
      const signature = createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex');
      const response = await api(null, `/api/pagos/mercadopago/webhook?data.id=${id}`, 'POST', { type: 'payment', user_id: 2261865975, data: { id } }, null, signed ? { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${signature}` } : {});
      // Route acknowledges before persistence. Wait for DB change, bounded to 1 second.
      for (let n = 0; n < 50; n++) { const current = await Payment.findById(pago._id); if (current.mercadoPago.paymentId === id) break; await new Promise(r => setTimeout(r, 20)); }
      return { response, stored: await Payment.findById(pago._id), id };
    };
    await check('unauthenticated preference is rejected', async () => assert.equal((await api(null, '/api/pagos/mercadopago/create-preference', 'POST', {})).status, 401));
    await check('missing idempotency key is rejected', async () => assert.equal((await api(buyer, '/api/pagos/mercadopago/create-preference', 'POST', {}, null)).status, 400));
    for (const type of ['Emergencia', 'Cita']) {
      await check(`${type}: create preference and persist split metadata`, async () => { const { pago } = await pending(type); assert.equal(pago.mercadoPago.marketplaceFee, 3000); assert.equal(pago.mercadoPago.sellerNetAmount, 7000); assert.equal(pago.estado, 'Pendiente'); });
      await check(`${type}: another buyer cannot create payment`, async () => { const ref = await reference(type); assert.equal((await prefer(ref, type, 10000, outsider)).status, 403); });
      await check(`${type}: altered client amount must be rejected or corrected`, async () => { const ref = await reference(type); const r = await prefer(ref, type, 1); assert.ok(r.status >= 400 || r.data.pago.monto === 10000, `HTTP ${r.status}; persisted amount ${r.data.pago?.monto} instead of 10000`); });
      for (const [status, expected] of [['approved', 'Pagado'], ['rejected', 'Fallido'], ['pending', 'Pendiente'], ['in_process', 'Procesando']]) {
        await check(`${type}: mocked ${status} maps to ${expected}`, async () => { const { pago } = await pending(type); const result = await notify(pago, status, status === 'approved' ? { transaction_details: { net_received_amount: 6840 }, fee_details: [{ type: 'mercadopago_fee', amount: 160 }] } : {}); assert.equal(result.stored.estado, expected); if (status === 'approved') { assert.equal(result.stored.mercadoPago.netReceivedAmount, 6840); assert.equal(result.stored.paymentEvidence.length, 1); } });
      }
    }
    await check('same key replay persists one payment', async () => { const ref = await reference('Cita'), key = randomUUID(); const a = await prefer(ref, 'Cita', 10000, buyer, key); const b = await prefer(ref, 'Cita', 10000, buyer, key); assert.equal(a.status, 201); assert.equal(b.status, 200); assert.equal(b.data.pago._id, a.data.pago._id); assert.equal(b.data.idempotentReplay, true); });
    await check('same key with changed payload rejected', async () => { const ref = await reference('Cita'), key = randomUUID(); await prefer(ref, 'Cita', 10000, buyer, key); assert.equal((await prefer(ref, 'Cita', 2, buyer, key)).status, 409); });
    await check('concurrent distinct keys for one service must not duplicate preferences', async () => { const ref = await reference('Cita'); const before = calls.length; await Promise.all([prefer(ref, 'Cita'), prefer(ref, 'Cita')]); assert.equal(calls.length - before, 1); assert.equal(await Payment.countDocuments({ 'referencia.id': ref._id }), 1); });
    await check('unsigned webhook must not mark paid', async () => { const { pago } = await pending('Cita'); const r = await notify(pago, 'approved', {}, false); assert.notEqual(r.stored.estado, 'Pagado'); });
    for (const [name, fields] of [['wrong amount', { transaction_amount: 1 }], ['wrong collector', { collector_id: 999 }], ['wrong currency', { currency_id: 'USD' }], ['missing preference', { preference_id: null }], ['wrong owner/reference type', { external_reference: 'Emergencia_000000000000000000000099_000000000000000000000099' }]]) {
      await check(`webhook ${name} must not mark paid`, async () => { const { pago } = await pending('Cita'); const r = await notify(pago, 'approved', fields); assert.notEqual(r.stored.estado, 'Pagado'); });
    }
    await check('duplicate webhook must preserve approved timestamp', async () => { const { pago } = await pending('Cita'); const first = await notify(pago, 'approved', { id: `dup-${randomUUID()}` }); await new Promise(r => setTimeout(r, 25)); await notify(pago, 'approved', { id: first.id }); await new Promise(r => setTimeout(r, 100)); assert.equal((await Payment.findById(pago._id)).fechaPago.getTime(), first.stored.fechaPago.getTime()); });
    await check('late older rejected notification must not overwrite approved payment', async () => { const { pago } = await pending('Cita'); await notify(pago, 'approved', { date_last_updated: '2026-09-24T20:00:00Z' }); await notify(pago, 'rejected', { date_last_updated: '2026-09-23T20:00:00Z' }); assert.equal((await Payment.findById(pago._id)).estado, 'Pagado'); });
    await check('unknown MP payment must not approve a local record', async () => { const { pago } = await pending('Cita'); const r = await api(null, '/api/pagos/mercadopago/webhook', 'POST', { type: 'payment', data: { id: 'not-found' } }); assert.equal((await Payment.findById(pago._id)).estado, 'Pendiente'); return { acknowledgment: r.status, providerLookup: 'mock 404' }; });
    await check('client cannot mark another users payment completed', async () => { const { pago } = await pending('Cita'); const r = await api(outsider, `/api/pagos/${pago._id}/estado`, 'PATCH', { estado: 'Completado' }); assert.ok([401, 403].includes(r.status), `HTTP ${r.status}; state ${r.data.estado}`); });
    await check('provider cannot approve payment without MP verification', async () => { const { pago } = await pending('Cita'); const r = await api(seller, `/api/pagos/${pago._id}/estado`, 'PATCH', { estado: 'Completado' }); assert.ok([401, 403].includes(r.status), `HTTP ${r.status}; state ${r.data.estado}`); });
    await check('unsigned legacy OAuth state must be rejected', async () => assert.rejects(() => mp.resolveMercadoPagoOAuthState(String(provider._id))));
    await check('signed OAuth state is single-use', async () => { const url = new URL(await mp.getMercadoPagoAuthorizationUrl({ prestadorId: provider._id })); const state = url.searchParams.get('state'); assert.equal((await mp.resolveMercadoPagoOAuthState(state)).prestadorId, String(provider._id)); await assert.rejects(() => mp.resolveMercadoPagoOAuthState(state)); });
    await check('emergency arrival creates checkout for a connected test seller', async () => {
      const ref = await reference('Emergencia'); ref.estado = 'En camino'; ref.metodoPago = 'MercadoPago'; await ref.save();
      const arrival = await api(buyer, `/api/emergencias/${ref._id}/codigo-llegada`, 'GET');
      assert.equal((await api(seller, `/api/emergencias/${ref._id}/validar-llegada`, 'PATCH', { codigo: arrival.data.codigo })).status, 200);
      const r = await api(buyer, `/api/emergencias/${ref._id}/confirmar-llegada`, 'PATCH', {});
      assert.equal(r.status, 200); assert.ok(r.data.preferenciaMP?.initPoint, `HTTP ${r.status}; initPoint ${r.data.preferenciaMP?.initPoint}; estado ${r.data.emergencia?.estado}`);
      assert.equal(await Payment.countDocuments({ 'referencia.id': ref._id }), 1);
    });
    await check('emergency arrival recovers checkout after seller reconnects', async () => {
      const ref = await reference('Emergencia'); ref.estado = 'En camino'; ref.metodoPago = 'MercadoPago'; await ref.save();
      const arrival = await api(buyer, `/api/emergencias/${ref._id}/codigo-llegada`, 'GET');
      assert.equal((await api(seller, `/api/emergencias/${ref._id}/validar-llegada`, 'PATCH', { codigo: arrival.data.codigo })).status, 200);
      await Provider.updateOne({ _id: provider._id }, { $set: { 'mercadoPago.conectado': false } });
      const failed = await api(buyer, `/api/emergencias/${ref._id}/confirmar-llegada`, 'PATCH', {});
      assert.equal(failed.status, 503); assert.equal((await Emergency.findById(ref._id)).estado, 'En atención');
      assert.equal(await Payment.countDocuments({ 'referencia.id': ref._id }), 0);
      await Provider.updateOne({ _id: provider._id }, { $set: { 'mercadoPago.conectado': true } });
      const retry = await api(buyer, `/api/emergencias/${ref._id}/confirmar-llegada`, 'PATCH', {});
      assert.equal(retry.status, 200); assert.ok(retry.data.preferenciaMP?.initPoint);
      assert.equal(await Payment.countDocuments({ 'referencia.id': ref._id }), 1);
    });
    await check('client must not self-confirm an appointment without provider acceptance', async () => {
      const ref = await reference('Cita'); ref.estado = 'Pendiente'; await ref.save();
      const r = await api(buyer, `/api/citas/${ref._id}/estado`, 'PATCH', { estado: 'Confirmada' });
      assert.ok(r.status >= 400, `HTTP ${r.status}; estado ${r.data.estado}`);
    });
    await check('cancel pending checkout preserves unpaid state', async () => {
      const { pago } = await pending('Cita');
      assert.equal((await api(buyer, '/api/pagos/mercadopago/cancel-payment', 'POST', { pagoId: pago._id })).status, 200);
      assert.equal((await Payment.findById(pago._id)).estado, 'Cancelado');
    });
    await check('abandoned checkout remains unpaid', async () => { const { pago } = await pending('Cita'); assert.equal((await Payment.findById(pago._id)).estado, 'Pendiente'); });
    await check('another buyer cannot cancel a payment', async () => { const { pago } = await pending('Cita'); assert.equal((await api(outsider, '/api/pagos/mercadopago/cancel-payment', 'POST', { pagoId: pago._id })).status, 403); });
    await check('service completion rejects checkout without verified MP payment', async () => { const { pago } = await pending('Cita'); const r = await api(buyer, '/api/pagos/mercadopago/capture-payment', 'POST', { pagoId: pago._id }); assert.equal(r.status, 409); assert.equal((await Payment.findById(pago._id)).estado, 'Pendiente'); });
    await check('buyer can verify preference with seller credential and real payment binding', async () => { const { pago } = await pending('Cita'); const path = `/api/pagos/mercadopago/preference-status/${pago.mercadoPago.preferenceId}`; assert.equal((await api(outsider, path)).status, 403); assert.equal((await api(buyer, path)).data.estado, 'Pendiente'); await notify(pago, 'approved', { transaction_details: { net_received_amount: 6840 } }); const r = await api(buyer, path); assert.equal(r.status, 200); assert.equal(r.data.estado, 'Pagado'); assert.equal(r.data.netoRecibidoPrestador, 6840); });
    await check('real appointment creation, acceptance and completion-before-payment denial', async () => {
      const date = new Date(Date.now() + 3 * 86400000); date.setHours(0,0,0,0);
      const r = await api(buyer, '/api/citas', 'POST', { mascota: String(pet._id), prestador: String(provider._id), servicio: String(service._id), fecha: date.toISOString(), horaInicio: '11:00', metodoPago: 'MercadoPago', motivo: 'QA local' });
      assert.equal(r.status, 201, JSON.stringify(r.data)); const id = r.data._id;
      assert.equal((await api(outsider, `/api/citas/prestador/${provider._id}/cita/${id}`, 'PATCH', { estado: 'Confirmada' })).status, 403);
      assert.equal((await api(seller, `/api/citas/prestador/${provider._id}/cita/${id}`, 'PATCH', { estado: 'Confirmada' })).status, 200);
      const completion = await api(seller, `/api/citas/prestador/${provider._id}/cita/${id}`, 'PATCH', { estado: 'Completada' });
      assert.ok(completion.status >= 400); assert.equal((await Appointment.findById(id)).estado, 'Confirmada');
      return { appointmentId: id, completionStatus: completion.status };
    });
  } finally {
    writeFileSync('qa/logs/payment-regression-20260925.json', JSON.stringify(evidence, null, 2));
    if (server) { server.closeAllConnections(); await new Promise(r => server.close(r)); }
    await mongoose.disconnect(); if (mongo) await mongo.stop(); mock.restoreAll();
  }
});
