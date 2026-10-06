// Isolated real MongoDB + HTTP + Socket.IO. No production credentials or push tokens.
// QA_MONGO_MODULE points to a temporary installation of mongodb-memory-server.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import http from 'node:http';
const require = createRequire(import.meta.url);
process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.NODE_ENV = 'production';
for (const key of ['MONGO_URI', 'REDIS_URL', 'UPSTASH_REDIS_URL', 'MP_ACCESS_TOKEN', 'MERCADOPAGO_ACCESS_TOKEN']) delete process.env[key];
const { MongoMemoryReplSet } = require(resolve(process.env.QA_MONGO_MODULE));
const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
const express = (await import('../../backend/node_modules/express/index.js')).default;
const jwt = (await import('../../backend/node_modules/jsonwebtoken/index.js')).default;
const { io } = await import('../../vetya/node_modules/socket.io-client/build/esm/index.js');
const User = (await import('../../backend/src/models/User.js')).default;
const Pet = (await import('../../backend/src/models/Mascota.js')).default;
const Provider = (await import('../../backend/src/models/Prestador.js')).default;
const Emergency = (await import('../../backend/src/models/Emergencia.js')).default;
const Notification = (await import('../../backend/src/models/Notificacion.js')).default;
const router = (await import('../../backend/src/routes/emergenciaRoutes.js')).default;
const { initializeSocket } = await import('../../backend/src/services/socketService.js');
const report = [];
const realLog = console.log;
console.log = () => {};
let mongo, server, sockets = [], socketServer;
try {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, dbName: 'vetya_qa_disposable', ip: '127.0.0.1' } });
  const uri = mongo.getUri();
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:/);
  await mongoose.connect(uri, { dbName: 'vetya_qa_disposable' });
  await Provider.init();
  const app = express(); app.use(express.json()); app.use('/api/emergencias', router);
  server = http.createServer(app); socketServer = initializeSocket(server);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const makeUser = role => User.create({ username: `${role}-${randomBytes(4).toString('hex')}`, email: `${randomBytes(5).toString('hex')}@example.invalid`, password: randomBytes(20).toString('hex'), role, emailVerified: true });
  const client = await makeUser('client'), vet = await makeUser('provider'), otherVet = await makeUser('provider');
  const provider = await Provider.create({ usuario: vet._id, nombre: 'Veterinario QA', tipo: 'Veterinario', emergenciaGratisAdmin: true, estadoValidacion: 'aprobado' });
  await Provider.create({ usuario: otherVet._id, nombre: 'Veterinario QA B', tipo: 'Veterinario' });
  const pet = await Pet.create({ propietario: client._id, nombre: 'Mascota QA', tipo: 'Perro', raza: 'Mestizo', edad: '3', genero: 'Macho' });
  const token = user => jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const api = async (user, path, method = 'GET', body, authorization = token(user)) => {
    const start = performance.now();
    const res = await fetch(`${base}/api/emergencias${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorization}` }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
    return { status: res.status, data: await res.json(), ms: Math.round(performance.now() - start) };
  };
  const event = (socket, name) => new Promise((resolveEvent, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout ${name}`)), 10000);
    socket.once(name, data => { clearTimeout(timeout); resolveEvent(data); });
  });
  for (const user of [client, vet, otherVet]) {
    const socket = io(base, { autoConnect: false, transports: ['websocket'], auth: { token: token(user) }, reconnection: false });
    sockets.push(socket); const ready = event(socket, 'socket:ready'); socket.connect(); await ready;
  }
  const payload = { mascota: String(pet._id), descripcion: 'Mi perro está decaído 😢. No come. ¿Pueden venir?', tipoEmergencia: 'Otro', nivelUrgencia: 'Media', ubicacion: { direccion: 'Lugar QA', ciudad: 'Formosa', coordenadas: { latitud: -26.1775, longitud: -58.1781 } } };
  const createdEvent = event(sockets[0], 'emergencia:actualizada');
  const created = await api(client, '', 'POST', payload); assert.equal(created.status, 201);
  const id = created.data._id;
  assert.equal((await createdEvent).emergenciaId, id);
  assert.equal(await Emergency.countDocuments({ usuario: client._id }), 1);
  report.push({ case: 'create persisted pet emergency + client realtime', result: 'PASS', ms: created.ms });
  assert.equal((await api(client, '', 'POST', payload)).status, 429);
  report.push({ case: 'sequential duplicate', result: 'PASS' });
  const assignedEvent = event(sockets[1], 'emergencia:actualizada');
  const unassignedEvent = event(sockets[2], 'emergencia:lista-actualizada');
  const assigned = await api(client, `/${id}/confirmar`, 'PATCH', { veterinarioId: String(provider._id), metodoPago: 'Por definir' });
  assert.equal(assigned.status, 200);
  assert.equal((await assignedEvent).emergenciaId, id);
  const leaked = await unassignedEvent;
  assert.deepEqual(Object.keys(leaked).sort(), ['eventType', 'updatedAt']);
  report.push({ case: 'unassigned veterinarian only receives a list invalidation without private data', result: 'PASS' });
  const details = await api(vet, `/${id}`); assert.equal(details.status, 200);
  assert.deepEqual(details.data.ubicacion.coordenadas, { lat: -26.1775, lng: -58.1781 });
  assert.equal(details.data.mascotaInfo.nombre, 'Mascota QA');
  report.push({ case: 'assigned provider details, pet and exact location', result: 'PASS', ms: assigned.ms });
  assert.equal((await api(otherVet, `/${id}/confirmacion-veterinario`, 'PATCH', { confirmado: true })).status, 401);
  const acceptedEvent = event(sockets[0], 'emergencia:actualizada');
  const accepted = await api(vet, `/${id}/confirmacion-veterinario`, 'PATCH', { confirmado: true });
  assert.equal(accepted.status, 200); assert.equal(accepted.data.emergencia.estado, 'Asignada');
  assert.equal((await acceptedEvent).estado, 'Asignada');
  assert.equal((await api(client, `/${id}`)).data.estado, 'Asignada');
  report.push({ case: 'provider accepts, state persisted and client realtime', result: 'PASS', ms: accepted.ms });
  assert.equal((await api(vet, `/${id}/confirmacion-veterinario`, 'PATCH', { confirmado: true })).status, 400);
  report.push({ case: 'other provider denied and sequential double acceptance denied', result: 'PASS' });
  assert.equal((await api(client, `/${id}`, 'GET', undefined, jwt.sign({ userId: String(client._id) }, process.env.JWT_SECRET, { expiresIn: -1 }))).status, 401);
  report.push({ case: 'expired JWT rejected by real middleware', result: 'PASS' });
  assert.ok(await Notification.countDocuments({ usuario: client._id }) > 0);
  report.push({ case: 'notification records persisted (no push delivery)', result: 'PASS' });
  // Independent controlled client exercises another animal and the rejection path.
  const client2 = await makeUser('client');
  const another = await api(client2, '', 'POST', { ...payload, mascota: undefined, esOtroAnimal: true, otroAnimal: { tipo: 'Gato', descripcionAnimal: 'Gato QA' } });
  assert.equal(another.status, 201);
  const id2 = another.data._id;
  assert.equal((await api(client2, `/${id2}/confirmar`, 'PATCH', { veterinarioId: String(provider._id) })).status, 200);
  assert.equal((await api(vet, `/${id2}`)).data.mascotaInfo.esOtroAnimal, true);
  assert.equal((await api(vet, `/${id2}/confirmacion-veterinario`, 'PATCH', { confirmado: false })).status, 200);
  assert.equal((await Emergency.findById(id2)).veterinario, null);
  report.push({ case: 'another animal, provider details and rejection persisted', result: 'PASS' });
  const client3 = await makeUser('client');
  const racePayload = { ...payload, mascota: undefined, esOtroAnimal: true, otroAnimal: { tipo: 'Perro', descripcionAnimal: 'Prueba simultánea QA' } };
  const concurrent = await Promise.all([api(client3, '', 'POST', racePayload), api(client3, '', 'POST', racePayload)]);
  const count = await Emergency.countDocuments({ usuario: client3._id });
  report.push({ case: 'two simultaneous creates', result: count > 1 ? 'FAIL' : 'PASS (single attempt only)', statuses: concurrent.map(r => r.status), persisted: count });
  if (count > 1) process.exitCode = 1;
} catch(error) { report.push({ case: 'integration execution', result: 'BLOCKED OR FAIL', error: error.message }); process.exitCode = 1; }
finally {
  sockets.forEach(s => s.disconnect());
  if (socketServer) await new Promise(r => socketServer.close(r));
  else if (server) await new Promise(r => server.close(r));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  console.log = realLog;
  console.log(JSON.stringify({ environment: 'disposable local MongoDB, no real push/payment', results: report }, null, 2));
}
