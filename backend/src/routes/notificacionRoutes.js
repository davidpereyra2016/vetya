import express from "express";
import Notificacion from "../models/Notificacion.js";
import protectRoute from "../middleware/auth.middleware.js";
import Prestador from "../models/Prestador.js";
import User from "../models/User.js";
import admin from "../config/firebase.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();
const NOTIFICATION_FIELDS = "_id usuario prestador titulo mensaje tipo accion icono color leida fechaEnvio fechaLectura enlace activa prioridad datos createdAt";

const getRecipientFilter = async (userId, leidas) => {
  const prestador = await Prestador.findOne({ usuario: userId }).select("_id").lean();
  const filtro = prestador ? { prestador: prestador._id } : { usuario: userId };
  if (leidas !== undefined) filtro.leida = leidas === "true";
  return { filtro, prestadorId: prestador?._id || null };
};

router.get("/", protectRoute, async (req, res) => {
  try {
    const pagination = getPagination(req.query, { defaultLimit: 30, maxLimit: 100 });
    const { filtro } = await getRecipientFilter(req.user._id, req.query.leidas);

    const [notificaciones, total] = await Promise.all([
      Notificacion.find(filtro)
        .select(NOTIFICATION_FIELDS)
        .sort({ fechaEnvio: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Notificacion.countDocuments(filtro),
    ]);

    res.status(200).json(paginatedResponse(notificaciones, total, pagination));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener las notificaciones" });
  }
});

router.get("/conteo", protectRoute, async (req, res) => {
  try {
    const { filtro } = await getRecipientFilter(req.user._id);
    filtro.leida = false;
    const conteo = await Notificacion.countDocuments(filtro);
    res.status(200).json({ conteo });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al obtener el conteo de notificaciones" });
  }
});

router.patch("/leer-todas", protectRoute, async (req, res) => {
  try {
    const { filtro } = await getRecipientFilter(req.user._id);
    filtro.leida = false;

    await Notificacion.updateMany(filtro, {
      $set: { leida: true, fechaLectura: new Date() },
    });

    res.status(200).json({ message: "Todas las notificaciones marcadas como leidas" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al marcar las notificaciones" });
  }
});

router.patch("/:id/leer", protectRoute, async (req, res) => {
  try {
    const { filtro } = await getRecipientFilter(req.user._id);
    filtro._id = req.params.id;

    const notificacion = await Notificacion.findOneAndUpdate(
      filtro,
      { $set: { leida: true, fechaLectura: new Date() } },
      { new: true }
    ).select(NOTIFICATION_FIELDS).lean();

    if (!notificacion) {
      return res.status(404).json({ message: "Notificacion no encontrada" });
    }

    res.status(200).json(notificacion);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al marcar la notificacion como leida" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const { filtro } = await getRecipientFilter(req.user._id);
    filtro._id = req.params.id;

    const deleted = await Notificacion.findOneAndDelete(filtro).select("_id").lean();
    if (!deleted) {
      return res.status(404).json({ message: "Notificacion no encontrada" });
    }

    res.status(200).json({ message: "Notificacion eliminada con exito" });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al eliminar la notificacion" });
  }
});

router.post("/", protectRoute, async (req, res) => {
  try {
    const { usuario, prestador, titulo, mensaje, tipo, icono, color, prioridad, enlace, enviarPush } = req.body;

    if ((!usuario && !prestador) || !titulo || !mensaje) {
      return res.status(400).json({ message: "Usuario o prestador, titulo y mensaje son obligatorios" });
    }

    const nuevaNotificacion = await Notificacion.create({
      usuario,
      prestador,
      titulo,
      mensaje,
      tipo: tipo || "Sistema",
      icono: icono || "notifications-outline",
      color: color || "#1E88E5",
      prioridad: prioridad || "Media",
      enlace: enlace || { tipo: null, id: null, url: null },
    });

    if (enviarPush && admin) {
      try {
        let destinatarioInfo;
        if (prestador) {
          const prestadorData = await Prestador.findById(prestador)
            .select("nombre usuario")
            .populate("usuario", "deviceToken")
            .lean();
          if (prestadorData?.usuario?.deviceToken) {
            destinatarioInfo = { token: prestadorData.usuario.deviceToken, nombre: prestadorData.nombre };
          }
        } else if (usuario) {
          const userData = await User.findById(usuario).select("username deviceToken").lean();
          if (userData?.deviceToken) {
            destinatarioInfo = { token: userData.deviceToken, nombre: userData.username };
          }
        }

        if (destinatarioInfo?.token) {
          await admin.messaging().send({
            notification: { title: titulo, body: mensaje },
            data: {
              tipo: tipo || "Sistema",
              notificacionId: nuevaNotificacion._id.toString(),
              enlaceTipo: enlace?.tipo || "",
              enlaceId: enlace?.id || "",
              enlaceUrl: enlace?.url || "",
            },
            token: destinatarioInfo.token,
          });
        }
      } catch (pushError) {
        if (process.env.NODE_ENV !== "production") console.error("Error al enviar notificacion push:", pushError);
      }
    }

    res.status(201).json(nuevaNotificacion);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    res.status(500).json({ message: "Error al crear la notificacion" });
  }
});

router.post("/emergencia-asignada", protectRoute, async (req, res) => {
  try {
    const { emergenciaId, prestadorId, clienteNombre, mascotaNombre, tipoEmergencia } = req.body;
    if (!emergenciaId || !prestadorId || !tipoEmergencia) {
      return res.status(400).json({ message: "Datos de emergencia incompletos" });
    }

    const prestador = await Prestador.findById(prestadorId)
      .select("nombre usuario")
      .populate("usuario", "deviceToken")
      .lean();
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    const mensaje = `${clienteNombre || "Un cliente"} necesita atencion urgente para ${mascotaNombre || "su mascota"} por ${tipoEmergencia}. Por favor responde lo antes posible.`;
    const nuevaNotificacion = await Notificacion.create({
      prestador: prestadorId,
      titulo: "Emergencia asignada",
      mensaje,
      tipo: "Emergencia",
      icono: "alert-circle",
      color: "#F44336",
      prioridad: "Alta",
      enlace: { tipo: "Emergencia", id: emergenciaId, url: "/emergencias/asignadas" },
    });

    if (admin && prestador.usuario?.deviceToken) {
      try {
        await admin.messaging().send({
          notification: { title: "Emergencia veterinaria asignada", body: mensaje },
          data: {
            tipo: "Emergencia",
            notificacionId: nuevaNotificacion._id.toString(),
            emergenciaId,
            enlaceTipo: "Emergencia",
            enlaceId: emergenciaId,
            enlaceUrl: "/emergencias/asignadas",
            prioridad: "alta",
          },
          android: { priority: "high" },
          token: prestador.usuario.deviceToken,
        });
      } catch (pushError) {
        if (process.env.NODE_ENV !== "production") console.error("Error al enviar notificacion push de emergencia:", pushError);
      }
    }

    res.status(201).json({
      message: "Notificacion de emergencia enviada",
      notificacion: nuevaNotificacion,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error al enviar notificacion de emergencia:", error);
    res.status(500).json({ message: "Error al enviar notificacion de emergencia" });
  }
});

export default router;
