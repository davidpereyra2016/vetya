import mongoose from "mongoose";

/**
 * Esquema para las valoraciones/reseñas de prestadores
 * Este modelo almacena las calificaciones y comentarios que los usuarios hacen sobre los veterinarios
 * Se relaciona tanto con el usuario que hace la valoración como con el veterinario valorado
 */
const valoracionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prestador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestador',
    required: true
  },
  mascota: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota'
    // Opcional, puede incluirse la mascota relacionada con la atención
  },
  cita: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cita'
    // Opcional, referencia a la cita relacionada con esta valoración
  },
  emergencia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Emergencia'
    // Opcional, referencia a la emergencia relacionada con esta valoración
  },
  calificacion: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String
  },
  fechaAtencion: {
    type: Date
  },
  tipoServicio: {
    type: String,
    enum: ['Consulta', 'Emergencia', 'Otro','Cita']
  },
  verificada: {
    type: Boolean,
    default: false
    // Indica si la valoración ha sido verificada por un administrador
  },
  reportada: {
    type: Boolean,
    default: false
    // Indica si la valoración ha sido reportada por contenido inapropiado
  },
  visible: {
    type: Boolean,
    default: true
    // Permite ocultar valoraciones inapropiadas
  }
}, {
  timestamps: true
});

// Un usuario solo puede valorar una vez cada interacción (cita o emergencia)
valoracionSchema.index({ usuario: 1, prestador: 1, cita: 1 }, { unique: true, sparse: true });
valoracionSchema.index({ usuario: 1, prestador: 1, emergencia: 1 }, { unique: true, sparse: true });
valoracionSchema.index({ prestador: 1, visible: 1, createdAt: -1 });
valoracionSchema.index({ usuario: 1, createdAt: -1 });

// Hook para actualizar el rating promedio del prestador cuando se crea/modifica una valoración
valoracionSchema.post('save', async function() {
  const Prestador = mongoose.model('Prestador');
  
  // Calcular el nuevo promedio de calificaciones para este prestador
  const [stats] = await this.constructor.aggregate([
    { $match: { prestador: this.prestador, visible: true } },
    { $group: { _id: '$prestador', promedio: { $avg: '$calificacion' }, total: { $sum: 1 } } }
  ]);

  const nuevoRating = stats?.promedio || 0;
  
  // Actualizar el rating y número de reseñas del prestador
  await Prestador.findByIdAndUpdate(this.prestador, {
    rating: parseFloat(nuevoRating.toFixed(1)),
    reviews: stats?.total || 0
  });
});

const Valoracion = mongoose.model("Valoracion", valoracionSchema);
export default Valoracion;
