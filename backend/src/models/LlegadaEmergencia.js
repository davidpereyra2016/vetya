import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  emergencia: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergencia', required: true, unique: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prestador: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestador', default: null },
  codigo: { type: String, required: true, match: /^\d{4}$/, select: false },
  intentosFallidos: { type: Number, default: 0 },
  bloqueadoHasta: Date,
  confirmadaEn: Date,
  confirmadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estadoEmergencia: String,
  canceladaEn: Date,
  intentos: [{
    _id: false,
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestador' },
    fecha: { type: Date, required: true },
    resultado: { type: String, enum: ['incorrecto', 'confirmado'], required: true },
  }],
}, { timestamps: true });
// Sin TTL: se conserva la trazabilidad incluso después de cancelar.
schema.index({ cliente: 1, createdAt: -1 });
schema.index({ prestador: 1, createdAt: -1 });
export default mongoose.model('LlegadaEmergencia', schema);
