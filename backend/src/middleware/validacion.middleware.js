import Prestador from '../models/Prestador.js';

/**
 * Middleware para verificar que el prestador esté aprobado antes de acceder a ciertas funcionalidades
 * Solo permite acceso a prestadores con estado 'aprobado'
 */
export const requireApprovedProvider = async (req, res, next) => {
  try {
    // Buscar el prestador asociado al usuario actual
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador) {
      return res.status(404).json({ 
        message: 'Prestador no encontrado',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    // Verificar el estado de validación
    if (prestador.estadoValidacion !== 'aprobado') {
      return res.status(403).json({
        message: 'Acceso denegado. Su cuenta de prestador debe ser aprobada antes de acceder a esta funcionalidad.',
        code: 'PROVIDER_NOT_APPROVED',
        estadoValidacion: prestador.estadoValidacion,
        detalles: getEstadoMessage(prestador.estadoValidacion)
      });
    }

    // Si está aprobado, agregar el prestador al request para uso posterior
    req.prestador = prestador;
    next();
  } catch (error) {
    console.error('Error en middleware de validación:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware más permisivo que permite acceso a prestadores en proceso de validación
 * pero proporciona información sobre su estado
 */
export const checkProviderStatus = async (req, res, next) => {
  try {
    const prestador = await Prestador.findOne({ usuario: req.user._id });
    
    if (!prestador) {
      return res.status(404).json({ 
        message: 'Prestador no encontrado',
        code: 'PROVIDER_NOT_FOUND'
      });
    }

    // Agregar información del estado al request
    req.prestador = prestador;
    req.providerStatus = {
      estadoValidacion: prestador.estadoValidacion,
      isApproved: prestador.estadoValidacion === 'aprobado',
      message: getEstadoMessage(prestador.estadoValidacion)
    };

    next();
  } catch (error) {
    console.error('Error en middleware de estado de prestador:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Función auxiliar para obtener mensajes descriptivos según el estado
 */
function getEstadoMessage(estado) {
  const messages = {
    'pendiente_documentos': 'Debe completar la carga de documentos requeridos para la validación.',
    'en_revision': 'Sus documentos están siendo revisados por nuestro equipo. Recibirá una notificación cuando el proceso esté completo.',
    'aprobado': 'Su cuenta ha sido aprobada. Puede acceder a todas las funcionalidades.',
    'rechazado': 'Su solicitud ha sido rechazada. Contacte con soporte para más información.',
    'requiere_correccion': 'Algunos documentos requieren corrección. Revise las observaciones y vuelva a subirlos.'
  };
  
  return messages[estado] || 'Estado de validación desconocido.';
}

/**
 * Middleware para rutas que requieren prestador aprobado o en ciertos estados específicos
 */
export const requireProviderInStates = (allowedStates) => {
  return async (req, res, next) => {
    try {
      const prestador = await Prestador.findOne({ usuario: req.user._id });
      
      if (!prestador) {
        return res.status(404).json({ 
          message: 'Prestador no encontrado',
          code: 'PROVIDER_NOT_FOUND'
        });
      }

      if (!allowedStates.includes(prestador.estadoValidacion)) {
        return res.status(403).json({
          message: 'Acceso denegado para su estado actual de validación.',
          code: 'INVALID_PROVIDER_STATE',
          estadoValidacion: prestador.estadoValidacion,
          estadosPermitidos: allowedStates,
          detalles: getEstadoMessage(prestador.estadoValidacion)
        });
      }

      req.prestador = prestador;
      next();
    } catch (error) {
      console.error('Error en middleware de estados de prestador:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};
