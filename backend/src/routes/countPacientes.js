import express from "express";
import Cita from "../models/Cita.js";
import Emergencia from "../models/Emergencia.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Endpoint para contar pacientes únicos (usuarios) atendidos por un prestador de servicio
 * Considera tanto citas como emergencias, sin duplicar usuarios que aparecen en ambos
 */
router.get("/prestador/:prestadorId", async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log(`DEBUG - Contando pacientes únicos para el prestador: ${prestadorId}`);

    // Buscar todas las citas completadas del prestador
    const citasCompletadas = await Cita.find({
      prestador: prestadorId,
      estado: "Completada"
    }).select("usuario");

    // Buscar todas las emergencias atendidas del prestador (campo veterinario)
    const emergenciasAtendidas = await Emergencia.find({
      veterinario: prestadorId,
      estado: "Atendida"
    }).select("usuario");

    // Extraer los IDs de usuario únicos de citas
    const usuariosCitas = citasCompletadas.map(cita => cita.usuario.toString());
    
    // Extraer los IDs de usuario únicos de emergencias
    const usuariosEmergencias = emergenciasAtendidas.map(emergencia => emergencia.usuario.toString());
    
    // Combinar ambos arrays y eliminar duplicados usando un Set
    const todosUsuarios = [...usuariosCitas, ...usuariosEmergencias];
    const usuariosUnicos = [...new Set(todosUsuarios)];
    
    const totalPacientes = usuariosUnicos.length;
    
    console.log(`DEBUG - Total pacientes únicos atendidos: ${totalPacientes}`);
    
    res.status(200).json({
      totalPacientes,
      desglose: {
        citas: usuariosCitas.length,
        emergencias: usuariosEmergencias.length
      }
    });
  } catch (error) {
    console.error("ERROR al contar pacientes:", error);
    res.status(500).json({ 
      message: "Error al obtener el conteo de pacientes" 
    });
  }
});

export default router;
