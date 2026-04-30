import mongoose from "mongoose";

/**
 * Esquema para las campañas de banners publicitarios.
 * Cada campaña pertenece a un Anunciante y contiene una o más imágenes
 * (banners) que se muestran dentro de la app Vetya del lado del cliente.
 */
const bannerSchema = new mongoose.Schema(
  {
    urlImagen: {
      type: String,
      required: true,
    },
    publicId: {
      type: String, // ID de Cloudinary para poder eliminar el recurso
      default: "",
    },
    enlace: {
      type: String, // URL opcional a la que redirige el banner al hacer click
      default: "",
      trim: true,
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true, timestamps: true }
);

const campanaBannerSchema = new mongoose.Schema(
  {
    anunciante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anunciante",
      required: true,
    },
    titulo: {
      type: String,
      trim: true,
      default: "",
    },
    descripcion: {
      type: String,
      trim: true,
      default: "",
    },
    limiteBanners: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    banners: [bannerSchema],
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

campanaBannerSchema.index({ anunciante: 1 });
campanaBannerSchema.index({ anunciante: 1, activo: 1 });
campanaBannerSchema.index({ activo: 1, createdAt: -1 });

const CampanaBanner = mongoose.model("CampanaBanner", campanaBannerSchema);
export default CampanaBanner;
