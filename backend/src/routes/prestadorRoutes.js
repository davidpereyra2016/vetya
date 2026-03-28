import express from 'express';
const router = express.Router();
import Prestador from '../models/Prestador.js';
import Servicio from '../models/Servicio.js';
import User from '../models/User.js';
import { protectRoute, checkRole } from '../middleware/auth.middleware.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/';
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en kilómetros
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
}

/**
 * Convierte grados a radianes
 * @param {number} value - Valor en grados
 * @returns {number} Valor en radianes
 */
function toRad(value) {
  return value * Math.PI / 180;
}

function obtenerCoordenadasNormalizadas(coordenadas) {
  if (!coordenadas) return null;

  if (Array.isArray(coordenadas) && coordenadas.length >= 2) {
    const lng = parseFloat(coordenadas[0]);
    const lat = parseFloat(coordenadas[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  }

  const lat = parseFloat(coordenadas.lat ?? coordenadas.latitude);
  const lng = parseFloat(coordenadas.lng ?? coordenadas.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
}

// CAMBIO: Se actualizó esta ruta para que filtre por tipo si se proporciona como query param.
router.get('/', async (req, res) => {
  try {
    // Objeto de filtro inicial
    const filtro = { activo: true };

    // Si se recibe un 'tipo' en los parámetros de la consulta, se añade al filtro
    if (req.query.tipo) {
      filtro.tipo = req.query.tipo;
    }

    // Obtener prestadores con populate del usuario para acceder a profilePicture
    const prestadoresDb = await Prestador.find(filtro)
      .select('nombre tipo especialidades imagen direccion rating disponibleEmergencias precioEmergencia')
      .populate('usuario', 'profilePicture');
    
    // Mapear los resultados para incluir profilePicture como imagen
    const prestadores = prestadoresDb.map(prestador => {
      const prestadorObj = prestador.toObject();
      
      // Asignar la imagen de perfil del usuario al campo imagen del prestador si existe
      if (prestadorObj.usuario && prestadorObj.usuario.profilePicture) {
        prestadorObj.imagen = prestadorObj.usuario.profilePicture;
      }
      
      // Eliminar el objeto usuario para no exponer información innecesaria
      delete prestadorObj.usuario;
      
      return prestadorObj;
    });
    
    res.json(prestadores);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener los prestadores' });
  }
});

// Obtener prestadores por tipo
router.get('/tipo/:tipo', async (req, res) => {
  try {
    const tiposValidos = ['Veterinario', 'Centro Veterinario', 'Veterinaria', 'Otro'];
    if (!tiposValidos.includes(req.params.tipo)) {
      return res.status(400).json({ message: 'Tipo de prestador inválido' });
    }

    const prestadoresDb = await Prestador.find({
      tipo: req.params.tipo,
      activo: true
    }).select('nombre tipo especialidades imagen direccion rating disponibleEmergencias')
      .populate('usuario', 'profilePicture');
    
    // Mapear los resultados para incluir profilePicture como imagen
    const prestadores = prestadoresDb.map(prestador => {
      const prestadorObj = prestador.toObject();
      
      // Asignar la imagen de perfil del usuario al campo imagen del prestador si existe
      if (prestadorObj.usuario && prestadorObj.usuario.profilePicture) {
        prestadorObj.imagen = prestadorObj.usuario.profilePicture;
      }
      
      // Eliminar el objeto usuario para no exponer información innecesaria
      delete prestadorObj.usuario;
      
      return prestadorObj;
    });
    
    res.json(prestadores);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener los prestadores por tipo' });
  }
});

// Obtener prestadores disponibles para emergencias
router.get('/emergencias', async (req, res) => {
  try {
    const prestadoresDb = await Prestador.find({
      disponibleEmergencias: true,
      activo: true
    }).select('nombre tipo especialidades imagen direccion rating disponibleEmergencias precioEmergencia ubicacionActual radio')
      .populate('usuario', 'profilePicture');
    
    // Mapear los resultados para incluir profilePicture como imagen
    const prestadores = prestadoresDb.map(prestador => {
      const prestadorObj = prestador.toObject();

      const coordsActuales = obtenerCoordenadasNormalizadas(prestadorObj.ubicacionActual?.coordenadas);
      if (coordsActuales) {
        prestadorObj.ubicacionActual = {
          ...prestadorObj.ubicacionActual,
          coordenadas: coordsActuales
        };
      }
      
      // Asignar la imagen de perfil del usuario al campo imagen del prestador si existe
      if (prestadorObj.usuario && prestadorObj.usuario.profilePicture) {
        prestadorObj.imagen = prestadorObj.usuario.profilePicture;
      }
      
      // Eliminar el objeto usuario para no exponer información innecesaria
      delete prestadorObj.usuario;
      
      return prestadorObj;
    });
    
    res.json(prestadores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los prestadores para emergencias' });
  }
});

// Obtener prestadores disponibles para emergencias con cálculo de distancia
router.get('/emergencias/disponibles', protectRoute, async (req, res) => {
  try {
    let { clientLat, clientLng } = req.query;
    
    // Si el cliente no proporciona ubicación, intentar obtenerla de su perfil
    if (!clientLat || !clientLng) {
      // Intentar obtener la ubicación del usuario autenticado
      if (req.user && req.user._id) {
        const client = await User.findById(req.user._id);
        if (client && client.ubicacionActual && client.ubicacionActual.coordinates) {
          clientLat = client.ubicacionActual.coordinates.lat;
          clientLng = client.ubicacionActual.coordinates.lng;
          console.log('Usando ubicación guardada del cliente:', { clientLat, clientLng });
        }
      }
      
      // Si aún no tenemos ubicación, retornar error
      if (!clientLat || !clientLng) {
        return res.status(400).json({ 
          message: 'Se requiere la ubicación del cliente. Por favor, activa tu GPS o ingresa una ubicación manual.'
        });
      }
    }
    
    // Convertir a números
    clientLat = parseFloat(clientLat);
    clientLng = parseFloat(clientLng);
    
    // Buscar veterinarios disponibles
    const prestadores = await Prestador.find({
      disponibleEmergencias: true,
      activo: true
    }).populate('usuario', 'email username');
    
    // Calcular distancias y tiempos
    const prestadoresConDistancia = prestadores.map(prestador => {
      // Usar ubicación actual o fija del prestador
      const prestadorLat = prestador.ubicacionActual?.coordenadas?.lat || prestador.direccion?.coordenadas?.lat;
      const prestadorLng = prestador.ubicacionActual?.coordenadas?.lng || prestador.direccion?.coordenadas?.lng;
      
      // Si no hay coordenadas, asignar una distancia muy grande
      if (!prestadorLat || !prestadorLng) {
        return {
          ...prestador.toObject(),
          distancia: 9999,
          distanciaTexto: 'Desconocida',
          tiempoEstimado: 'Desconocido'
        };
      }
      
      // Calcular distancia usando Haversine
      const distancia = calcularDistancia(
        clientLat, clientLng, 
        prestadorLat, prestadorLng
      );
      
      // Calcular tiempo estimado (asumiendo 30 km/h promedio en ciudad)
      const tiempoEstimadoMinutos = Math.ceil(distancia / 30 * 60);
      
      return {
        ...prestador.toObject(),
        distancia: distancia, // valor numérico para ordenar
        distanciaTexto: `${distancia.toFixed(1)} km`,
        tiempoEstimado: tiempoEstimadoMinutos,
        tiempoEstimadoTexto: tiempoEstimadoMinutos < 60 ? 
          `${tiempoEstimadoMinutos} min` : 
          `${Math.floor(tiempoEstimadoMinutos/60)} h ${tiempoEstimadoMinutos%60} min`
      };
    });
    
    // Ordenar por cercanía
    prestadoresConDistancia.sort((a, b) => a.distancia - b.distancia);
    
    res.status(200).json({
      success: true,
      count: prestadoresConDistancia.length,
      data: prestadoresConDistancia
    });
  } catch (error) {
    console.error('Error al obtener prestadores con distancia:', error);
    res.status(500).json({ message: 'Error al obtener prestadores disponibles' });
  }
});

// Obtener prestadores disponibles para emergencias con ubicación en tiempo real
router.get('/emergencias/ubicacion', async (req, res) => {
  try {
    // Obtener las coordenadas del cliente (si se proporcionan)
    const { lat, lng } = req.query;
    
    // Log detallado de las coordenadas recibidas del cliente
    console.log('=== COORDENADAS DEL CLIENTE RECIBIDAS EN BACKEND ===');
    console.log(`Latitud recibida: ${lat || 'NO RECIBIDA'}`);
    console.log(`Longitud recibida: ${lng || 'NO RECIBIDA'}`);
    console.log(`IP del cliente: ${req.ip || req.connection.remoteAddress || 'desconocida'}`);
    console.log(`Timestamp de recepción: ${new Date().toISOString()}`);
    console.log(`Ruta solicitada: ${req.originalUrl}`);
    console.log('=================================================');
    
    // Buscar prestadores disponibles para emergencias
    // Verificar que tengan coordenadas válidas (no solo que exista el campo)
    const query = {
      disponibleEmergencias: true,
      activo: true,
      'ubicacionActual.coordenadas.lat': { $exists: true, $ne: null },
      'ubicacionActual.coordenadas.lng': { $exists: true, $ne: null }
    };
    
    console.log('🔍 [BACKEND] Query de búsqueda:', JSON.stringify(query));
    
    // Primero, verificar cuántos prestadores tienen disponibleEmergencias=true
    const totalDisponibles = await Prestador.countDocuments({ 
      disponibleEmergencias: true, 
      activo: true 
    });
    console.log(`📊 [BACKEND] Total prestadores con disponibleEmergencias=true: ${totalDisponibles}`);
    
    // Verificar cuántos tienen ubicacionActual con coordenadas
    const conUbicacion = await Prestador.countDocuments({
      disponibleEmergencias: true,
      activo: true,
      'ubicacionActual.coordenadas.lat': { $exists: true }
    });
    console.log(`📊 [BACKEND] Con ubicacionActual.lat: ${conUbicacion}`);
    
    const prestadores = await Prestador.find(query).select(
      'nombre tipo especialidades imagen direccion rating disponibleEmergencias precioEmergencia radio ubicacionActual'
    );
    
    console.log(`✅ [BACKEND] Prestadores encontrados con coords válidas: ${prestadores.length}`);
    
    // Log detallado de cada prestador
    prestadores.forEach((p, i) => {
      console.log(`   Prestador ${i+1}: ${p.nombre}`);
      console.log(`      -> disponibleEmergencias: ${p.disponibleEmergencias}`);
      console.log(`      -> ubicacionActual:`, JSON.stringify(p.ubicacionActual));
      console.log(`      -> tiene coordenadas válidas:`, 
        p.ubicacionActual?.coordenadas?.lat != null && p.ubicacionActual?.coordenadas?.lng != null ? 'SÍ' : 'NO'
      );
    });
    
    // Si no hay prestadores disponibles, devolver array vacío
    if (!prestadores || prestadores.length === 0) {
      return res.json([]);
    }
    
    // Si se proporcionaron coordenadas del cliente, calcular distancia y tiempo estimado
    let resultado = prestadores;
    if (lat && lng) {
      const clientLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      
      // Calcular distancia y tiempo estimado para cada prestador
      resultado = prestadores.map(prestador => {
        const prestadorObj = prestador.toObject();
        
        if (prestadorObj.ubicacionActual && prestadorObj.ubicacionActual.coordenadas) {
          // Calcular distancia en km usando la fórmula de Haversine
          const distance = calcularDistancia(
            clientLocation.lat, 
            clientLocation.lng, 
            prestadorObj.ubicacionActual.coordenadas.lat, 
            prestadorObj.ubicacionActual.coordenadas.lng
          );
          
          // Calcular tiempo estimado (asumiendo velocidad promedio de 30 km/h en ciudad)
          // Convertir a minutos y redondear
          const tiempoEstimadoMinutos = Math.round(distance / 30 * 60);
          
          // Añadir información de distancia y tiempo estimado
          prestadorObj.distancia = {
            valor: distance,
            texto: `${distance.toFixed(1)} km`
          };
          
          prestadorObj.tiempoEstimado = {
            valor: tiempoEstimadoMinutos,
            texto: tiempoEstimadoMinutos < 60 
              ? `${tiempoEstimadoMinutos} min` 
              : `${Math.floor(tiempoEstimadoMinutos/60)} h ${tiempoEstimadoMinutos % 60} min`
          };
        }
        
        return prestadorObj;
      });
      
      // Ordenar por distancia (más cercanos primero)
      resultado.sort((a, b) => {
        const distanciaA = a.distancia?.valor || Infinity;
        const distanciaB = b.distancia?.valor || Infinity;
        return distanciaA - distanciaB;
      });
    }
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener prestadores con ubicación:', error);
    res.status(500).json({ message: 'Error al obtener los prestadores con ubicación' });
  }
});

// Nota: Usamos la función calcularDistancia definida al inicio del archivo

// Obtener prestadores cercanos por coordenadas
router.get('/cercanos', async (req, res) => {
  try {
    const { lat, lng, distancia = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Se requieren las coordenadas (lat, lng)' });
    }

    const prestadores = await Prestador.find({
      activo: true,
      'direccion.coordenadas': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(distancia) * 1000 // Convertir a metros
        }
      }
    }).select('nombre tipo especialidades imagen direccion rating disponibleEmergencias');
    
    res.json(prestadores);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener los prestadores cercanos' });
  }
});

// Obtener un prestador por ID
router.get('/:id', async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id)
      .populate('usuario', 'nombre email profilePicture')
      .populate('opiniones.usuario', 'nombre imagen');
    
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    res.json(prestador);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener el prestador' });
  }
});

// Crear un nuevo prestador (solo para usuarios autenticados)
router.post('/', protectRoute, async (req, res) => {
  try {
    const nuevoPrestador = new Prestador({
      usuario: req.user._id,
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      especialidades: req.body.especialidades || [],
      servicios: req.body.servicios || [],
      imagen: req.body.imagen,
      direccion: req.body.direccion,
      horarios: req.body.horarios || [],
      telefono: req.body.telefono,
      email: req.body.email,
      sitioWeb: req.body.sitioWeb,
      disponibleEmergencias: req.body.disponibleEmergencias || false,
      radio: req.body.radio || 5
    });
    
    // Guardar el prestador
    const prestadorGuardado = await nuevoPrestador.save();
    
    // Ya no se asocian servicios predefinidos automáticamente
    // El prestador deberá elegir sus servicios desde el catálogo
    console.log(`Prestador creado correctamente con ID: ${prestadorGuardado._id}`);
    console.log(`Tipo de prestador: ${prestadorGuardado.tipo} - No se asignaron servicios automáticamente`);
    
    
    res.status(201).json(prestadorGuardado);
  } catch (error) {
    console.log('Error al crear el prestador:', error);
    res.status(500).json({ message: 'Error al crear el prestador' });
  }
});

// Actualizar ubicación del prestador en tiempo real
router.patch('/:id/ubicacion', protectRoute, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Validar que las coordenadas sean números válidos
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requieren coordenadas válidas (lat, lng)' 
      });
    }
    
    // Buscar prestador
    const prestador = await Prestador.findById(req.params.id);
    
    if (!prestador) {
      return res.status(404).json({ 
        success: false, 
        message: 'Prestador no encontrado' 
      });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado para modificar este prestador' 
      });
    }
    
    // Verificar que el prestador sea veterinario y esté disponible para emergencias
    if (prestador.tipo !== 'Veterinario') {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo los veterinarios pueden actualizar su ubicación para emergencias' 
      });
    }
    
    if (!prestador.disponibleEmergencias) {
      return res.status(400).json({ 
        success: false, 
        message: 'El prestador debe estar disponible para emergencias para actualizar su ubicación' 
      });
    }
    
    // Actualizar la ubicación actual
    prestador.ubicacionActual = {
      coordenadas: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      ultimaActualizacion: new Date()
    };
    
    // Mantener sincronizado el fallback histórico de coordenadas del prestador
    if (!prestador.direccion) {
      prestador.direccion = {};
    }

    prestador.direccion.coordenadas = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    
    await prestador.save();
    
    res.json({ 
      success: true, 
      message: 'Ubicación actualizada correctamente',
      ubicacion: prestador.ubicacionActual 
    });
  } catch (error) {
    console.error('Error al actualizar ubicación del prestador:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar la ubicación', 
      error: error.message 
    });
  }
});

// Actualizar precio de emergencia del prestador
router.patch('/:id/precio-emergencia', protectRoute, async (req, res) => {
  try {
    const { precioEmergencia, disponibleEmergencias } = req.body;
    
    // Validar que el precio sea un número
    if (precioEmergencia !== undefined && (isNaN(precioEmergencia) || precioEmergencia < 0)) {
      return res.status(400).json({ message: 'El precio de emergencia debe ser un número válido y no negativo' });
    }
    
    // Buscar prestador
    const prestador = await Prestador.findById(req.params.id);
    
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'No autorizado para modificar este prestador' });
    }
    
    // Verificar que el prestador sea veterinario para poder configurar servicio de emergencia
    if (prestador.tipo !== 'Veterinario') {
      return res.status(400).json({ message: 'Solo los veterinarios pueden configurar servicios de emergencia' });
    }
    
    // Actualizar los campos
    if (precioEmergencia !== undefined) {
      prestador.precioEmergencia = precioEmergencia;
    }
    
    if (disponibleEmergencias !== undefined) {
      prestador.disponibleEmergencias = disponibleEmergencias;
      
      // Si el prestador está desactivando su disponibilidad, limpiar ubicación actual
      if (!disponibleEmergencias && prestador.ubicacionActual) {
        prestador.ubicacionActual = undefined;
      }
    }
    
    await prestador.save();
    
    res.json({
      message: 'Precio de emergencia actualizado correctamente',
      prestador: {
        _id: prestador._id,
        precioEmergencia: prestador.precioEmergencia,
        disponibleEmergencias: prestador.disponibleEmergencias
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al actualizar el precio de emergencia' });
  }
});

// Crear nuevo prestador (para administradores)
router.post('/', protectRoute, async (req, res) => {
  try {
    console.log('=== CREAR PRESTADOR ===');
    console.log('Usuario autenticado:', req.user?.email, 'Rol:', req.user?.role);
    console.log('Datos recibidos:', req.body);
    
    // Verificar rol de administrador manualmente
    if (req.user?.role !== 'admin') {
      console.log('Acceso denegado: usuario no es admin');
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    const { email, nombre, telefono, tipo, especialidades, disponibleEmergencias, activo, direccion, radio } = req.body;
    
    // Validar campos requeridos
    if (!email || !nombre) {
      console.log('Faltan campos requeridos');
      return res.status(400).json({ message: 'Email y nombre son requeridos' });
    }
    
    // Verificar si ya existe un usuario con ese email
    let usuario = await User.findOne({ email });
    console.log('Usuario existente encontrado:', !!usuario);
    
    if (!usuario) {
      // Crear nuevo usuario
      usuario = new User({
        email,
        username: email.split('@')[0], // Usar parte del email como username
        password: 'temp123', // Contraseña temporal
        role: 'provider'
      });
      await usuario.save();
      console.log('Nuevo usuario creado:', usuario._id);
    }
    
    // Crear prestador
    const prestador = new Prestador({
      usuario: usuario._id,
      nombre,
      telefono,
      email,
      tipo: tipo || 'Veterinario',
      especialidades: especialidades || [],
      disponibleEmergencias: disponibleEmergencias || false,
      activo: activo !== false,
      direccion: direccion || {},
      radio: radio || 1
    });
    
    console.log('Datos del prestador a guardar:', prestador);
    const prestadorGuardado = await prestador.save();
    console.log('Prestador guardado exitosamente:', prestadorGuardado._id);
    
    res.status(201).json(prestadorGuardado);
  } catch (error) {
    console.error('Error completo al crear prestador:', error);
    res.status(500).json({ 
      message: 'Error al crear el prestador',
      error: error.message,
      details: error.stack
    });
  }
});

// Actualizar prestador (solo el dueño)
router.put('/:id', protectRoute, async (req, res) => {
  try {
    console.log('=== ACTUALIZAR PRESTADOR ===');
    console.log('ID del prestador:', req.params.id);
    console.log('Usuario autenticado:', req.user?.email, 'Rol:', req.user?.role);
    console.log('Datos a actualizar:', req.body);
    
    const prestador = await Prestador.findById(req.params.id);
    
    if (!prestador) {
      console.log('Prestador no encontrado');
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    console.log('Prestador encontrado, dueño:', prestador.usuario);
    
    // Verificar que el usuario logueado sea dueño del prestador o administrador
    if (prestador.usuario.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log('Acceso denegado: no es dueño ni admin');
      return res.status(403).json({ message: 'No tienes permisos para actualizar este prestador' });
    }
    
    console.log('Permisos verificados, actualizando...');
    const prestadorActualizado = await Prestador.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    console.log('Prestador actualizado exitosamente:', prestadorActualizado._id);
    res.json(prestadorActualizado);
  } catch (error) {
    console.error('Error completo al actualizar prestador:', error);
    res.status(500).json({ 
      message: 'Error al actualizar el prestador',
      error: error.message,
      details: error.stack
    });
  }
});

// Agregar opinión a un prestador
router.post('/:id/opiniones', protectRoute, async (req, res) => {
  try {
    const { texto, calificacion } = req.body;
    
    if (!texto || !calificacion) {
      return res.status(400).json({ message: 'Se requiere texto y calificación' });
    }
    
    const prestador = await Prestador.findById(req.params.id);
    
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario ya dejó una opinión
    const opinionExistente = prestador.opiniones.find(
      opinion => opinion.usuario.toString() === req.user._id.toString()
    );
    
    if (opinionExistente) {
      return res.status(400).json({ message: 'Ya has dejado una opinión para este prestador' });
    }
    
    // Agregar nueva opinión
    prestador.opiniones.push({
      usuario: req.user._id,
      texto,
      calificacion
    });
    
    // Actualizar rating promedio
    const totalOpiniones = prestador.opiniones.length;
    const sumaCalificaciones = prestador.opiniones.reduce(
      (sum, opinion) => sum + opinion.calificacion, 0
    );
    
    prestador.rating = sumaCalificaciones / totalOpiniones;
    
    await prestador.save();
    
    res.status(201).json(prestador);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al agregar opinión' });
  }
});

// Eliminar prestador (solo el dueño)

// =================== GESTIÓN DE SERVICIOS ===================

// Obtener servicios de un prestador (todos, activos e inactivos)
router.get('/:id/servicios', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando servicios para prestador con ID: ${id}`);
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      console.log(`Prestador con ID ${id} no encontrado`);
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Buscar servicios asociados al prestador
    const servicios = await Servicio.find({ prestadorId: id });
    console.log(`Se encontraron ${servicios.length} servicios para el prestador ${id}`);
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios del prestador:', error);
    res.status(500).json({ message: 'Error al obtener servicios del prestador' });
  }
});

// Obtener servicios activos de un prestador
router.get('/:id/servicios/activo', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Buscar servicios asociados al prestador que estén activos
    const servicios = await Servicio.find({ 
      prestadorId: id,
      activo: true
    });
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios activos del prestador:', error);
    res.status(500).json({ message: 'Error al obtener servicios activos del prestador' });
  }
});

// Obtener servicios inactivos de un prestador
router.get('/:id/servicios/desactivado', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Buscar servicios asociados al prestador que estén inactivos
    const servicios = await Servicio.find({ 
      prestadorId: id,
      activo: false
    });
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios inactivos del prestador:', error);
    res.status(500).json({ message: 'Error al obtener servicios inactivos del prestador' });
  }
});

// Añadir un servicio a un prestador (desde el catálogo o personalizado)
router.post('/:id/servicios', protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const { servicioId, nombre, descripcion, precio, duracion, activo, ...otrosDatos } = req.body;
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'No autorizado para modificar los servicios de este prestador' });
    }
    
    let nuevoServicio;
    
    // Si se proporciona servicioId, buscar servicio del catálogo y asociarlo al prestador
    if (servicioId) {
      console.log(`Buscando servicio del catálogo con ID: ${servicioId}`);
      const servicioBase = await Servicio.findById(servicioId);
      
      if (!servicioBase) {
        return res.status(404).json({ message: 'Servicio no encontrado en el catálogo' });
      }
      
      // Crear una nueva instancia personalizada del servicio para el prestador
      nuevoServicio = new Servicio({
        nombre: servicioBase.nombre,
        descripcion: servicioBase.descripcion,
        icono: servicioBase.icono,
        color: servicioBase.color,
        precio: precio || servicioBase.precio,
        duracion: duracion || servicioBase.duracion,
        categoria: servicioBase.categoria,
        tipoPrestador: servicioBase.tipoPrestador,
        disponibleParaTipos: servicioBase.disponibleParaTipos,
        requiereAprobacion: servicioBase.requiereAprobacion,
        modalidadAtencion: otrosDatos.modalidadAtencion || servicioBase.modalidadAtencion || ['Clínica'],
        activo: activo !== undefined ? activo : true,
        esServicioPredefinido: false, // Es personalizado por el prestador
        prestadorId: id // Establecer el prestadorId
      });
    } else {
      // Si no se proporciona servicioId, crear un servicio personalizado
      if (!nombre) {
        return res.status(400).json({ message: 'Se requiere nombre para crear un servicio personalizado' });
      }
      
      nuevoServicio = new Servicio({
        nombre,
        descripcion,
        icono: otrosDatos.icono || 'default-icon',
        color: otrosDatos.color || '#3498db',
        precio: precio || 0,
        duracion: duracion || 30,
        categoria: otrosDatos.categoria || 'General',
        tipoPrestador: prestador.tipo,
        disponibleParaTipos: otrosDatos.disponibleParaTipos || ['Perro', 'Gato'],
        requiereAprobacion: otrosDatos.requiereAprobacion || false,
        modalidadAtencion: otrosDatos.modalidadAtencion || ['Clínica'],
        activo: activo !== undefined ? activo : true,
        esServicioPredefinido: false,
        prestadorId: id // Establecer el prestadorId
      });
    }
    
    // Guardar el nuevo servicio
    const servicioGuardado = await nuevoServicio.save();
    console.log(`Servicio creado correctamente con ID: ${servicioGuardado._id}`);
    
    res.status(201).json(servicioGuardado);
  } catch (error) {
    console.error('Error al añadir servicio al prestador:', error);
    res.status(500).json({ message: 'Error al añadir servicio al prestador' });
  }
});

// Actualizar un servicio de un prestador
router.put('/:id/servicios/:servicioId', protectRoute, async (req, res) => {
  try {
    const { id, servicioId } = req.params;
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'No autorizado para modificar los servicios de este prestador' });
    }
    
    // Verificar si el servicio existe y pertenece al prestador
    const servicio = await Servicio.findOne({
      _id: servicioId,
      prestadorId: id
    });
    
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado o no pertenece al prestador' });
    }
    
    // Actualizar los campos del servicio
    Object.keys(req.body).forEach(key => {
      // No permitir cambiar el prestadorId ni el tipo de servicio predefinido
      if (key !== 'prestadorId' && key !== 'esServicioPredefinido') {
        // Validar modalidadAtencion si se envía
        if (key === 'modalidadAtencion') {
          const validas = ['Clínica', 'Domicilio'];
          const modalidades = Array.isArray(req.body[key]) ? req.body[key] : [req.body[key]];
          servicio[key] = modalidades.filter(m => validas.includes(m));
        } else {
          servicio[key] = req.body[key];
        }
      }
    });
    
    // Guardar los cambios
    const servicioActualizado = await servicio.save();
    console.log(`Servicio ${servicioId} actualizado correctamente`);
    
    res.json(servicioActualizado);
  } catch (error) {
    console.error('Error al actualizar servicio del prestador:', error);
    res.status(500).json({ message: 'Error al actualizar servicio del prestador' });
  }
});

// Eliminar un servicio de un prestador
router.delete('/:id/servicios/:servicioId', protectRoute, async (req, res) => {
  try {
    const { id, servicioId } = req.params;
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'No autorizado para eliminar servicios de este prestador' });
    }
    
    // Verificar si el servicio existe y pertenece al prestador
    const servicio = await Servicio.findOne({
      _id: servicioId,
      prestadorId: id
    });
    
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado o no pertenece al prestador' });
    }
    
    // Eliminar el servicio
    await Servicio.findByIdAndDelete(servicioId);
    console.log(`Servicio ${servicioId} eliminado correctamente`);
    
    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar servicio del prestador:', error);
    res.status(500).json({ message: 'Error al eliminar servicio del prestador' });
  }
});

// Cambiar el estado (activo/inactivo) de un servicio
router.patch('/:id/servicios/:servicioId/estado', protectRoute, async (req, res) => {
  try {
    const { id, servicioId } = req.params;
    const { activo } = req.body;
    
    if (activo === undefined) {
      return res.status(400).json({ message: 'Se requiere el campo "activo"' });
    }
    
    // Verificar si el prestador existe
    const prestador = await Prestador.findById(id);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar si el usuario autenticado es dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'No autorizado para modificar los servicios de este prestador' });
    }
    
    // Verificar si el servicio existe y pertenece al prestador
    const servicio = await Servicio.findOne({
      _id: servicioId,
      prestadorId: id
    });
    
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado o no pertenece al prestador' });
    }
    
    // Actualizar el estado del servicio
    servicio.activo = activo;
    await servicio.save();
    console.log(`Estado del servicio ${servicioId} actualizado a: ${activo}`);
    
    res.json({
      message: `Servicio ${activo ? 'activado' : 'desactivado'} correctamente`,
      servicio
    });
  } catch (error) {
    console.error('Error al cambiar estado del servicio:', error);
    res.status(500).json({ message: 'Error al cambiar estado del servicio' });
  }
});
router.delete('/:id', protectRoute, async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);
    
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar que el usuario logueado sea dueño del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este prestador' });
    }
    
    // Eliminar completamente el prestador
    // Esto activa el middleware pre('deleteOne') que eliminaá todos los registros relacionados
    console.log(`Eliminando completamente el prestador con ID: ${prestador._id}`);
    await prestador.deleteOne();
    
    res.json({ message: 'Prestador y todos sus datos relacionados eliminados correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al eliminar el prestador' });
  }
});

// Obtener prestador por ID de usuario con log de ubicación
router.get('/usuario/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log('Se intentó buscar un prestador con ID de usuario inválido:', userId);
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    
    console.log('🔍 [BACKEND] Buscando prestador para usuario:', userId);
    
    // Intentar encontrar el prestador relacionado al usuario
    const prestador = await Prestador.findOne({ usuario: userId });
    
    if (!prestador) {
      console.log('❌ [BACKEND] No se encontró prestador para usuario:', userId);
      return res.status(404).json({ message: 'No se encontró el perfil de prestador' });
    }
    
    console.log('✅ [BACKEND] Prestador encontrado:', prestador._id);
    console.log('   -> Nombre:', prestador.nombre);
    console.log('   -> Disponible emergencias:', prestador.disponibleEmergencias);
    console.log('   -> Ubicación actual:', prestador.ubicacionActual);
    console.log('   -> Última actualización:', prestador.ubicacionActual?.ultimaActualizacion);
    
    res.json(prestador);
  } catch (error) {
    console.log('Error al buscar prestador por ID de usuario:', error.message);
    res.status(500).json({ message: 'Error al obtener el prestador' });
  }
});

// Obtener servicios del prestador activo
router.get('/:prestadorId/servicios/activo', async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log('Obteniendo servicios para prestador ID:', prestadorId);
    
    // Importar el modelo Servicio
    const Servicio = (await import('../models/Servicio.js')).default;
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      console.log('Prestador no encontrado:', prestadorId);
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    console.log('Prestador encontrado:', prestador._id);
    
    // Obtener los servicios del prestador
    const servicios = await Servicio.find({ 
      prestadorId: prestadorId,
      activo: true
    });
    
    console.log(`Se encontraron ${servicios.length} servicios para el prestador`);
    res.json(servicios);
  } catch (error) {
    console.log('Error al obtener servicios del prestador:', error.message);
    res.status(500).json({ message: 'Error al obtener los servicios del prestador' });
  }
});

// Obtener servicios del prestador desactivado
router.get('/:prestadorId/servicios/desactivado', async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log('Obteniendo servicios desactivados para prestador ID:', prestadorId);
    
    // Importar el modelo Servicio
    const Servicio = (await import('../models/Servicio.js')).default;
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      console.log('Prestador no encontrado:', prestadorId);
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    console.log('Prestador encontrado:', prestador._id);
    
    // Obtener los servicios del prestador
    const servicios = await Servicio.find({ 
      prestadorId: prestadorId,
      activo: false
    });
    
    console.log(`Se encontraron ${servicios.length} servicios desactivados para el prestador`);
    res.json(servicios);
  } catch (error) {
    console.log('Error al obtener servicios del prestador:', error.message);
    res.status(500).json({ message: 'Error al obtener los servicios del prestador' });
  }
});

// Obtener todos los servicios del prestador (activos e inactivos)
router.get('/:prestadorId/servicios', async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log('Obteniendo todos los servicios para prestador ID:', prestadorId);
    
    // Importar el modelo Servicio
    const Servicio = (await import('../models/Servicio.js')).default;
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      console.log('Prestador no encontrado:', prestadorId);
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    console.log('Prestador encontrado:', prestador._id);
    
    // Obtener todos los servicios del prestador sin filtrar por estado
    const servicios = await Servicio.find({ 
      prestadorId: prestadorId
    });
    
    console.log(`Se encontraron ${servicios.length} servicios en total para el prestador`);
    res.json(servicios);
  } catch (error) {
    console.log('Error al obtener servicios del prestador:', error.message);
    res.status(500).json({ message: 'Error al obtener los servicios del prestador' });
  }
});

// Añadir servicio al prestador
router.post('/:prestadorId/servicios', protectRoute, async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log('Añadiendo servicio para prestador ID:', prestadorId);
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar que el usuario autenticado sea el dueño del perfil
    console.log('ID usuario del prestador:', prestador.usuario.toString());
    console.log('ID usuario autenticado:', req.user._id.toString());
    
    // Comparar los IDs como strings para evitar problemas de tipo
    const prestadorUserId = prestador.usuario.toString();
    const authUserId = req.user._id.toString();
    
    if (prestadorUserId !== authUserId) {
      console.log('Error de permisos: El usuario no es el dueño del perfil ni un admin');
      return res.status(403).json({ message: 'No tienes permiso para añadir servicios a este prestador' });
    }
    
    // Si se proporciona un servicioId, significa que se está añadiendo un servicio existente
    if (req.body.servicioId) {
      console.log('Añadiendo servicio existente:', req.body.servicioId);
      
      // Buscar el servicio en el catálogo
      const servicioCatalogo = await Servicio.findById(req.body.servicioId);
      if (!servicioCatalogo) {
        return res.status(404).json({ message: 'Servicio no encontrado en el catálogo' });
      }
      
      // Crear una copia personalizada del servicio para este prestador con nombre único
      // Agregando un sufijo único al nombre para evitar duplicados con el índice existente
      const nombreUnico = `${servicioCatalogo.nombre} (${prestadorId.substring(0, 6)})`;
      
      const servicioNuevo = new Servicio({
        nombre: nombreUnico,
        descripcion: servicioCatalogo.descripcion,
        icono: servicioCatalogo.icono,
        color: servicioCatalogo.color,
        precio: req.body.precio || servicioCatalogo.precio,
        duracion: req.body.duracion || servicioCatalogo.duracion,
        categoria: servicioCatalogo.categoria,
        tipoPrestador: prestador.tipo,
        disponibleParaTipos: req.body.disponibleParaTipos || servicioCatalogo.disponibleParaTipos,
        modalidadAtencion: req.body.modalidadAtencion || servicioCatalogo.modalidadAtencion || ['Clínica'],
        prestadorId: prestadorId,
        activo: true,
        esServicioPredefinido: false
      });
      
      // Guardar el nuevo servicio personalizado
      const servicioGuardado = await servicioNuevo.save();
      console.log('Servicio añadido correctamente:', servicioGuardado._id);
      
      res.status(201).json(servicioGuardado);
    } 
    // Si no hay servicioId, se está creando un servicio completamente nuevo
    else {
      console.log('Creando nuevo servicio personalizado');
      const { nombre, descripcion, precio, duracion, categoria, disponibleParaTipos, icono, color } = req.body;
      
      // Validar campos obligatorios
      if (!nombre || !descripcion) {
        return res.status(400).json({ message: 'El nombre y la descripción son obligatorios' });
      }
      
      // Crear el nuevo servicio
      const servicioNuevo = new Servicio({
        nombre,
        descripcion,
        icono: icono || 'medkit-outline',
        color: color || '#1E88E5',
        precio: precio || 0,
        duracion: duracion || 30,
        categoria: categoria || 'Otros',
        tipoPrestador: prestador.tipo,
        disponibleParaTipos: disponibleParaTipos || ['Perro', 'Gato'],
        modalidadAtencion: req.body.modalidadAtencion || ['Clínica'],
        prestadorId: prestadorId,
        activo: true,
        esServicioPredefinido: false
      });
      
      // Guardar el nuevo servicio
      const servicioGuardado = await servicioNuevo.save();
      console.log('Servicio personalizado creado correctamente:', servicioGuardado._id);
      
      res.status(201).json(servicioGuardado);
    }
  } catch (error) {
    console.log('Error al añadir servicio al prestador:', error);
    
    // Manejar errores específicos
    if (error.code === 11000) {
      // Error de clave duplicada
      return res.status(400).json({ 
        message: 'Ya existe un servicio con ese nombre asociado a este prestador'
      });
    }
    
    // Otros errores
    res.status(500).json({ 
      message: 'Error al añadir servicio al prestador',
      error: error.message 
    });
  }
});

// Actualizar un servicio del prestador
router.put('/:prestadorId/servicios/:servicioId', protectRoute, async (req, res) => {
  try {
    const { prestadorId, servicioId } = req.params;
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar que el usuario autenticado sea el dueño del perfil o un administrador
    if (prestador.usuario.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para modificar servicios de este prestador' });
    }
    
    // Buscar el servicio
    const servicio = await Servicio.findOne({ _id: servicioId, prestadorId: prestadorId });
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // Actualizar los campos permitidos
    const { nombre, descripcion, precio, duracion, disponibleParaTipos, activo, modalidadAtencion } = req.body;
    
    if (nombre) servicio.nombre = nombre;
    if (descripcion) servicio.descripcion = descripcion;
    if (precio !== undefined) servicio.precio = precio;
    if (duracion) servicio.duracion = duracion;
    if (disponibleParaTipos) servicio.disponibleParaTipos = disponibleParaTipos;
    if (activo !== undefined) servicio.activo = activo;
    if (modalidadAtencion) {
      const validas = ['Clínica', 'Domicilio'];
      servicio.modalidadAtencion = (Array.isArray(modalidadAtencion) ? modalidadAtencion : [modalidadAtencion]).filter(m => validas.includes(m));
    }
    
    // Guardar los cambios
    const servicioActualizado = await servicio.save();
    
    res.json(servicioActualizado);
  } catch (error) {
    console.log('Error al actualizar servicio:', error.message);
    res.status(500).json({ message: 'Error al actualizar el servicio' });
  }
});

// Eliminar servicio del prestador 
router.delete('/:prestadorId/servicios/:servicioId', protectRoute, async (req, res) => {
  try {
    const { prestadorId, servicioId } = req.params;
    
    // Verificar que el prestador existe
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    // Verificar que el usuario autenticado sea el dueño del perfil o un administrador
    if (prestador.usuario.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar servicios de este prestador' });
    }
    
    // Buscar el servicio
    const servicio = await Servicio.findOne({ _id: servicioId, prestadorId: prestadorId });
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }
    
    // eliminar el servicio
    await servicio.deleteOne();
    
    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.log('Error al eliminar servicio:', error.message);
    res.status(500).json({ message: 'Error al eliminar el servicio' });
  }
});

// Subir imagen de perfil para prestadores (actualiza tanto el usuario como el prestador)
router.post('/profile-picture', protectRoute, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }
    
    // Buscar si el usuario es un prestador
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador) {
      return res.status(404).json({ message: 'No se encontró el perfil de prestador para este usuario' });
    }
    
    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_pictures',
      transformation: [
        { width: 500, height: 500, crop: 'limit' }
      ]
    });
    
    console.log('Imagen subida a Cloudinary:', result.secure_url);
    
    // Actualizar la URL de la imagen tanto en el usuario como en el prestador
    const userId = req.user._id;
    
    // 1. Actualizar en la tabla User
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true }
    ).select('-password');
    
    // 2. Actualizar en la tabla Prestador
    const updatedPrestador = await Prestador.findByIdAndUpdate(
      prestador._id,
      { imagen: result.secure_url },
      { new: true }
    );
    
    res.json({
      user: updatedUser,
      prestador: updatedPrestador,
      message: 'Imagen de perfil actualizada con éxito'
    });
  } catch (error) {
    console.error('Error al subir imagen de prestador:', error);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
});

export default router;
