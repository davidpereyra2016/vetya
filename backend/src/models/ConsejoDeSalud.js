import mongoose from "mongoose";

const TIPOS_MASCOTA = ["Perro", "Gato", "Ave", "Reptil", "Roedor", "Pez", "Conejo", "Todos"];

const consejoDeSaludSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    contenido: {
      type: String,
      required: true,
    },
    resumen: {
      type: String,
      required: true,
      trim: true,
      maxlength: 360,
    },
    imagen: {
      type: String,
      required: true,
      trim: true,
    },
    imagenPublicId: {
      type: String,
      trim: true,
      default: "",
    },
    categoria: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    categoriaSlug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    categoriaRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategoriaConsejoSalud",
      default: null,
      index: true,
    },
    paraTipos: [
      {
        type: String,
        enum: TIPOS_MASCOTA,
      },
    ],
    tiempoLectura: {
      type: Number,
      min: 1,
      max: 60,
      default: 5,
    },
    autor: {
      type: String,
      trim: true,
      default: "Equipo Vetya",
    },
    medicoCitado: {
      type: String,
      trim: true,
      default: "",
    },
    fuente: {
      type: String,
      trim: true,
      default: "",
    },
    etiquetas: [
      {
        type: String,
        trim: true,
      },
    ],
    destacado: {
      type: Boolean,
      default: false,
      index: true,
    },
    visualizaciones: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    fechaPublicacion: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

consejoDeSaludSchema.index({ activo: 1, destacado: -1, fechaPublicacion: -1 });
consejoDeSaludSchema.index({ categoriaSlug: 1, activo: 1, fechaPublicacion: -1 });
consejoDeSaludSchema.index({ paraTipos: 1, activo: 1, fechaPublicacion: -1 });
consejoDeSaludSchema.index({
  titulo: "text",
  contenido: "text",
  resumen: "text",
  etiquetas: "text",
  autor: "text",
  medicoCitado: "text",
});

const ConsejoDeSalud = mongoose.model("ConsejoDeSalud", consejoDeSaludSchema);
export { TIPOS_MASCOTA };
export default ConsejoDeSalud;
