import mongoose from 'mongoose';
const { Schema } = mongoose;

const prestadorSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Veterinario', 'Centro Veterinario', 'Veterinaria', 'Otro'],
    default: 'Otro'
  },
  especialidades: [{
    type: String,
    trim: true
  }],
  servicios: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    precio: {
      type: Number,
      default: 0
    },
    duracion: {
      type: Number, // Duración en minutos
      default: 30
    },
    descripcion: String
  }],
  imagen: {
    type: String
  },
  direccion: {
    calle: String,
    numero: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    coordenadas: {
      lat: Number,
      lng: Number
    }
  },
  direccionGeo: {
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
  horarios: [{
    dia: {
      type: Number, // 0 = Domingo, 1 = Lunes, ... 6 = Sábado
      required: true
    },
    // Turno mañana
    manana: {
      activo: {
        type: Boolean,
        default: true
      },
      apertura: {
        type: String, // Formato: "HH:MM"
        default: "08:00"
      },
      cierre: {
        type: String, // Formato: "HH:MM"
        default: "12:00"
      }
    },
    // Turno tarde-noche
    tarde: {
      activo: {
        type: Boolean,
        default: true
      },
      apertura: {
        type: String, // Formato: "HH:MM"
        default: "16:00"
      },
      cierre: {
        type: String, // Formato: "HH:MM"
        default: "20:00"
      }
    }
  }],
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  sitioWeb: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  opiniones: [{
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    texto: String,
    calificacion: {
      type: Number,
      min: 1,
      max: 5
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  disponibleEmergencias: {
    type: Boolean,
    default: false
  },
  mercadoPago: {
    conectado: {
      type: Boolean,
      default: false
    },
    accessToken: {
      type: String,
      select: false
    },
    refreshToken: {
      type: String,
      select: false
    },
    publicKey: {
      type: String,
      select: false
    },
    userId: String,
    tokenType: String,
    scope: String,
    liveMode: Boolean,
    expiresIn: Number,
    expiresAt: Date,
    connectedAt: Date,
    lastRefreshAt: Date
  },
  wallet: {
    cashDebt: {
      type: Number,
      default: 0,
      min: 0
    },
    canAcceptCash: {
      type: Boolean,
      default: true
    },
    cashDebtUpdatedAt: Date,
    cashDebtLastPaidAt: Date,
    cashDebtPaymentAlias: {
      type: String,
      trim: true,
      default: () => process.env.CASH_DEBT_PAYMENT_ALIAS || 'davidpereyra.mercado'
    },
    cashDebtPaymentLink: {
      type: String,
      trim: true,
      default: () => process.env.CASH_DEBT_PAYMENT_LINK || ''
    }
  },
  precioEmergencia: {
    type: Number,
    default: 0
  },
  radio: {
    type: Number, // Radio de cobertura en kilómetros
    default: 1 // Cambiado a 1 km para proteger la privacidad del prestador
  },
  ubicacionActual: {
    coordenadas: {
      lat: Number,
      lng: Number
    },
    ultimaActualizacion: {
      type: Date,
      default: Date.now
    }
  },
  ubicacionActualGeo: {
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
  activo: {
    type: Boolean,
    default: true
  },
  verificado: {
    type: Boolean,
    default: false
  },
  // Estado del proceso de validación para controlar acceso
  estadoValidacion: {
    type: String,
    enum: ['pendiente_documentos', 'en_revision', 'aprobado', 'rechazado', 'requiere_correccion'],
    default: 'pendiente_documentos'
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice geoespacial para búsquedas por ubicación
prestadorSchema.index({ direccionGeo: '2dsphere' }, { sparse: true });
prestadorSchema.index({ ubicacionActualGeo: '2dsphere' }, { sparse: true });
prestadorSchema.index({ usuario: 1 }, { unique: true });
prestadorSchema.index({ tipo: 1, activo: 1, verificado: 1 });
prestadorSchema.index({ disponibleEmergencias: 1, activo: 1 });
prestadorSchema.index({ estadoValidacion: 1, activo: 1 });
prestadorSchema.index({ rating: -1 });
prestadorSchema.index({ fechaRegistro: -1 });

prestadorSchema.pre('save', function(next) {
  const dirLat = this.direccion?.coordenadas?.lat;
  const dirLng = this.direccion?.coordenadas?.lng;
  if (Number.isFinite(dirLat) && Number.isFinite(dirLng)) {
    this.direccionGeo = { type: 'Point', coordinates: [dirLng, dirLat] };
  }

  const actualLat = this.ubicacionActual?.coordenadas?.lat;
  const actualLng = this.ubicacionActual?.coordenadas?.lng;
  if (Number.isFinite(actualLat) && Number.isFinite(actualLng)) {
    this.ubicacionActualGeo = { type: 'Point', coordinates: [actualLng, actualLat] };
  }

  next();
});

/**
 * Middleware para eliminación en cascada
 * Se ejecuta antes de eliminar un prestador para eliminar todos los registros relacionados
 */
prestadorSchema.pre('deleteOne', { document: true, query: false }, async function() {
  try {
    const prestadorId = this._id;
    console.log(`Eliminando en cascada todos los registros relacionados con el prestador: ${prestadorId}`);
    
    // 1. Eliminar todos los servicios asociados al prestador
    const Servicio = mongoose.model('Servicio');
    const serviciosEliminados = await Servicio.deleteMany({ prestadorId });
    console.log(`- ${serviciosEliminados.deletedCount} servicios eliminados`);
    
    // 2. Eliminar todas las citas asociadas al prestador (si el modelo usa prestadorId en lugar de veterinario)
    const Cita = mongoose.model('Cita');
    const citasEliminadas = await Cita.deleteMany({ veterinario: prestadorId });
    console.log(`- ${citasEliminadas.deletedCount} citas eliminadas`);
    
    // 3. Actualizar emergencias (en lugar de eliminarlas, quitar la referencia al prestador)
    const Emergencia = mongoose.model('Emergencia');
    const emergenciasActualizadas = await Emergencia.updateMany(
      { veterinario: prestadorId }, 
      { $set: { veterinario: null, estado: 'Solicitada' } }
    );
    console.log(`- ${emergenciasActualizadas.modifiedCount} emergencias actualizadas`);
    
    // 4. Si hay más modelos relacionados, añadir aquí su eliminación...
    
    console.log('Eliminación en cascada completada con éxito');
  } catch (error) {
    console.error('Error durante la eliminación en cascada:', error);
    // No lanzamos el error para permitir que la operación original continúe
    // pero lo registramos para depuración
  }
});

export default mongoose.model('Prestador', prestadorSchema);
