import express from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import Anunciante from "../models/Anunciante.js";
import CampanaBanner from "../models/CampanaBanner.js";
import Suscripcion from "../models/Suscripcion.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const okExt = allowed.test(file.originalname.toLowerCase());
    const okMime = allowed.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(new Error("Solo se permiten imágenes (jpg, jpeg, png, gif, webp)"));
  },
});

/**
 * Sube un buffer a Cloudinary en la carpeta vetya/publicidad
 */
const uploadBufferToCloudinary = (buffer, folder = "vetya/publicidad") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// =====================================================================
// ENDPOINT PÚBLICO - Banners activos para mostrar en la app del cliente
// =====================================================================
router.get("/banners-activos", async (req, res) => {
  try {
    const hoy = new Date();

    // 1. Obtener suscripciones vigentes
    const suscripcionesVigentes = await Suscripcion.find({
      estado: "activa",
      fechaInicio: { $lte: hoy },
      fechaFin: { $gte: hoy },
    }).select("anunciante").lean();

    const anunciantesActivos = suscripcionesVigentes.map((s) => s.anunciante);

    // 2. Obtener campañas de esos anunciantes
    const campanas = await CampanaBanner.find({
      anunciante: { $in: anunciantesActivos },
      activo: true,
    })
      .populate("anunciante", "nombre apellido nombreNegocio")
      .lean();

    // 3. Aplanar banners activos respetando el límite de cada campaña
    const banners = [];
    campanas.forEach((c) => {
      const activos = (c.banners || [])
        .filter((b) => b.activo)
        .slice(0, c.limiteBanners)
        .map((b) => ({
          _id: b._id,
          urlImagen: b.urlImagen,
          enlace: b.enlace,
          orden: b.orden,
          campanaId: c._id,
          titulo: c.titulo,
          anunciante: c.anunciante,
        }));
      banners.push(...activos);
    });

    banners.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    res.json({ success: true, total: banners.length, banners });
  } catch (error) {
    console.error("Error al obtener banners activos:", error);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener banners" });
  }
});

// =====================================================================
// ANUNCIANTES CRUD
// =====================================================================

// Listar anunciantes
router.get("/anunciantes", protectRoute, async (req, res) => {
  try {
    const anunciantes = await Anunciante.find().sort({ createdAt: -1 }).lean();
    res.json(anunciantes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener anunciantes" });
  }
});

// Obtener un anunciante
router.get("/anunciantes/:id", protectRoute, async (req, res) => {
  try {
    const anunciante = await Anunciante.findById(req.params.id).lean();
    if (!anunciante)
      return res.status(404).json({ message: "Anunciante no encontrado" });
    res.json(anunciante);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener anunciante" });
  }
});

// Crear anunciante
router.post("/anunciantes", protectRoute, async (req, res) => {
  try {
    const { nombre, apellido, telefono, nombreNegocio, email } = req.body;
    if (!nombre || !apellido || !telefono || !nombreNegocio) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios" });
    }
    const anunciante = await Anunciante.create({
      nombre,
      apellido,
      telefono,
      nombreNegocio,
      email: email || "",
    });
    res.status(201).json(anunciante);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear anunciante" });
  }
});

// Actualizar anunciante
router.put("/anunciantes/:id", protectRoute, async (req, res) => {
  try {
    const anunciante = await Anunciante.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!anunciante)
      return res.status(404).json({ message: "Anunciante no encontrado" });
    res.json(anunciante);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar anunciante" });
  }
});

// Eliminar anunciante (cascada: elimina campañas/suscripciones asociadas)
router.delete("/anunciantes/:id", protectRoute, async (req, res) => {
  try {
    const anunciante = await Anunciante.findById(req.params.id);
    if (!anunciante)
      return res.status(404).json({ message: "Anunciante no encontrado" });

    // Eliminar imágenes de Cloudinary de campañas asociadas
    const campanas = await CampanaBanner.find({ anunciante: anunciante._id });
    for (const c of campanas) {
      for (const b of c.banners || []) {
        if (b.publicId) {
          try {
            await cloudinary.uploader.destroy(b.publicId);
          } catch (err) {
            console.warn("Error eliminando imagen:", err.message);
          }
        }
      }
    }

    await CampanaBanner.deleteMany({ anunciante: anunciante._id });
    await Suscripcion.deleteMany({ anunciante: anunciante._id });
    await anunciante.deleteOne();

    res.json({ message: "Anunciante eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar anunciante" });
  }
});

// =====================================================================
// CAMPAÑAS / BANNERS CRUD
// =====================================================================

// Listar campañas (opcional filtro por anunciante)
router.get("/campanas", protectRoute, async (req, res) => {
  try {
    const filter = {};
    if (req.query.anunciante) filter.anunciante = req.query.anunciante;
    const campanas = await CampanaBanner.find(filter)
      .populate("anunciante", "nombre apellido nombreNegocio")
      .sort({ createdAt: -1 })
      .lean();
    res.json(campanas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener campañas" });
  }
});

// Obtener campaña por ID
router.get("/campanas/:id", protectRoute, async (req, res) => {
  try {
    const campana = await CampanaBanner.findById(req.params.id).populate(
      "anunciante"
    ).lean();
    if (!campana)
      return res.status(404).json({ message: "Campaña no encontrada" });
    res.json(campana);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener campaña" });
  }
});

// Crear campaña con banners (acepta múltiples imágenes con multer)
router.post(
  "/campanas",
  protectRoute,
  upload.array("imagenes", 10),
  async (req, res) => {
    try {
      const { anunciante, titulo, descripcion, limiteBanners, enlace } =
        req.body;
      if (!anunciante) {
        return res.status(400).json({ message: "Anunciante requerido" });
      }

      const existeAnunciante = await Anunciante.findById(anunciante);
      if (!existeAnunciante) {
        return res.status(404).json({ message: "Anunciante no existe" });
      }

      const banners = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const up = await uploadBufferToCloudinary(file.buffer);
          banners.push({
            urlImagen: up.secure_url,
            publicId: up.public_id,
            enlace: enlace || "",
            activo: true,
          });
        }
      }

      const campana = await CampanaBanner.create({
        anunciante,
        titulo: titulo || "",
        descripcion: descripcion || "",
        limiteBanners: Number(limiteBanners) || 1,
        banners,
      });

      res.status(201).json(campana);
    } catch (error) {
      console.error("Error al crear campaña:", error);
      res.status(500).json({ message: "Error al crear campaña" });
    }
  }
);

// Actualizar campaña (datos básicos) y opcionalmente añadir nuevos banners
router.put(
  "/campanas/:id",
  protectRoute,
  upload.array("imagenes", 10),
  async (req, res) => {
    try {
      const campana = await CampanaBanner.findById(req.params.id);
      if (!campana)
        return res.status(404).json({ message: "Campaña no encontrada" });

      const { titulo, descripcion, limiteBanners, activo, enlace } = req.body;
      if (titulo !== undefined) campana.titulo = titulo;
      if (descripcion !== undefined) campana.descripcion = descripcion;
      if (limiteBanners !== undefined)
        campana.limiteBanners = Number(limiteBanners);
      if (activo !== undefined) campana.activo = activo === "true" || activo === true;

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const up = await uploadBufferToCloudinary(file.buffer);
          campana.banners.push({
            urlImagen: up.secure_url,
            publicId: up.public_id,
            enlace: enlace || "",
            activo: true,
          });
        }
      }

      await campana.save();
      res.json(campana);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar campaña" });
    }
  }
);

// Eliminar un banner específico dentro de una campaña
router.delete(
  "/campanas/:campanaId/banners/:bannerId",
  protectRoute,
  async (req, res) => {
    try {
      const campana = await CampanaBanner.findById(req.params.campanaId);
      if (!campana)
        return res.status(404).json({ message: "Campaña no encontrada" });

      const banner = campana.banners.id(req.params.bannerId);
      if (!banner)
        return res.status(404).json({ message: "Banner no encontrado" });

      if (banner.publicId) {
        try {
          await cloudinary.uploader.destroy(banner.publicId);
        } catch (err) {
          console.warn("Error eliminando imagen:", err.message);
        }
      }

      banner.deleteOne();
      await campana.save();
      res.json({ message: "Banner eliminado", campana });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar banner" });
    }
  }
);

// Eliminar campaña completa
router.delete("/campanas/:id", protectRoute, async (req, res) => {
  try {
    const campana = await CampanaBanner.findById(req.params.id);
    if (!campana)
      return res.status(404).json({ message: "Campaña no encontrada" });

    for (const b of campana.banners || []) {
      if (b.publicId) {
        try {
          await cloudinary.uploader.destroy(b.publicId);
        } catch (err) {
          console.warn("Error eliminando imagen:", err.message);
        }
      }
    }

    await campana.deleteOne();
    res.json({ message: "Campaña eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar campaña" });
  }
});

// =====================================================================
// SUSCRIPCIONES CRUD
// =====================================================================

// Listar suscripciones
router.get("/suscripciones", protectRoute, async (req, res) => {
  try {
    const filter = {};
    if (req.query.anunciante) filter.anunciante = req.query.anunciante;
    if (req.query.estado) filter.estado = req.query.estado;
    const suscripciones = await Suscripcion.find(filter)
      .populate("anunciante", "nombre apellido nombreNegocio")
      .populate("campana", "titulo limiteBanners")
      .sort({ createdAt: -1 })
      .lean();
    res.json(suscripciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener suscripciones" });
  }
});

// Obtener una suscripción
router.get("/suscripciones/:id", protectRoute, async (req, res) => {
  try {
    const s = await Suscripcion.findById(req.params.id)
      .populate("anunciante")
      .populate("campana")
      .lean();
    if (!s) return res.status(404).json({ message: "No encontrada" });
    res.json(s);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener suscripción" });
  }
});

// Crear suscripción
router.post("/suscripciones", protectRoute, async (req, res) => {
  try {
    const {
      anunciante,
      campana,
      cuotaMensual,
      fechaInicio,
      fechaFin,
      estado,
      notas,
    } = req.body;

    if (!anunciante || cuotaMensual === undefined || !fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios" });
    }

    const existe = await Anunciante.findById(anunciante);
    if (!existe)
      return res.status(404).json({ message: "Anunciante no existe" });

    const suscripcion = await Suscripcion.create({
      anunciante,
      campana: campana || null,
      cuotaMensual: Number(cuotaMensual),
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      estado: estado || "activa",
      notas: notas || "",
    });
    res.status(201).json(suscripcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear suscripción" });
  }
});

// Actualizar suscripción
router.put("/suscripciones/:id", protectRoute, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.fechaInicio) update.fechaInicio = new Date(update.fechaInicio);
    if (update.fechaFin) update.fechaFin = new Date(update.fechaFin);
    if (update.cuotaMensual !== undefined)
      update.cuotaMensual = Number(update.cuotaMensual);

    const s = await Suscripcion.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!s) return res.status(404).json({ message: "No encontrada" });
    res.json(s);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar suscripción" });
  }
});

// Eliminar suscripción
router.delete("/suscripciones/:id", protectRoute, async (req, res) => {
  try {
    const s = await Suscripcion.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ message: "No encontrada" });
    res.json({ message: "Suscripción eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar suscripción" });
  }
});

export default router;
