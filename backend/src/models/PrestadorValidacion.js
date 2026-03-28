import mongoose from 'mongoose';
const { Schema } = mongoose;

const prestadorValidacionSchema = new Schema({
  prestador: {
    type: Schema.Types.ObjectId,
    ref: 'Prestador',
    required: true,
    unique: true
  },
  
  // Estado del proceso de validación
  estadoValidacion: {
    type: String,
    enum: ['pendiente_documentos', 'en_revision', 'aprobado', 'rechazado', 'requiere_correccion'],
    default: 'pendiente_documentos'
  },
  
  // Datos adicionales del prestador
  datosAdicionales: {
    // Para todos los tipos
    cuit_cuil: {
      type: String,
      trim: true
    },
    razonSocial: {
      type: String,
      trim: true
    },
    
    // Para veterinarios individuales
    numeroMatricula: {
      type: String,
      trim: true
    },
    fechaGraduacion: {
      type: Date
    },
    universidad: {
      type: String,
      trim: true
    },
    
    // Para centros veterinarios
    numeroHabilitacion: {
      type: String,
      trim: true
    },
    fechaHabilitacion: {
      type: Date
    },
    
    // Campos planos para responsable técnico
    responsableTecnicoNombre: {
      type: String,
      trim: true
    },
    responsableTecnicoMatricula: {
      type: String,
      trim: true
    },
    responsableTecnicoDocumento: {
      type: String,
      trim: true
    },
    
    // Información de contacto adicional
    telefonoAlternativo: {
      type: String,
      trim: true
    },
    horarioAtencion: {
      type: String,
      trim: true
    }
  },
  
  // Documentos requeridos (URLs de Cloudinary)
  documentos: {
    // Para veterinarios individuales
    diploma: {
      url: String,
      publicId: String, // Para poder eliminar de Cloudinary si es necesario
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    constanciaConsejo: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    cedulaIdentidad: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    // Para centros veterinarios
    habilitacionMunicipal: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    constanciaAfip: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    contratoAlquiler: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    seguroResponsabilidadCivil: {
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    },
    
    // Documentos adicionales (flexibilidad para otros tipos)
    documentosAdicionales: [{
      nombre: String,
      descripcion: String,
      url: String,
      publicId: String,
      fechaSubida: Date,
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      observaciones: String
    }]
  },
  
  // Historial de revisiones
  historialRevisiones: [{
    revisor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    accion: {
      type: String,
      enum: ['revision_iniciada', 'documento_aprobado', 'documento_rechazado', 'documento_pendiente', 'documento_revisado', 'solicitud_correccion', 'aprobacion_final', 'rechazo_final']
    },
    observaciones: String,
    documentosRevisados: [String] // Array de nombres de documentos revisados
  }],
  
  // Observaciones generales del administrador
  observacionesAdmin: {
    type: String,
    trim: true
  },
  
  // Fechas importantes
  fechaEnvioDocumentos: {
    type: Date
  },
  fechaInicioRevision: {
    type: Date
  },
  fechaAprobacion: {
    type: Date
  },
  fechaRechazo: {
    type: Date
  },
  
  // Configuración de notificaciones
  notificacionesEnviadas: [{
    tipo: {
      type: String,
      enum: ['documentos_recibidos', 'revision_iniciada', 'solicitud_correccion', 'aprobado', 'rechazado']
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    mensaje: String
  }]
  
}, {
  timestamps: true
});

// Índices para optimizar consultas
// Nota: El índice de 'prestador' se crea automáticamente por unique: true
prestadorValidacionSchema.index({ estadoValidacion: 1 });
prestadorValidacionSchema.index({ 'datosAdicionales.numeroMatricula': 1 });
prestadorValidacionSchema.index({ 'datosAdicionales.cuit_cuil': 1 });

// Middleware para actualizar el estado del prestador cuando se aprueba
prestadorValidacionSchema.post('save', async function(doc) {
  if (doc.estadoValidacion === 'aprobado') {
    const Prestador = mongoose.model('Prestador');
    await Prestador.findByIdAndUpdate(doc.prestador, {
      verificado: true,
      activo: true
    });
  } else if (doc.estadoValidacion === 'rechazado') {
    const Prestador = mongoose.model('Prestador');
    await Prestador.findByIdAndUpdate(doc.prestador, {
      verificado: false,
      activo: false
    });
  }
});

// Método para obtener documentos requeridos según el tipo de prestador
prestadorValidacionSchema.methods.getDocumentosRequeridos = function(tipoPrestador) {
  const documentosBase = ['cedulaIdentidad'];
  
  switch (tipoPrestador) {
    case 'Veterinario':
      return [...documentosBase, 'diploma', 'constanciaConsejo'];
    
    case 'Centro Veterinario':
    case 'Veterinaria':
      return [...documentosBase, 'habilitacionMunicipal', 'constanciaAfip', 'contratoAlquiler', 'seguroResponsabilidadCivil'];
    
    default:
      return documentosBase;
  }
};

// Método para verificar si todos los documentos requeridos están aprobados
prestadorValidacionSchema.methods.todosDocumentosAprobados = function(tipoPrestador) {
  const requeridos = this.getDocumentosRequeridos(tipoPrestador);
  
  return requeridos.every(docName => {
    const documento = this.documentos[docName];
    return documento && documento.estado === 'aprobado';
  });
};

// Método para obtener el progreso de validación
prestadorValidacionSchema.methods.getProgreso = function(tipoPrestador) {
  const requeridos = this.getDocumentosRequeridos(tipoPrestador);
  const subidos = requeridos.filter(docName => {
    const documento = this.documentos[docName];
    return documento && documento.url;
  }).length;
  
  const aprobados = requeridos.filter(docName => {
    const documento = this.documentos[docName];
    return documento && documento.estado === 'aprobado';
  }).length;
  
  return {
    total: requeridos.length,
    subidos,
    aprobados,
    porcentajeSubida: Math.round((subidos / requeridos.length) * 100),
    porcentajeAprobacion: Math.round((aprobados / requeridos.length) * 100)
  };
};

export default mongoose.model('PrestadorValidacion', prestadorValidacionSchema);
