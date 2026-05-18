import mongoose from "mongoose";

const categoriaConsejoSaludSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
      maxlength: 240,
    },
    color: {
      type: String,
      trim: true,
      default: "#1E88E5",
    },
    icono: {
      type: String,
      trim: true,
      default: "medical",
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

categoriaConsejoSaludSchema.index({ activo: 1, nombre: 1 });

const CategoriaConsejoSalud = mongoose.model("CategoriaConsejoSalud", categoriaConsejoSaludSchema);
export default CategoriaConsejoSalud;
