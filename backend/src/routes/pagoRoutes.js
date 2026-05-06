import express from "express";
import Pago from "../models/Pago.js";
import Cita from "../models/Cita.js";
import Emergencia from "../models/Emergencia.js";
import Prestador from "../models/Prestador.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import {
  createMarketplacePreference,
  exchangeMercadoPagoCode,
  getMercadoPagoAuthorizationUrl,
  getMercadoPagoRedirectUri,
  paymentClient,
  resolveMercadoPagoOAuthState,
} from "../lib/mercadopago.js";
import {
  beginIdempotency,
  completeIdempotency,
  failIdempotency,
  replayIdempotencyResult,
  requireIdempotencyKey,
} from "../utils/idempotency.js";
import { getPagination, paginatedResponse } from "../utils/routePerformance.js";

const router = express.Router();

const ESTADOS_PAGO_POSITIVOS = new Set(["Pendiente", "Procesando", "Pagado", "Capturado", "Completado"]);
const ESTADOS_PAGO_NEGATIVOS = new Set(["Fallido", "Reembolsado", "Cancelado", "Expirado"]);

function renderMercadoPagoConnectedPage() {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mercado Pago conectado</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: #f7faf8;
        color: #1f2933;
      }
      main {
        width: min(88vw, 420px);
        text-align: center;
      }
      h1 {
        font-size: 24px;
        margin: 0 0 12px;
      }
      p {
        margin: 0;
        font-size: 16px;
        line-height: 1.45;
        color: #52606d;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Mercado Pago conectado</h1>
      <p>Ya podés volver a VetPresta. Tus clientes podrán pagarte online cuando aceptes una cita o emergencia.</p>
    </main>
  </body>
</html>`;
}
const MARKETPLACE_PERCENTAGE = 0.3;

function buildMercadoPagoBackUrls() {
  return {
    success: "vetya://pago-exitoso",
    failure: "vetya://pago-fallido",
    pending: "vetya://pago-pendiente",
  };
}

function buildMercadoPagoNotificationUrl() {
  const backendUrl = process.env.BACKEND_URL || "http://192.168.100.32:3000";
  return `${backendUrl.replace(/\/$/, "")}/api/pagos/mercadopago/webhook`;
}

function buildMercadoPagoExternalReference(referencia, usuarioId) {
  return `${referencia.tipo}_${referencia.id}_${usuarioId}`;
}

function buildCreatePreferenceResponse({ pago, preferenceId, initPoint, split, message = "Preferencia de pago creada exitosamente" }) {
  return {
    message,
    pago,
    preferenceId,
    initPoint,
    split: split ? {
      marketplaceFee: split.marketplaceFee,
      prestadorRecibe: split.netAmount,
      marketplacePercentage: split.marketplacePercentage,
    } : undefined,
  };
}

function buildEfectivoResponse({ pago, message = "Pago en efectivo registrado exitosamente" }) {
  return {
    message,
    pago,
  };
}

function parseMercadoPagoExternalReference(externalReference = "") {
  const [tipo, id, usuarioId] = externalReference.split("_");
  return { tipo, id, usuarioId };
}

function getPrestadorMercadoPagoAccessToken(prestador) {
  return prestador?.mercadoPago?.accessToken;
}

function normalizarMetodoPagoDesdeCita(metodoPago) {
  switch (metodoPago) {
    case "MercadoPago":
      return "MercadoPago";
    case "Transferencia":
      return "Transferencia";
    case "Tarjeta":
      return "Otro";
    case "Efectivo":
    case "Por definir":
    default:
      return "Efectivo";
  }
}

function obtenerMontoCita(cita) {
  return Number(cita?.costoEstimado || cita?.servicio?.precio || 0);
}

async function reconciliarPagosCitasCompletadas({ usuarioId = null, prestadorId = null } = {}) {
  const filtro = { estado: "Completada" };

  if (usuarioId) {
    filtro.usuario = usuarioId;
  }

  if (prestadorId) {
    filtro.prestador = prestadorId;
  }

  const citas = await Cita.find(filtro)
    .populate("servicio", "nombre precio")
    .select("usuario prestador servicio costoEstimado metodoPago fecha createdAt updatedAt");

  if (!citas.length) {
    return { creados: 0, actualizados: 0 };
  }

  const citasIds = citas.map((cita) => cita._id);
  const pagosExistentes = await Pago.find({
    "referencia.tipo": "Cita",
    "referencia.id": { $in: citasIds },
  }).sort({ createdAt: -1 });

  const pagosPorCita = new Map();
  for (const pago of pagosExistentes) {
    const citaId = pago.referencia?.id?.toString();
    if (!citaId) continue;

    const pagosCita = pagosPorCita.get(citaId) || [];
    pagosCita.push(pago);
    pagosPorCita.set(citaId, pagosCita);
  }

  let creados = 0;
  let actualizados = 0;

  for (const cita of citas) {
    const monto = obtenerMontoCita(cita);
    if (monto <= 0) {
      continue;
    }

    const pagosCita = pagosPorCita.get(cita._id.toString()) || [];
    let pago = pagosCita.find((item) => ESTADOS_PAGO_POSITIVOS.has(item.estado));

    if (!pago) {
      pago = new Pago({
        usuario: cita.usuario,
        concepto: "Cita",
        referencia: {
          tipo: "Cita",
          id: cita._id,
        },
        prestador: cita.prestador,
        monto,
        metodoPago: normalizarMetodoPagoDesdeCita(cita.metodoPago),
        estado: "Completado",
        fechaPago: cita.updatedAt || cita.createdAt || new Date(),
        idTransaccion: `SYNC-CITA-${cita._id.toString()}`,
        notasAdicionales: "Pago reconciliado automáticamente desde una cita completada",
      });

      await pago.save();
      creados += 1;
      continue;
    }

    if (ESTADOS_PAGO_NEGATIVOS.has(pago.estado)) {
      continue;
    }

    let huboCambios = false;

    if (pago.estado !== "Completado") {
      pago.estado = "Completado";
      huboCambios = true;
    }

    if ((!pago.monto || pago.monto <= 0) && monto > 0) {
      pago.monto = monto;
      huboCambios = true;
    }

    if (!pago.fechaPago) {
      pago.fechaPago = cita.updatedAt || cita.createdAt || new Date();
      huboCambios = true;
    }

    if (!pago.idTransaccion) {
      pago.idTransaccion = `SYNC-CITA-${cita._id.toString()}`;
      huboCambios = true;
    }

    if (huboCambios) {
      await pago.save();
      actualizados += 1;
    }
  }

  return { creados, actualizados };
}

// Obtener todos los pagos del usuario autenticado (CLIENTE)
router.get("/", protectRoute, async (req, res) => {
  try {
    const reconciliacion = await reconciliarPagosCitasCompletadas({ usuarioId: req.user._id });
    if (reconciliacion.creados || reconciliacion.actualizados) {
      console.log("🔄 Pagos de citas reconciliados para cliente:", reconciliacion);
    }

    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const pagos = await Pago.find({ usuario: req.user._id })
      .populate("prestador", "nombre especialidades imagen tipo direccion telefono email")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
    const total = await Pago.countDocuments({ usuario: req.user._id });
    
    // Popular referencias manualmente porque son polimórficas
    for (let pago of pagos) {
      if (pago.referencia && pago.referencia.id) {
        if (pago.referencia.tipo === 'Cita') {
          const cita = await Cita.findById(pago.referencia.id)
            .populate('mascota', 'nombre tipo raza imagen')
            .select('mascota tipoServicio motivo fecha horaInicio')
            .lean();
          pago.referencia.id = cita;
        } else if (pago.referencia.tipo === 'Emergencia') {
          const emergencia = await Emergencia.findById(pago.referencia.id)
            .populate('mascota', 'nombre tipo raza imagen')
            .select('mascota tipoEmergencia descripcion fechaSolicitud nivelUrgencia')
            .lean();
          pago.referencia.id = emergencia;
        }
      }
    }

    console.log('✅ Pagos del cliente obtenidos:', pagos.length);
    
    res.status(200).json(paginatedResponse(pagos, total, pagination));
  } catch (error) {
    console.log('❌ Error al obtener pagos del cliente:', error);
    res.status(500).json({ message: "Error al obtener los pagos" });
  }
});

// Obtener todos los pagos del prestador autenticado (PRESTADOR)
router.get("/prestador/mis-pagos", protectRoute, async (req, res) => {
  try {
    // Obtener el prestador asociado al usuario autenticado
    const prestador = await Prestador.findOne({ usuario: req.user._id }).select("_id").lean();
    
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    console.log('🔍 Buscando pagos para prestador:', prestador._id);

    const reconciliacion = await reconciliarPagosCitasCompletadas({ prestadorId: prestador._id });
    if (reconciliacion.creados || reconciliacion.actualizados) {
      console.log("🔄 Pagos de citas reconciliados para prestador:", reconciliacion);
    }

    // Buscar todos los pagos donde el prestador es el destinatario
    const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const pagos = await Pago.find({ prestador: prestador._id })
      .populate("usuario", "nombre email")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
    const total = await Pago.countDocuments({ prestador: prestador._id });

    // Popular referencias manualmente porque son polimórficas
    for (let pago of pagos) {
      if (pago.referencia && pago.referencia.id) {
        if (pago.referencia.tipo === 'Cita') {
          const cita = await Cita.findById(pago.referencia.id)
            .populate('mascota', 'nombre tipo raza')
            .select('mascota tipoServicio motivo')
            .lean();
          pago.referencia.id = cita;
        } else if (pago.referencia.tipo === 'Emergencia') {
          const emergencia = await Emergencia.findById(pago.referencia.id)
            .populate('mascota', 'nombre tipo raza')
            .select('mascota tipoEmergencia descripcion')
            .lean();
          pago.referencia.id = emergencia;
        }
      }
    }

    console.log('✅ Pagos encontrados:', pagos.length);

    // Calcular estadísticas
    const estadisticas = {
      total: 0,
      pendiente: 0,
      completado: 0,
      capturado: 0,
      pagado: 0
    };

    pagos.forEach(pago => {
      estadisticas.total += pago.monto;
      
      if (pago.estado === 'Pendiente' || pago.estado === 'Procesando') {
        estadisticas.pendiente += pago.monto;
      } else if (pago.estado === 'Completado' || pago.estado === 'Capturado' || pago.estado === 'Pagado') {
        estadisticas.completado += pago.monto;
      }

      if (pago.estado === 'Capturado') {
        estadisticas.capturado += pago.monto;
      } else if (pago.estado === 'Pagado') {
        estadisticas.pagado += pago.monto;
      }
    });

    res.status(200).json({
      pagos,
      estadisticas,
      pagination: paginatedResponse([], total, pagination).pagination
    });
  } catch (error) {
    console.error('❌ Error al obtener pagos del prestador:', error);
    res.status(500).json({ message: "Error al obtener los pagos del prestador" });
  }
});

// Obtener un pago por ID
router.get("/:id", protectRoute, async (req, res, next) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return next();
    }

    const pago = await Pago.findById(req.params.id)
      .populate("veterinario", "nombre especialidad imagen ubicacion email telefono")
      .lean();
    
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para ver este pago" });
    }
    
    res.status(200).json(pago);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener el pago" });
  }
});

// Crear un nuevo pago
router.post("/", protectRoute, async (req, res) => {
  try {
    const { concepto, referencia, veterinario, monto, metodoPago, idTransaccion, detallesPago, facturaDatos, notasAdicionales } = req.body;
    
    // Validar campos obligatorios
    if (!concepto || !referencia || !veterinario || !monto || !metodoPago) {
      return res.status(400).json({ message: "Concepto, referencia, veterinario, monto y método de pago son obligatorios" });
    }
    
    // Verificar que la referencia exista
    let referenciaExiste = false;
    
    if (referencia.tipo === "Cita") {
      const cita = await Cita.findById(referencia.id);
      if (cita && cita.usuario.toString() === req.user._id.toString()) {
        referenciaExiste = true;
      }
    } else if (referencia.tipo === "Emergencia") {
      const emergencia = await Emergencia.findById(referencia.id);
      if (emergencia && emergencia.usuario.toString() === req.user._id.toString()) {
        referenciaExiste = true;
      }
    }
    
    if (!referenciaExiste) {
      return res.status(404).json({ message: "La referencia no existe o no pertenece al usuario" });
    }
    
    // Procesar comprobante si se proporciona
    let comprobanteUrl = "";
    if (req.body.comprobante) {
      const uploadResponse = await cloudinary.uploader.upload(req.body.comprobante, {
        folder: "comprobantes_pago"
      });
      comprobanteUrl = uploadResponse.secure_url;
    }
    
    // Crear nuevo pago
    const nuevoPago = new Pago({
      usuario: req.user._id,
      concepto,
      referencia,
      veterinario,
      monto,
      metodoPago,
      estado: "Pendiente",
      idTransaccion: idTransaccion || "",
      comprobante: comprobanteUrl,
      detallesPago: detallesPago || {},
      facturaDatos: facturaDatos || {},
      notasAdicionales: notasAdicionales || ""
    });
    
    await nuevoPago.save();
    
    // Populate para devolver la información completa
    const pagoCompletado = await Pago.findById(nuevoPago._id)
      .populate("veterinario", "nombre especialidad imagen");
    
    res.status(201).json(pagoCompletado);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear el pago" });
  }
});

// Actualizar estado de un pago (ruta protegida para admin o sistema)
router.patch("/:id/estado", protectRoute, async (req, res) => {
  try {
    const { estado } = req.body;
    const estados = ["Pendiente", "Procesando", "Completado", "Fallido", "Reembolsado"];
    
    if (!estado || !estados.includes(estado)) {
      return res.status(400).json({ message: "Estado de pago inválido" });
    }
    
    const pago = await Pago.findById(req.params.id);
    
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }
    
    // Solo actualizar si es un nuevo estado
    if (pago.estado !== estado) {
      pago.estado = estado;
      
      // Si se completa el pago, actualizar la fecha
      if (estado === "Completado") {
        pago.fechaPago = new Date();
      }
      
      await pago.save();
    }
    
    res.status(200).json(pago);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar el estado del pago" });
  }
});

// Subir comprobante de pago
router.post("/:id/comprobante", protectRoute, async (req, res) => {
  try {
    const { comprobante } = req.body;
    
    if (!comprobante) {
      return res.status(400).json({ message: "El comprobante es requerido" });
    }
    
    const pago = await Pago.findById(req.params.id);
    
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para modificar este pago" });
    }
    
    // Eliminar comprobante anterior si existe
    if (pago.comprobante && pago.comprobante.includes('cloudinary')) {
      const publicId = pago.comprobante.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`comprobantes_pago/${publicId}`);
    }
    
    // Subir nuevo comprobante
    const uploadResponse = await cloudinary.uploader.upload(comprobante, {
      folder: "comprobantes_pago"
    });
    
    pago.comprobante = uploadResponse.secure_url;
    
    // Si el pago estaba pendiente, cambiarlo a procesando
    if (pago.estado === "Pendiente") {
      pago.estado = "Procesando";
    }
    
    await pago.save();
    
    res.status(200).json(pago);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al subir el comprobante" });
  }
});

// Solicitar factura
router.patch("/:id/solicitar-factura", protectRoute, async (req, res) => {
  try {
    const { facturaDatos } = req.body;
    
    if (!facturaDatos || !facturaDatos.nombre || !facturaDatos.direccion || !facturaDatos.correo) {
      return res.status(400).json({ message: "Los datos de facturación son incompletos" });
    }
    
    const pago = await Pago.findById(req.params.id);
    
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para modificar este pago" });
    }
    
    // Actualizar datos de facturación
    pago.facturaDatos = facturaDatos;
    await pago.save();
    
    res.status(200).json(pago);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al solicitar la factura" });
  }
});

// Obtener pagos por referencia
router.get("/referencia/:tipo/:id", protectRoute, async (req, res) => {
  try {
    const { tipo, id } = req.params;

    if (tipo === "Cita") {
      const prestadorActual = await Prestador.findOne({ usuario: req.user._id }).select("_id");
      await reconciliarPagosCitasCompletadas({
        usuarioId: prestadorActual ? null : req.user._id,
        prestadorId: prestadorActual?._id || null,
      });
    }

    const prestador = await Prestador.findOne({ usuario: req.user._id }).select('_id');
    const filtro = {
      "referencia.tipo": tipo,
      "referencia.id": id
    };

    if (prestador) {
      filtro.$or = [
        { usuario: req.user._id },
        { prestador: prestador._id }
      ];
    } else {
      filtro.usuario = req.user._id;
    }

    const pagos = await Pago.find(filtro)
      .populate("prestador", "nombre especialidades imagen");
    
    res.status(200).json(pagos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener los pagos" });
  }
});

// ============================================
// 🔷 RUTAS DE MERCADO PAGO
// ============================================

/**
 * Crear preferencia de pago en Mercado Pago
 * Se ejecuta cuando el PRESTADOR ACEPTA una emergencia/cita
 */
router.get("/mercadopago/connect-status", protectRoute, async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ usuario: req.user._id })
      .select("_id nombre mercadoPago.conectado mercadoPago.userId mercadoPago.connectedAt mercadoPago.expiresAt")
      .lean();

    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    res.status(200).json({
      prestadorId: prestador._id,
      conectado: Boolean(prestador.mercadoPago?.conectado),
      mercadoPago: {
        userId: prestador.mercadoPago?.userId,
        connectedAt: prestador.mercadoPago?.connectedAt,
        expiresAt: prestador.mercadoPago?.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error al consultar conexion de Mercado Pago:", error);
    res.status(500).json({
      message: "Error al consultar la conexion de Mercado Pago",
      error: error.message,
    });
  }
});

router.get("/mercadopago/connect-url", protectRoute, async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ usuario: req.user._id }).select("_id nombre");

    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    const redirectUri = getMercadoPagoRedirectUri();
    const authorizationUrl = getMercadoPagoAuthorizationUrl({ prestadorId: prestador._id });

    res.status(200).json({
      authorizationUrl,
      redirectUri,
      prestadorId: prestador._id,
    });
  } catch (error) {
    console.error("Error al crear URL de conexion de Mercado Pago:", error);
    res.status(500).json({
      message: "Error al crear la URL de conexion de Mercado Pago",
      error: error.message,
    });
  }
});

router.get("/mercadopago/success", (_req, res) => {
  res.status(200).send(renderMercadoPagoConnectedPage());
});

router.get("/mercadopago/connect", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({ message: "Falta el codigo de autorizacion de Mercado Pago" });
    }

    if (!state) {
      return res.status(400).json({ message: "Falta el prestador asociado a la conexion" });
    }

    const { prestadorId, codeVerifier } = resolveMercadoPagoOAuthState(state);
    const credentials = await exchangeMercadoPagoCode(code, codeVerifier);
    const expiresAt = credentials.expires_in
      ? new Date(Date.now() + Number(credentials.expires_in) * 1000)
      : undefined;

    const prestador = await Prestador.findByIdAndUpdate(
      prestadorId,
      {
        $set: {
          "mercadoPago.conectado": true,
          "mercadoPago.accessToken": credentials.access_token,
          "mercadoPago.refreshToken": credentials.refresh_token,
          "mercadoPago.publicKey": credentials.public_key,
          "mercadoPago.userId": credentials.user_id?.toString(),
          "mercadoPago.tokenType": credentials.token_type,
          "mercadoPago.scope": credentials.scope,
          "mercadoPago.liveMode": credentials.live_mode,
          "mercadoPago.expiresIn": credentials.expires_in,
          "mercadoPago.expiresAt": expiresAt,
          "mercadoPago.connectedAt": new Date(),
        },
      },
      { new: true }
    ).select("_id nombre mercadoPago.conectado");

    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado para guardar Mercado Pago" });
    }

    if (process.env.MP_SUCCESS_REDIRECT_URI && /^https?:\/\//i.test(process.env.MP_SUCCESS_REDIRECT_URI)) {
      return res.redirect(process.env.MP_SUCCESS_REDIRECT_URI);
    }

    if (process.env.FRONTEND_URL && /^https?:\/\//i.test(process.env.FRONTEND_URL)) {
      return res.redirect(`${process.env.FRONTEND_URL.replace(/\/$/, "")}/mercadopago/conectado`);
    }

    res.status(200).send(renderMercadoPagoConnectedPage());
  } catch (error) {
    console.error("Error al conectar Mercado Pago:", error);
    res.status(500).json({
      message: "Error al conectar Mercado Pago",
      error: error.message,
    });
  }
});

router.post("/mercadopago/create-preference", protectRoute, async (req, res) => {
  let idempotencyRecord = null;

  try {
    requireIdempotencyKey(req);
    const { emergenciaId, citaId, monto, descripcion } = req.body;

    // Validar que se proporcione una referencia
    if (!emergenciaId && !citaId) {
      return res.status(400).json({ 
        message: "Debe proporcionar emergenciaId o citaId" 
      });
    }

    if (!monto || monto <= 0) {
      return res.status(400).json({ 
        message: "El monto debe ser mayor a 0" 
      });
    }

    // Determinar el tipo de servicio y obtener los datos
    let referencia, referenciaObj, prestadorId, titulo, descripcionCompleta;

    if (emergenciaId) {
      const emergencia = await Emergencia.findById(emergenciaId)
        .populate('usuario', 'nombre email')
        .populate('veterinario', 'nombre');
      
      if (!emergencia) {
        return res.status(404).json({ message: "Emergencia no encontrada" });
      }

      // Verificar que el usuario sea el dueño de la emergencia
      if (emergencia.usuario._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: "No autorizado para crear pago de esta emergencia" 
        });
      }

      referencia = {
        tipo: 'Emergencia',
        id: emergenciaId
      };
      referenciaObj = emergencia;
      prestadorId = emergencia.veterinario._id;
      titulo = `Emergencia Veterinaria - ${emergencia.tipoEmergencia}`;
      descripcionCompleta = descripcion || emergencia.descripcion;

    } else if (citaId) {
      const cita = await Cita.findById(citaId)
        .populate('usuario', 'nombre email')
        .populate('prestador', 'nombre');
      
      if (!cita) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verificar que el usuario sea el dueño de la cita
      if (cita.usuario._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: "No autorizado para crear pago de esta cita" 
        });
      }

      referencia = {
        tipo: 'Cita',
        id: citaId
      };
      referenciaObj = cita;
      prestadorId = cita.prestador._id;
      titulo = `Cita Veterinaria - ${cita.tipoServicio || 'Consulta'}`;
      descripcionCompleta = descripcion || cita.motivo || 'Servicio veterinario';
    }

    const idempotency = await beginIdempotency(req, "pagos:mercadopago:create-preference");
    idempotencyRecord = idempotency.record;

    if (!idempotency.isNew) {
      return replayIdempotencyResult(res, idempotency.record);
    }

    // Verificar si ya existe un pago para esta referencia
    const pagoExistente = await Pago.findOne({
      'referencia.tipo': referencia.tipo,
      'referencia.id': referencia.id,
      estado: { $in: ['Pendiente', 'Procesando', 'Pagado', 'Capturado'] }
    });

    if (pagoExistente) {
      const responseBody = buildCreatePreferenceResponse({
        pago: pagoExistente,
        preferenceId: pagoExistente.mercadoPago?.preferenceId,
        initPoint: pagoExistente.mercadoPago?.initPoint,
        message: "Ya existe un pago activo para este servicio",
      });

      await completeIdempotency(idempotencyRecord, {
        statusCode: 200,
        body: responseBody,
        pago: pagoExistente._id,
      });

      return res.status(200).json(responseBody);
    }

    // Obtener información del prestador
    const prestador = await Prestador.findById(prestadorId).select("+mercadoPago.accessToken +mercadoPago.refreshToken");
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    if (!prestador.mercadoPago?.conectado || !getPrestadorMercadoPagoAccessToken(prestador)) {
      return res.status(409).json({
        message: "El prestador debe conectar su cuenta de Mercado Pago antes de recibir pagos con Mercado Pago",
        code: "MERCADOPAGO_SELLER_NOT_CONNECTED",
      });
    }

    console.log('=== CREAR PREFERENCIA MERCADO PAGO ===');
    console.log('Usuario:', req.user._id, req.user.email);
    console.log('Prestador:', prestadorId, prestador.nombre);
    console.log('Monto:', monto);
    console.log('Referencia:', referencia);

    // URLs para Mercado Pago: usar deep links del app para volver al flujo móvil
    const backUrls = buildMercadoPagoBackUrls();
    const notificationUrl = buildMercadoPagoNotificationUrl();
    
    console.log('🔗 URLs configuradas para MP:', { backUrls, notificationUrl });

    // Crear preferencia en Mercado Pago (estructura idéntica a emergencias)
    const preferenceData = {
      items: [
        {
          id: `${referencia.tipo.toLowerCase()}_${referencia.id}`,
          title: titulo,
          description: descripcionCompleta,
          quantity: 1,
          unit_price: Number(monto),
          currency_id: 'ARS' // Cambiar según el país
        }
      ],
      payer: {
        name: req.user.nombre || '',
        email: req.user.email || '',
        phone: {
          number: req.user.telefono || ''
        }
      },
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: buildMercadoPagoExternalReference(referencia, req.user._id),
      notification_url: notificationUrl,
      statement_descriptor: 'Vetya',
      metadata: {
        usuario_id: req.user._id.toString(),
        prestador_id: prestadorId.toString(),
        referencia_tipo: referencia.tipo,
        referencia_id: referencia.id.toString(),
        marketplace_role: "vetya",
        seller_role: "vetpresta",
        buyer_role: "vetya_cliente"
      }
    };

    console.log('📦 Datos de preferencia a enviar a MP:', JSON.stringify(preferenceData, null, 2));

    // Crear preferencia en nombre del prestador conectado.
    // Mercado Pago envia el 70% al vetpresta y retiene el 30% como marketplace_fee para Vetya.
    const { preference, split } = await createMarketplacePreference({
      sellerAccessToken: getPrestadorMercadoPagoAccessToken(prestador),
      preferenceData,
      marketplacePercentage: MARKETPLACE_PERCENTAGE,
    });

    console.log('✅ Preferencia creada:', preference.id);
    console.log('Init Point:', preference.init_point);

    // Crear registro de pago en la base de datos
    const nuevoPago = new Pago({
      usuario: req.user._id,
      concepto: referencia.tipo,
      referencia: referencia,
      prestador: prestadorId,
      monto: monto,
      metodoPago: 'MercadoPago',
      estado: 'Pendiente',
      idempotencyKey: idempotency.key,
      mercadoPago: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        status: 'pending',
        captured: false,
        metadata: {
          ...preferenceData.metadata,
          marketplace_fee: split.marketplaceFee,
          seller_net_amount: split.netAmount,
          marketplace_percentage: split.marketplacePercentage,
        },
        marketplaceFee: split.marketplaceFee,
        sellerNetAmount: split.netAmount,
        marketplacePercentage: split.marketplacePercentage,
      }
    });

    await nuevoPago.save();

    console.log('💾 Pago registrado en BD:', nuevoPago._id);

    const responseBody = buildCreatePreferenceResponse({
      message: 'Preferencia de pago creada exitosamente',
      pago: nuevoPago,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      split,
    });

    await completeIdempotency(idempotencyRecord, {
      statusCode: 201,
      body: responseBody,
      pago: nuevoPago._id,
    });

    res.status(201).json(responseBody);

  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    if (idempotencyRecord) {
      const { statusCode, body } = await failIdempotency(idempotencyRecord, error, "Error al crear la preferencia de pago");
      return res.status(statusCode).json(body);
    }

    res.status(error.status || 500).json({ 
      message: "Error al crear la preferencia de pago",
      error: error.message 
    });
  }
});

/**
 * Webhook para recibir notificaciones de Mercado Pago
 * MP enviará notificaciones sobre cambios en el estado del pago
 */
router.post("/mercadopago/webhook", async (req, res) => {
  try {
    console.log('=== WEBHOOK MERCADO PAGO ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', req.query);

    const { type, data } = req.body;

    // Responder rápidamente a MP
    res.sendStatus(200);

    // Procesar según el tipo de notificación
    if (type === 'payment') {
      const paymentId = data.id;
      
      console.log('💳 Notificación de pago:', paymentId);

      // Obtener información del pago desde MP
      const payment = await paymentClient.get({ id: paymentId });

      console.log('Estado del pago:', payment.status);
      console.log('External reference:', payment.external_reference);

      const parsedReference = parseMercadoPagoExternalReference(payment.external_reference);

      // Buscar el pago en nuestra BD por external_reference o preferenceId
      const pago = await Pago.findOne({
        $or: [
          { 'mercadoPago.preferenceId': payment.preference_id },
          { 'referencia.id': parsedReference.id }
        ]
      });

      if (!pago) {
        console.log('⚠️ Pago no encontrado en BD');
        return;
      }

      console.log('📝 Actualizando pago:', pago._id);

      // Actualizar información del pago
      pago.mercadoPago.paymentId = paymentId.toString();
      pago.mercadoPago.status = payment.status;
      pago.mercadoPago.statusDetail = payment.status_detail;
      pago.mercadoPago.marketplaceFee = payment.marketplace_fee ?? pago.mercadoPago.marketplaceFee;

      // Actualizar estado según el status de MP
      if (payment.status === 'approved') {
        pago.estado = 'Pagado';
        pago.fechaPago = new Date();
        pago.idTransaccion = paymentId.toString();

        // Guardar información de la tarjeta si está disponible
        if (payment.payment_method_id) {
          pago.detallesPago = {
            ultimos4Digitos: payment.card?.last_four_digits || '',
            tipoTarjeta: payment.payment_type_id || '',
            bancoEmisor: payment.issuer_id || '',
            titular: payment.payer?.first_name + ' ' + payment.payer?.last_name || ''
          };
        }

        console.log('✅ Pago aprobado - Estado: Pagado (pendiente de captura)');
      } else if (payment.status === 'rejected') {
        pago.estado = 'Fallido';
        console.log('❌ Pago rechazado');
      } else if (payment.status === 'cancelled') {
        pago.estado = 'Cancelado';
        console.log('⚠️ Pago cancelado');
      } else if (payment.status === 'in_process') {
        pago.estado = 'Procesando';
        console.log('⏳ Pago en proceso');
      }

      await pago.save();

      // Actualizar estado de la emergencia/cita si el pago fue aprobado
      if (payment.status === 'approved') {
        if (pago.referencia.tipo === 'Emergencia') {
          await Emergencia.findByIdAndUpdate(pago.referencia.id, {
            metodoPago: 'MercadoPago',
            costoTotal: pago.monto
          });
          console.log('✅ Emergencia actualizada con método de pago');
        } else if (pago.referencia.tipo === 'Cita') {
          // Registrar el pago, pero la cita debe seguir pendiente hasta que el prestador la acepte
          await Cita.findByIdAndUpdate(pago.referencia.id, {
            metodoPago: 'MercadoPago'
          });
          console.log('✅ Pago de cita registrado. La aprobación sigue pendiente del prestador');
        }
      }

      console.log('💾 Pago actualizado exitosamente');
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    // No enviar error al webhook para evitar reintentos innecesarios
  }
});

/**
 * Capturar pago cuando el servicio se completa
 * Se ejecuta cuando el CLIENTE CONFIRMA que el servicio fue completado
 */
router.post("/mercadopago/capture-payment", protectRoute, async (req, res) => {
  try {
    const { pagoId } = req.body;

    if (!pagoId) {
      return res.status(400).json({ message: "pagoId es requerido" });
    }

    // Buscar el pago
    const pago = await Pago.findById(pagoId)
      .populate('referencia.id');

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Verificar que el usuario sea el propietario
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "No autorizado para capturar este pago" 
      });
    }

    // Verificar que el pago esté en estado Pagado
    if (pago.estado !== 'Pagado') {
      return res.status(400).json({ 
        message: `No se puede capturar. Estado actual: ${pago.estado}` 
      });
    }

    // Verificar que no haya sido capturado ya
    if (pago.mercadoPago.captured) {
      return res.status(400).json({ 
        message: "Este pago ya fue capturado" 
      });
    }

    console.log('=== CAPTURAR PAGO ===');
    console.log('Pago ID:', pagoId);
    console.log('Payment ID MP:', pago.mercadoPago.paymentId);

    // En Mercado Pago, los pagos se capturan automáticamente al ser aprobados
    // Este endpoint sirve para marcar el servicio como completado
    // Si necesitas captura manual, debes crear el pago con capture=false

    // Actualizar estado del pago
    pago.estado = 'Capturado';
    pago.mercadoPago.captured = true;
    pago.mercadoPago.captureDate = new Date();

    await pago.save();

    // Actualizar estado de la referencia
    if (pago.referencia.tipo === 'Emergencia') {
      await Emergencia.findByIdAndUpdate(pago.referencia.id, {
        estado: 'Atendida',
        pagado: true,
        fechaAtencion: new Date()
      });
    } else if (pago.referencia.tipo === 'Cita') {
      await Cita.findByIdAndUpdate(pago.referencia.id, {
        estado: 'Completada',
        pagado: true
      });
    }

    console.log('✅ Pago capturado exitosamente');

    res.status(200).json({
      message: 'Pago capturado exitosamente',
      pago
    });

  } catch (error) {
    console.error('❌ Error al capturar pago:', error);
    res.status(500).json({ 
      message: "Error al capturar el pago",
      error: error.message 
    });
  }
});

/**
 * Consultar estado de un pago en Mercado Pago
 */
router.get("/mercadopago/payment-status/:paymentId", protectRoute, async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Buscar el pago en nuestra BD
    const pago = await Pago.findOne({
      'mercadoPago.paymentId': paymentId
    });

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Verificar autorización
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "No autorizado para ver este pago" 
      });
    }

    // Consultar estado en Mercado Pago
    const payment = await paymentClient.get({ id: paymentId });

    res.status(200).json({
      pago,
      mercadoPagoStatus: {
        status: payment.status,
        statusDetail: payment.status_detail,
        transactionAmount: payment.transaction_amount,
        dateApproved: payment.date_approved,
        dateCreated: payment.date_created
      }
    });

  } catch (error) {
    console.error('Error al consultar estado:', error);
    res.status(500).json({ 
      message: "Error al consultar el estado del pago",
      error: error.message 
    });
  }
});

/**
 * Cancelar un pago pendiente
 */
router.post("/mercadopago/cancel-payment", protectRoute, async (req, res) => {
  try {
    const { pagoId } = req.body;

    const pago = await Pago.findById(pagoId);

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    // Verificar autorización
    if (pago.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: "No autorizado para cancelar este pago" 
      });
    }

    // Solo se puede cancelar si está pendiente
    if (pago.estado !== 'Pendiente') {
      return res.status(400).json({ 
        message: `No se puede cancelar. Estado actual: ${pago.estado}` 
      });
    }

    pago.estado = 'Cancelado';
    await pago.save();

    res.status(200).json({
      message: 'Pago cancelado exitosamente',
      pago
    });

  } catch (error) {
    console.error('Error al cancelar pago:', error);
    res.status(500).json({ 
      message: "Error al cancelar el pago",
      error: error.message 
    });
  }
});

// ============================================
// 🔷 PAGOS EN EFECTIVO
// ============================================

/**
 * Registrar un pago en efectivo para una cita o emergencia.
 * Se ejecuta cuando el CLIENTE elige "Efectivo" como método de pago.
 * El pago queda en estado "Pendiente" hasta que se completa el servicio.
 */
router.post("/efectivo", protectRoute, async (req, res) => {
  let idempotencyRecord = null;

  try {
    requireIdempotencyKey(req);
    const { emergenciaId, citaId, monto, descripcion } = req.body;

    if (!emergenciaId && !citaId) {
      return res.status(400).json({
        message: "Debe proporcionar emergenciaId o citaId",
      });
    }

    if (!monto || monto <= 0) {
      return res.status(400).json({
        message: "El monto debe ser mayor a 0",
      });
    }

    // Resolver referencia, prestador y dueño
    let referencia, prestadorId;

    if (emergenciaId) {
      const emergencia = await Emergencia.findById(emergenciaId).populate(
        "veterinario",
        "_id"
      );
      if (!emergencia) {
        return res.status(404).json({ message: "Emergencia no encontrada" });
      }
      if (emergencia.usuario.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "No autorizado para crear pago de esta emergencia",
        });
      }
      referencia = { tipo: "Emergencia", id: emergenciaId };
      prestadorId = emergencia.veterinario?._id;
    } else {
      const cita = await Cita.findById(citaId).populate("prestador", "_id");
      if (!cita) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      if (cita.usuario.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "No autorizado para crear pago de esta cita",
        });
      }
      referencia = { tipo: "Cita", id: citaId };
      prestadorId = cita.prestador?._id;
    }

    if (!prestadorId) {
      return res
        .status(400)
        .json({ message: "No se pudo determinar el prestador asociado" });
    }

    const idempotency = await beginIdempotency(req, "pagos:efectivo");
    idempotencyRecord = idempotency.record;

    if (!idempotency.isNew) {
      return replayIdempotencyResult(res, idempotency.record);
    }

    // Evitar duplicados: si ya hay un pago activo para esta referencia, lo devolvemos
    const pagoExistente = await Pago.findOne({
      "referencia.tipo": referencia.tipo,
      "referencia.id": referencia.id,
      estado: { $in: ["Pendiente", "Procesando", "Pagado", "Capturado"] },
    });

    if (pagoExistente) {
      const responseBody = buildEfectivoResponse({
        message: "Ya existe un pago activo para este servicio",
        pago: pagoExistente,
      });

      await completeIdempotency(idempotencyRecord, {
        statusCode: 200,
        body: responseBody,
        pago: pagoExistente._id,
      });

      return res.status(200).json(responseBody);
    }

    const nuevoPago = new Pago({
      usuario: req.user._id,
      concepto: referencia.tipo,
      referencia,
      prestador: prestadorId,
      monto,
      metodoPago: "Efectivo",
      estado: "Pendiente",
      idempotencyKey: idempotency.key,
      notasAdicionales: descripcion || undefined,
    });

    await nuevoPago.save();

    console.log("💵 Pago en efectivo registrado:", nuevoPago._id);

    const responseBody = buildEfectivoResponse({
      message: "Pago en efectivo registrado exitosamente",
      pago: nuevoPago,
    });

    await completeIdempotency(idempotencyRecord, {
      statusCode: 201,
      body: responseBody,
      pago: nuevoPago._id,
    });

    res.status(201).json(responseBody);
  } catch (error) {
    console.error("❌ Error al registrar pago en efectivo:", error);
    if (idempotencyRecord) {
      const { statusCode, body } = await failIdempotency(idempotencyRecord, error, "Error al registrar el pago en efectivo");
      return res.status(statusCode).json(body);
    }

    res.status(error.status || 500).json({
      message: "Error al registrar el pago en efectivo",
      error: error.message,
    });
  }
});

export default router;
