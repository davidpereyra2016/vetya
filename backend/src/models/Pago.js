import mongoose from "mongoose";

/**
 * Esquema para los pagos de servicios veterinarios
 * Este modelo almacena la información relacionada con los pagos realizados por servicios
 * Permite referenciar pagos a citas, emergencias o servicios específicos
 */
const pagoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  concepto: {
    type: String,
    required: true,
    enum: ['Cita', 'Emergencia', 'Servicio', 'Otro']
  },
  referencia: {
    // Referencia polimórfica - puede ser una cita, emergencia o servicio
    tipo: {
      type: String,
      required: true,
      enum: ['Cita', 'Emergencia', 'Servicio', 'Otro']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'referencia.tipo'
    }
  },
  prestador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prestador',
    required: true
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  metodoPago: {
    type: String,
    required: true,
    enum: ['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'MercadoPago', 'Otro']
  },
  estado: {
    type: String,
    required: true,
    enum: [
      'Pendiente',           // Preferencia creada, esperando pago
      'Procesando',          // Pago en proceso
      'Pagado',              // Pago aprobado pero no capturado
      'Capturado',           // Pago capturado (dinero liberado al prestador)
      'Completado',          // Servicio completado y pago finalizado
      'Fallido',             // Pago rechazado
      'Reembolsado',         // Pago devuelto
      'Cancelado',           // Pago cancelado antes de completarse
      'Expirado'             // Preferencia o pago expirado
    ],
    default: 'Pendiente'
  },
  fechaPago: {
    type: Date
  },
  idTransaccion: {
    type: String
    // ID de transacción generado por la pasarela de pago
  },
  // Campos específicos de Mercado Pago
  mercadoPago: {
    preferenceId: {
      type: String
      // ID de la preferencia de pago creada en MP
    },
    paymentId: {
      type: String
      // ID del pago una vez procesado en MP
    },
    initPoint: {
      type: String
      // URL del checkout de Mercado Pago
    },
    status: {
      type: String
      // Estado del pago en Mercado Pago
    },
    statusDetail: {
      type: String
      // Detalle del estado del pago en MP
    },
    captured: {
      type: Boolean,
      default: false
      // Indica si el pago ya fue capturado
    },
    captureDate: {
      type: Date
      // Fecha en que se capturó el pago
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
      // Metadata adicional del pago de MP
    }
  },
  comprobante: {
    type: String
    // URL a la imagen del comprobante (si aplica)
  },
  detallesPago: {
    // Campos adicionales específicos de cada método de pago
    ultimos4Digitos: String,
    tipoTarjeta: String,
    bancoEmisor: String,
    titular: String
  },
  notasAdicionales: {
    type: String
  },
  facturaDatos: {
    nombre: String,
    direccion: String,
    rfc: String,
    correo: String
  },
  facturaGenerada: {
    type: Boolean,
    default: false
  },
  facturaURL: {
    type: String
  }
}, {
  timestamps: true
});

// Actualizar el estado de la referencia cuando se completa un pago
pagoSchema.post('save', async function() {
  // Solo proceder si el pago está completado y antes no lo estaba
  if (this.estado === 'Completado' && this.isModified('estado')) {
    // Determinar qué modelo actualizar basado en el tipo de referencia
    let ModeloReferencia;
    switch (this.referencia.tipo) {
      case 'Cita':
        ModeloReferencia = mongoose.model('Cita');
        await ModeloReferencia.findByIdAndUpdate(this.referencia.id, { pagado: true });
        break;
      case 'Emergencia':
        ModeloReferencia = mongoose.model('Emergencia');
        await ModeloReferencia.findByIdAndUpdate(this.referencia.id, { pagado: true });
        break;
      // Otros casos según sea necesario
    }
  }
});

// Índices para búsquedas comunes
pagoSchema.index({ usuario: 1 });
pagoSchema.index({ 'referencia.tipo': 1, 'referencia.id': 1 });
pagoSchema.index({ estado: 1 });
pagoSchema.index({ fechaPago: -1 });

const Pago = mongoose.model("Pago", pagoSchema);
export default Pago;
