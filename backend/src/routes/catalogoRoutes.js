import express from "express";
import Servicio from "../models/Servicio.js";
import Prestador from "../models/Prestador.js";
import { serviciosPorTipo } from "../data/serviciosPredefinidos.js";

const router = express.Router();
const SERVICE_FIELDS = "_id nombre descripcion icono color precio duracion categoria tipoPrestador disponibleParaTipos requiereAprobacion modalidadAtencion activo esServicioPredefinido prestadorId";

/**
 * Devuelve el catalogo de servicios predefinidos por tipo de prestador.
 * La carga inicial usa bulkWrite para reducir roundtrips y evitar duplicados.
 */
router.get("/servicios/:tipoPrestador", async (req, res) => {
  try {
    const { tipoPrestador } = req.params;

    if (!serviciosPorTipo[tipoPrestador]) {
      return res.status(404).json({ message: `No se encontro catalogo para el tipo ${tipoPrestador}` });
    }

    let serviciosExistentes = await Servicio.find({
      tipoPrestador,
      esServicioPredefinido: true,
    }).select(SERVICE_FIELDS).sort({ nombre: 1 }).lean();

    if (serviciosExistentes.length > 0) {
      return res.json(serviciosExistentes);
    }

    const operaciones = serviciosPorTipo[tipoPrestador].map((servicio) => ({
      updateOne: {
        filter: {
          nombre: servicio.nombre,
          tipoPrestador,
          esServicioPredefinido: true,
        },
        update: {
          $setOnInsert: {
            ...servicio,
            tipoPrestador,
            esServicioPredefinido: true,
            disponibleParaTipos: servicio.disponibleParaTipos || ["Perro", "Gato"],
            activo: true,
          },
        },
        upsert: true,
      },
    }));

    await Servicio.bulkWrite(operaciones, { ordered: false });
    serviciosExistentes = await Servicio.find({
      tipoPrestador,
      esServicioPredefinido: true,
    }).select(SERVICE_FIELDS).sort({ nombre: 1 }).lean();

    res.status(201).json(serviciosExistentes);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error al obtener catalogo de servicios:", error);
    }
    res.status(500).json({ message: "Error al obtener el catalogo de servicios" });
  }
});

router.get("/prestador/:prestadorId", async (req, res) => {
  try {
    const { prestadorId } = req.params;
    const prestador = await Prestador.findById(prestadorId).select("_id").lean();
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    const servicios = await Servicio.find({
      prestadorId,
      activo: true,
    }).select(SERVICE_FIELDS).sort({ nombre: 1 }).lean();

    res.json(servicios);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error al obtener servicios del prestador:", error.message);
    }
    res.status(500).json({ message: "Error al obtener los servicios del prestador" });
  }
});

export default router;
