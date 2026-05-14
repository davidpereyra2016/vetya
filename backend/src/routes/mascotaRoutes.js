import express from "express";
import Mascota from "../models/Mascota.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();

const PET_LIST_FIELDS = "_id nombre tipo raza edad genero color peso vacunado imagen fechaNacimiento ultimaVisita activo createdAt";
const REQUIRED_FIELDS = ["nombre", "tipo", "raza", "edad", "genero"];

const ownsPetFilter = (id, userId) => ({ _id: id, propietario: userId });
const isMissing = (value) => value === undefined || value === null || String(value).trim() === "";
const normalizeOptionalString = (value) => (value === undefined || value === null ? "" : String(value).trim());

router.get("/", protectRoute, async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filter = { propietario: req.user._id, activo: true };

    const [mascotas, total] = await Promise.all([
      Mascota.find(filter)
        .select(PET_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Mascota.countDocuments(filter),
    ]);

    res.status(200).json(paginatedResponse(mascotas, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener las mascotas" });
  }
});

router.get("/tipo/:tipo", protectRoute, async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filter = { propietario: req.user._id, tipo: req.params.tipo, activo: true };

    const [mascotas, total] = await Promise.all([
      Mascota.find(filter)
        .select(PET_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Mascota.countDocuments(filter),
    ]);

    res.status(200).json(paginatedResponse(mascotas, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener las mascotas" });
  }
});

router.get("/:id", protectRoute, async (req, res) => {
  try {
    const mascota = await Mascota.findOne(ownsPetFilter(req.params.id, req.user._id))
      .select(`${PET_LIST_FIELDS} necesidadesEspeciales historialMedico proximasVacunas propietario`)
      .lean();

    if (!mascota) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    res.status(200).json(mascota);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener la mascota" });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { nombre, tipo, raza, edad, genero, color, peso, vacunado, necesidadesEspeciales, fechaNacimiento } = req.body;

    const missingFields = REQUIRED_FIELDS.filter((field) => isMissing(req.body[field]));
    if (missingFields.length > 0) {
      return res.status(400).json({ message: "Por favor completa todos los campos obligatorios" });
    }

    let imageUrl = "";
    if (req.body.imagen) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.imagen, { folder: "mascotas" });
      imageUrl = uploadResponse.secure_url;
    }

    const nuevaMascota = await Mascota.create({
      nombre: normalizeOptionalString(nombre),
      tipo: normalizeOptionalString(tipo),
      raza: normalizeOptionalString(raza),
      edad: normalizeOptionalString(edad),
      genero: normalizeOptionalString(genero),
      color: normalizeOptionalString(color),
      peso: normalizeOptionalString(peso),
      vacunado: vacunado || false,
      necesidadesEspeciales: normalizeOptionalString(necesidadesEspeciales),
      imagen: imageUrl,
      fechaNacimiento: fechaNacimiento || null,
      propietario: req.user._id,
    });

    res.status(201).json(nuevaMascota);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0]?.message || "Datos de mascota invalidos" });
    }
    res.status(500).json({ message: "Error al crear la mascota" });
  }
});

router.put("/:id", protectRoute, async (req, res) => {
  try {
    const mascota = await Mascota.findOne(ownsPetFilter(req.params.id, req.user._id))
      .select("_id imagen propietario")
      .lean();

    if (!mascota) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    const updateData = { ...req.body };
    if (updateData.imagen && updateData.imagen !== mascota.imagen) {
      if (mascota.imagen?.includes("cloudinary")) {
        const publicId = mascota.imagen.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`mascotas/${publicId}`);
      }

      const uploadResponse = await cloudinary.uploader.upload(updateData.imagen, { folder: "mascotas" });
      updateData.imagen = uploadResponse.secure_url;
    }

    const mascotaActualizada = await Mascota.findOneAndUpdate(
      ownsPetFilter(req.params.id, req.user._id),
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(`${PET_LIST_FIELDS} necesidadesEspeciales historialMedico proximasVacunas`).lean();

    res.status(200).json(mascotaActualizada);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al actualizar la mascota" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const mascota = await Mascota.findOne(ownsPetFilter(req.params.id, req.user._id))
      .select("_id imagen")
      .lean();

    if (!mascota) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    if (mascota.imagen?.includes("cloudinary")) {
      const publicId = mascota.imagen.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`mascotas/${publicId}`);
    }

    await Mascota.deleteOne(ownsPetFilter(req.params.id, req.user._id));
    res.status(200).json({ message: "Mascota eliminada con exito" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar la mascota" });
  }
});

router.post("/:id/historial", protectRoute, async (req, res) => {
  try {
    const { fecha, descripcion, veterinario, tipoVisita } = req.body;

    if (!descripcion || !tipoVisita) {
      return res.status(400).json({ message: "La descripcion y el tipo de visita son obligatorios" });
    }

    const nuevaEntrada = {
      fecha: fecha || new Date(),
      descripcion,
      veterinario,
      tipoVisita,
    };

    const mascota = await Mascota.findOneAndUpdate(
      ownsPetFilter(req.params.id, req.user._id),
      {
        $push: { historialMedico: nuevaEntrada },
        $set: { ultimaVisita: nuevaEntrada.fecha },
      },
      { new: true, runValidators: true }
    ).select(`${PET_LIST_FIELDS} necesidadesEspeciales historialMedico proximasVacunas`).lean();

    if (!mascota) {
      return res.status(404).json({ message: "Mascota no encontrada" });
    }

    res.status(201).json(mascota);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al agregar entrada al historial" });
  }
});

export default router;
