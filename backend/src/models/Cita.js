import mongoose from "mongoose";

/**
 * Esquema para las citas veterinarias
 * Este modelo almacena toda la información relacionada con las citas programadas
 * Incluye referencias a la mascotas, prestadores, servicios, usuarios y disponibilidad
 */
const citaSchema = new mongoose.Schema({
  mascota: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota',
    required: true
  },
  prestador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestador',
    required: true
  },
  disponibilidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disponibilidad'
  },
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  horaInicio: {
    type: String,
    required: true
  },
  horaFin: {
    type: String,
    required: true
  },
  motivo: {
    type: String
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'],
    default: 'Pendiente'
  },
  ubicacion: {
    type: String,
    enum: ['Clínica', 'Domicilio'],
    default: 'Clínica'
  },
  direccion: {
    type: String,
    // Solo requerido si la ubicación es 'Domicilio'
  },
  notas: {
    type: String
  },
  recordatorioEnviado: {
    type: Boolean,
    default: false
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  costoEstimado: {
    type: Number
  },
  metodoPago: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'MercadoPago', 'Por definir'],
    default: 'Por definir'
  },
  pagado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice para buscar citas por rango de fechas y prestador
citaSchema.index({ fecha: 1, prestador: 1 });

// Índice para buscar citas por usuario
citaSchema.index({ usuario: 1 });
citaSchema.index({ usuario: 1, estado: 1, fecha: 1 });
citaSchema.index({ prestador: 1, estado: 1, fecha: 1, horaInicio: 1 });
citaSchema.index({ servicio: 1 });
citaSchema.index({ disponibilidad: 1 });
citaSchema.index(
  { prestador: 1, fecha: 1, horaInicio: 1 },
  { partialFilterExpression: { estado: { $in: ["Pendiente", "Confirmada"] } } }
);


const Cita = mongoose.model("Cita", citaSchema);
export default Cita;
