import express from "express";
import ConsejoDeSalud from "../models/ConsejoDeSalud.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();
const LIST_FIELDS = "_id titulo resumen imagen categoria paraTipos tiempoLectura autor etiquetas destacado visualizaciones likes fechaPublicacion";

router.get("/", async (req, res) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.paraTipos) filtro.paraTipos = req.query.paraTipos;
    if (req.query.destacado) filtro.destacado = req.query.destacado === "true";
    if (req.query.activo !== undefined) filtro.activo = req.query.activo === "true";

    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ destacado: -1, fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/categoria/:categoria", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = { categoria: req.params.categoria, activo: true };
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/mascota/:tipo", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = {
      $or: [{ paraTipos: req.params.tipo }, { paraTipos: "Todos" }],
      activo: true,
    };
    const [consejos, total] = await Promise.all([
      ConsejoDeSalud.find(filtro)
        .select(LIST_FIELDS)
        .sort({ fechaPublicacion: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ConsejoDeSalud.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los consejos de salud" });
  }
});

router.get("/buscar/:texto", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filtro = { $text: { $search: req.params.texto }, activo: true };
    const consejos = await ConsejoDeSalud.find(filtro, { score: { $meta: "textScore" } })
      .select(`${LIST_FIELDS} score`)
      .sort({ score: { $meta: "textScore" } })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
    const total = await ConsejoDeSalud.countDocuments(filtro);

    res.status(200).json(paginatedResponse(consejos, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al buscar consejos de salud" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findByIdAndUpdate(
      req.params.id,
      { $inc: { visualizaciones: 1 } },
      { new: true }
    ).select(`${LIST_FIELDS} contenido fuente`).lean();

    if (!consejo) {
      return res.status(404).json({ message: "Consejo de salud no encontrado" });
    }

    res.status(200).json(consejo);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener el consejo de salud" });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { titulo, contenido, resumen, categoria, paraTipos, tiempoLectura, autor, fuente, etiquetas, destacado } = req.body;

    if (!titulo || !contenido || !resumen || !categoria) {
      return res.status(400).json({ message: "Titulo, contenido, resumen y categoria son obligatorios" });
    }

    if (!req.body.imagen) {
      return res.status(400).json({ message: "La imagen es obligatoria" });
    }

    const uploadResponse = await cloudinary.uploader.upload(req.body.imagen, { folder: "consejos_salud" });
    const nuevoConsejo = await ConsejoDeSalud.create({
      titulo,
      contenido,
      resumen,
      imagen: uploadResponse.secure_url,
      categoria,
      paraTipos: paraTipos || ["Todos"],
      tiempoLectura: tiempoLectura || 5,
      autor: autor || "Equipo Vetya",
      fuente: fuente || "",
      etiquetas: etiquetas || [],
      destacado: destacado || false,
      fechaPublicacion: new Date(),
    });

    res.status(201).json(nuevoConsejo);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al crear el consejo de salud" });
  }
});

router.put("/:id", protectRoute, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findById(req.params.id).select("_id imagen").lean();
    if (!consejo) {
      return res.status(404).json({ message: "Consejo de salud no encontrado" });
    }

    const updateData = { ...req.body };
    if (updateData.imagen && updateData.imagen !== consejo.imagen) {
      if (consejo.imagen?.includes("cloudinary")) {
        const publicId = consejo.imagen.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`consejos_salud/${publicId}`);
      }
      const uploadResponse = await cloudinary.uploader.upload(updateData.imagen, { folder: "consejos_salud" });
      updateData.imagen = uploadResponse.secure_url;
    }

    const consejoActualizado = await ConsejoDeSalud.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    res.status(200).json(consejoActualizado);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al actualizar el consejo de salud" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findById(req.params.id).select("_id imagen").lean();
    if (!consejo) {
      return res.status(404).json({ message: "Consejo de salud no encontrado" });
    }

    if (consejo.imagen?.includes("cloudinary")) {
      const publicId = consejo.imagen.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`consejos_salud/${publicId}`);
    }

    await ConsejoDeSalud.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Consejo de salud eliminado con exito" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar el consejo de salud" });
  }
});

router.post("/:id/like", protectRoute, async (req, res) => {
  try {
    const consejo = await ConsejoDeSalud.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    ).select("likes").lean();

    if (!consejo) {
      return res.status(404).json({ message: "Consejo de salud no encontrado" });
    }

    res.status(200).json({ likes: consejo.likes });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al dar like al consejo de salud" });
  }
});

export default router;
