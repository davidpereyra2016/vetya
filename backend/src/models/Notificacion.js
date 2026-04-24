import mongoose from "mongoose";

/**
 * Esquema para las notificaciones del sistema
 * Este modelo almacena las notificaciones que se envían a los usuarios y prestadores de servicios
 * Permite realizar seguimiento de notificaciones leídas/no leídas y categorizarlas
 */
const notificacionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.prestador; } // Requerido solo si no hay prestador
  },
  prestador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestador',
    required: function() { return !this.usuario; } // Requerido solo si no hay usuario
  },
  titulo: {
    type: String,
    required: true
  },
  mensaje: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Cita', 'Emergencia', 'emergencia_asignada', 'emergencia_confirmada', 'emergencia_en_camino', 'emergencia_atendida', 'emergencia_cancelada', 'llegada_confirmada', 'cita_solicitada', 'cita_confirmada', 'cita_cancelada', 'cita_completada', 'cita_reprogramada', 'valoracion_nueva', 'Recordatorio', 'Sistema', 'Promocion'],
    default: 'Sistema'
  },
  accion: {
    type: String,
    enum: ['ver_detalle', 'ver_emergencia', 'confirmar_emergencia', 'rechazar_emergencia', 'confirmar_cita', 'cancelar_cita', null],
    default: 'ver_detalle'
  },
  icono: {
    type: String,
    default: 'notifications-outline'
  },
  color: {
    type: String,
    default: '#1E88E5'
  },
  leida: {
    type: Boolean,
    default: false
  },
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  fechaLectura: {
    type: Date
  },
  enlace: {
    tipo: {
      type: String,
      enum: ['Cita', 'Emergencia', 'Mascota', 'Veterinario', 'Prestador', 'Consejo', 'Externo'],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  activa: {
    type: Boolean,
    default: true
  },
  prioridad: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media'
  },
  // Campos adicionales para almacenar datos específicos de emergencias o citas
  datos: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índice para buscar notificaciones no leídas de un usuario
notificacionSchema.index({ usuario: 1, leida: 1 });
// Índice para buscar notificaciones no leídas de un prestador
notificacionSchema.index({ prestador: 1, leida: 1 });

// Índice para ordenar por fecha
notificacionSchema.index({ fechaEnvio: -1 });

const Notificacion = mongoose.model("Notificacion", notificacionSchema);
export default Notificacion;
