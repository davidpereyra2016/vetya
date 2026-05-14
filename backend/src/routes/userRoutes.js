import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Emergencia from "../models/Emergencia.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { existsSync, mkdirSync, unlink } from "fs";
import { getPagination, normalizeEmail, paginatedResponse } from "../utils/routePerformance.js";
import { normalizeAvatarUrl } from "../utils/avatar.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const uploadDir = "./uploads/";
    if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("El archivo debe ser una imagen"));
    }
    cb(null, true);
  },
});
const router = express.Router();
const USER_PUBLIC_FIELDS = "_id email username profilePicture role emailVerified ubicacionActual deviceToken createdAt";
const removeLocalFile = (path) => {
  if (path) unlink(path, () => {});
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No autorizado" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token invalido" });
    req.user = decoded;
    next();
  });
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const filtro = { role: req.query.role || "client" };
    const pagination = getPagination(req.query, { defaultLimit: 25, maxLimit: 100 });

    const [usuarios, total] = await Promise.all([
      User.find(filtro)
        .select(USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(filtro),
    ]);

    res.json(paginatedResponse(usuarios, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    let user = await User.findById(req.user.userId).select(USER_PUBLIC_FIELDS).lean();
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    const normalizedProfilePicture = normalizeAvatarUrl(user.profilePicture);
    if (normalizedProfilePicture !== user.profilePicture) {
      user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: { profilePicture: normalizedProfilePicture } },
        { new: true, runValidators: true }
      ).select(USER_PUBLIC_FIELDS).lean();
    }
    res.json(user);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.get("/addresses", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [direcciones, user] = await Promise.all([
      Emergencia.aggregate([
        {
          $match: {
            usuario: userObjectId,
            "ubicacion.coordenadas.lat": { $exists: true, $ne: null },
          },
        },
        { $sort: { fechaSolicitud: -1 } },
        {
          $group: {
            _id: {
              lat: { $round: ["$ubicacion.coordenadas.lat", 3] },
              lng: { $round: ["$ubicacion.coordenadas.lng", 3] },
            },
            emergenciaId: { $first: "$_id" },
            direccion: { $first: "$ubicacion.direccion" },
            ciudad: { $first: "$ubicacion.ciudad" },
            coordenadas: { $first: "$ubicacion.coordenadas" },
            ultimoUso: { $first: "$fechaSolicitud" },
          },
        },
        { $limit: 10 },
        {
          $project: {
            _id: "$emergenciaId",
            direccion: 1,
            ciudad: 1,
            coordenadas: 1,
            ultimoUso: 1,
            tipo: { $literal: "emergencia" },
          },
        },
      ]),
      User.findById(userId).select("ubicacionActual").lean(),
    ]);

    let ubicacionActual = null;
    if (user?.ubicacionActual?.coordinates?.lat && user?.ubicacionActual?.coordinates?.lng) {
      ubicacionActual = {
        lat: user.ubicacionActual.coordinates.lat,
        lng: user.ubicacionActual.coordinates.lng,
        lastUpdated: user.ubicacionActual.lastUpdated,
      };
    }

    res.json({ direcciones, ubicacionActual, total: direcciones.length });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al obtener direcciones:", error);
    res.status(500).json({ message: "Error al obtener direcciones" });
  }
});

router.put("/location", authenticateToken, async (req, res) => {
  try {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "Latitud y longitud son requeridas" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $set: {
          ubicacionActual: { coordinates: { lat, lng }, lastUpdated: new Date() },
          ubicacionActualGeo: { type: "Point", coordinates: [lng, lat] },
        },
      },
      { new: true, runValidators: true }
    ).select("_id ubicacionActual").lean();

    if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Ubicacion actualizada", ubicacionActual: updatedUser.ubicacionActual });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al actualizar ubicacion:", error);
    res.status(500).json({ message: "Error al actualizar ubicacion" });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select(USER_PUBLIC_FIELDS).lean();
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.username) updateData.username = String(req.body.username).trim();
    if (req.body.email) updateData.email = normalizeEmail(req.body.email);
    if (req.body.profilePicture) updateData.profilePicture = normalizeAvatarUrl(req.body.profilePicture);

    if (updateData.email) {
      const existingEmail = await User.findOne({
        email: updateData.email,
        _id: { $ne: req.user.userId },
      }).select("_id").lean();
      if (existingEmail) return res.status(400).json({ message: "El correo ya esta registrado" });
    }

    if (updateData.username) {
      const existingUsername = await User.findOne({
        username: updateData.username,
        _id: { $ne: req.user.userId },
      }).select("_id").lean();
      if (existingUsername) return res.status(400).json({ message: "El nombre de usuario ya esta registrado" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(USER_PUBLIC_FIELDS).lean();

    if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(updatedUser);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "La nueva contrasena debe tener al menos 6 caracteres" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "La contrasena actual es incorrecta" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

router.post("/device-token", authenticateToken, async (req, res) => {
  try {
    const { deviceToken } = req.body;
    if (!deviceToken) return res.status(400).json({ message: "Token de dispositivo requerido" });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { deviceToken } },
      { new: true, runValidators: true }
    ).select("_id deviceToken").lean();

    if (!updatedUser) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Token de dispositivo registrado correctamente", deviceToken: updatedUser.deviceToken });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al registrar token de dispositivo:", error);
    res.status(500).json({ message: "Error al registrar token de dispositivo" });
  }
});

router.delete("/device-token", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $set: { deviceToken: null } });
    res.json({ message: "Token de dispositivo eliminado correctamente" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al eliminar token de dispositivo:", error);
    res.status(500).json({ message: "Error al eliminar token de dispositivo" });
  }
});

router.post("/profile-picture", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No se ha proporcionado ninguna imagen" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
      transformation: [{ width: 500, height: 500, crop: "limit" }],
      resource_type: "image",
    });
    removeLocalFile(req.file.path);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { profilePicture: result.secure_url } },
      { new: true, runValidators: true }
    ).select(USER_PUBLIC_FIELDS).lean();

    res.json(updatedUser);
  } catch (error) {
    removeLocalFile(req.file?.path);
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: error.message || "Error al subir la imagen" });
  }
});

export default router;
