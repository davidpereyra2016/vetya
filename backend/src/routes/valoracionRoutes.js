import express from "express";
import Valoracion from "../models/Valoracion.js";
import Prestador from "../models/Prestador.js";
import Cita from "../models/Cita.js";
import Emergencia from "../models/Emergencia.js";
import Notificacion from "../models/Notificacion.js";
import protectRoute from "../middleware/auth.middleware.js";
import { enviarNotificacionPush, esTokenValido } from "../utils/notificacionesUtils.js";

const router = express.Router();

// Obtener todas las valoraciones de un prestador
router.get("/veterinario/:veterinarioId", async (req, res) => {
  try {
    console.log(`DEBUG - Obteniendo valoraciones para el prestador: ${req.params.veterinarioId}`);
    const valoraciones = await Valoracion.find({ 
      prestador: req.params.veterinarioId,
      visible: true
    })
      .populate("usuario", "username profilePicture")
      .populate("mascota", "nombre tipo raza")
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`DEBUG - Valoraciones encontradas: ${valoraciones.length}`);
    res.status(200).json(valoraciones);
  } catch (error) {
    console.log("ERROR al obtener valoraciones:", error);
    res.status(500).json({ message: "Error al obtener las valoraciones" });
  }
});

// Mantener ruta con nuevo nombre para mejor semántica (pero conservar la antigua para compatibilidad)
router.get("/prestador/:prestadorId", async (req, res) => {
  try {
    console.log(`DEBUG - Obteniendo valoraciones para el prestador: ${req.params.prestadorId}`);
    const valoraciones = await Valoracion.find({ 
      prestador: req.params.prestadorId,
      visible: true
    })
      .populate("usuario", "username profilePicture")
      .populate("mascota", "nombre tipo raza")
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`DEBUG - Valoraciones encontradas: ${valoraciones.length}`);
    res.status(200).json(valoraciones);
  } catch (error) {
    console.log("ERROR al obtener valoraciones:", error);
    res.status(500).json({ message: "Error al obtener las valoraciones" });
  }
});

// Obtener las valoraciones hechas por el usuario autenticado
router.get("/mis-valoraciones", protectRoute, async (req, res) => {
  try {
    console.log(`DEBUG - Obteniendo mis valoraciones para usuario: ${req.user._id}`);
    const valoraciones = await Valoracion.find({ usuario: req.user._id })
      .populate("prestador", "nombre especialidad imagen rating")
      .populate("mascota", "nombre tipo raza")
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`DEBUG - Mis valoraciones encontradas: ${valoraciones.length}`);
    res.status(200).json(valoraciones);
  } catch (error) {
    console.log("ERROR al obtener mis valoraciones:", error);
    res.status(500).json({ message: "Error al obtener las valoraciones" });
  }
});

// Verificar si el usuario puede valorar a un prestador
router.get("/puede-valorar/:veterinarioId", protectRoute, async (req, res) => {
  try {
    const prestadorId = req.params.veterinarioId;
    console.log(`DEBUG - Verificando si puede valorar al prestador: ${prestadorId}`);
    
    // Verificar si el usuario ya ha valorado a este prestador
    const valoracionExistente = await Valoracion.findOne({
      usuario: req.user._id,
      prestador: prestadorId
    }).select("_id").lean();
    
    if (valoracionExistente) {
      return res.status(200).json({ 
        puedeValorar: false, 
        mensaje: "Ya has valorado a este veterinario" 
      });
    }
    
    // Verificar si el usuario ha tenido una cita o emergencia con este prestador
    const citas = await Cita.find({
      usuario: req.user._id,
      prestador: prestadorId,
      estado: "Completada"
    }).select("_id").lean();
    
    const emergencias = await Emergencia.find({
      usuario: req.user._id,
      prestador: prestadorId,
      estado: "Atendida"
    }).select("_id").lean();
    
    const puedeValorar = citas.length > 0 || emergencias.length > 0;
    
    console.log(`DEBUG - Puede valorar al prestador ${prestadorId}: ${puedeValorar}`);
    console.log(`DEBUG - Citas completadas: ${citas.length}, Emergencias atendidas: ${emergencias.length}`);
    
    res.status(200).json({
      puedeValorar,
      mensaje: puedeValorar ? 
        "Puedes valorar a este veterinario" : 
        "Solo puedes valorar a veterinarios con los que hayas tenido una cita o emergencia"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al verificar si puede valorar" });
  }
});

// Crear una nueva valoración
router.post("/", protectRoute, async (req, res) => {
  try {
    // Aceptar tanto 'prestador' como 'veterinario' para mantener compatibilidad
    let { prestador, veterinario, mascota, calificacion, comentario, cita, emergencia, tipoServicio } = req.body;
    
    // Usar prestador si está disponible, si no usar veterinario (compatibilidad hacia atrás)
    const prestadorId = prestador || veterinario;
    
    console.log('DEBUG - Payload recibido en /valoraciones:', { 
      prestadorId, 
      mascota, 
      calificacion, 
      comentario,
      cita,
      emergencia,
      tipoServicio
    });
    
    // Validar campos obligatorios
    if (!prestadorId || !calificacion) {
      return res.status(400).json({ message: "El prestador y la calificación son obligatorios" });
    }
    
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ message: "La calificación debe estar entre 1 y 5" });
    }
    
    // Verificar si el usuario ya ha valorado a este prestador
    const valoracionExistente = await Valoracion.findOne({
      usuario: req.user._id,
      prestador: prestadorId
    });
    
    if (valoracionExistente) {
      return res.status(400).json({ message: "Ya has valorado a este prestador" });
    }
    
    // Verificar si el usuario ha tenido una cita o emergencia con este prestador
    let puedeValorar = false;
    let fechaAtencion = null;
    
    if (cita) {
      const citaExistente = await Cita.findOne({
        _id: cita,
        usuario: req.user._id,
        prestador: prestadorId,
        estado: "Completada"
      });
      
      if (citaExistente) {
        puedeValorar = true;
        fechaAtencion = citaExistente.fecha;
      }
    } else if (emergencia) {
      const emergenciaExistente = await Emergencia.findOne({
        _id: emergencia,
        usuario: req.user._id,
        prestador: prestadorId,
        estado: "Atendida"
      });
      
      if (emergenciaExistente) {
        puedeValorar = true;
        fechaAtencion = emergenciaExistente.fechaAtencion;
      }
    } else {
      // Si no se especifica cita o emergencia, verificar si ha tenido alguna
      const citasCompletadas = await Cita.find({
        usuario: req.user._id,
        prestador: prestadorId,
        estado: "Completada"
      });
      
      const emergenciasAtendidas = await Emergencia.find({
        usuario: req.user._id,
        prestador: prestadorId,
        estado: "Atendida"
      });
      
      puedeValorar = citasCompletadas.length > 0 || emergenciasAtendidas.length > 0;
      
      if (citasCompletadas.length > 0) {
        fechaAtencion = citasCompletadas[0].fecha;
      } else if (emergenciasAtendidas.length > 0) {
        fechaAtencion = emergenciasAtendidas[0].fechaAtencion;
      }
    }
    
    if (!puedeValorar) {
      return res.status(400).json({ 
        message: "Solo puedes valorar a prestadores con los que hayas tenido una cita o emergencia" 
      });
    }
    
    // Crear nueva valoración
    const nuevaValoracion = new Valoracion({
      usuario: req.user._id,
      prestador: prestadorId,
      mascota,
      cita,
      emergencia,
      calificacion,
      comentario: comentario || "",
      fechaAtencion,
      tipoServicio: tipoServicio || "Consulta"
    });
    
    await nuevaValoracion.save();
    
    // Populate para devolver la información completa
    const valoracionCompletada = await Valoracion.findById(nuevaValoracion._id)
      .populate("usuario", "username profilePicture")
      .populate("mascota", "nombre tipo raza")
      .populate("veterinario", "nombre");

    const prestadorNotificado = await Prestador.findById(prestadorId).populate("usuario", "deviceToken");
    if (prestadorNotificado) {
      const nombreAutor = valoracionCompletada?.usuario?.username || req.user?.email || "Un cliente";
      const nombreMascota = valoracionCompletada?.mascota?.nombre || "una mascota";
      const titulo = "Nueva valoración recibida";
      const mensaje = `${nombreAutor} te dejó ${calificacion} estrella${calificacion > 1 ? "s" : ""} por la atención de ${nombreMascota}.`;

      const notificacionPrestador = new Notificacion({
        tipo: "valoracion_nueva",
        titulo,
        mensaje,
        prestador: prestadorNotificado._id,
        datos: {
          valoracionId: valoracionCompletada._id,
          prestadorId,
          calificacion,
          comentario: comentario || "",
          clienteNombre: nombreAutor,
          mascotaNombre: nombreMascota,
          tipoServicio: tipoServicio || "Consulta"
        },
        icono: "star",
        color: "#F59E0B",
        prioridad: "Media",
        accion: "ver_detalle"
      });

      await notificacionPrestador.save();

      if (prestadorNotificado.usuario?.deviceToken && esTokenValido(prestadorNotificado.usuario.deviceToken)) {
        await enviarNotificacionPush(
          prestadorNotificado.usuario.deviceToken,
          titulo,
          mensaje,
          {
            tipo: "valoracion_nueva",
            notificacionId: notificacionPrestador._id.toString(),
            valoracionId: valoracionCompletada._id.toString(),
            accion: "ver_detalle",
            datos: notificacionPrestador.datos
          }
        );
      }
    }
    
    res.status(201).json(valoracionCompletada);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear la valoración" });
  }
});

// Actualizar una valoración
router.put("/:id", protectRoute, async (req, res) => {
  try {
    const { calificacion, comentario } = req.body;
    
    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ message: "La calificación debe estar entre 1 y 5" });
    }
    
    const valoracion = await Valoracion.findById(req.params.id);
    
    if (!valoracion) {
      return res.status(404).json({ message: "Valoración no encontrada" });
    }
    
    // Verificar si el usuario actual es el autor
    if (valoracion.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para modificar esta valoración" });
    }
    
    // Solo permitir actualizar calificación y comentario
    valoracion.calificacion = calificacion;
    valoracion.comentario = comentario || "";
    
    await valoracion.save();
    
    const valoracionActualizada = await Valoracion.findById(valoracion._id)
      .populate("usuario", "username profilePicture")
      .populate("mascota", "nombre tipo raza")
      .populate("veterinario", "nombre");
    
    res.status(200).json(valoracionActualizada);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar la valoración" });
  }
});

// Eliminar una valoración
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const valoracion = await Valoracion.findById(req.params.id);
    
    if (!valoracion) {
      return res.status(404).json({ message: "Valoración no encontrada" });
    }
    
    // Verificar si el usuario actual es el autor
    if (valoracion.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para eliminar esta valoración" });
    }
    
    await Valoracion.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Valoración eliminada con éxito" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al eliminar la valoración" });
  }
});

// Reportar una valoración
router.patch("/:id/reportar", protectRoute, async (req, res) => {
  try {
    const valoracion = await Valoracion.findById(req.params.id);
    
    if (!valoracion) {
      return res.status(404).json({ message: "Valoración no encontrada" });
    }
    
    valoracion.reportada = true;
    await valoracion.save();
    
    res.status(200).json({ message: "Valoración reportada con éxito" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al reportar la valoración" });
  }
});

export default router;
