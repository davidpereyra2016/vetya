import express from "express";
import Servicio from "../models/Servicio.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Obtener todos los servicios
router.get("/", async (req, res) => {
  try {
    // Filtrar por categoría si se proporciona
    const filtro = {};
    if (req.query.categoria) {
      filtro.categoria = req.query.categoria;
    }
    if (req.query.activo !== undefined) {
      filtro.activo = req.query.activo === 'true';
    }
    
    const servicios = await Servicio.find(filtro).sort({ nombre: 1 });
    res.status(200).json(servicios);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
});

// Obtener un servicio por ID
router.get("/:id", async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    
    res.status(200).json(servicio);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener el servicio" });
  }
});

// Crear un nuevo servicio (protegido)
router.post("/", protectRoute, async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, precio, duracion, categoria, tipoPrestador, disponibleParaTipos, requiereAprobacion, activo, esServicioPredefinido, modalidadAtencion } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !descripcion) {
      return res.status(400).json({ message: "El nombre y la descripción son obligatorios" });
    }
    
    if (!tipoPrestador) {
      return res.status(400).json({ message: "El tipo de prestador es obligatorio" });
    }
    
    // Verificar si ya existe un servicio con ese nombre (solo para servicios predefinidos)
    if (esServicioPredefinido) {
      const existingServicio = await Servicio.findOne({ nombre, esServicioPredefinido: true });
      if (existingServicio) {
        return res.status(400).json({ message: "Ya existe un servicio predefinido con ese nombre" });
      }
    }
    
    // Crear nuevo servicio
    const nuevoServicio = new Servicio({
      nombre,
      descripcion,
      icono: icono || "medkit-outline",
      color: color || "#1E88E5",
      precio: precio || 0,
      duracion: duracion || 30,
      categoria: categoria || "Consulta general",
      tipoPrestador,
      disponibleParaTipos: disponibleParaTipos || ["Perro", "Gato", "Ave", "Reptil", "Roedor", "Otro"],
      requiereAprobacion: requiereAprobacion || false,
      modalidadAtencion: modalidadAtencion || ['Clínica'],
      activo: activo !== undefined ? activo : true,
      esServicioPredefinido: esServicioPredefinido || false
    });
    
    await nuevoServicio.save();
    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear el servicio" });
  }
});

// Actualizar un servicio (protegido)
router.put("/:id", protectRoute, async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    
    // Validar tipoPrestador si viene en el body
    if (req.body.tipoPrestador && !['Veterinario', 'Centro Veterinario', 'Veterinaria', 'Otro'].includes(req.body.tipoPrestador)) {
      return res.status(400).json({ message: "Tipo de prestador inválido" });
    }
    
    // Si se cambia el nombre, verificar que no exista otro servicio con ese nombre
    if (req.body.nombre && req.body.nombre !== servicio.nombre) {
      const existingServicio = await Servicio.findOne({ 
        nombre: req.body.nombre,
        _id: { $ne: req.params.id }
      });
      if (existingServicio) {
        return res.status(400).json({ message: "Ya existe un servicio con ese nombre" });
      }
    }
    
    // Actualizar servicio
    const servicioActualizado = await Servicio.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(servicioActualizado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar el servicio" });
  }
});

// Eliminar un servicio (protegido) - CON VALIDACIONES
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    console.log('=== INTENTO DE ELIMINAR SERVICIO ===');
    console.log('Servicio ID:', req.params.id);
    console.log('Usuario:', req.user?.email);
    
    const servicio = await Servicio.findById(req.params.id);
    
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    
    // ✅ VALIDACIÓN 1: Verificar si el servicio tiene citas asociadas
    const Cita = (await import('../models/Cita.js')).default;
    const citasConServicio = await Cita.countDocuments({ servicio: req.params.id });
    
    if (citasConServicio > 0) {
      console.log(`❌ No se puede eliminar: ${citasConServicio} cita(s) usan este servicio`);
      return res.status(400).json({ 
        message: `No se puede eliminar el servicio porque tiene ${citasConServicio} cita(s) asociada(s). Por seguridad, los servicios con citas no pueden eliminarse.`,
        citasAsociadas: citasConServicio
      });
    }
    
    // ✅ VALIDACIÓN 2: Verificar si es un servicio predefinido usado por prestadores
    if (servicio.esServicioPredefinido && !servicio.prestadorId) {
      // Es un servicio del catálogo global
      const copiasPrestadores = await Servicio.countDocuments({ 
        nombre: servicio.nombre,
        prestadorId: { $ne: null } 
      });
      
      if (copiasPrestadores > 0) {
        console.log(`⚠️ Servicio predefinido usado por ${copiasPrestadores} prestador(es)`);
        return res.status(400).json({ 
          message: `No se puede eliminar este servicio predefinido porque ${copiasPrestadores} prestador(es) lo están utilizando.`,
          prestadoresUsando: copiasPrestadores
        });
      }
    }
    
    // ✅ VALIDACIÓN 3: Si es servicio de un prestador específico, solo verificar citas
    if (servicio.prestadorId) {
      console.log('✓ Es servicio de prestador específico, verificación de citas OK');
    }
    
    // Si pasa todas las validaciones, eliminar
    await Servicio.findByIdAndDelete(req.params.id);
    console.log('✅ Servicio eliminado exitosamente');
    
    res.status(200).json({ 
      message: "Servicio eliminado con éxito",
      nombreServicio: servicio.nombre
    });
  } catch (error) {
    console.error('Error al eliminar el servicio:', error);
    res.status(500).json({ message: "Error al eliminar el servicio: " + error.message });
  }
});

// Obtener servicios por tipo de mascota
router.get("/tipo/:tipo", async (req, res) => {
  try {
    const servicios = await Servicio.find({ 
      disponibleParaTipos: req.params.tipo,
      activo: true
    }).sort({ nombre: 1 });
    
    res.status(200).json(servicios);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener los servicios" });
  }
});

// Actualizar estado de un servicio (activo/inactivo)
router.patch("/:id/estado", protectRoute, async (req, res) => {
  try {
    const { activo } = req.body;
    
    if (activo === undefined) {
      return res.status(400).json({ message: "El estado es requerido" });
    }
    
    const servicio = await Servicio.findById(req.params.id);
    
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    
    servicio.activo = activo;
    await servicio.save();
    
    res.status(200).json(servicio);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar el estado del servicio" });
  }
});

export default router;
