import mongoose from "mongoose";

/**
 * Esquema para las suscripciones de publicidad.
 * Una suscripción vincula a un Anunciante con un período de contratación
 * (fecha inicio/fin) y una cuota mensual. Controla la vigencia del
 * servicio publicitario.
 */
const suscripcionSchema = new mongoose.Schema(
  {
    anunciante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anunciante",
      required: true,
    },
    campana: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CampanaBanner",
      default: null,
    },
    cuotaMensual: {
      type: Number,
      required: true,
      min: 0,
    },
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    estado: {
      type: String,
      enum: ["activa", "pausada", "vencida", "cancelada"],
      default: "activa",
    },
    notas: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

suscripcionSchema.index({ anunciante: 1 });
suscripcionSchema.index({ estado: 1 });
suscripcionSchema.index({ estado: 1, fechaInicio: 1, fechaFin: 1 });
suscripcionSchema.index({ campana: 1 }, { sparse: true });

// Virtual: indica si la suscripción está vigente (entre fechaInicio y fechaFin y estado activa)
suscripcionSchema.virtual("vigente").get(function () {
  const hoy = new Date();
  return (
    this.estado === "activa" &&
    this.fechaInicio <= hoy &&
    this.fechaFin >= hoy
  );
});

suscripcionSchema.set("toJSON", { virtuals: true });
suscripcionSchema.set("toObject", { virtuals: true });

const Suscripcion = mongoose.model("Suscripcion", suscripcionSchema);
export default Suscripcion;
