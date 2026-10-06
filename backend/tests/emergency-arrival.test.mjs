// node --test backend/tests/emergency-arrival.test.mjs
// MongoDB replica set descartable. No carga .env ni llama pagos/push reales.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import http from 'node:http';

for (const key of Object.keys(process.env)) if (/MONGO|REDIS|UPSTASH|^MP_|MERCADOPAGO|CLOUDINARY|RESEND|EMAIL_/.test(key)) delete process.env[key];
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const require = createRequire(import.meta.url);
const { MongoMemoryReplSet } = require(process.env.QA_MONGO_MODULE || join(tmpdir(), 'vetya-qa-tools/node_modules/mongodb-memory-server'));
const mongoose = (await import('../node_modules/mongoose/index.js')).default;
const express = (await import('../node_modules/express/index.js')).default;
const jwt = (await import('../node_modules/jsonwebtoken/index.js')).default;
const User = (await import('../src/models/User.js')).default;
const Provider = (await import('../src/models/Prestador.js')).default;
const Emergency = (await import('../src/models/Emergencia.js')).default;
const Arrival = (await import('../src/models/LlegadaEmergencia.js')).default;
const Payment = (await import('../src/models/Pago.js')).default;
const router = (await import('../src/routes/emergenciaRoutes.js')).default;
const { initializeSocket } = await import('../src/services/socketService.js');
const { io } = await import('../../vetya/node_modules/socket.io-client/build/esm/index.js');

test('código de llegada: HTTP/JWT, transacciones, conservación y realtime', async t => {
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
  let mongo, server, socketServer;
  const sockets = [];
  try {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, dbName: 'arrival_disposable', ip: '127.0.0.1' } });
    assert.match(mongo.getUri(), /^mongodb:\/\/127\.0\.0\.1:/);
    await mongoose.connect(mongo.getUri());
    await Promise.all([Arrival.init(), Emergency.init(), Provider.init(), User.init(), Payment.init()]);
    const app = express(); app.use(express.json()); app.use('/api/emergencias', router);
    server = http.createServer(app); socketServer = initializeSocket(server);
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}`;
    const makeUser = role => User.create({ username: `QA-${randomUUID()}`, email: `${randomUUID()}@example.invalid`, password: randomUUID(), role, emailVerified: true });
    const client = await makeUser('client'), vet = await makeUser('provider'), stranger = await makeUser('client'), otherVet = await makeUser('provider'), nonVet = await makeUser('provider');
    const provider = await Provider.create({ usuario: vet._id, tipo: 'Veterinario', nombre: 'Vet QA', emergenciaGratisAdmin: true, estadoValidacion: 'aprobado' });
    await Provider.create({ usuario: otherVet._id, tipo: 'Veterinario', nombre: 'Otro vet QA' });
    await Provider.create({ usuario: nonVet._id, tipo: 'Otro', nombre: 'Paseador QA' });
    const token = u => jwt.sign({ userId: String(u._id) }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const api = async (u, path, method = 'GET', body, key) => {
      const r = await fetch(`${base}/api/emergencias${path}`, { method, headers: { Authorization: `Bearer ${token(u)}`, 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: r.status, data: await r.json(), headers: r.headers };
    };
    const body = { esOtroAnimal: true, otroAnimal: { tipo: 'Perro', descripcionAnimal: 'Animal QA' }, descripcion: 'Emergencia QA', tipoEmergencia: 'Otro', ubicacion: { direccion: 'Lugar QA', ciudad: 'Formosa', coordenadas: { latitud: -26, longitud: -58 } } };
    const create = async (estado = 'Asignada', user = client) => {
      const e = await Emergency.create({ usuario: user._id, veterinario: provider._id, otroAnimal: { esOtroAnimal: true, tipo: 'Perro' }, descripcion: 'QA', tipoEmergencia: 'Otro', estado, ubicacion: { direccion: 'QA', ciudad: 'QA', coordenadas: { lat: 0, lng: 0 } } });
      const code = await api(user, `/${e._id}/codigo-llegada`); assert.equal(code.status, 200);
      return { e, codigo: code.data.codigo };
    };
    let created, id, codigo;
    await t.test('creación genera un único registro relacionado y código estable', async () => {
      created = await api(client, '', 'POST', body); assert.equal(created.status, 201); id = created.data._id;
      assert.equal(await Arrival.countDocuments({ emergencia: id, cliente: client._id }), 1);
      assert.equal(created.data.codigo, undefined);
      const r = await api(client, `/${id}/codigo-llegada`); assert.equal(r.status, 200); codigo = r.data.codigo;
      assert.match(codigo, /^\d{4}$/); assert.equal(r.headers.get('cache-control'), 'no-store');
      const codes = await Promise.all(Array.from({ length: 4 }, () => api(client, `/${id}/codigo-llegada`)));
      assert.ok(codes.every(r => r.data.codigo === codigo));
      assert.equal((await Arrival.findOne({ emergencia: id })).codigo, undefined);
    });
    await t.test('código privado y permisos de lectura/validación', async () => {
      for (const u of [vet, otherVet, stranger]) assert.equal((await api(u, `/${id}/codigo-llegada`)).status, 403);
      for (const u of [client, otherVet, nonVet]) assert.equal((await api(u, `/${id}/validar-llegada`, 'PATCH', { codigo })).status, 403);
      assert.equal((await api(stranger, `/${id}/registro-llegada`)).status, 403);
      const r = await api(client, `/${id}/registro-llegada`); assert.equal(r.data.registro.codigo, undefined);
    });
    await t.test('solicitada no permite iniciar atención ni saltar la validación', async () => {
      const fresh = await create('Solicitada');
      assert.equal((await api(vet, `/${fresh.e._id}/validar-llegada`, 'PATCH', { codigo: fresh.codigo })).status, 409);
      assert.equal((await api(client, `/${id}/estado`, 'PATCH', { estado: 'En atención' })).status, 409);
      assert.equal((await api(client, `/${id}/confirmar-llegada`, 'PATCH', {}, randomUUID())).status, 409);
      assert.equal((await api(vet, `/${fresh.e._id}/estado`, 'PATCH', { estado: 'Atendida' })).status, 409);
    });
    await t.test('ceros iniciales, formato, rechazo, límite y desbloqueo', async () => {
      const { e } = await create();
      await Arrival.updateOne({ emergencia: e._id }, { $set: { codigo: '0042' } });
      for (const code of [42, '42', 'abcd', { $ne: null }]) assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo: code })).status, 400);
      for (let i = 0; i < 5; i++) assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo: '1111' })).status, i === 4 ? 429 : 400);
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo: '0042' })).status, 429);
      assert.equal((await Arrival.findOne({ emergencia: e._id })).intentos.length, 5);
      assert.equal((await Emergency.findById(e._id)).estado, 'Asignada');
      await Arrival.updateOne({ emergencia: e._id }, { $set: { bloqueadoHasta: new Date(0) } });
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo: '0042' })).status, 200);
    });
    for (const estado of ['Asignada', 'Confirmada', 'En camino']) await t.test(`validación desde ${estado}, reintentos concurrentes y un solo historial`, async () => {
      const { e, codigo } = await create(estado);
      const results = await Promise.all([api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo }), api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })]);
      assert.deepEqual(results.map(r => r.status), [200, 200]);
      const saved = await Emergency.findById(e._id); assert.equal(saved.estado, 'En atención'); assert.ok(saved.llegadaConfirmada);
      assert.equal(saved.historial.filter(h => h.estado === 'En atención').length, 1);
      const record = await Arrival.findOne({ emergencia: e._id }); assert.ok(record.confirmadaEn); assert.equal(record.intentos.length, 1);
      assert.equal(String(record.prestador), String(provider._id));
      assert.equal((await api(client, `/${e._id}/codigo-llegada`)).data.codigo, null);
      assert.equal((await api(vet, `/${e._id}/estado`, 'PATCH', { estado: 'En camino' })).status, 409);
    });
    await t.test('cliente recibe realtime de llegada sin código y conserva checkout', async () => {
      const { e, codigo } = await create('En camino');
      const socket = io(base, { autoConnect: false, transports: ['websocket'], auth: { token: token(client) }, reconnection: false }); sockets.push(socket);
      const next = name => new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Socket timeout')), 10000); socket.once(name, data => { clearTimeout(timer); resolve(data); }); });
      const ready = next('socket:ready'); socket.connect(); await ready;
      const changed = next('emergencia:actualizada');
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 200);
      const event = await changed; assert.equal(event.estado, 'En atención'); assert.equal(event.emergencia.codigo, undefined);
      assert.equal(event.emergencia.veterinario.nombre, 'Vet QA');
      assert.equal(event.emergencia.usuario._id, String(client._id));
      assert.equal((await api(client, `/${e._id}/confirmar-llegada`, 'PATCH', {}, randomUUID())).status, 200);
      assert.equal((await api(vet, `/${e._id}/estado`, 'PATCH', { estado: 'Atendida' })).status, 200);
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 409);
    });
    await t.test('dos consultas de pago efectivo con claves distintas no duplican el registro', async () => {
      await Provider.updateOne({ _id: provider._id }, { $set: { emergenciaGratisAdmin: false, precioEmergencia: 5000 } });
      const { e, codigo } = await create();
      e.metodoPago = 'Efectivo'; await e.save();
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 200);
      const results = await Promise.all(Array.from({ length: 2 }, () => api(client, `/${e._id}/confirmar-llegada`, 'PATCH', {}, randomUUID())));
      assert.deepEqual(results.map(r => r.status), [200, 200]);
      assert.equal(await Payment.countDocuments({ 'referencia.id': e._id }), 1);
      assert.equal((await Payment.findOne({ 'referencia.id': e._id })).estado, 'Pendiente');
      assert.equal((await api(vet, `/${e._id}/estado`, 'PATCH', { estado: 'Atendida' })).status, 200);
      assert.equal((await Payment.findOne({ 'referencia.id': e._id })).estado, 'Completado');
      await Provider.updateOne({ _id: provider._id }, { $set: { emergenciaGratisAdmin: true } });
    });
    await t.test('fallo al guardar emergencia revierte el consumo del código y permite reintentar', async () => {
      const { e, codigo } = await create();
      const originalSave = Emergency.prototype.save;
      const failingSave = mock.method(Emergency.prototype, 'save', async function(options) {
        if (String(this._id) === String(e._id) && this.estado === 'En atención') throw Error('Fallo sintético QA');
        return originalSave.call(this, options);
      });
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 500);
      failingSave.mock.restore();
      assert.equal((await Emergency.findById(e._id)).estado, 'Asignada');
      const record = await Arrival.findOne({ emergencia: e._id });
      assert.equal(record.confirmadaEn, undefined); assert.equal(record.intentos.length, 0);
      assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 200);
    });
    await t.test('cancelación anterior y posterior conserva el registro y bloquea códigos', async () => {
      for (const verified of [false, true]) {
        const { e, codigo } = await create();
        if (verified) assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 200);
        assert.equal((await api(client, `/${e._id}/estado`, 'PATCH', { estado: 'Cancelada' })).status, 200);
        const r = await api(client, `/${e._id}/registro-llegada`);
        assert.equal(r.data.estadoEmergencia, 'Cancelada'); assert.ok(r.data.registro.canceladaEn);
        assert.equal(Boolean(r.data.registro.confirmadaEn), verified);
        assert.equal((await Arrival.findOne({ emergencia: e._id }).select('+codigo')).codigo, codigo);
        assert.equal((await api(vet, `/${e._id}/validar-llegada`, 'PATCH', { codigo })).status, 409);
      }
    });
  } finally {
    sockets.forEach(s => s.disconnect());
    if (socketServer) await new Promise(r => socketServer.close(r));
    else if (server) await new Promise(r => server.close(r));
    await mongoose.disconnect(); if (mongo) await mongo.stop(); mock.restoreAll();
  }
});
