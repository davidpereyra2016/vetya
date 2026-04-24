import express from 'express';
import mongoose from 'mongoose';  
import Emergencia from "../models/Emergencia.js";
import Mascota from "../models/Mascota.js";
import Prestador from "../models/Prestador.js";
import User from "../models/User.js";
import Notificacion from "../models/Notificacion.js";
import Pago from "../models/Pago.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import { enviarNotificacionPush, esTokenValido } from "../utils/notificacionesUtils.js";
import { preferenceClient } from "../lib/mercadopago.js";

const router = express.Router();

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

async function completarPagoEfectivoEmergencia(emergencia) {
  if (!emergencia?._id || emergencia.metodoPago !== 'Efectivo') {
    return null;
  }

  let pago = await Pago.findOne({
    'referencia.tipo': 'Emergencia',
    'referencia.id': emergencia._id,
    metodoPago: 'Efectivo'
  }).sort({ createdAt: -1 });

  if (!pago) {
    const prestador = await Prestador.findById(emergencia.veterinario).select('_id precioEmergencia');

    if (!prestador) {
      throw new Error('No se encontró el prestador para completar el pago en efectivo');
    }

    const monto = emergencia.costoTotal || prestador.precioEmergencia || 0;

    if (monto <= 0) {
      throw new Error('No se pudo determinar el monto del pago en efectivo');
    }

    pago = new Pago({
      usuario: emergencia.usuario,
      concepto: 'Emergencia',
      referencia: {
        tipo: 'Emergencia',
        id: emergencia._id
      },
      prestador: prestador._id,
      monto,
      metodoPago: 'Efectivo'
    });
  }

  pago.estado = 'Completado';
  pago.fechaPago = new Date();

  if (!pago.idTransaccion) {
    pago.idTransaccion = `EFECTIVO-EMERG-${emergencia._id.toString()}`;
  }

  await pago.save();
  return pago;
}

// Obtener todas las emergencias del usuario autenticado
router.get("/", protectRoute, async (req, res) => {
  try {
    const emergencias = await Emergencia.find({ usuario: req.user._id })
      .populate("mascota", "nombre tipo raza imagen edad genero color peso")
      .populate("veterinario", "nombre especialidades imagen rating")
      .select("+otroAnimal")
      .sort({ fechaSolicitud: -1 });
    
    // Agregar mascotaInfo a cada emergencia
    const emergenciasConMascotaInfo = emergencias.map(emergencia => {
      const emergenciaObj = emergencia.toObject();
      
      let mascotaInfo = null;
      if (emergencia.otroAnimal && emergencia.otroAnimal.esOtroAnimal) {
        mascotaInfo = {
          esOtroAnimal: true,
          tipo: emergencia.otroAnimal.tipo,
          nombre: emergencia.otroAnimal.descripcionAnimal || 'Animal no registrado',
          descripcion: emergencia.otroAnimal.descripcionAnimal,
          condicion: emergencia.otroAnimal.condicion,
          ubicacionExacta: emergencia.otroAnimal.ubicacionExacta,
          raza: null, edad: null, genero: null, color: null, peso: null, imagen: null
        };
      } else if (emergencia.mascota) {
        mascotaInfo = {
          esOtroAnimal: false,
          _id: emergencia.mascota._id,
          nombre: emergencia.mascota.nombre,
          tipo: emergencia.mascota.tipo,
          raza: emergencia.mascota.raza,
          edad: emergencia.mascota.edad,
          genero: emergencia.mascota.genero,
          color: emergencia.mascota.color,
          peso: emergencia.mascota.peso,
          imagen: emergencia.mascota.imagen
        };
      }
      
      emergenciaObj.mascotaInfo = mascotaInfo;
      return emergenciaObj;
    });
    
    res.status(200).json(emergenciasConMascotaInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener las emergencias" });
  }
});

// Obtener emergencias por estado
router.get("/estado/:estado", protectRoute, async (req, res) => {
  try {
    const estados = ["Solicitada", "Asignada", "En camino", "Atendida", "Cancelada"];
    if (!estados.includes(req.params.estado)) {
      return res.status(400).json({ message: "Estado de emergencia inválido" });
    }
    
    const emergencias = await Emergencia.find({ 
      usuario: req.user._id,
      estado: req.params.estado
    })
      .populate("mascota", "nombre tipo raza imagen edad genero color peso")
      .populate("veterinario", "nombre especialidades imagen rating")
      .select("+otroAnimal")
      .sort({ fechaSolicitud: -1 });
    
    // Agregar mascotaInfo a cada emergencia
    const emergenciasConMascotaInfo = emergencias.map(emergencia => {
      const emergenciaObj = emergencia.toObject();
      
      let mascotaInfo = null;
      if (emergencia.otroAnimal && emergencia.otroAnimal.esOtroAnimal) {
        mascotaInfo = {
          esOtroAnimal: true,
          tipo: emergencia.otroAnimal.tipo,
          nombre: emergencia.otroAnimal.descripcionAnimal || 'Animal no registrado',
          descripcion: emergencia.otroAnimal.descripcionAnimal,
          condicion: emergencia.otroAnimal.condicion,
          ubicacionExacta: emergencia.otroAnimal.ubicacionExacta,
          raza: null, edad: null, genero: null, color: null, peso: null, imagen: null
        };
      } else if (emergencia.mascota) {
        mascotaInfo = {
          esOtroAnimal: false,
          _id: emergencia.mascota._id,
          nombre: emergencia.mascota.nombre,
          tipo: emergencia.mascota.tipo,
          raza: emergencia.mascota.raza,
          edad: emergencia.mascota.edad,
          genero: emergencia.mascota.genero,
          color: emergencia.mascota.color,
          peso: emergencia.mascota.peso,
          imagen: emergencia.mascota.imagen
        };
      }
      
      emergenciaObj.mascotaInfo = mascotaInfo;
      return emergenciaObj;
    });
    
    res.status(200).json(emergenciasConMascotaInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener las emergencias" });
  }
});

// Obtener emergencias activas del usuario
router.get("/activas", protectRoute, async (req, res) => {
  try {
    const estadosActivos = ["Solicitada", "Asignada", "Confirmada", "En camino"];
    
    const emergencias = await Emergencia.find({ 
      usuario: req.user._id,
      estado: { $in: estadosActivos }
    })
      .populate("mascota", "nombre tipo raza imagen edad genero color peso")
      .populate("veterinario", "nombre especialidades imagen rating")
      .select("+otroAnimal");
    
    // Agregar mascotaInfo a cada emergencia
    const emergenciasConMascotaInfo = emergencias.map(emergencia => {
      const emergenciaObj = emergencia.toObject();
      
      let mascotaInfo = null;
      if (emergencia.otroAnimal && emergencia.otroAnimal.esOtroAnimal) {
        mascotaInfo = {
          esOtroAnimal: true,
          tipo: emergencia.otroAnimal.tipo,
          nombre: emergencia.otroAnimal.descripcionAnimal || 'Animal no registrado',
          descripcion: emergencia.otroAnimal.descripcionAnimal,
          condicion: emergencia.otroAnimal.condicion,
          ubicacionExacta: emergencia.otroAnimal.ubicacionExacta,
          raza: null, edad: null, genero: null, color: null, peso: null, imagen: null
        };
      } else if (emergencia.mascota) {
        mascotaInfo = {
          esOtroAnimal: false,
          _id: emergencia.mascota._id,
          nombre: emergencia.mascota.nombre,
          tipo: emergencia.mascota.tipo,
          raza: emergencia.mascota.raza,
          edad: emergencia.mascota.edad,
          genero: emergencia.mascota.genero,
          color: emergencia.mascota.color,
          peso: emergencia.mascota.peso,
          imagen: emergencia.mascota.imagen
        };
      }
      
      emergenciaObj.mascotaInfo = mascotaInfo;
      return emergenciaObj;
    });
    
    res.status(200).json(emergenciasConMascotaInfo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener la emergencia" });
  }
});

// Obtener emergencias asignadas al veterinario autenticado
router.get("/asignadas", protectRoute, async (req, res) => {
  try {
    // Verificar que el usuario sea un prestador de tipo veterinario
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    console.log(`🔍 Buscando emergencias para veterinario:`, {
      prestadorId: prestador?._id,
      tipo: prestador?.tipo,
      usuarioId: req.user._id
    });
    
    if (!prestador || prestador.tipo !== "Veterinario") {
      return res.status(403).json({ message: "Solo los veterinarios pueden acceder a emergencias asignadas" });
    }
    
    // Primero verificar cuántas emergencias tiene este veterinario en TOTAL
    const totalEmergencias = await Emergencia.countDocuments({ veterinario: prestador._id });
    console.log(`📊 Total de emergencias del veterinario en BD: ${totalEmergencias}`);
    
    // Obtener TODAS las emergencias asignadas a este veterinario (activas + historial)
    // Incluye: Solicitada, Asignada, Confirmada, En camino, En atención, Atendida, Cancelada
    const emergencias = await Emergencia.find({
      veterinario: prestador._id,
      estado: { $in: ["Solicitada", "Asignada", "Confirmada", "En camino", "En atención", "Atendida", "Cancelada"] }
    })
      .populate("mascota", "nombre tipo raza imagen edad genero color")
      .populate("usuario", "username telefono email profilePicture")
      .select("+otroAnimal") // Asegurarse de incluir otroAnimal
      .sort({ fechaSolicitud: -1 }); // Ordenar por fecha de solicitud (más reciente primero)
    
    console.log(`✅ Encontradas ${emergencias.length} emergencias (activas + historial) del veterinario ${prestador._id}`);
    if (emergencias.length > 0) {
      console.log(`   Estados: ${emergencias.map(e => e.estado).join(', ')}`);
      console.log(`   IDs: ${emergencias.map(e => e._id).join(', ')}`);
    } else {
      // Si no encuentra ninguna, buscar todas sin filtro de estado para debug
      const todasEmergencias = await Emergencia.find({ veterinario: prestador._id });
      console.log(`⚠️ Ninguna emergencia con estados permitidos. Total sin filtro: ${todasEmergencias.length}`);
      if (todasEmergencias.length > 0) {
        console.log(`   Estados encontrados: ${todasEmergencias.map(e => e.estado).join(', ')}`);
      }
    }
    
    // Obtener ubicación actual del veterinario para calcular distancias
    const vetLat = prestador.ubicacionActual?.coordenadas?.lat || prestador.direccion?.coordenadas?.lat || 0;
    const vetLng = prestador.ubicacionActual?.coordenadas?.lng || prestador.direccion?.coordenadas?.lng || 0;
    
    // Agregar mascotaInfo y calcular distancia para cada emergencia
    const emergenciasConMascotaInfo = emergencias.map(emergencia => {
      const emergenciaObj = emergencia.toObject();
      
      // Preparar información de la mascota
      let mascotaInfo = null;
      
      if (emergencia.otroAnimal && emergencia.otroAnimal.esOtroAnimal) {
        // Es otro animal no registrado
        mascotaInfo = {
          esOtroAnimal: true,
          tipo: emergencia.otroAnimal.tipo,
          nombre: emergencia.otroAnimal.descripcionAnimal || 'Animal no registrado',
          descripcion: emergencia.otroAnimal.descripcionAnimal,
          condicion: emergencia.otroAnimal.condicion,
          ubicacionExacta: emergencia.otroAnimal.ubicacionExacta,
          raza: null,
          edad: null,
          genero: null,
          color: null,
          peso: null,
          imagen: null
        };
      } else if (emergencia.mascota) {
        // Es una mascota registrada
        mascotaInfo = {
          esOtroAnimal: false,
          _id: emergencia.mascota._id,
          nombre: emergencia.mascota.nombre,
          tipo: emergencia.mascota.tipo,
          raza: emergencia.mascota.raza,
          edad: emergencia.mascota.edad,
          genero: emergencia.mascota.genero,
          color: emergencia.mascota.color,
          peso: emergencia.mascota.peso,
          imagen: emergencia.mascota.imagen
        };
      }
      
      emergenciaObj.mascotaInfo = mascotaInfo;
      
      // Calcular distancia si hay coordenadas válidas
      if (emergencia.ubicacion?.coordenadas?.lat && emergencia.ubicacion?.coordenadas?.lng && vetLat && vetLng) {
        const distanciaReal = calcularDistancia(
          vetLat, vetLng,
          emergencia.ubicacion.coordenadas.lat,
          emergencia.ubicacion.coordenadas.lng
        );
        // Aplicar radio de privacidad (mínimo 1km)
        emergenciaObj.distancia = Math.max(1.0, distanciaReal);
        // Calcular tiempo estimado (2 min por km a 30km/h promedio)
        emergenciaObj.tiempoEstimado = Math.ceil(emergenciaObj.distancia * 2);
      } else {
        emergenciaObj.distancia = null;
        emergenciaObj.tiempoEstimado = null;
      }
      
      return emergenciaObj;
    });
    
    res.status(200).json(emergenciasConMascotaInfo);
  } catch (error) {
    console.log("Error al obtener emergencias asignadas:", error);
    res.status(500).json({ message: "Error al obtener emergencias asignadas" });
  }
});

// Obtener una emergencia por ID
router.get("/:id", protectRoute, async (req, res) => {
  try {
    console.log('Solicitud de emergencia por ID:', req.params.id, 'Usuario:', req.user._id);
    
    // Buscamos primero al prestador si el usuario es un prestador (veterinario)
    let prestador = null;
    try {
      prestador = await Prestador.findOne({ usuario: req.user._id });
      console.log('Prestador encontrado:', prestador ? prestador._id : 'No es prestador');
    } catch (err) {
      console.log('Error al buscar prestador:', err);
    }
    
    // Primero obtenemos la emergencia sin populate para verificar permisos
    const emergenciaBase = await Emergencia.findById(req.params.id);
    
    if (!emergenciaBase) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario o el veterinario asignado
    const esCliente = emergenciaBase.usuario.toString() === req.user._id.toString();
    // Si es prestador, verificamos si el ID del prestador coincide con el veterinario asignado
    const esVeterinarioAsignado = prestador && emergenciaBase.veterinario && 
      emergenciaBase.veterinario.toString() === prestador._id.toString();
    
    console.log('Verificando permisos detallados:', {
      usuarioId: req.user._id,
      prestadorId: prestador ? prestador._id : null,
      esCliente,
      esVeterinarioAsignado,
      usuarioEmergencia: emergenciaBase.usuario.toString(),
      veterinarioEmergencia: emergenciaBase.veterinario ? emergenciaBase.veterinario.toString() : null
    });
    
    if (!esCliente && !esVeterinarioAsignado) {
      console.log('Acceso denegado - No es cliente ni veterinario asignado');
      return res.status(401).json({ message: "No autorizado para ver esta emergencia" });
    }
    
    // Si está autorizado, ahora obtenemos la emergencia con todos los datos populados
    const emergencia = await Emergencia.findById(req.params.id)
      .populate("mascota", "nombre tipo raza imagen edad genero color peso")
      .populate("usuario", "username email profilePicture telefono")
      .populate({
        path: "veterinario",
        model: "Prestador",
        select: "nombre especialidades imagen rating telefono email precioEmergencia ubicacionActual"
      });
    
    // Preparar respuesta con información de la mascota (registrada u otro animal)
    let mascotaInfo = null;
    
    if (emergencia.otroAnimal && emergencia.otroAnimal.esOtroAnimal) {
      // Es otro animal no registrado
      mascotaInfo = {
        esOtroAnimal: true,
        tipo: emergencia.otroAnimal.tipo,
        nombre: emergencia.otroAnimal.descripcionAnimal || 'Animal no registrado',
        descripcion: emergencia.otroAnimal.descripcionAnimal,
        condicion: emergencia.otroAnimal.condicion,
        ubicacionExacta: emergencia.otroAnimal.ubicacionExacta,
        // Campos adicionales para compatibilidad con el frontend
        raza: null,
        edad: null,
        genero: null,
        color: null,
        peso: null,
        imagen: null
      };
    } else if (emergencia.mascota) {
      // Es una mascota registrada
      mascotaInfo = {
        esOtroAnimal: false,
        _id: emergencia.mascota._id,
        nombre: emergencia.mascota.nombre,
        tipo: emergencia.mascota.tipo,
        raza: emergencia.mascota.raza,
        edad: emergencia.mascota.edad,
        genero: emergencia.mascota.genero,
        color: emergencia.mascota.color,
        peso: emergencia.mascota.peso,
        imagen: emergencia.mascota.imagen
      };
    }
    
    // Crear objeto de respuesta con mascotaInfo incluida
    const emergenciaResponse = emergencia.toObject();
    emergenciaResponse.mascotaInfo = mascotaInfo;
    
    console.log('Emergencia enviada al cliente:', {
      id: emergencia._id,
      estado: emergencia.estado,
      esOtroAnimal: emergencia.otroAnimal?.esOtroAnimal || false,
      mascota: mascotaInfo ? mascotaInfo.nombre : null,
      usuario: emergencia.usuario ? emergencia.usuario.email : null,
      veterinario: emergencia.veterinario ? emergencia.veterinario.nombre : null
    });
    
    res.status(200).json(emergenciaResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener la emergencia" });
  }
});

// Crear una nueva solicitud de emergencia
router.post("/", protectRoute, async (req, res) => {
  try {
    const { mascota, descripcion, tipoEmergencia, nivelUrgencia, ubicacion, imagenes, otroAnimal } = req.body;
    
    // Verificar si el usuario ya tiene una emergencia activa o reciente (dentro de los últimos 5 minutos)
    const tiempoLimite = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás
    
    const emergenciasRecientes = await Emergencia.find({
      usuario: req.user._id,
      estado: { $in: ['Solicitada', 'Asignada', 'En camino'] },
      fechaSolicitud: { $gte: tiempoLimite }
    });
    
    if (emergenciasRecientes.length > 0) {
      console.log(`El usuario ${req.user._id} ya tiene una emergencia activa o reciente`);
      return res.status(429).json({
        message: 'Ya tienes una emergencia activa o has solicitado una recientemente. Por favor espera 5 minutos entre solicitudes.',
        tiempoRestante: Math.ceil((new Date(emergenciasRecientes[0].expiraEn) - new Date()) / 1000 / 60), // tiempo restante en minutos
        emergenciaActiva: emergenciasRecientes[0]
      });
    }
    
    // Validar campos obligatorios comunes
    if (!descripcion || !tipoEmergencia || !ubicacion) {
      return res.status(400).json({ message: "Por favor completa todos los campos obligatorios" });
    }
    
    // Determinar si es una emergencia para mascota registrada o para otro animal
    const esOtroAnimal = req.body.esOtroAnimal === true;
    console.log(`Tipo de emergencia: ${esOtroAnimal ? 'Otro animal' : 'Mascota registrada'}`);
    console.log(`Datos de otro animal:`, JSON.stringify(otroAnimal));
    
    // Validaciones específicas según el tipo de emergencia
    if (esOtroAnimal) {
      // Validar datos mínimos para otro animal
      if (!otroAnimal.tipo || !otroAnimal.descripcionAnimal) {
        return res.status(400).json({ message: "Por favor completa la información del animal" });
      }
      
      console.log('Creando emergencia para animal no registrado:', otroAnimal);
    } else {
      // Validar datos para mascota registrada
      if (!mascota) {
        return res.status(400).json({ message: "Por favor selecciona una mascota" });
      }
      
      // Verificar que la mascota exista y pertenezca al usuario
      const mascotaExiste = await Mascota.findById(mascota);
      if (!mascotaExiste) {
        return res.status(404).json({ message: "Mascota no encontrada" });
      }
      if (mascotaExiste.propietario.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "No autorizado para solicitar emergencia con esta mascota" });
      }
      
      console.log('Creando emergencia para mascota registrada ID:', mascota);
    }
    
    // Procesar imágenes si se proporcionan
    let imagenesUrls = [];
    if (imagenes && imagenes.length > 0) {
      for (const imagen of imagenes) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(imagen, {
            folder: "emergencias"
          });
          imagenesUrls.push(uploadResponse.secure_url);
        } catch (error) {
          console.log("Error al subir imagen a Cloudinary:", error);
          // Continúa con las otras imágenes si una falla
        }
      }
    }
    
    // Adaptar el formato de ubicación para que coincida con el modelo
    let ubicacionFormateada = {
      direccion: ubicacion.direccion || 'Dirección no especificada',
      ciudad: ubicacion.ciudad || 'Ciudad no especificada',
      coordenadas: {
        lat: ubicacion.coordenadas?.latitud || 0,
        lng: ubicacion.coordenadas?.longitud || 0
      }
    };
    
    console.log('Ubicación formateada:', JSON.stringify(ubicacionFormateada));
    
    // Crear el objeto de emergencia según el tipo (mascota registrada o no)
    const nuevaEmergencia = new Emergencia({
      usuario: req.user._id,
      descripcion,
      tipoEmergencia,
      nivelUrgencia: nivelUrgencia || 'Media',
      ubicacion: ubicacionFormateada,
      fechaSolicitud: new Date(),
      imagenes: imagenesUrls
    });
    
    // Asignar datos específicos según el tipo de emergencia
    if (esOtroAnimal) {
      nuevaEmergencia.otroAnimal = {
        esOtroAnimal: true,
        tipo: otroAnimal.tipo,
        descripcionAnimal: otroAnimal.descripcionAnimal,
        condicion: otroAnimal.condicion || '',
        ubicacionExacta: otroAnimal.ubicacionExacta || ''
      };
      // No establecemos el campo mascota
    } else {
      nuevaEmergencia.mascota = mascota;
      // Mantenemos otroAnimal.esOtroAnimal como false (valor por defecto)
    }

    await nuevaEmergencia.save();
    
    // Buscar veterinarios cercanos (esto es un ejemplo, en una implementación real 
    // podrías usar geolocalización para encontrar los veterinarios más cercanos)
    
    // Populate para devolver la información completa
    const emergenciaCompletada = await Emergencia.findById(nuevaEmergencia._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("veterinario", "nombre especialidad imagen rating");
    
    res.status(201).json(emergenciaCompletada);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear la solicitud de emergencia" });
  }
});

// Verificar y cancelar emergencias expiradas
router.get("/verificar-expiracion/:id", protectRoute, async (req, res) => {
  try {
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (emergencia.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para verificar esta emergencia" });
    }
    
    let expiracionOcurrida = false;
    let mensajeExpiracion = '';

    // Verificar si la emergencia ha expirado (Solicitud inicial no atendida)
    if (emergencia.estado === 'Solicitada' && emergencia.expiraEn && new Date() > new Date(emergencia.expiraEn)) {
      emergencia.estado = 'Cancelada';
      emergencia.motivoCancelacion = 'Expirada antes de asignación';
      emergencia.expirada = true;
      await emergencia.save();
      expiracionOcurrida = true;
      mensajeExpiracion = 'La solicitud de emergencia ha expirado antes de ser asignada y fue cancelada automáticamente';
    }
    // Verificar si la emergencia ha expirado (Veterinario asignado no respondió a tiempo)
    else if (emergencia.estado === 'Asignada' && emergencia.expiraRespuestaVetEn && new Date() > new Date(emergencia.expiraRespuestaVetEn)) {
      emergencia.estado = 'Cancelada';
      emergencia.motivoCancelacion = 'Veterinario no respondió a tiempo';
      emergencia.expirada = true;
      await emergencia.save();
      expiracionOcurrida = true;
      mensajeExpiracion = 'El veterinario asignado no respondió a tiempo y la emergencia fue cancelada automáticamente';
      // Aquí podrías añadir lógica para notificar al cliente que la emergencia fue cancelada
      // y quizás reabrir la posibilidad de buscar otro veterinario si es aplicable.
    }

    if (expiracionOcurrida) {
      return res.status(200).json({
        message: mensajeExpiracion,
        emergencia
      });
    }
    
    // Calcular tiempo restante en segundos para la próxima expiración relevante
    let tiempoRestante = 0;
    let proximaExpiracion = null;

    if (emergencia.estado === 'Solicitada' && emergencia.expiraEn) {
      proximaExpiracion = new Date(emergencia.expiraEn);
    } else if (emergencia.estado === 'Asignada' && emergencia.expiraRespuestaVetEn) {
      proximaExpiracion = new Date(emergencia.expiraRespuestaVetEn);
    }

    if (proximaExpiracion) {
      tiempoRestante = Math.max(0, Math.floor((proximaExpiracion - new Date()) / 1000));
    }
    
    return res.status(200).json({
      message: 'Emergencia válida',
      tiempoRestante,
      emergencia
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al verificar expiración de la emergencia" });
  }
});

// Cancelar una emergencia
router.post("/:id/cancelar", protectRoute, async (req, res) => {
  try {
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar que el usuario sea el propietario de la emergencia
    if (emergencia.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para cancelar esta emergencia" });
    }
    
    // Verificar que la emergencia esté en un estado que permita cancelación
    const estadosPermitidos = ["Solicitada", "Asignada"];
    if (!estadosPermitidos.includes(emergencia.estado)) {
      return res.status(400).json({ 
        message: `No se puede cancelar una emergencia en estado ${emergencia.estado}` 
      });
    }
    
    // Actualizar estado
    emergencia.estado = "Cancelada";
    emergencia.expirada = true;
    emergencia.expiraEn = new Date(); // Expira inmediatamente
    await emergencia.save();
    
    return res.status(200).json({ 
      message: "Emergencia cancelada exitosamente",
      emergencia
    });
  } catch (error) {
    console.log("Error al cancelar emergencia:", error);
    return res.status(500).json({ message: "Error al cancelar la emergencia" });
  }
});

// ❌ RUTA DUPLICADA ELIMINADA - La ruta correcta está más abajo (línea ~650)
// Esta ruta estaba causando conflictos porque solo permitía al cliente cambiar el estado
// La ruta consolidada maneja tanto cliente como veterinario

// Asignar veterinario a una emergencia (ruta para admin o sistema)
router.patch("/:id/asignar-veterinario", protectRoute, async (req, res) => {
  try {
    const { veterinarioId } = req.body;
    
    if (!veterinarioId) {
      return res.status(400).json({ message: "ID del veterinario es requerido" });
    }
    
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar que el prestador (veterinario) exista
    const veterinario = await Prestador.findById(veterinarioId);
    if (!veterinario || veterinario.tipo !== "Veterinario") {
      return res.status(404).json({ message: "Prestador de tipo Veterinario no encontrado" });
    }
    
    // Solo se puede asignar a emergencias solicitadas
    if (emergencia.estado !== "Solicitada") {
      return res.status(400).json({ message: "Solo se puede asignar veterinario a emergencias solicitadas" });
    }
    
    emergencia.veterinario = veterinarioId;
    // El estado no se cambia aquí, se mantiene como 'Solicitada'
    // El cambio de estado a 'Asignada' o 'Confirmada' se hará en el paso de confirmación del usuario.
    emergencia.fechaAsignacion = new Date();
    
    await emergencia.save();
    
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("usuario", "nombre")
      .populate("veterinario", "nombre especialidades imagen rating precioEmergencia ubicacionActual");
    
    // Crear notificaciones para el veterinario y el usuario
    try {
      // Obtener información del usuario, veterinario y mascota para las notificaciones
      const veterinario = await Prestador.findById(veterinarioId).populate('usuario');
      const usuarioData = await User.findById(emergencia.usuario);
      
      // Determinar si es mascota registrada u otro animal
      let mascotaNombre = "Animal";
      let mascotaTipo = "";
      
      if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
        const mascota = await Mascota.findById(emergencia.mascota);
        if (mascota) {
          mascotaNombre = mascota.nombre;
          mascotaTipo = mascota.tipo;
        }
      } else if (emergencia.otroAnimal?.esOtroAnimal) {
        mascotaNombre = emergencia.otroAnimal.nombre || "Animal no registrado";
        mascotaTipo = emergencia.otroAnimal.tipo || "";
      }
      
      // 1. Crear notificación para el VETERINARIO
      if (veterinario && veterinario.usuario) {
        const notificacionVeterinario = new Notificacion({
          tipo: 'emergencia_asignada',
          titulo: 'Nueva emergencia asignada',
          mensaje: `Se te ha asignado una emergencia ${emergencia.tipoEmergencia.toLowerCase()} para ${mascotaNombre}`,
          prestador: veterinarioId, // Solo asignamos prestador, no usuario (para el veterinario)
          datos: {
            emergenciaId: emergencia._id,
            mascotaNombre: mascotaNombre,
            mascotaTipo: mascotaTipo,
            tipoEmergencia: emergencia.tipoEmergencia,
            nivelUrgencia: emergencia.nivelUrgencia,
            clienteNombre: usuarioData?.nombre || 'Cliente',
            ubicacion: emergencia.ubicacion,
            distancia: (() => {
              const coordsVeterinario = obtenerCoordenadasNormalizadas(veterinario.ubicacionActual?.coordenadas);
              if (!coordsVeterinario) return 1.0;
              return Math.max(1.0, calcularDistancia(
                emergencia.ubicacion.coordenadas.lat,
                emergencia.ubicacion.coordenadas.lng,
                coordsVeterinario.lat,
                coordsVeterinario.lng
              ));
            })()
          },
          enlace: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          icono: 'medkit',
          color: '#E53935',
          prioridad: 'Alta',
          accion: 'confirmar_emergencia'
        });
        
        await notificacionVeterinario.save();
        console.log('Notificación creada para el veterinario:', veterinario.nombre);
        
        // Enviar notificación push si el veterinario tiene un token
        if (veterinario.usuario.deviceToken && esTokenValido(veterinario.usuario.deviceToken)) {
          await enviarNotificacionPush(
            veterinario.usuario.deviceToken,
            'Nueva emergencia asignada',
            `Se te ha asignado una emergencia: ${emergencia.tipoEmergencia}`,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: 'emergencia_asignada',
              accion: 'confirmar_emergencia',
              prioridad: 'Alta',
              datos: notificacionVeterinario.datos
            }
          );
        }
      }
      
      // 2. Crear notificación para el USUARIO/CLIENTE
      if (emergencia.usuario) {
        const notificacionUsuario = new Notificacion({
          tipo: 'emergencia_asignada',
          titulo: 'Veterinario asignado a tu emergencia',
          mensaje: `${veterinario?.nombre || 'Un veterinario'} ha sido asignado a tu emergencia`,
          usuario: emergencia.usuario, // Solo asignamos usuario, no prestador (para el cliente)
          datos: {
            emergenciaId: emergencia._id,
            mascotaNombre: mascotaNombre,
            tipoEmergencia: emergencia.tipoEmergencia,
            nivelUrgencia: emergencia.nivelUrgencia,
            veterinarioNombre: veterinario?.nombre || 'Veterinario',
            veterinarioRating: veterinario?.rating || 0,
            estado: 'Asignada'
          },
          enlace: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          icono: 'medkit',
          color: '#2196F3',
          prioridad: 'Alta',
          accion: 'ver_detalle'
        });
        
        await notificacionUsuario.save();
        console.log('Notificación creada para el usuario:', usuarioData?.email || emergencia.usuario);
        
        // Enviar notificación push al usuario si tiene token
        if (usuarioData?.deviceToken && esTokenValido(usuarioData.deviceToken)) {
          await enviarNotificacionPush(
            usuarioData.deviceToken,
            'Veterinario asignado',
            `${veterinario?.nombre || 'Un veterinario'} ha sido asignado a tu emergencia`,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: 'emergencia_asignada',
              accion: 'ver_detalle',
              datos: notificacionUsuario.datos
            }
          );
        }
      }
    } catch (notifError) {
      console.log('Error al crear notificaciones:', notifError);
      // No interrumpimos el flujo principal si falla la notificación
    }
    
    res.status(200).json(emergenciaActualizada);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al asignar veterinario a la emergencia" });
  }
});

// Función auxiliar para calcular distancia entre dos puntos geográficos
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distancia en km
  return d;
}

// Actualizar estado de una emergencia (En camino, Atendida, etc.)
router.patch("/:id/estado", protectRoute, async (req, res) => {
  try {
    const { estado } = req.body;
    
    console.log(`\n📥 ============ PATCH /emergencias/${req.params.id}/estado ============`);
    console.log(`   Usuario: ${req.user._id} (${req.user.username || req.user.email})`);
    console.log(`   Estado nuevo: ${estado}`);
    console.log(`   Body completo:`, req.body);
    
    if (!estado) {
      console.log('❌ Estado no proporcionado');
      return res.status(400).json({ message: "El estado es requerido" });
    }
    
    // Validar que el estado sea válido
    const estadosValidos = ['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'Atendida', 'Cancelada'];
    if (!estadosValidos.includes(estado)) {
      console.log('❌ Estado no válido:', estado);
      return res.status(400).json({ message: "Estado no válido" });
    }
    
    console.log('🔍 Buscando emergencia en BD...');
    const emergencia = await Emergencia.findById(req.params.id);
    console.log('✅ Emergencia encontrada:', emergencia ? 'SÍ' : 'NO');
    
    if (!emergencia) {
      console.log('❌ Emergencia no encontrada en BD');
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    console.log('🔍 Estado actual de la emergencia:', emergencia.estado);
    
    // Determinar si el usuario es el cliente propietario o el veterinario asignado
    console.log('🔍 Verificando permisos...');
    const esClientePropietario = emergencia.usuario.toString() === req.user._id.toString();
    console.log('   Es cliente propietario:', esClientePropietario);
    
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    console.log('   Prestador encontrado:', prestador ? prestador._id : 'NO');
    
    const esVeterinarioAsignado = prestador && 
                                  prestador.tipo === "Veterinario" && 
                                  emergencia.veterinario && 
                                  emergencia.veterinario.toString() === prestador._id.toString();
    console.log('   Es veterinario asignado:', esVeterinarioAsignado);
    
    // Verificar autorización según el estado que se quiere cambiar
    console.log('🔒 Verificando autorización para estado:', estado);
    if (estado === 'En camino' || estado === 'Atendida') {
      // Solo el veterinario puede marcar como "En camino" o "Atendida"
      if (!esVeterinarioAsignado) {
        console.log('❌ No autorizado: no es veterinario asignado');
        return res.status(403).json({ 
          message: "No autorizado: solo el veterinario asignado puede cambiar a este estado" 
        });
      }
      console.log('✅ Autorización concedida: es veterinario asignado');
    } else if (estado === 'Cancelada') {
      // Tanto el cliente como el veterinario pueden cancelar
      if (!esClientePropietario && !esVeterinarioAsignado) {
        return res.status(403).json({ 
          message: "No autorizado para cancelar esta emergencia" 
        });
      }
    } else if (estado === 'En atención') {
      // Solo el cliente puede confirmar que el veterinario llegó (cambiar a "En atención")
      if (!esClientePropietario) {
        return res.status(403).json({ 
          message: "No autorizado: solo el cliente puede confirmar la llegada del veterinario" 
        });
      }
    } else {
      // Para otros estados, verificar que sea el cliente o el veterinario
      if (!esClientePropietario && !esVeterinarioAsignado) {
        return res.status(403).json({ 
          message: "No autorizado para modificar esta emergencia" 
        });
      }
    }
    
    // Si está cambiando a Atendida, validar pago y registrar fecha de atención
    if (estado === 'Atendida') {
      console.log('📝 Validando requisitos para marcar como Atendida...');
      
      // Si el método de pago es MercadoPago, verificar que el pago esté completado
      if (emergencia.metodoPago === 'MercadoPago') {
        console.log('💳 Método de pago: MercadoPago - Verificando estado del pago...');
        
        const pagoEmergencia = await Pago.findOne({
          'referencia.tipo': 'Emergencia',
          'referencia.id': emergencia._id,
          metodoPago: 'MercadoPago'
        });
        
        if (!pagoEmergencia) {
          console.log('❌ No se encontró registro de pago para esta emergencia');
          return res.status(400).json({ 
            message: "No se puede marcar como atendida. No se encontró el registro de pago." 
          });
        }
        
        // Verificar que el pago esté en estado completado
        if (!['Pagado', 'Capturado', 'Completado'].includes(pagoEmergencia.estado)) {
          console.log(`❌ Estado del pago: ${pagoEmergencia.estado} - No está completado`);
          return res.status(400).json({ 
            message: `No se puede marcar como atendida. El cliente debe completar el pago con Mercado Pago primero. Estado actual: ${pagoEmergencia.estado}`,
            pagoEstado: pagoEmergencia.estado,
            initPoint: pagoEmergencia.mercadoPago?.initPoint
          });
        }
        
        console.log(`✅ Pago verificado - Estado: ${pagoEmergencia.estado}`);
        emergencia.pagado = true;
      } else if (emergencia.metodoPago === 'Efectivo') {
        console.log('💵 Método de pago: Efectivo - Completando pago al cerrar la emergencia...');

        const pagoEfectivo = await completarPagoEfectivoEmergencia(emergencia);
        emergencia.pagado = true;

        if (!emergencia.costoTotal && pagoEfectivo?.monto) {
          emergencia.costoTotal = pagoEfectivo.monto;
        }

        console.log(`✅ Pago en efectivo completado - Estado: ${pagoEfectivo?.estado}`);
      } else {
        console.log(`💵 Método de pago: ${emergencia.metodoPago || 'Por definir'} - No requiere verificación adicional`);
      }
      
      console.log('📝 Registrando fecha de atención y actualizando historial...');
      emergencia.fechaAtencion = new Date();
      
      // Registrar esto en el historial de emergencias
      if (!emergencia.historial) {
        console.log('⚠️ Creando array de historial (no existía)');
        emergencia.historial = [];
      }
      emergencia.historial.push({
        estado: 'Atendida',
        fecha: new Date(),
        usuario: req.user._id,
        notas: 'Emergencia atendida por el veterinario'
      });
      console.log('✅ Historial actualizado');
    }
    
    // Si está cambiando a En camino, registrar fecha
    if (estado === 'En camino') {
      emergencia.fechaEnCamino = new Date();
      emergencia.historial.push({
        estado: 'En camino',
        fecha: new Date(),
        usuario: req.user._id,
        notas: 'Veterinario en camino'
      });
    }
    
    // Actualizar el estado
    const estadoAnterior = emergencia.estado;
    emergencia.estado = estado;
    await emergencia.save();
    
    console.log(`✅ Estado de emergencia ${emergencia._id} actualizado: ${estadoAnterior} → ${estado}`);
    console.log(`   Veterinario: ${prestador?._id || 'N/A'}`);
    console.log(`   Cliente: ${emergencia.usuario}`);
    
    // Enviar notificación al cliente
    try {
      if (emergencia.usuario) {
        // Determinar si es mascota registrada u otro animal
        let mascotaNombre = "Animal";
        let mascotaTipo = "";
        
        if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
          const mascota = await Mascota.findById(emergencia.mascota);
          if (mascota) {
            mascotaNombre = mascota.nombre;
            mascotaTipo = mascota.tipo;
          }
        } else if (emergencia.otroAnimal?.esOtroAnimal) {
          mascotaNombre = emergencia.otroAnimal.nombre || "Animal no registrado";
          mascotaTipo = emergencia.otroAnimal.tipo || "";
        }
        
        // 1. Obtener información relevante para la notificación
        const usuarioData = await User.findById(emergencia.usuario);
        
        // Diferentes mensajes según el estado
        let notificacionTipo = 'emergencia_actualizada';
        let notificacionTitulo = `Emergencia ${estado}`;
        let notificationText = `El estado de tu emergencia ha cambiado a: ${estado}`;
        let notificacionIcono = 'information-circle';
        let notificacionColor = '#1E88E5';
        
        // Personalizar según el estado específico
        if (estado === 'Atendida') {
          notificacionTipo = 'emergencia_atendida';
          notificacionTitulo = 'Emergencia atendida';
          notificationText = `Tu emergencia para ${mascotaNombre} ha sido atendida por el veterinario ${prestador.nombre}`;
          notificacionIcono = 'checkmark-done-circle';
          notificacionColor = '#43A047';
          
          // Actualizar la notificación original del veterinario (marcarla como finalizada)
          await Notificacion.updateMany(
            { 
              prestador: prestador._id, 
              'datos.emergenciaId': emergencia._id.toString(),
              $or: [{ tipo: 'emergencia_asignada' }, { tipo: 'emergencia_confirmada' }]
            },
            {
              $set: {
                leida: true,
                fechaLectura: new Date(),
                activa: false
              }
            }
          );
        } else if (estado === 'En camino') {
          notificacionTipo = 'emergencia_en_camino';
          notificacionTitulo = 'Veterinario en camino';
          notificationText = `El veterinario ${prestador.nombre} está en camino para atender tu emergencia`;
          notificacionIcono = 'navigate';
          notificacionColor = '#FB8C00';
        }
        
        // Crear notificación en la base de datos
        const notificacionUsuario = new Notificacion({
          usuario: emergencia.usuario,
          titulo: notificacionTitulo,
          mensaje: notificationText,
          tipo: notificacionTipo,
          datos: {
            emergenciaId: emergencia._id.toString(),
            mascotaNombre: mascotaNombre,
            tipoEmergencia: emergencia.tipoEmergencia,
            nivelUrgencia: emergencia.nivelUrgencia,
            veterinarioNombre: prestador.nombre || 'Veterinario',
            veterinarioRating: prestador.rating || 0,
            estado
          },
          enlace: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          icono: notificacionIcono,
          color: notificacionColor,
          prioridad: 'Alta',
          accion: 'ver_detalle',
          leida: false
        });
        
        await notificacionUsuario.save();
        console.log(`Notificación de estado ${estado} creada para el usuario:`, usuarioData?.email || emergencia.usuario);
        
        // Enviar notificación push al usuario si tiene token
        if (usuarioData?.deviceToken && esTokenValido(usuarioData.deviceToken)) {
          await enviarNotificacionPush(
            usuarioData.deviceToken,
            notificacionTitulo,
            notificationText,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: notificacionTipo,
              accion: 'ver_detalle',
              datos: notificacionUsuario.datos
            }
          );
        }
      }
    } catch (notifError) {
      console.log('Error al crear notificación:', notifError);
      // No interrumpimos el flujo principal si falla la notificación
    }
    
    // Retornar la emergencia actualizada con todos los datos poblados
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen edad genero color")
      .populate("usuario", "username telefono email profilePicture")
      .populate("veterinario", "nombre especialidad imagen rating telefono");
    
    console.log(`📤 Retornando emergencia actualizada con estado: ${emergenciaActualizada.estado}`);
    
    console.log('✅ Estado actualizado exitosamente a:', estado);
    console.log(`============ FIN PATCH /emergencias/${req.params.id}/estado ============\n`);
    res.status(200).json(emergenciaActualizada);
  } catch (error) {
    console.error('\n💥 ============ ERROR EN PATCH /emergencias/:id/estado ============');
    console.error('Error completo:', error);
    console.error('Stack trace:', error.stack);
    console.error('============ FIN ERROR ============\n');
    res.status(500).json({ message: "Error al actualizar el estado de la emergencia" });
  }
});

// Obtener actualización de ubicación del veterinario asignado a una emergencia
router.get("/:id/ubicacion-veterinario", protectRoute, async (req, res) => {
  try {
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario de la emergencia
    if (emergencia.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para ver esta información" });
    }
    
    // Verificar si hay un veterinario asignado
    if (!emergencia.veterinario) {
      return res.status(400).json({ message: "No hay veterinario asignado a esta emergencia" });
    }
    
    // Buscar el prestador (veterinario) para obtener su ubicación actual
    const veterinario = await Prestador.findById(emergencia.veterinario);
    
    if (!veterinario || !veterinario.ubicacionActual || !veterinario.ubicacionActual.coordenadas) {
      return res.status(404).json({ message: "No se encontró la ubicación del veterinario" });
    }
    
    // Coordenadas del cliente y veterinario
    const clienteLat = emergencia.ubicacion.coordenadas.lat;
    const clienteLng = emergencia.ubicacion.coordenadas.lng;
    
    // Verificar que las coordenadas del veterinario sean válidas
    const coordsVeterinario = obtenerCoordenadasNormalizadas(veterinario.ubicacionActual.coordenadas);
    if (!coordsVeterinario) {
      return res.status(400).json({ message: "Coordenadas del veterinario inválidas" });
    }
    const vetLat = coordsVeterinario.lat;
    const vetLng = coordsVeterinario.lng;
    
    // Asegurarse de que las coordenadas son números válidos
    if (isNaN(clienteLat) || isNaN(clienteLng) || isNaN(vetLat) || isNaN(vetLng)) {
      return res.status(400).json({ message: "Coordenadas inválidas" });
    }
    
    // Calcular distancia real (usando la fórmula haversine)
    const distanciaReal = calcularDistancia(clienteLat, clienteLng, vetLat, vetLng);
    
    // Aplicar radio de privacidad (mínimo 1km)
    const distanciaAjustada = Math.max(1.0, distanciaReal);
    
    // Calcular tiempo estimado (asumiendo 30km/h en entorno urbano)
    const tiempoEstimadoMin = Math.ceil(distanciaAjustada * 2); // 2 min por km
    
    res.status(200).json({
      distancia: {
        valor: distanciaAjustada,
        texto: `${distanciaAjustada.toFixed(1)} km`
      },
      tiempoEstimado: {
        valor: tiempoEstimadoMin,
        texto: `${tiempoEstimadoMin} min`
      },
      ultimaActualizacion: veterinario.ubicacionActual.ultimaActualizacion || new Date()
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener la ubicación del veterinario" });
  }
});

// Agregar imagen a una emergencia
router.post("/:id/imagen", protectRoute, async (req, res) => {
  try {
    const { imagen } = req.body;
    
    if (!imagen) {
      return res.status(400).json({ message: "La imagen es requerida" });
    }
    
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (emergencia.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para modificar esta emergencia" });
    }
    
    // Subir imagen a Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imagen, {
      folder: "emergencias"
    });
    
    // Agregar URL de la imagen a la emergencia
    emergencia.imagenes.push(uploadResponse.secure_url);
    await emergencia.save();
    
    res.status(200).json(emergencia);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al agregar imagen a la emergencia" });
  }
});

// Obtener emergencias activas cercanas a una ubicación (para veterinarios)
router.post("/cercanas", protectRoute, async (req, res) => {
  try {
    const { lat, lng, radio } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: "La ubicación es requerida" });
    }
    
    // En una implementación real, aquí usarías geolocalización para encontrar emergencias cercanas
    // Este es un ejemplo simplificado para demostración
    const emergencias = await Emergencia.find({
      estado: "Solicitada",
      "ubicacion.coordenadas": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radio || 5000 // 5km por defecto
        }
      }
    })
      .populate("mascota", "nombre tipo raza imagen")
      .sort({ fechaSolicitud: -1 });
    
    res.status(200).json(emergencias);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener emergencias cercanas" });
  }
});

// Obtener emergencias cercanas disponibles para el veterinario (endpoint especial para la app de veterinarios)
router.get("/cercanas/disponibles", protectRoute, async (req, res) => {
  try {
    // Verificar que el usuario sea un prestador de tipo veterinario
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador || prestador.tipo !== "Veterinario") {
      return res.status(403).json({ message: "Solo los veterinarios pueden acceder a emergencias cercanas" });
    }
    
    // Obtener ubicación del veterinario
    if (!prestador.ubicacion || !prestador.ubicacion.coordenadas) {
      return res.status(400).json({ message: "El veterinario no tiene ubicación registrada" });
    }
    
    const lat = prestador.ubicacion.coordenadas.lat;
    const lng = prestador.ubicacion.coordenadas.lng;
    
    // Buscar emergencias solicitadas cercanas a la ubicación del veterinario
    const emergencias = await Emergencia.find({
      estado: "Solicitada",
      "ubicacion.coordenadas": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // 10km por defecto
        }
      }
    })
      .populate("mascota", "nombre tipo raza imagen")
      .populate("usuario", "nombre telefono")
      .sort({ fechaSolicitud: -1 })
      .limit(10); // Limitar a 10 emergencias para no sobrecargar
    
    // Añadir información de distancia para cada emergencia
    const emergenciasConDistancia = emergencias.map(emergencia => {
      const emergenciaObj = emergencia.toObject();
      const distancia = calcularDistancia(
        lat,
        lng,
        emergencia.ubicacion.coordenadas.lat,
        emergencia.ubicacion.coordenadas.lng
      );
      
      // Aplicar radio de privacidad de 1km
      const distanciaAjustada = Math.max(distancia, 1.0);
      
      // Calcular tiempo estimado basado en velocidad promedio de 30km/h
      const tiempoEstimado = Math.ceil(distanciaAjustada / 30 * 60); // en minutos
      
      return {
        ...emergenciaObj,
        distancia: distanciaAjustada,
        tiempoEstimado: tiempoEstimado
      };
    });
    
    console.log(`Encontradas ${emergenciasConDistancia.length} emergencias cercanas disponibles para el veterinario ${prestador._id}`);
    res.status(200).json(emergenciasConDistancia);
  } catch (error) {
    console.log("Error al obtener emergencias cercanas disponibles:", error);
    res.status(500).json({ message: "Error al obtener emergencias cercanas disponibles" });
  }
});

// Aceptar una emergencia (ruta para veterinarios)
router.post("/:id/aceptar", protectRoute, async (req, res) => {
  try {
    // Validación de ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`ID de emergencia inválido: ${req.params.id}`);
      return res.status(400).json({ message: "ID de emergencia inválido" });
    }
    
    // Buscar emergencia
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      console.log(`Emergencia no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar que el prestador (veterinario) exista
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador || prestador.tipo !== "Veterinario") {
      return res.status(403).json({ message: "Solo los veterinarios pueden aceptar emergencias" });
    }
    
    // Verificar que el veterinario que acepta sea el asignado a la emergencia
    if (emergencia.veterinario && emergencia.veterinario.toString() !== prestador._id.toString()) {
      return res.status(403).json({ message: "No autorizado: solo el veterinario asignado puede actualizar esta emergencia" });
    }
    
    // Cambiar estado a "En camino"
    emergencia.estado = "En camino";
    emergencia.fechaEnCamino = new Date();
    
    await emergencia.save();
    
    console.log('✅ Veterinario acepta y va en camino. Preferencia MP se creará cuando el cliente confirme llegada.');
    
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen edad genero color")
      .populate("usuario", "nombre email telefono profilePicture")
      .populate("veterinario", "nombre especialidad imagen rating");
    
    // Crear notificación para el usuario de tipo "emergencia_confirmada"
    try {
      if (emergencia.usuario) {
        // 1. Obtener información relevante para la notificación
        const usuarioData = await User.findById(emergencia.usuario);
        
        // Determinar si es mascota registrada u otro animal
        let mascotaNombre = "Animal";
        let mascotaTipo = "";
        
        if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
          const mascota = await Mascota.findById(emergencia.mascota);
          if (mascota) {
            mascotaNombre = mascota.nombre;
            mascotaTipo = mascota.tipo;
          }
        } else if (emergencia.otroAnimal?.esOtroAnimal) {
          mascotaNombre = emergencia.otroAnimal.nombre || "Animal no registrado";
          mascotaTipo = emergencia.otroAnimal.tipo || "";
        }
        
        // 2. Crear notificación para el usuario
        const notificacionUsuario = new Notificacion({
          tipo: 'emergencia_confirmada',
          titulo: 'Emergencia confirmada',
          mensaje: `El veterinario ${prestador.nombre} ha confirmado tu emergencia y está en camino`,
          usuario: emergencia.usuario,
          datos: {
            emergenciaId: emergencia._id,
            mascotaNombre: mascotaNombre,
            tipoEmergencia: emergencia.tipoEmergencia,
            nivelUrgencia: emergencia.nivelUrgencia,
            veterinarioNombre: prestador.nombre || 'Veterinario',
            veterinarioRating: prestador.rating || 0,
            estado: 'En camino'
          },
          enlace: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          icono: 'checkmark-circle',
          color: '#4CAF50',
          prioridad: 'Alta',
          accion: 'ver_detalle'
        });
        
        await notificacionUsuario.save();
        console.log('Notificación de confirmación creada para el usuario:', usuarioData?.email || emergencia.usuario);
        
        // Enviar notificación push al usuario si tiene token
        if (usuarioData?.deviceToken && esTokenValido(usuarioData.deviceToken)) {
          await enviarNotificacionPush(
            usuarioData.deviceToken,
            'Emergencia confirmada',
            `El veterinario ${prestador.nombre} ha confirmado tu emergencia y está en camino`,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: 'emergencia_confirmada',
              accion: 'ver_detalle',
              datos: notificacionUsuario.datos
            }
          );
        }
        
        // 3. Actualizar la notificación original del veterinario (marcarla como atendida)
        await Notificacion.updateMany(
          { 
            prestador: prestador._id, 
            'datos.emergenciaId': emergencia._id.toString(),
            tipo: 'emergencia_asignada'
          },
          {
            $set: {
              leida: true,
              fechaLectura: new Date(),
              activa: false
            }
          }
        );
      }
    } catch (notifError) {
      console.log('Error al crear/actualizar notificaciones:', notifError);
      // No interrumpimos el flujo principal si falla la notificación
    }
    
    console.log(`Emergencia ${emergencia._id} aceptada por el veterinario ${prestador._id} y puesta en camino`);
    res.status(200).json(emergenciaActualizada);
  } catch (error) {
    console.error(`Error al aceptar emergencia: ${error.message}`, error);
    res.status(500).json({ message: "Error al aceptar la emergencia" });
  }
});

// Rechazar una emergencia (ruta para veterinarios)
router.post("/:id/rechazar", protectRoute, async (req, res) => {
  try {
    // Validación de ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`ID de emergencia inválido: ${req.params.id}`);
      return res.status(400).json({ message: "ID de emergencia inválido" });
    }
    
    // Buscar emergencia
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      console.log(`Emergencia no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar que el prestador (veterinario) exista
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador || prestador.tipo !== "Veterinario") {
      return res.status(403).json({ message: "Solo los veterinarios pueden rechazar emergencias" });
    }
    
    // Verificar que el veterinario que rechaza sea el asignado a la emergencia
    if (emergencia.veterinario && emergencia.veterinario.toString() !== prestador._id.toString()) {
      return res.status(403).json({ message: "No autorizado: solo el veterinario asignado puede actualizar esta emergencia" });
    }
    
    // Cambiar estado a "Cancelada"
    emergencia.estado = "Cancelada";
    emergencia.fechaCancelacion = new Date();
    emergencia.motivoCancelacion = "Rechazada por el veterinario";
    
    await emergencia.save();
    
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("usuario", "nombre email telefono profilePicture")
      .populate("veterinario", "nombre especialidad imagen rating");
    
    // Crear notificación para el usuario de tipo "emergencia_cancelada"
    try {
      if (emergencia.usuario) {
        // 1. Obtener información relevante para la notificación
        const usuarioData = await User.findById(emergencia.usuario);
        
        // Determinar si es mascota registrada u otro animal
        let mascotaNombre = "Animal";
        let mascotaTipo = "";
        
        if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
          const mascota = await Mascota.findById(emergencia.mascota);
          if (mascota) {
            mascotaNombre = mascota.nombre;
            mascotaTipo = mascota.tipo;
          }
        } else if (emergencia.otroAnimal?.esOtroAnimal) {
          mascotaNombre = emergencia.otroAnimal.nombre || "Animal no registrado";
          mascotaTipo = emergencia.otroAnimal.tipo || "";
        }
        
        // 2. Crear notificación para el usuario
        const notificacionUsuario = new Notificacion({
          tipo: 'emergencia_cancelada',
          titulo: 'Emergencia rechazada',
          mensaje: `El veterinario ${prestador.nombre} no ha podido atender tu emergencia`,
          usuario: emergencia.usuario,
          datos: {
            emergenciaId: emergencia._id,
            mascotaNombre: mascotaNombre,
            tipoEmergencia: emergencia.tipoEmergencia,
            nivelUrgencia: emergencia.nivelUrgencia,
            veterinarioNombre: prestador.nombre || 'Veterinario',
            motivo: 'Rechazada por el veterinario',
            estado: 'Cancelada'
          },
          enlace: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          icono: 'close-circle',
          color: '#F44336',
          prioridad: 'Alta',
          accion: 'ver_detalle'
        });
        
        await notificacionUsuario.save();
        console.log('Notificación de rechazo creada para el usuario:', usuarioData?.email || emergencia.usuario);
        
        // Enviar notificación push al usuario si tiene token
        if (usuarioData?.deviceToken && esTokenValido(usuarioData.deviceToken)) {
          await enviarNotificacionPush(
            usuarioData.deviceToken,
            'Emergencia rechazada',
            `El veterinario ${prestador.nombre} no ha podido atender tu emergencia`,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: 'emergencia_cancelada',
              accion: 'ver_detalle',
              datos: notificacionUsuario.datos
            }
          );
        }
        
        // 3. Actualizar la notificación original del veterinario (marcarla como leída e inactiva)
        await Notificacion.updateMany(
          { 
            prestador: prestador._id, 
            'datos.emergenciaId': emergencia._id.toString(),
            tipo: 'emergencia_asignada'
          },
          {
            $set: {
              leida: true,
              fechaLectura: new Date(),
              activa: false
            }
          }
        );
      }
    } catch (notifError) {
      console.log('Error al crear/actualizar notificaciones:', notifError);
      // No interrumpimos el flujo principal si falla la notificación
    }
    
    console.log(`Emergencia ${emergencia._id} rechazada por el veterinario ${prestador._id} y marcada como cancelada`);
    res.status(200).json(emergenciaActualizada);
  } catch (error) {
    console.error(`Error al rechazar emergencia: ${error.message}`, error);
    res.status(500).json({ message: "Error al rechazar la emergencia" });
  }
});

// Confirmar servicio de emergencia
// Confirmar llegada del veterinario (ruta para clientes)
router.patch("/:id/confirmar-llegada", protectRoute, async (req, res) => {
  try {
    // Validación de ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de emergencia inválido" });
    }
    
    // Buscar la emergencia
    const emergencia = await Emergencia.findById(req.params.id);
    
    // Verificar que la emergencia existe
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Verificar que el usuario es el dueño de la emergencia
    if (emergencia.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No tienes permiso para confirmar esta emergencia" });
    }
    
    // Verificar que la emergencia está en estado "En camino"
    if (emergencia.estado !== "En camino") {
      return res.status(400).json({ message: "La emergencia debe estar en estado 'En camino' para confirmar llegada" });
    }
    
    // Actualizar la emergencia para confirmar llegada y cambiar a estado "En atención"
    emergencia.llegadaConfirmada = true;
    emergencia.fechaLlegadaConfirmada = new Date();
    emergencia.estado = "En atención";
    
    // Verificar y crear el historial si no existe
    if (!emergencia.historial) {
      emergencia.historial = [];
    }
    
    // Agregar al historial
    emergencia.historial.push({
      estado: "En atención",
      fecha: new Date(),
      usuario: req.user._id,
      notas: "Llegada del veterinario confirmada por el cliente"
    });
    
    await emergencia.save();
    
    // 💰 CREAR REGISTRO DE PAGO SEGÚN MÉTODO
    let preferenciaMP = null;
    const prestador = await Prestador.findById(emergencia.veterinario);
    const monto = prestador.precioEmergencia || 5000;
    
    if (emergencia.metodoPago === 'Efectivo') {
      // 💵 CREAR PAGO EN EFECTIVO
      try {
        console.log('💵 [CONFIRMAR LLEGADA] Creando registro de pago en efectivo para emergencia:', emergencia._id);
        
        const nuevoPago = new Pago({
          usuario: emergencia.usuario,
          concepto: 'Emergencia',
          referencia: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          prestador: prestador._id,
          monto: monto,
          metodoPago: 'Efectivo',
          estado: 'Pendiente', // Se completa automáticamente cuando el veterinario marca la emergencia como Atendida
          fechaPago: null // Se actualizará cuando se complete el pago
        });
        
        await nuevoPago.save();
        
        console.log('✅ [CONFIRMAR LLEGADA] Pago en efectivo registrado:', {
          pagoId: nuevoPago._id,
          monto: monto,
          estado: 'Pendiente'
        });
        
      } catch (efectivoError) {
        console.error('❌ [CONFIRMAR LLEGADA] Error al registrar pago en efectivo:', {
          message: efectivoError.message,
          error: efectivoError
        });
        // No bloqueamos el flujo
      }
    } else if (emergencia.metodoPago === 'MercadoPago') {
      // 💳 CREAR PREFERENCIA DE MERCADO PAGO
      try {
        console.log('💳 [CONFIRMAR LLEGADA] Creando preferencia de Mercado Pago para emergencia:', emergencia._id);
        
        const usuarioData = await User.findById(emergencia.usuario);
        
        console.log('📊 Datos para preferencia MP:', {
          emergenciaId: emergencia._id,
          metodoPago: emergencia.metodoPago,
          prestadorId: prestador._id,
          monto: monto,
          usuario: usuarioData?.email
        });
        
        // Determinar descripción según tipo de mascota
        let descripcion = `Emergencia Veterinaria - ${emergencia.tipoEmergencia}`;
        if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
          const mascota = await Mascota.findById(emergencia.mascota);
          if (mascota) {
            descripcion += ` (${mascota.nombre})`;
          }
        }
        
        // URLs para Mercado Pago: usar deep links del app para volver al flujo móvil
        const backUrls = {
          success: 'vetya://pago-exitoso',
          failure: 'vetya://pago-fallido',
          pending: 'vetya://pago-pendiente'
        };

        const notificationUrl = `${process.env.BACKEND_URL || 'http://192.168.100.32:3000'}/api/pagos/mercadopago/webhook`;
        
        console.log(' URLs configuradas para MP:', { backUrls, notificationUrl });
        
        // Crear preferencia en Mercado Pago
        const preference = await preferenceClient.create({
          body: {
            items: [{
              id: emergencia._id.toString(),
              title: descripcion,
              description: emergencia.descripcion,
              quantity: 1,
              unit_price: monto,
              currency_id: 'ARS'
            }],
            payer: {
              name: usuarioData?.nombre || usuarioData?.username,
              email: usuarioData?.email
            },
            back_urls: backUrls,
            auto_return: 'approved',
            external_reference: emergencia._id.toString(),
            notification_url: notificationUrl,
            metadata: {
              tipo: 'emergencia',
              emergenciaId: emergencia._id.toString(),
              prestadorId: prestador._id.toString()
            }
          }
        });
        
        preferenciaMP = preference;
        
        // Crear registro de pago en la BD
        const nuevoPago = new Pago({
          usuario: emergencia.usuario,
          concepto: 'Emergencia',
          referencia: {
            tipo: 'Emergencia',
            id: emergencia._id
          },
          prestador: prestador._id,
          monto: monto,
          metodoPago: 'MercadoPago',
          estado: 'Pendiente',
          mercadoPago: {
            preferenceId: preference.id,
            initPoint: preference.init_point,
            metadata: {
              emergenciaId: emergencia._id.toString(),
              prestadorId: prestador._id.toString()
            }
          }
        });
        
        await nuevoPago.save();
        
        console.log('✅ [CONFIRMAR LLEGADA] Preferencia MP creada:', {
          preferenceId: preference.id,
          initPoint: preference.init_point,
          pagoId: nuevoPago._id,
          monto: monto
        });
        
      } catch (mpError) {
        console.error('❌ [CONFIRMAR LLEGADA] Error al crear preferencia MP:', {
          message: mpError.message,
          error: mpError.error,
          status: mpError.status
        });
        // No bloqueamos el flujo
      }
    }
    
    // Crear notificación para el veterinario
    try {
      if (emergencia.veterinario) {
        const veterinario = await Prestador.findById(emergencia.veterinario).populate('usuario');
        
        if (veterinario && veterinario.usuario) {
          // Determinar si es mascota registrada u otro animal
          let mascotaNombre = "Animal";
          let mascotaTipo = "";
          
          if (!emergencia.otroAnimal?.esOtroAnimal && emergencia.mascota) {
            const mascota = await Mascota.findById(emergencia.mascota);
            if (mascota) {
              mascotaNombre = mascota.nombre;
              mascotaTipo = mascota.tipo;
            }
          } else if (emergencia.otroAnimal?.esOtroAnimal) {
            mascotaNombre = emergencia.otroAnimal.nombre || "Animal no registrado";
            mascotaTipo = emergencia.otroAnimal.tipo || "";
          }
          
          // Crear notificación para el veterinario
          const notificacion = new Notificacion({
            tipo: 'llegada_confirmada',
            titulo: 'Llegada confirmada por el cliente',
            mensaje: `El cliente ha confirmado tu llegada para la emergencia de ${mascotaNombre}`,
            prestador: emergencia.veterinario,
            datos: {
              emergenciaId: emergencia._id,
              mascotaNombre: mascotaNombre,
              mascotaTipo: mascotaTipo,
              estado: 'En atención'
            },
            enlace: {
              tipo: 'Emergencia',
              id: emergencia._id
            },
            icono: 'checkmark-circle',
            color: '#2196F3',
            prioridad: 'Alta',
            accion: 'ver_emergencia'
          });
          
          await notificacion.save();
          console.log('Notificación de llegada confirmada creada para el veterinario');
          
          // Enviar notificación push si el veterinario tiene un token
          if (veterinario.usuario.deviceToken && esTokenValido(veterinario.usuario.deviceToken)) {
            await enviarNotificacionPush(
              veterinario.usuario.deviceToken,
              'Llegada confirmada',
              `El cliente ha confirmado tu llegada para la emergencia`,
              {
                emergenciaId: emergencia._id.toString(),
                tipo: 'llegada_confirmada',
                accion: 'ver_emergencia',
                datos: notificacion.datos
              }
            );
          }
        }
      }
    } catch (notifError) {
      console.error('Error al enviar notificación de confirmación de llegada:', notifError);
      // No bloqueamos el flujo por errores en notificaciones
    }
    
    // Devolver la emergencia actualizada con info de pago
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("veterinario", "nombre especialidad imagen rating");
    
    console.log(`Llegada del veterinario a emergencia ${emergencia._id} confirmada por el cliente ${req.user._id}`);
    
    // Incluir link de pago si se creó preferencia MP
    const response = {
      emergencia: emergenciaActualizada,
      preferenciaMP: preferenciaMP ? {
        id: preferenciaMP.id,
        initPoint: preferenciaMP.init_point
      } : null
    };
    
    console.log('📤 [CONFIRMAR LLEGADA] Respuesta al cliente:', {
      emergenciaId: emergenciaActualizada._id,
      estado: emergenciaActualizada.estado,
      tienePreferenciaMP: !!preferenciaMP
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error al confirmar llegada: ${error.message}`, error);
    res.status(500).json({ message: "Error al confirmar la llegada del veterinario" });
  }
});

router.patch("/:id/confirmar", protectRoute, async (req, res) => {
  try {
    const { metodoPago } = req.body;
    console.log(`Recibida solicitud para confirmar emergencia ${req.params.id} con método de pago: ${metodoPago}`);
    
    // Validación de ID
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`ID de emergencia inválido: ${req.params.id}`);
      return res.status(400).json({ message: "ID de emergencia inválido" });
    }
    
    // Buscar emergencia
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      console.log(`Emergencia no encontrada con ID: ${req.params.id}`);
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    console.log(`Emergencia encontrada: ${emergencia._id}, estado actual: ${emergencia.estado}`);
    
    // Verificar si el usuario actual es el propietario
    if (emergencia.usuario && emergencia.usuario.toString() !== req.user._id.toString()) {
      console.log(`Usuario no autorizado: ${req.user._id} vs propietario: ${emergencia.usuario}`);
      return res.status(401).json({ message: "No autorizado para confirmar esta emergencia" });
    }
    
    // Verificar que la emergencia tenga un veterinario asignado
    if (!emergencia.veterinario) {
      console.log(`Emergencia sin veterinario asignado: ${emergencia._id}`);
      return res.status(400).json({ message: "No se puede confirmar una emergencia sin veterinario asignado" });
    }
    
    // Verificar estado válido para confirmar
    const estadosValidos = ["Solicitada", "Asignada"];
    if (!estadosValidos.includes(emergencia.estado)) {
      console.log(`Estado no válido para confirmar: ${emergencia.estado}`);
      return res.status(400).json({ 
        message: `No se puede confirmar una emergencia en estado ${emergencia.estado}. Debe estar en estado Solicitada o Asignada` 
      });
    }
    
    // Actualizar método de pago
    // El estado NO se cambia aquí, se mantiene como "Solicitada"
    // El estado cambiará a "Asignada" cuando el veterinario acepte la emergencia
    // emergencia.estado = "Asignada"; // ❌ ELIMINADO
    
    if (metodoPago) {
      emergencia.metodoPago = metodoPago;
    } else {
      emergencia.metodoPago = "Efectivo"; // Valor por defecto
    }
    
    // Registrar fecha de confirmación
    emergencia.fechaConfirmacion = new Date();
    
    console.log(`Guardando emergencia con estado: ${emergencia.estado} y método de pago: ${emergencia.metodoPago}`);
    await emergencia.save();
    
    // Devolver los datos actualizados de la emergencia
    const emergenciaActualizada = await Emergencia.findById(emergencia._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("veterinario", "nombre especialidad email telefono imagen rating");
    
    console.log(`Emergencia confirmada exitosamente: ${emergencia._id}`);
    return res.status(200).json(emergenciaActualizada);
  } catch (error) {
    console.log("Error al procesar confirmación de emergencia:", error);
    return res.status(500).json({ message: "Error al procesar la confirmación de emergencia" });
  }
});

// Confirmar o rechazar una emergencia por parte del veterinario
router.patch("/:id/confirmacion-veterinario", protectRoute, async (req, res) => {
  try {
    const { confirmado } = req.body;
    
    if (confirmado === undefined) {
      return res.status(400).json({ message: "Se requiere indicar si confirma o rechaza la emergencia" });
    }
    
    const emergencia = await Emergencia.findById(req.params.id);
    
    if (!emergencia) {
      return res.status(404).json({ message: "Emergencia no encontrada" });
    }
    
    // Buscar si el usuario actual es un prestador
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador) {
      return res.status(401).json({ message: "No autorizado: solo prestadores pueden confirmar emergencias" });
    }
    
    // Verificar que este prestador sea el asignado a la emergencia
    if (emergencia.veterinario.toString() !== prestador._id.toString()) {
      return res.status(401).json({ message: "No autorizado: solo el veterinario asignado puede confirmar" });
    }
    
    // Verificar que la emergencia esté en estado solicitada
    if (emergencia.estado !== "Solicitada") {
      return res.status(400).json({ 
        message: `No se puede ${confirmado ? 'confirmar' : 'rechazar'} una emergencia que no está en estado 'Solicitada'` 
      });
    }
    
    if (confirmado) {
      // El veterinario confirma que atenderá la emergencia
      emergencia.estado = "Asignada";
      // Actualizar o establecer la fecha de asignación
      if (!emergencia.fechaAsignacion) {
        emergencia.fechaAsignacion = new Date();
      }
      
      // Guardar cambios
      await emergencia.save();
      
      // Crear notificación para el cliente
      const nuevaNotificacion = new Notificacion({
        tipo: 'emergencia_confirmada',
        titulo: 'Emergencia confirmada',
        mensaje: `El veterinario ha confirmado tu emergencia y está en camino`,
        datos: {
          emergenciaId: emergencia._id,
          veterinarioId: prestador._id
        },
        usuario: emergencia.usuario,
        leida: false,
        fechaEnvio: new Date(),
        accion: 'ver_emergencia'
      });
      
      await nuevaNotificacion.save();
      
      // Enviar notificación push al cliente
      try {
        const cliente = await Usuario.findById(emergencia.usuario);
        if (cliente && cliente.deviceToken && esTokenValido(cliente.deviceToken)) {
          // Calcular la distancia manteniendo el radio de privacidad de 1km
          const coordsPrestador = obtenerCoordenadasNormalizadas(prestador.ubicacionActual?.coordenadas);
          const distancia = Math.max(1.0, calcularDistancia(
            emergencia.ubicacion.coordenadas.lat,
            emergencia.ubicacion.coordenadas.lng,
            coordsPrestador?.lat || 0,
            coordsPrestador?.lng || 0
          ));
          
          // Calcular tiempo estimado de llegada (2 min por km a 30km/h en promedio)
          const tiempoEstimadoMin = Math.ceil(distancia * 2);
          
          await enviarNotificacionPush(
            cliente.deviceToken,
            'Emergencia confirmada',
            `El veterinario ha confirmado tu emergencia y está en camino. Tiempo estimado: ${tiempoEstimadoMin} min.`,
            {
              emergenciaId: emergencia._id.toString(),
              tipo: 'emergencia_confirmada',
              accion: 'ver_emergencia',
              distancia: distancia.toFixed(1),
              tiempoEstimado: tiempoEstimadoMin,
              veterinarioNombre: prestador.nombre
            }
          );
        }
      } catch (notifError) {
        console.log('Error al enviar notificación al cliente:', notifError);
        // No interrumpimos el flujo principal
      }
      
      // Devolver emergencia actualizada
      const emergenciaActualizada = await Emergencia.findById(emergencia._id)
        .populate("mascota", "nombre tipo raza imagen")
        .populate("veterinario", "nombre especialidad imagen rating")
        .populate("usuario", "nombre");
      
      return res.status(200).json({
        message: "Emergencia confirmada exitosamente",
        emergencia: emergenciaActualizada
      });
    } else {
      // El veterinario rechaza la emergencia
      // Liberar al veterinario
      emergencia.veterinario = null;
      emergencia.fechaAsignacion = null;
      // Se mantiene como solicitada para poder asignarla a otro veterinario
      
      // Guardar cambios
      await emergencia.save();
      
      // Devolver mensaje de éxito
      return res.status(200).json({
        message: "Emergencia rechazada exitosamente",
        emergencia
      });
    }
  } catch (error) {
    console.log("Error al procesar confirmación de veterinario:", error);
    return res.status(500).json({ message: "Error al procesar la confirmación del veterinario" });
  }
});

//cantidad de emergencias del prestador (veterinario)
router.get("/cantidad-emergencias", protectRoute, async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador || prestador.tipo !== "Veterinario") {
      return res.status(403).json({ message: "Solo los veterinarios pueden acceder a esta información" });
    }
    
    // Obtener todas las emergencias del veterinario
    const todasEmergencias = await Emergencia.find({ veterinario: prestador._id });
    
    // Filtrar las emergencias atendidas
    const emergenciasAtendidas = await Emergencia.find({ 
      veterinario: prestador._id,
      estado: "Atendida"
    });
    
    res.status(200).json({
      cantidad: todasEmergencias.length,
      cantidadAtendidas: emergenciasAtendidas.length,
      emergencias: todasEmergencias
    });
  } catch (error) {
    console.log("Error al obtener la cantidad de emergencias:", error);
    res.status(500).json({ message: "Error al obtener la cantidad de emergencias" });
  }
});

export default router;
