import express from "express";
import User from "../models/User.js";
import { protectRoute, checkRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.patch("/:id/ubicacion", protectRoute, checkRole(["client"]), async (req, res) => {
  try {
    const clientId = req.params.id;
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    if (req.user.id.toString() !== clientId) {
      return res.status(403).json({ message: "No autorizado para actualizar este usuario" });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "Coordenadas invalidas" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      clientId,
      {
        $set: {
          ubicacionActual: {
            coordinates: { lat, lng },
            lastUpdated: new Date(),
          },
          ubicacionActualGeo: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
      { new: true, runValidators: true }
    ).select("_id ubicacionActual").lean();

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({
      success: true,
      message: "Ubicacion actualizada con exito",
      data: { ubicacion: updatedUser.ubicacionActual },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al actualizar ubicacion:", error);
    res.status(500).json({ message: "Error al actualizar la ubicacion" });
  }
});

router.get("/:id/ubicacion", protectRoute, async (req, res) => {
  try {
    const clientId = req.params.id;

    if (req.user.id.toString() !== clientId && req.user.role !== "provider") {
      return res.status(403).json({ message: "No autorizado para ver esta ubicacion" });
    }

    const user = await User.findById(clientId).select("_id ubicacionActual").lean();
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.ubicacionActual?.coordinates) {
      return res.status(404).json({ message: "El usuario no tiene ubicacion registrada" });
    }

    res.status(200).json({
      success: true,
      data: { ubicacion: user.ubicacionActual },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al obtener ubicacion:", error);
    res.status(500).json({ message: "Error al obtener la ubicacion" });
  }
});

export default router;
