import express from "express";
import Servicio from "../models/Servicio.js";
import { serviciosPorTipo } from "../data/serviciosPredefinidos.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Endpoint para obtener todos los servicios predefinidos por tipo de prestador
 * Si es la primera vez que se solicitan, se cargan en la base de datos
 */
router.get("/servicios/:tipoPrestador", async (req, res) => {
  try {
    const { tipoPrestador } = req.params;
    console.log(`GET /catalogo/servicios/${tipoPrestador} - Solicitando catálogo para tipo: ${tipoPrestador}`);
    
    // Verificar que exista el tipo de prestador en el catálogo
    if (!serviciosPorTipo[tipoPrestador]) {
      console.log(`No se encontró catálogo para el tipo ${tipoPrestador}`);
      return res.status(404).json({ 
        message: `No se encontró catálogo para el tipo ${tipoPrestador}` 
      });
    }
    
    // Buscar si ya existen servicios predefinidos para este tipo de prestador
    const serviciosExistentes = await Servicio.find({ 
      tipoPrestador: tipoPrestador,
      esServicioPredefinido: true
    });
    
    // Si ya existen servicios predefinidos, devolverlos
    if (serviciosExistentes.length > 0) {
      console.log(`Devolviendo ${serviciosExistentes.length} servicios predefinidos existentes para ${tipoPrestador}`);
      return res.json(serviciosExistentes);
    }
    
    // Si no existen, crear servicios uno por uno para manejar posibles duplicados
    console.log(`Cargando servicios predefinidos para ${tipoPrestador}. Total a procesar: ${serviciosPorTipo[tipoPrestador].length}`);
    const serviciosCreados = [];
    
    // Procesar cada servicio uno por uno para manejar errores de duplicación
    for (const servicio of serviciosPorTipo[tipoPrestador]) {
      try {
        // Buscar si ya existe un servicio con este nombre (puede ser de otro tipoPrestador)
        const existeServicio = await Servicio.findOne({ 
          nombre: servicio.nombre,
          esServicioPredefinido: true 
        });
        
        if (existeServicio) {
          // Si ya existe, crear un servicio con el mismo nombre pero vinculado al tipoPrestador actual
          const nuevoServicio = new Servicio({
            ...servicio,
            tipoPrestador: tipoPrestador,
            esServicioPredefinido: true,
            disponibleParaTipos: servicio.disponibleParaTipos || ['Perro', 'Gato'],
            activo: true,
            nombre: `${servicio.nombre} (${tipoPrestador})` // Añadir sufijo para evitar colisión
          });
          
          const servicioGuardado = await nuevoServicio.save();
          serviciosCreados.push(servicioGuardado);
          console.log(`Creado servicio modificado: ${nuevoServicio.nombre} para ${tipoPrestador}`);
        } else {
          // Si no existe, crearlo normalmente
          const nuevoServicio = new Servicio({
            ...servicio,
            tipoPrestador: tipoPrestador,
            esServicioPredefinido: true,
            disponibleParaTipos: servicio.disponibleParaTipos || ['Perro', 'Gato'],
            activo: true
          });
          
          const servicioGuardado = await nuevoServicio.save();
          serviciosCreados.push(servicioGuardado);
          console.log(`Creado servicio nuevo: ${nuevoServicio.nombre} para ${tipoPrestador}`);
        }
      } catch (err) {
        console.log(`Error al procesar servicio ${servicio.nombre}:`, err.message);
        // Continuar con el siguiente servicio en caso de error
      }
    }
    
    console.log(`Se crearon ${serviciosCreados.length} servicios predefinidos para ${tipoPrestador}`);
    res.status(201).json(serviciosCreados);
  } catch (error) {
    console.log('Error al obtener catálogo de servicios:', error);
    
    // Intentar devolver los servicios existentes incluso si hubo error
    try {
      const { tipoPrestador } = req.params;
      const serviciosExistentes = await Servicio.find({ 
        tipoPrestador: tipoPrestador,
        esServicioPredefinido: true
      });
      
      if (serviciosExistentes.length > 0) {
        console.log(`Fallback: Devolviendo ${serviciosExistentes.length} servicios existentes para ${tipoPrestador}`);
        return res.json(serviciosExistentes);
      }
    } catch (fallbackError) {
      console.log('Error en el fallback:', fallbackError);
    }
    
    res.status(500).json({ message: "Error al obtener el catálogo de servicios" });
  }
});

/**
 * Endpoint para obtener los servicios de un prestador específico
 */
router.get("/prestador/:prestadorId", async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log('Buscando servicios para el prestador ID:', prestadorId);
    
    // Importar el modelo Prestador (evitamos circular imports)
    const Prestador = (await import('../models/Prestador.js')).default;
    
    // Buscar prestador para verificar que existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      console.log('Prestador no encontrado:', prestadorId);
      return res.status(404).json({ message: "Prestador no encontrado" });
    }
    
    console.log('Prestador encontrado:', prestador._id);
    
    // Obtener los servicios asociados al prestador
    const servicios = await Servicio.find({ 
      prestadorId: prestadorId,
      activo: true
    });
    
    console.log(`Se encontraron ${servicios.length} servicios para el prestador`);
    res.json(servicios);
  } catch (error) {
    console.log('Error al obtener servicios del prestador:', error.message);
    res.status(500).json({ message: "Error al obtener los servicios del prestador" });
  }
});

export default router;
