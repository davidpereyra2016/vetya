import mongoose from "mongoose";

/**
 * Esquema para emergencias veterinarias
 * Este modelo almacena información relacionada con solicitudes de atención de emergencia
 * Incluye tipo de emergencia, estado, ubicación y referencias al usuario, mascota y veterinario
 */
const emergenciaSchema = new mongoose.Schema({
  // Campo para controlar expiración automática
  expiraEn: {
    type: Date,
    default: function() {
      // Por defecto, expira 5 minutos después de la creación
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  },
  expirada: {
    type: Boolean,
    default: false
  },
  expiraRespuestaVetEn: {
    type: Date
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mascota: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mascota',
    required: function() {
      // Solo es requerido si no hay datos de otroAnimal
      return !this.otroAnimal;
    }
  },
  otroAnimal: {
    // Datos del animal no registrado
    esOtroAnimal: {
      type: Boolean,
      default: false
    },
    tipo: {
      type: String,
      enum: ['Perro', 'Gato', 'Ave', 'Reptil', 'Roedor', 'Otro']
    },
    descripcionAnimal: {
      type: String,
      trim: true
    },
    condicion: {
      type: String,
      trim: true
    },
    ubicacionExacta: {
      type: String,
      trim: true
    },
  },
  veterinario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestador'
  },
  descripcion: {
    type: String,
    required: true
  },
  tipoEmergencia: {
    type: String,
    required: true,
    enum: ['Accidente', 'Envenenamiento', 'Dificultad respiratoria', 'Herida grave', 'Convulsiones', 'Otro']
  },
  nivelUrgencia: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media'
  },
  estado: {
    type: String,
    enum: ['Solicitada', 'Asignada', 'Confirmada', 'En camino', 'En atención', 'Atendida', 'Cancelada'],
    default: 'Solicitada'
  },
  llegadaConfirmadaPorCliente: {
    type: Boolean,
    default: false
  },
  ubicacion: {
    direccion: {
      type: String,
      required: true
    },
    ciudad: {
      type: String,
      required: true
    },
    coordenadas: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  ubicacionGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  },
  fechaAsignacion: {
    type: Date
  },
  fechaAtencion: {
    type: Date
  },
  notas: {
    type: String
  },
  imagenes: [{
    type: String
  }],
  notificacionesEnviadas: {
    solicitada: {
      type: Boolean,
      default: false
    },
    asignada: {
      type: Boolean,
      default: false
    },
    enCamino: {
      type: Boolean,
      default: false
    },
    atendida: {
      type: Boolean,
      default: false
    }
  },
  costoTotal: {
    type: Number
  },
  metodoPago: {
    type: String,
    enum: ['Efectivo', 'MercadoPago', 'Tarjeta', 'Transferencia', 'Por definir'],
    default: 'Por definir'
  },
  pagado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índice para búsqueda de emergencias por estado y fecha
emergenciaSchema.index({ estado: 1, fechaSolicitud: -1 });

// Índice para búsqueda de emergencias por usuario
emergenciaSchema.index({ usuario: 1 });

// Índice para búsqueda de emergencias por veterinario
emergenciaSchema.index({ veterinario: 1 });
emergenciaSchema.index({ usuario: 1, estado: 1, fechaSolicitud: -1 });
emergenciaSchema.index({ veterinario: 1, estado: 1, fechaSolicitud: -1 });
emergenciaSchema.index({ expirada: 1, expiraEn: 1 });
emergenciaSchema.index({ expiraRespuestaVetEn: 1, estado: 1 });
emergenciaSchema.index({ ubicacionGeo: '2dsphere' }, { sparse: true });

// Middleware pre-save para manejar estados
emergenciaSchema.pre('save', function(next) {
  const ahora = new Date();
  const lat = this.ubicacion?.coordenadas?.lat;
  const lng = this.ubicacion?.coordenadas?.lng;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    this.ubicacionGeo = { type: 'Point', coordinates: [lng, lat] };
  }

  // Manejo de fechas y expiraciones según el estado
  if (this.isNew && this.estado === 'Solicitada') {
    if (!this.fechaSolicitud) this.fechaSolicitud = ahora;
    // Establecer la hora de expiración de la solicitud inicial en 5 minutos por defecto
    if (this.expiraEn === undefined) { // Solo si no se proveyó explícitamente
        this.expiraEn = new Date(ahora.getTime() + 5 * 60 * 1000);
    }
  } else if (this.isModified('estado') || this.isModified('veterinario')) {
    if (this.estado === 'Asignada' && this.veterinario) {
      if (!this.fechaAsignacion) this.fechaAsignacion = ahora;
      // Establecer tiempo límite para respuesta del veterinario (5 minutos desde asignación)
      this.expiraRespuestaVetEn = new Date(this.fechaAsignacion.getTime() + 5 * 60 * 1000);
      this.expiraEn = undefined; // La expiración de la solicitud inicial ya no aplica
      this.expirada = false;
    } else if (['Confirmada', 'En camino', 'Atendida'].includes(this.estado)) {
      this.expiraEn = undefined;
      this.expiraRespuestaVetEn = undefined;
      this.expirada = false;
      if (this.estado === 'Atendida' && !this.fechaAtencion) {
        this.fechaAtencion = ahora;
      }
    }
  }

  // Si la emergencia se cancela, marcarla como expirada
  if (this.estado === 'Cancelada') {
    this.expirada = true;
    // Opcional: limpiar fechas de expiración si se cancela
    // this.expiraEn = undefined;
    // this.expiraRespuestaVetEn = undefined;
  }
  
  next();
});

// ❌ ÍNDICE TTL DESHABILITADO - Las emergencias deben permanecer en la BD para historial
// Este índice eliminaba automáticamente las emergencias cuando expiraban
// Causaba que el historial de emergencias se borrara de la base de datos
// emergenciaSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

const Emergencia = mongoose.model("Emergencia", emergenciaSchema);
export default Emergencia;
