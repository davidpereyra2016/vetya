import mongoose from "mongoose";

/**
 * Esquema para los anunciantes (clientes que contratan publicidad en la app Vetya)
 * Representa a empresas o emprendimientos que pagan para mostrar banners
 * publicitarios dentro de la aplicación móvil del cliente.
 */
const anuncianteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    nombreNegocio: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

anuncianteSchema.index({ nombreNegocio: 1 });

const Anunciante = mongoose.model("Anunciante", anuncianteSchema);
export default Anunciante;
