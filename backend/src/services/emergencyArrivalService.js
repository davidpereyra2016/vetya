import { randomInt, timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import Llegada from '../models/LlegadaEmergencia.js';
import Emergencia from '../models/Emergencia.js';

export const arrivalStates = ['Asignada', 'Confirmada', 'En camino'];
const error = (status, message) => Object.assign(new Error(message), { status });

export async function ensureArrival(emergencia, session = null) {
  // Upsert e índice único mantienen el mismo código entre recargas y solicitudes concurrentes.
  return Llegada.findOneAndUpdate({ emergencia: emergencia._id }, { $setOnInsert: {
    cliente: emergencia.usuario?._id || emergencia.usuario,
    prestador: emergencia.veterinario?._id || emergencia.veterinario || null,
    codigo: String(randomInt(0, 10000)).padStart(4, '0'),
    estadoEmergencia: emergencia.estado,
  } }, { upsert: true, new: true, runValidators: true, session }).select('+codigo');
}

export async function verifyArrival(emergencyId, prestador, userId, codigo) {
  if (typeof codigo !== 'string' || !/^\d{4}$/.test(codigo)) {
    throw error(400, 'Ingresa los cuatro dígitos del código del cliente');
  }
  let outcome;
  await mongoose.connection.transaction(async session => {
    const emergencia = await Emergencia.findById(emergencyId).session(session);
    if (!emergencia) throw error(404, 'Emergencia no encontrada');
    if (prestador.tipo !== 'Veterinario' || String(emergencia.veterinario) !== String(prestador._id)) {
      throw error(403, 'Solo el veterinario asignado puede validar la llegada');
    }
    if (['Cancelada', 'Atendida'].includes(emergencia.estado)) throw error(409, 'La emergencia ya está cerrada');
    const llegada = await Llegada.findOne({ emergencia: emergencyId }).select('+codigo').session(session);
    if (!llegada) throw error(409, 'El cliente debe abrir su emergencia para obtener el código de llegada');
    if (llegada.confirmadaEn) {
      if (String(llegada.prestador) !== String(prestador._id)) throw error(409, 'La llegada corresponde a otro veterinario');
      outcome = { emergencia, alreadyConfirmed: true };
      return;
    }
    if (!arrivalStates.includes(emergencia.estado)) throw error(409, 'Primero debes aceptar la emergencia');
    const now = new Date();
    if (llegada.bloqueadoHasta > now) throw error(429, 'Demasiados intentos. Espera cinco minutos antes de reintentar');
    if (llegada.bloqueadoHasta) {
      llegada.intentosFallidos = 0;
      llegada.bloqueadoHasta = undefined;
    }
    const correct = timingSafeEqual(Buffer.from(codigo), Buffer.from(llegada.codigo));
    llegada.prestador = prestador._id;
    llegada.intentos.push({ usuario: userId, prestador: prestador._id, fecha: now, resultado: correct ? 'confirmado' : 'incorrecto' });
    if (!correct) {
      llegada.intentosFallidos += 1;
      if (llegada.intentosFallidos >= 5) llegada.bloqueadoHasta = new Date(now.getTime() + 5 * 60 * 1000);
      await llegada.save({ session });
      outcome = { error: error(llegada.bloqueadoHasta ? 429 : 400, llegada.bloqueadoHasta ? 'Demasiados intentos. Espera cinco minutos antes de reintentar' : 'El código es incorrecto. Verifícalo con el cliente') };
      return;
    }
    llegada.confirmadaEn = now;
    llegada.confirmadoPor = userId;
    llegada.estadoEmergencia = 'En atención';
    await llegada.save({ session });
    emergencia.estado = 'En atención';
    emergencia.llegadaConfirmada = true;
    emergencia.llegadaConfirmadaPorCliente = true;
    emergencia.fechaLlegadaConfirmada = now;
    emergencia.expirada = false;
    emergencia.expiraEn = undefined;
    emergencia.expiraRespuestaVetEn = undefined;
    emergencia.historial.push({ estado: 'En atención', fecha: now, usuario: userId, notas: 'Llegada validada por el veterinario con el código entregado por el cliente' });
    await emergencia.save({ session });
    outcome = { emergencia, alreadyConfirmed: false };
  });
  if (outcome.error) throw outcome.error;
  return outcome;
}
