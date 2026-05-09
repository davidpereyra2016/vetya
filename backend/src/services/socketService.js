import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Prestador from '../models/Prestador.js';

let ioInstance = null;

const getTokenFromSocket = (socket) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token || typeof token !== 'string') return null;
  return token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
};

export const initializeSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Token requerido para WebSocket'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId)
        .select('_id email username role')
        .lean();

      if (!user) {
        return next(new Error('Usuario no encontrado para WebSocket'));
      }

      const prestador = await Prestador.findOne({ usuario: user._id })
        .select('_id tipo disponibleEmergencias')
        .lean();

      socket.user = {
        ...user,
        id: user._id.toString(),
        prestadorId: prestador?._id?.toString() || null,
        prestadorTipo: prestador?.tipo || null,
      };

      return next();
    } catch (error) {
      return next(new Error('WebSocket no autorizado'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);

    if (socket.user.prestadorId) {
      socket.join(`prestador:${socket.user.prestadorId}`);
    }

    if (socket.user.prestadorTipo === 'Veterinario') {
      socket.join('veterinarios');
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Socket] Cliente conectado:', {
        socketId: socket.id,
        userId,
        prestadorId: socket.user.prestadorId,
        prestadorTipo: socket.user.prestadorTipo,
      });
    }

    socket.emit('socket:ready', {
      userId,
      prestadorId: socket.user.prestadorId,
      prestadorTipo: socket.user.prestadorTipo,
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;

const emitToRoom = (room, event, payload) => {
  if (!ioInstance || !room) return;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Socket] Emitiendo evento:', {
      room,
      event,
      emergenciaId: payload?.emergenciaId,
      estado: payload?.estado,
      eventType: payload?.eventType,
    });
  }
  ioInstance.to(room).emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!userId) return;
  emitToRoom(`user:${userId.toString()}`, event, payload);
};

export const emitToPrestador = (prestadorId, event, payload) => {
  if (!prestadorId) return;
  emitToRoom(`prestador:${prestadorId.toString()}`, event, payload);
};

export const emitToVeterinarios = (event, payload) => {
  emitToRoom('veterinarios', event, payload);
};

const normalizeEmergencyPayload = (emergencia, eventType) => {
  if (!emergencia) return null;

  const emergencyObject = typeof emergencia.toObject === 'function'
    ? emergencia.toObject()
    : emergencia;

  return {
    eventType,
    emergencia: emergencyObject,
    emergenciaId: emergencyObject._id?.toString?.() || emergencyObject.id?.toString?.(),
    estado: emergencyObject.estado,
    usuarioId: emergencyObject.usuario?._id?.toString?.() || emergencyObject.usuario?.toString?.(),
    veterinarioId: emergencyObject.veterinario?._id?.toString?.() || emergencyObject.veterinario?.toString?.(),
    updatedAt: emergencyObject.updatedAt || new Date().toISOString(),
  };
};

export const emitEmergencyCreated = (emergencia) => {
  const payload = normalizeEmergencyPayload(emergencia, 'created');
  if (!payload) return;

  emitToUser(payload.usuarioId, 'emergencia:actualizada', payload);
};

export const emitEmergencyUpdated = (emergencia, eventType = 'updated') => {
  const payload = normalizeEmergencyPayload(emergencia, eventType);
  if (!payload) return;

  emitToUser(payload.usuarioId, 'emergencia:actualizada', payload);

  if (payload.veterinarioId) {
    emitToPrestador(payload.veterinarioId, 'emergencia:actualizada', payload);
  }

  if (['created', 'assigned', 'rejected', 'cancelled', 'expired', 'accepted', 'vet_confirmed', 'vet_declined', 'status_changed'].includes(eventType)) {
    emitToVeterinarios('emergencia:lista-actualizada', payload);
  }
};
