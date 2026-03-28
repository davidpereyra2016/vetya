import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import PrestadorValidacion from '../models/PrestadorValidacion.js';
import Prestador from '../models/Prestador.js';
import User from '../models/User.js';
import { protectRoute, checkRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes y PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG) y PDFs.'), false);
    }
  }
});

// =====================================================================
// RUTAS PARA PRESTADORES (Subir documentos y consultar estado)
// =====================================================================

/**
 * Obtener el estado de validación del prestador actual
 * GET /api/validacion/mi-estado
 */
router.get('/mi-estado', protectRoute, async (req, res) => {
  try {
    // Buscar el prestador asociado al usuario actual
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }

    // Buscar o crear el registro de validación
    let validacion = await PrestadorValidacion.findOne({ prestador: prestador._id });
    if (!validacion) {
      validacion = new PrestadorValidacion({ prestador: prestador._id });
      await validacion.save();
    }

    // Obtener progreso según el tipo de prestador
    const progreso = validacion.getProgreso(prestador.tipo);
    const documentosRequeridos = validacion.getDocumentosRequeridos(prestador.tipo);

    res.status(200).json({
      estadoValidacion: validacion.estadoValidacion,
      prestadorTipo: prestador.tipo,
      progreso,
      documentosRequeridos,
      datosAdicionales: validacion.datosAdicionales,
      documentos: validacion.documentos,
      observacionesAdmin: validacion.observacionesAdmin,
      fechaEnvioDocumentos: validacion.fechaEnvioDocumentos,
      fechaAprobacion: validacion.fechaAprobacion,
      fechaRechazo: validacion.fechaRechazo
    });
  } catch (error) {
    console.error('Error al obtener estado de validación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Actualizar datos adicionales del prestador
 * PUT /api/validacion/datos-adicionales
 */
router.put('/datos-adicionales', protectRoute, async (req, res) => {
  try {
    console.log('=== ACTUALIZAR DATOS ADICIONALES ===');
    console.log('Usuario ID:', req.user._id);
    console.log('Datos recibidos:', req.body);
    
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador) {
      console.log('❌ Prestador no encontrado para usuario:', req.user._id);
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    
    console.log('✅ Prestador encontrado:', prestador._id, prestador.nombre);
    console.log('📝 Dirección actual del prestador:', JSON.stringify(prestador.direccion, null, 2));

    let validacion = await PrestadorValidacion.findOne({ prestador: prestador._id });
    if (!validacion) {
      // Crear nueva validación si no existe
      validacion = new PrestadorValidacion({
        prestador: prestador._id,
        estado: 'pendiente_documentos',
        datosAdicionales: {}
      });
      await validacion.save();
      console.log('✅ Nueva validación creada:', validacion._id);
    } else {
      console.log('✅ Validación existente encontrada:', validacion._id);
      
      // Limpieza única: eliminar campo responsableTecnico problemático si existe
      if (validacion.datosAdicionales && validacion.datosAdicionales.responsableTecnico !== undefined) {
        console.log('🧽 Limpieza única: eliminando campo responsableTecnico problemático');
        await PrestadorValidacion.updateOne(
          { _id: validacion._id },
          { $unset: { 'datosAdicionales.responsableTecnico': 1 } }
        );
        // Recargar el documento después de la limpieza
        validacion = await PrestadorValidacion.findById(validacion._id);
        console.log('🔄 Documento limpio recargado');
      }
    } 
    console.log('Datos adicionales actuales:', validacion.datosAdicionales);

    // Separar datos entre Prestador y PrestadorValidacion
    const {
      // Datos que van al modelo Prestador
      telefono,
      direccion,
      ciudad,
      provincia,
      codigoPostal,
      // Datos que van al modelo PrestadorValidacion (datos profesionales)
      ...datosProfesionales
    } = req.body;
    
    // Actualizar datos del prestador (información de contacto y ubicación)
    const datosActualizacionPrestador = {};
    
    if (telefono) datosActualizacionPrestador.telefono = telefono;
    
    // Actualizar dirección si se proporcionan datos
    if (direccion || ciudad || provincia || codigoPostal) {
      // Preservar coordenadas existentes o usar valores por defecto
      const coordenadasActuales = prestador.direccion?.coordenadas;
      let coordenadasValidas;
      
      // Verificar si las coordenadas existentes son válidas
      if (coordenadasActuales && 
          typeof coordenadasActuales.lat === 'number' && 
          typeof coordenadasActuales.lng === 'number') {
        coordenadasValidas = coordenadasActuales;
      } else {
        // Usar coordenadas por defecto si no existen o son inválidas
        coordenadasValidas = { lat: 0, lng: 0 };
      }
      
      datosActualizacionPrestador.direccion = {
        ...prestador.direccion,
        ...(direccion && { calle: direccion }),
        ...(ciudad && { ciudad }),
        ...(provincia && { estado: provincia }), // 'estado' es 'provincia' en el modelo
        ...(codigoPostal && { codigoPostal }),
        coordenadas: coordenadasValidas
      };
      
      console.log('🗺️ Dirección a actualizar:', datosActualizacionPrestador.direccion);
      console.log('🗺️ Coordenadas válidas:', coordenadasValidas);
    }
    
    // Guardar cambios en el prestador si hay datos para actualizar
    if (Object.keys(datosActualizacionPrestador).length > 0) {
      // Actualizar campos individualmente para evitar problemas con Object.assign
      if (datosActualizacionPrestador.telefono) {
        prestador.telefono = datosActualizacionPrestador.telefono;
      }
      
      if (datosActualizacionPrestador.direccion) {
        // Actualizar dirección campo por campo
        if (!prestador.direccion) prestador.direccion = {};
        
        if (datosActualizacionPrestador.direccion.calle) {
          prestador.direccion.calle = datosActualizacionPrestador.direccion.calle;
        }
        if (datosActualizacionPrestador.direccion.ciudad) {
          prestador.direccion.ciudad = datosActualizacionPrestador.direccion.ciudad;
        }
        if (datosActualizacionPrestador.direccion.estado) {
          prestador.direccion.estado = datosActualizacionPrestador.direccion.estado;
        }
        if (datosActualizacionPrestador.direccion.codigoPostal) {
          prestador.direccion.codigoPostal = datosActualizacionPrestador.direccion.codigoPostal;
        }
        
        // Asegurar que las coordenadas sean válidas
        if (!prestador.direccion.coordenadas || 
            typeof prestador.direccion.coordenadas.lat !== 'number' ||
            typeof prestador.direccion.coordenadas.lng !== 'number') {
          prestador.direccion.coordenadas = { lat: 0, lng: 0 };
        }
        
        prestador.markModified('direccion');
      }
      
      await prestador.save();
      console.log('🏠 Datos del prestador actualizados exitosamente');
    }
    
    // Actualizar datos adicionales en PrestadorValidacion (datos profesionales)
    const datosAnteriores = { ...validacion.datosAdicionales };
    
    // Actualizar datos adicionales directamente
    validacion.datosAdicionales = { ...validacion.datosAdicionales, ...datosProfesionales };
    
    console.log('📝 Datos anteriores (validación):', datosAnteriores);
    console.log('📝 Datos nuevos (validación):', validacion.datosAdicionales);
    
    const validacionGuardada = await validacion.save();
    console.log('💾 Validación guardada exitosamente:', validacionGuardada._id);
    console.log('💾 Datos adicionales guardados:', validacionGuardada.datosAdicionales);

    // Recargar el prestador para obtener los datos actualizados
    const prestadorActualizado = await Prestador.findById(prestador._id);
    
    res.status(200).json({
      message: 'Datos adicionales actualizados correctamente',
      datosAdicionales: validacionGuardada.datosAdicionales,
      prestador: {
        telefono: prestadorActualizado.telefono,
        direccion: prestadorActualizado.direccion
      }
    });
  } catch (error) {
    console.error('Error al actualizar datos adicionales:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Subir documento de validación
 * POST /api/validacion/subir-documento
 */
router.post('/subir-documento', protectRoute, upload.single('documento'), async (req, res) => {
  try {
    const { tipoDocumento, descripcion } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha enviado ningún archivo' });
    }

    if (!tipoDocumento) {
      return res.status(400).json({ message: 'Tipo de documento es requerido' });
    }

    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }

    let validacion = await PrestadorValidacion.findOne({ prestador: prestador._id });
    if (!validacion) {
      validacion = new PrestadorValidacion({ prestador: prestador._id });
    }

    // Verificar que el tipo de documento sea válido para este tipo de prestador
    const documentosRequeridos = validacion.getDocumentosRequeridos(prestador.tipo);
    const documentosPermitidos = [...documentosRequeridos, 'documentosAdicionales'];
    
    if (!documentosPermitidos.includes(tipoDocumento)) {
      return res.status(400).json({ 
        message: `Tipo de documento no válido para prestador tipo ${prestador.tipo}` 
      });
    }

    // Subir archivo a Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `vetya/validacion/${prestador._id}`,
          resource_type: 'auto',
          public_id: `${tipoDocumento}_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Actualizar el documento en la validación
    if (tipoDocumento === 'documentosAdicionales') {
      if (!validacion.documentos.documentosAdicionales) {
        validacion.documentos.documentosAdicionales = [];
      }
      validacion.documentos.documentosAdicionales.push({
        nombre: tipoDocumento,
        descripcion: descripcion || '',
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fechaSubida: new Date(),
        estado: 'pendiente'
      });
    } else {
      // Si ya existe un documento del mismo tipo, eliminar el anterior de Cloudinary
      if (validacion.documentos[tipoDocumento] && validacion.documentos[tipoDocumento].publicId) {
        try {
          await cloudinary.uploader.destroy(validacion.documentos[tipoDocumento].publicId);
        } catch (error) {
          console.warn('Error al eliminar archivo anterior de Cloudinary:', error);
        }
      }

      validacion.documentos[tipoDocumento] = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fechaSubida: new Date(),
        estado: 'pendiente'
      };
    }

    // Actualizar fecha de envío de documentos si es la primera vez
    if (!validacion.fechaEnvioDocumentos) {
      validacion.fechaEnvioDocumentos = new Date();
    }

    // Verificar si todos los documentos requeridos están subidos
    const progreso = validacion.getProgreso(prestador.tipo);
    if (progreso.porcentajeSubida === 100 && validacion.estadoValidacion === 'pendiente_documentos') {
      validacion.estadoValidacion = 'en_revision';
      
      // Actualizar también el estado en el prestador
      prestador.estadoValidacion = 'en_revision';
      await prestador.save();
    }

    await validacion.save();

    res.status(200).json({
      message: 'Documento subido correctamente',
      documento: {
        tipo: tipoDocumento,
        url: uploadResult.secure_url,
        fechaSubida: new Date(),
        estado: 'pendiente'
      },
      progreso: validacion.getProgreso(prestador.tipo),
      estadoValidacion: validacion.estadoValidacion
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Eliminar documento subido
 * DELETE /api/validacion/documento/:tipoDocumento
 */
router.delete('/documento/:tipoDocumento', protectRoute, async (req, res) => {
  try {
    const { tipoDocumento } = req.params;
    const { indice } = req.query; // Para documentos adicionales

    const prestador = await Prestador.findOne({ usuario: req.user._id });
    if (!prestador) {
      return res.status(404).json({ message: 'Prestador no encontrado' });
    }

    const validacion = await PrestadorValidacion.findOne({ prestador: prestador._id });
    if (!validacion) {
      return res.status(404).json({ message: 'Registro de validación no encontrado' });
    }

    let documentoEliminado = null;

    if (tipoDocumento === 'documentosAdicionales' && indice !== undefined) {
      // Eliminar documento adicional específico
      const idx = parseInt(indice);
      if (validacion.documentos.documentosAdicionales && validacion.documentos.documentosAdicionales[idx]) {
        documentoEliminado = validacion.documentos.documentosAdicionales[idx];
        validacion.documentos.documentosAdicionales.splice(idx, 1);
      }
    } else {
      // Eliminar documento específico
      if (validacion.documentos[tipoDocumento]) {
        documentoEliminado = validacion.documentos[tipoDocumento];
        validacion.documentos[tipoDocumento] = undefined;
      }
    }

    if (!documentoEliminado) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    // Eliminar de Cloudinary
    if (documentoEliminado.publicId) {
      try {
        await cloudinary.uploader.destroy(documentoEliminado.publicId);
      } catch (error) {
        console.warn('Error al eliminar archivo de Cloudinary:', error);
      }
    }

    await validacion.save();

    res.status(200).json({
      message: 'Documento eliminado correctamente',
      progreso: validacion.getProgreso(prestador.tipo)
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =====================================================================
// RUTAS PARA ADMINISTRADORES (Revisar y aprobar prestadores)
// =====================================================================

/**
 * Obtener todas las validaciones para el panel admin (incluyendo estadísticas)
 * GET /api/validacion/admin/todas
 */
router.get('/admin/todas', protectRoute, checkRole(['admin']), async (req, res) => {
  try {
    const { estado, page = 1, limit = 100 } = req.query;
    
    const filtro = {};
    if (estado && estado !== 'todos') {
      filtro.estadoValidacion = estado;
    }

    const validaciones = await PrestadorValidacion.find(filtro)
      .populate({
        path: 'prestador',
        populate: {
          path: 'usuario',
          select: 'username email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PrestadorValidacion.countDocuments(filtro);

    const prestadoresConProgreso = validaciones.map(validacion => {
      const progreso = validacion.getProgreso(validacion.prestador.tipo);
      return {
        _id: validacion._id,
        prestador: validacion.prestador,
        estadoValidacion: validacion.estadoValidacion,
        progreso,
        fechaEnvioDocumentos: validacion.fechaEnvioDocumentos,
        fechaInicioRevision: validacion.fechaInicioRevision,
        fechaAprobacion: validacion.fechaAprobacion,
        fechaRechazo: validacion.fechaRechazo,
        createdAt: validacion.createdAt,
        updatedAt: validacion.updatedAt
      };
    });

    res.status(200).json({
      prestadores: prestadoresConProgreso,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener todas las validaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Obtener lista de prestadores pendientes de validación
 * GET /api/validacion/admin/pendientes
 */
router.get('/admin/pendientes', protectRoute, checkRole(['admin']), async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    
    const filtro = {};
    if (estado && estado !== 'todos') {
      filtro.estadoValidacion = estado;
    }

    const validaciones = await PrestadorValidacion.find(filtro)
      .populate({
        path: 'prestador',
        populate: {
          path: 'usuario',
          select: 'username email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PrestadorValidacion.countDocuments(filtro);

    const prestadoresConProgreso = validaciones.map(validacion => {
      const progreso = validacion.getProgreso(validacion.prestador.tipo);
      return {
        _id: validacion._id,
        prestador: validacion.prestador,
        estadoValidacion: validacion.estadoValidacion,
        progreso,
        fechaEnvioDocumentos: validacion.fechaEnvioDocumentos,
        fechaInicioRevision: validacion.fechaInicioRevision,
        createdAt: validacion.createdAt
      };
    });

    res.status(200).json({
      prestadores: prestadoresConProgreso,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener prestadores pendientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Obtener detalles completos de validación de un prestador
 * GET /api/validacion/admin/detalle/:prestadorId
 */
router.get('/admin/detalle/:prestadorId', protectRoute, checkRole(['admin']), async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const validacion = await PrestadorValidacion.findOne({ prestador: prestadorId })
      .populate({
        path: 'prestador',
        populate: {
          path: 'usuario',
          select: 'username email createdAt'
        }
      })
      .populate('historialRevisiones.revisor', 'username email');

    if (!validacion) {
      return res.status(404).json({ message: 'Registro de validación no encontrado' });
    }

    const progreso = validacion.getProgreso(validacion.prestador.tipo);
    const documentosRequeridos = validacion.getDocumentosRequeridos(validacion.prestador.tipo);

    res.status(200).json({
      validacion,
      progreso,
      documentosRequeridos
    });
  } catch (error) {
    console.error('Error al obtener detalles de validación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Revisar documento específico
 * PUT /api/validacion/admin/revisar-documento/:validacionId
 */
router.put('/admin/revisar-documento/:validacionId', protectRoute, checkRole(['admin']), async (req, res) => {
  try {
    const { validacionId } = req.params;
    const { tipoDocumento, estado, observaciones, indice } = req.body;

    if (!['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    const validacion = await PrestadorValidacion.findById(validacionId)
      .populate('prestador');

    if (!validacion) {
      return res.status(404).json({ message: 'Registro de validación no encontrado' });
    }

    // Actualizar estado del documento
    if (tipoDocumento === 'documentosAdicionales' && indice !== undefined) {
      const idx = parseInt(indice);
      if (validacion.documentos.documentosAdicionales && validacion.documentos.documentosAdicionales[idx]) {
        validacion.documentos.documentosAdicionales[idx].estado = estado;
        validacion.documentos.documentosAdicionales[idx].observaciones = observaciones;
      }
    } else {
      if (validacion.documentos[tipoDocumento]) {
        validacion.documentos[tipoDocumento].estado = estado;
        validacion.documentos[tipoDocumento].observaciones = observaciones;
      }
    }

    // Agregar al historial
    let accion;
    switch(estado) {
      case 'aprobado':
        accion = 'documento_aprobado';
        break;
      case 'rechazado':
        accion = 'documento_rechazado';
        break;
      case 'pendiente':
        accion = 'documento_pendiente';
        break;
      default:
        accion = 'documento_revisado';
    }
    
    validacion.historialRevisiones.push({
      revisor: req.user._id,
      accion: accion,
      observaciones,
      documentosRevisados: [tipoDocumento]
    });

    // Verificar si todos los documentos están aprobados
    const todosAprobados = validacion.todosDocumentosAprobados(validacion.prestador.tipo);
    
    if (todosAprobados && validacion.estadoValidacion === 'en_revision') {
      validacion.estadoValidacion = 'aprobado';
      validacion.fechaAprobacion = new Date();
      
      // Actualizar prestador
      validacion.prestador.estadoValidacion = 'aprobado';
      validacion.prestador.verificado = true;
      validacion.prestador.activo = true;
      await validacion.prestador.save();
      
      // Agregar al historial
      validacion.historialRevisiones.push({
        revisor: req.user._id,
        accion: 'aprobacion_final',
        observaciones: 'Todos los documentos han sido aprobados'
      });
    }

    await validacion.save();

    res.status(200).json({
      message: 'Documento revisado correctamente',
      estadoValidacion: validacion.estadoValidacion,
      documento: {
        tipo: tipoDocumento,
        estado,
        observaciones
      }
    });
  } catch (error) {
    console.error('Error al revisar documento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * Aprobar o rechazar prestador completamente
 * PUT /api/validacion/admin/decision-final/:validacionId
 */
router.put('/admin/decision-final/:validacionId', protectRoute, checkRole(['admin']), async (req, res) => {
  try {
    const { validacionId } = req.params;
    const { decision, observaciones } = req.body; // decision: 'aprobado' | 'rechazado'

    if (!['aprobado', 'rechazado'].includes(decision)) {
      return res.status(400).json({ message: 'Decisión no válida' });
    }

    const validacion = await PrestadorValidacion.findById(validacionId)
      .populate('prestador');

    if (!validacion) {
      return res.status(404).json({ message: 'Registro de validación no encontrado' });
    }

    // Actualizar estado
    validacion.estadoValidacion = decision;
    validacion.observacionesAdmin = observaciones;

    if (decision === 'aprobado') {
      validacion.fechaAprobacion = new Date();
      validacion.prestador.estadoValidacion = 'aprobado';
      validacion.prestador.verificado = true;
      validacion.prestador.activo = true;
    } else {
      validacion.fechaRechazo = new Date();
      validacion.prestador.estadoValidacion = 'rechazado';
      validacion.prestador.verificado = false;
      validacion.prestador.activo = false;
    }

    await validacion.prestador.save();

    // Agregar al historial
    validacion.historialRevisiones.push({
      revisor: req.user._id,
      accion: decision === 'aprobado' ? 'aprobacion_final' : 'rechazo_final',
      observaciones
    });

    await validacion.save();

    res.status(200).json({
      message: `Prestador ${decision} correctamente`,
      estadoValidacion: validacion.estadoValidacion,
      prestador: {
        _id: validacion.prestador._id,
        nombre: validacion.prestador.nombre,
        verificado: validacion.prestador.verificado,
        activo: validacion.prestador.activo
      }
    });
  } catch (error) {
    console.error('Error al tomar decisión final:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;
