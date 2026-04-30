import express from "express";
import mongoose from "mongoose";
import Cita from "../models/Cita.js";
import Emergencia from "../models/Emergencia.js";

const router = express.Router();

/**
 * Cuenta pacientes unicos atendidos por un prestador.
 * Usa aggregation para deduplicar en MongoDB y evitar cargar historiales completos en memoria.
 */
router.get("/prestador/:prestadorId", async (req, res) => {
  try {
    const { prestadorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
      return res.status(400).json({ message: "ID de prestador invalido" });
    }
    const prestadorObjectId = new mongoose.Types.ObjectId(prestadorId);

    const [citasStats, emergenciasStats] = await Promise.all([
      Cita.aggregate([
        { $match: { prestador: prestadorObjectId, estado: "Completada" } },
        { $group: { _id: "$usuario" } },
        { $group: { _id: null, total: { $sum: 1 }, usuarios: { $addToSet: "$_id" } } },
      ]),
      Emergencia.aggregate([
        { $match: { veterinario: prestadorObjectId, estado: "Atendida" } },
        { $group: { _id: "$usuario" } },
        { $group: { _id: null, total: { $sum: 1 }, usuarios: { $addToSet: "$_id" } } },
      ]),
    ]);

    const usuariosUnicos = new Set([
      ...(citasStats[0]?.usuarios || []).map(String),
      ...(emergenciasStats[0]?.usuarios || []).map(String),
    ]);

    res.status(200).json({
      totalPacientes: usuariosUnicos.size,
      desglose: {
        citas: citasStats[0]?.total || 0,
        emergencias: emergenciasStats[0]?.total || 0,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ERROR al contar pacientes:", error);
    }
    res.status(500).json({
      message: "Error al obtener el conteo de pacientes",
    });
  }
});

export default router;
