import express from "express";
import Servicio from "../models/Servicio.js";
import Cita from "../models/Cita.js";
import protectRoute from "../middleware/auth.middleware.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();
const SERVICE_FIELDS = "_id nombre descripcion icono color precio duracion categoria tipoPrestador disponibleParaTipos requiereAprobacion modalidadAtencion activo esServicioPredefinido prestadorId createdAt";

router.get("/", async (req, res) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.activo !== undefined) filtro.activo = req.query.activo === "true";
    if (req.query.tipoPrestador) filtro.tipoPrestador = req.query.tipoPrestador;

    const pagination = getPagination(req.query, { defaultLimit: 30, maxLimit: 100 });
    const [servicios, total] = await Promise.all([
      Servicio.find(filtro)
        .select(SERVICE_FIELDS)
        .sort({ nombre: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Servicio.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(servicios, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
});

router.get("/tipo/:tipo", async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 30, maxLimit: 100 });
    const filtro = { disponibleParaTipos: req.params.tipo, activo: true };
    const [servicios, total] = await Promise.all([
      Servicio.find(filtro)
        .select(SERVICE_FIELDS)
        .sort({ nombre: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Servicio.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(servicios, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).select(SERVICE_FIELDS).lean();
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.status(200).json(servicio);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener el servicio" });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, precio, duracion, categoria, tipoPrestador, disponibleParaTipos, requiereAprobacion, activo, esServicioPredefinido, modalidadAtencion } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({ message: "El nombre y la descripcion son obligatorios" });
    }
    if (!tipoPrestador) {
      return res.status(400).json({ message: "El tipo de prestador es obligatorio" });
    }

    if (esServicioPredefinido) {
      const existingServicio = await Servicio.findOne({ nombre, esServicioPredefinido: true }).select("_id").lean();
      if (existingServicio) {
        return res.status(400).json({ message: "Ya existe un servicio predefinido con ese nombre" });
      }
    }

    const nuevoServicio = await Servicio.create({
      nombre,
      descripcion,
      icono: icono || "medkit-outline",
      color: color || "#1E88E5",
      precio: precio || 0,
      duracion: duracion || 30,
      categoria: categoria || "Consulta general",
      tipoPrestador,
      disponibleParaTipos: disponibleParaTipos || ["Perro", "Gato", "Ave", "Reptil", "Roedor", "Otro"],
      requiereAprobacion: requiereAprobacion || false,
      modalidadAtencion: modalidadAtencion || undefined,
      activo: activo !== undefined ? activo : true,
      esServicioPredefinido: esServicioPredefinido || false,
    });

    res.status(201).json(nuevoServicio);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al crear el servicio" });
  }
});

router.put("/:id", protectRoute, async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).select("_id nombre").lean();
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    if (req.body.tipoPrestador && !["Veterinario", "Centro Veterinario", "Veterinaria", "Otro"].includes(req.body.tipoPrestador)) {
      return res.status(400).json({ message: "Tipo de prestador invalido" });
    }

    if (req.body.nombre && req.body.nombre !== servicio.nombre) {
      const existingServicio = await Servicio.findOne({
        nombre: req.body.nombre,
        _id: { $ne: req.params.id },
      }).select("_id").lean();
      if (existingServicio) {
        return res.status(400).json({ message: "Ya existe un servicio con ese nombre" });
      }
    }

    const servicioActualizado = await Servicio.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select(SERVICE_FIELDS).lean();

    res.status(200).json(servicioActualizado);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al actualizar el servicio" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).select("_id nombre esServicioPredefinido prestadorId").lean();
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const citasConServicio = await Cita.countDocuments({ servicio: req.params.id });
    if (citasConServicio > 0) {
      return res.status(400).json({
        message: `No se puede eliminar el servicio porque tiene ${citasConServicio} cita(s) asociada(s).`,
        citasAsociadas: citasConServicio,
      });
    }

    if (servicio.esServicioPredefinido && !servicio.prestadorId) {
      const copiasPrestadores = await Servicio.countDocuments({
        nombre: servicio.nombre,
        prestadorId: { $ne: null },
      });

      if (copiasPrestadores > 0) {
        return res.status(400).json({
          message: `No se puede eliminar este servicio predefinido porque ${copiasPrestadores} prestador(es) lo estan utilizando.`,
          prestadoresUsando: copiasPrestadores,
        });
      }
    }

    await Servicio.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Servicio eliminado con exito",
      nombreServicio: servicio.nombre,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar el servicio" });
  }
});

router.patch("/:id/estado", protectRoute, async (req, res) => {
  try {
    const { activo } = req.body;
    if (activo === undefined) {
      return res.status(400).json({ message: "El estado es requerido" });
    }

    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { $set: { activo } },
      { new: true, runValidators: true }
    ).select(SERVICE_FIELDS).lean();

    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    res.status(200).json(servicio);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al actualizar el estado del servicio" });
  }
});

export default router;
