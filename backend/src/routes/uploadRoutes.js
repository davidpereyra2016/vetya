import express from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 5
  }
});

const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

// Compatibilidad para builds antiguas de VetYa que subian imagenes antes de crear la emergencia.
router.post("/emergencia", protectRoute, upload.array("imagenes", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Debes adjuntar al menos una imagen" });
    }

    const uploads = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer, "emergencias"))
    );

    res.json({
      urls: uploads.map((result) => result.secure_url)
    });
  } catch (error) {
    console.error("Error al subir imagenes de emergencia:", error);
    res.status(500).json({ message: "Error al subir imagenes de emergencia" });
  }
});

export default router;
