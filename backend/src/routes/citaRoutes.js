import express from "express";
import Cita from "../models/Cita.js";
import Mascota from "../models/Mascota.js";
import Prestador from "../models/Prestador.js";
import Servicio from "../models/Servicio.js";
import Disponibilidad from "../models/Disponibilidad.js";
import Pago from "../models/Pago.js";
import Notificacion from "../models/Notificacion.js";
import protectRoute from "../middleware/auth.middleware.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { enviarNotificacionPush, esTokenValido } from "../utils/notificacionesUtils.js";
import {
  assertPrestadorCanAcceptCash,
  registerCashDebtForPayment,
} from "../services/cashDebtService.js";

const router = express.Router();

// =====================================================================
// FUNCI�N HELPER: Auto-cancelar citas vencidas
// =====================================================================
/**
 * Cancela automáticamente las citas en estado "Pendiente" que ya pasaron
 * su fecha y hora programada. Esta función se ejecuta automáticamente
 * antes de retornar citas al cliente/prestador.
 * 
 * Flujo de estados de una cita:
 * 1. Pendiente: Cliente solicita la cita (inicial)
 * 2. Confirmada: Prestador acepta la cita
 * 3. Completada: Prestador marca como atendida (puede cobrar)
 * 4. Cancelada: Prestador rechaza O la cita venció sin confirmación
 */
async function autoCancelarCitasVencidas(prestadorId = null) {
  try {
    const ahora = new Date();

    // Construir filtro base usando el inicio real de la cita.
    const filtroBase = {
      estado: 'Pendiente',
      fecha: { $lt: ahora }
    };
    
    // Si se proporciona prestadorId, filtrar solo sus citas
    if (prestadorId) {
      filtroBase.prestador = prestadorId;
    }
    
    // Buscar citas vencidas
    const citasVencidas = await Cita.find(filtroBase)
      .select("_id notas fecha horaInicio")
      .lean();
    
    if (citasVencidas.length > 0) {
      const citasIds = citasVencidas.map(cita => cita._id);
      
      // Actualizar todas las citas vencidas a "Cancelada"
      await Cita.updateMany(
        { _id: { $in: citasIds } },
        { 
          $set: { 
            estado: 'Cancelada',
            notas: (citasVencidas[0].notas || '') + ' [Auto-cancelada: La cita venció sin confirmación del prestador]'
          } 
        }
      );
      
      console.log(`⏰ Auto-canceladas ${citasVencidas.length} citas vencidas`);
      citasVencidas.forEach(cita => {
        console.log(`   - Cita ${cita._id}: ${new Date(cita.fecha).toLocaleDateString()} ${cita.horaInicio}`);
      });
    }
    
    return citasVencidas.length;
  } catch (error) {
    console.error('�R Error al auto-cancelar citas vencidas:', error);
    return 0;
  }
}

function formatearFechaCita(fecha) {
  try {
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

function normalizarMetodoPagoCitaParaPago(metodoPago) {
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

async function sincronizarPagoCitaCompletada(cita) {
  if (!cita?._id) {
    throw new Error("No se pudo sincronizar el pago porque la cita es inválida");
  }

  const citaCompleta = await Cita.findById(cita._id)
    .populate("servicio", "nombre precio")
    .select("usuario prestador servicio costoEstimado metodoPago fecha createdAt updatedAt");

  if (!citaCompleta) {
    throw new Error("No se encontró la cita para sincronizar su pago");
  }

  const monto = Number(citaCompleta.costoEstimado || citaCompleta.servicio?.precio || 0);
  if (monto <= 0) {
    throw new Error("No se pudo determinar el monto de la cita completada");
  }

  const metodoPagoPago = normalizarMetodoPagoCitaParaPago(citaCompleta.metodoPago);
  let pago = await Pago.findOne({
    "referencia.tipo": "Cita",
    "referencia.id": citaCompleta._id,
  }).sort({ createdAt: -1 });

  if (citaCompleta.metodoPago === "MercadoPago") {
    if (!pago) {
      throw new Error("No se encontró el pago de Mercado Pago asociado a la cita");
    }

    if (["Fallido", "Reembolsado", "Cancelado", "Expirado"].includes(pago.estado)) {
      throw new Error(`El pago asociado a la cita no es válido para completarla. Estado actual: ${pago.estado}`);
    }

    if (!["Pagado", "Capturado", "Completado"].includes(pago.estado)) {
      throw new Error(`La cita no se puede completar hasta que Mercado Pago confirme el cobro. Estado actual: ${pago.estado}`);
    }
  }

  if (!pago) {
    pago = new Pago({
      usuario: citaCompleta.usuario,
      concepto: "Cita",
      referencia: {
        tipo: "Cita",
        id: citaCompleta._id,
      },
      prestador: citaCompleta.prestador,
      monto,
      metodoPago: metodoPagoPago,
      notasAdicionales: "Pago generado automáticamente al completar la cita",
    });
  }

  pago.monto = pago.monto > 0 ? pago.monto : monto;
  pago.metodoPago = pago.metodoPago || metodoPagoPago;
  pago.estado = "Completado";
  pago.fechaPago = pago.fechaPago || new Date();

  if (!pago.idTransaccion) {
    const prefijo = pago.metodoPago === "MercadoPago" ? "MP" : "MANUAL";
    pago.idTransaccion = `${prefijo}-CITA-${citaCompleta._id.toString()}`;
  }

  await pago.save();
  await registerCashDebtForPayment(pago);
  return pago;
}

function construirFechaConHora(fecha, hora) {
  const [horaNum, minutoNum] = hora.split(":").map(Number);
  const fechaCompleta = new Date(fecha);
  fechaCompleta.setHours(horaNum, minutoNum, 0, 0);
  return fechaCompleta;
}

function horariosSeSolapan(inicioA, finA, inicioB, finB) {
  return inicioA < finB && finA > inicioB;
}

async function liberarReservaDisponibilidad(cita) {
  if (!cita?.disponibilidad) {
    return;
  }

  const disponibilidad = await Disponibilidad.findById(cita.disponibilidad);
  if (!disponibilidad) {
    return;
  }

  const reservasOriginales = disponibilidad.reservas.length;
  disponibilidad.reservas = disponibilidad.reservas.filter((reserva) => {
    if (reserva.cita && reserva.cita.toString() === cita._id.toString()) {
      return false;
    }

    const mismaFecha = new Date(reserva.fecha).toDateString() === new Date(cita.fecha).toDateString();
    const mismoHorario = reserva.horaInicio === cita.horaInicio && reserva.horaFin === cita.horaFin;
    return !(mismaFecha && mismoHorario);
  });

  if (disponibilidad.reservas.length !== reservasOriginales) {
    await disponibilidad.save();
  }
}

async function asegurarDisponibilidadParaServicio(prestadorId, servicioId) {
  let disponibilidad = await Disponibilidad.findOne({
    prestador: prestadorId,
    servicio: servicioId
  });

  if (!disponibilidad) {
    disponibilidad = new Disponibilidad({
      prestador: prestadorId,
      servicio: servicioId,
      horarioEspecifico: {
        activo: false,
        horarios: []
      },
      reservas: []
    });
    await disponibilidad.save();
  }

  return disponibilidad;
}

async function registrarReservaDisponibilidad({ disponibilidadId, fecha, horaInicio, horaFin, citaId }) {
  if (!disponibilidadId) {
    return;
  }

  const disponibilidad = await Disponibilidad.findById(disponibilidadId);
  if (!disponibilidad) {
    return;
  }

  disponibilidad.reservas = disponibilidad.reservas.filter((reserva) => {
    return !(reserva.cita && reserva.cita.toString() === citaId.toString());
  });

  disponibilidad.reservas.push({
    fecha,
    horaInicio,
    horaFin,
    cita: citaId
  });

  await disponibilidad.save();
}

async function validarHorarioCita({ prestadorId, servicioId, fecha, horaInicio, citaExcluirId = null }) {
  const servicio = await Servicio.findById(servicioId);
  if (!servicio) {
    throw new Error("Servicio no encontrado");
  }

  const prestador = await Prestador.findById(prestadorId);
  if (!prestador) {
    throw new Error("Prestador no encontrado");
  }

  const duracion = servicio.duracion || 30;
  const fechaInicio = construirFechaConHora(fecha, horaInicio);
  const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
  const horaFin = fechaFin.toTimeString().substring(0, 5);

  const disponibilidad = await asegurarDisponibilidadParaServicio(prestadorId, servicioId);

  const diaSemana = fechaInicio.getDay();
  let horarioValido = false;

  if (disponibilidad.horarioEspecifico?.activo) {
    const horarioDia = disponibilidad.horarioEspecifico.horarios.find((h) => h.dia === diaSemana);
    if (!horarioDia) {
      throw new Error(`El prestador no atiende los ${obtenerNombreDia(diaSemana)}`);
    }

    const horaInicioNum = parseHora(horaInicio);
    const horaFinNum = parseHora(horaFin);
    const enManana =
      horarioDia.manana?.activo &&
      horaInicioNum >= parseHora(horarioDia.manana.apertura) &&
      horaFinNum <= parseHora(horarioDia.manana.cierre);
    const enTarde =
      horarioDia.tarde?.activo &&
      horaInicioNum >= parseHora(horarioDia.tarde.apertura) &&
      horaFinNum <= parseHora(horarioDia.tarde.cierre);

    horarioValido = enManana || enTarde;
  } else {
    const horarioDia = prestador.horarios?.find((h) => h.dia === diaSemana);
    if (!horarioDia) {
      throw new Error(`El prestador no atiende los ${obtenerNombreDia(diaSemana)}`);
    }

    const horaInicioNum = parseHora(horaInicio);
    const horaFinNum = parseHora(horaFin);
    const enManana =
      horarioDia.manana?.activo &&
      horaInicioNum >= parseHora(horarioDia.manana.apertura) &&
      horaFinNum <= parseHora(horarioDia.manana.cierre);
    const enTarde =
      horarioDia.tarde?.activo &&
      horaInicioNum >= parseHora(horarioDia.tarde.apertura) &&
      horaFinNum <= parseHora(horarioDia.tarde.cierre);

    horarioValido = enManana || enTarde;
  }

  if (!horarioValido) {
    throw new Error("Horario no disponible");
  }

  const inicioDia = new Date(fechaInicio);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  const filtroConflictos = {
    prestador: prestadorId,
    estado: { $in: ["Pendiente", "Confirmada"] },
    fecha: { $gte: inicioDia, $lt: finDia }
  };

  if (citaExcluirId) {
    filtroConflictos._id = { $ne: citaExcluirId };
  }

  const citasConflicto = await Cita.find(filtroConflictos).select("fecha horaInicio horaFin");
  const conflicto = citasConflicto.some((citaExistente) => {
    const inicioExistente = construirFechaConHora(citaExistente.fecha, citaExistente.horaInicio);
    const finExistente = construirFechaConHora(citaExistente.fecha, citaExistente.horaFin);
    return horariosSeSolapan(fechaInicio, fechaFin, inicioExistente, finExistente);
  });

  if (conflicto) {
    throw new Error("El horario seleccionado ya fue reservado por otro cliente");
  }

  return {
    disponibilidad,
    fechaInicio,
    horaFin
  };
}

async function notificarPrestadorNuevaCita({ cita, usuario, mascota, servicio, prestador }) {
  try {
    if (!prestador?._id) return;

    const titulo = "Nueva cita solicitada";
    const nombreCliente = usuario?.username || usuario?.nombre || usuario?.email || "Un cliente";
    const nombreMascota = mascota?.nombre || "una mascota";
    const nombreServicio = servicio?.nombre || "servicio";
    const mensaje = `${nombreCliente} solicitó una cita para ${nombreMascota} el ${formatearFechaCita(cita.fecha)} a las ${cita.horaInicio}`;

    const notificacion = new Notificacion({
      tipo: "cita_solicitada",
      titulo,
      mensaje,
      prestador: prestador._id,
      datos: {
        citaId: cita._id,
        clienteNombre: nombreCliente,
        mascotaNombre: nombreMascota,
        servicioNombre: nombreServicio,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        estado: cita.estado
      },
      enlace: {
        tipo: "Cita",
        id: cita._id
      },
      icono: "calendar",
      color: "#1E88E5",
      prioridad: "Alta",
      accion: "ver_detalle"
    });

    await notificacion.save();

    if (prestador.usuario?.deviceToken && esTokenValido(prestador.usuario.deviceToken)) {
      await enviarNotificacionPush(
        prestador.usuario.deviceToken,
        titulo,
        mensaje,
        {
          tipo: "cita_solicitada",
          citaId: cita._id.toString(),
          notificacionId: notificacion._id.toString(),
          accion: "ver_detalle",
          datos: notificacion.datos
        }
      );
    }
  } catch (error) {
    console.error("Error al notificar nueva cita al prestador:", error);
  }
}

async function notificarPrestadorReprogramacionCita({ cita, usuario, mascota, servicio, prestador, estadoAnterior }) {
  try {
    if (!prestador?._id) return;

    const titulo = "Cita reprogramada por el cliente";
    const nombreCliente = usuario?.username || usuario?.nombre || usuario?.email || "Un cliente";
    const nombreMascota = mascota?.nombre || "una mascota";
    const nombreServicio = servicio?.nombre || "servicio";
    const detalleEstado = estadoAnterior === "Confirmada"
      ? "La cita que ya habías aceptado volvió a quedar pendiente de aprobación."
      : "La cita continúa pendiente hasta que vuelvas a aprobarla.";
    const mensaje = `${nombreCliente} reprogramó la cita de ${nombreMascota} para el ${formatearFechaCita(cita.fecha)} a las ${cita.horaInicio}. ${detalleEstado}`;

    const notificacion = new Notificacion({
      tipo: "cita_reprogramada",
      titulo,
      mensaje,
      prestador: prestador._id,
      datos: {
        citaId: cita._id,
        clienteNombre: nombreCliente,
        mascotaNombre: nombreMascota,
        servicioNombre: nombreServicio,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        estado: cita.estado,
        estadoAnterior
      },
      enlace: {
        tipo: "Cita",
        id: cita._id
      },
      icono: "calendar",
      color: "#FB8C00",
      prioridad: "Alta",
      accion: "ver_detalle"
    });

    await notificacion.save();

    if (prestador.usuario?.deviceToken && esTokenValido(prestador.usuario.deviceToken)) {
      await enviarNotificacionPush(
        prestador.usuario.deviceToken,
        titulo,
        mensaje,
        {
          tipo: "cita_reprogramada",
          citaId: cita._id.toString(),
          notificacionId: notificacion._id.toString(),
          accion: "ver_detalle",
          datos: notificacion.datos
        }
      );
    }
  } catch (error) {
    console.error("Error al notificar reprogramación de cita al prestador:", error);
  }
}

async function notificarClienteCambioEstadoCita({ cita, usuario, prestador, servicio, tipo, titulo, mensaje, accion = "ver_detalle", prioridad = "Media" }) {
  try {
    if (!usuario?._id) return;

    const notificacion = new Notificacion({
      tipo,
      titulo,
      mensaje,
      usuario: usuario._id,
      datos: {
        citaId: cita._id,
        prestadorNombre: prestador?.nombre || "Prestador",
        servicioNombre: servicio?.nombre || "Servicio",
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        estado: cita.estado
      },
      enlace: {
        tipo: "Cita",
        id: cita._id
      },
      icono: "calendar",
      color: tipo === "cita_cancelada" ? "#E53935" : "#43A047",
      prioridad,
      accion
    });

    await notificacion.save();

    if (usuario.deviceToken && esTokenValido(usuario.deviceToken)) {
      await enviarNotificacionPush(
        usuario.deviceToken,
        titulo,
        mensaje,
        {
          tipo,
          citaId: cita._id.toString(),
          notificacionId: notificacion._id.toString(),
          accion,
          datos: notificacion.datos
        }
      );
    }
  } catch (error) {
    console.error("Error al notificar cambio de estado de cita al cliente:", error);
  }
}

// Endpoint para verificar y auto-cancelar citas vencidas (manual)
router.post("/verificar-citas-vencidas", protectRoute, async (req, res) => {
  try {
    const { horaLocal } = req.body;
    
    if (!horaLocal) {
      return res.status(400).json({ message: "La hora local es requerida" });
    }
    
    console.log('=== VERIFICANDO CITAS VENCIDAS ===');
    console.log('Hora local recibida:', horaLocal);
    
    // Convertir la hora local a objeto Date
    const fechaHoraActual = new Date(horaLocal);
    
    // Encontrar todas las citas pendientes cuyo inicio real ya quedó atrás
    const citasVencidas = await Cita.find({
      estado: 'Pendiente',
      fecha: { $lt: fechaHoraActual }
    });
    
    console.log(`Se encontraron ${citasVencidas.length} citas vencidas`);
    
    // Actualizar todas las citas vencidas a estado "Cancelada"
    if (citasVencidas.length > 0) {
      const citasIds = citasVencidas.map(cita => cita._id);
      
      await Cita.updateMany(
        { _id: { $in: citasIds } },
        { $set: { estado: 'Cancelada' } }
      );
      
      console.log('Citas actualizadas a estado Cancelada:', citasIds);
    }
    
    res.status(200).json({ 
      message: "Verificación completada", 
      citasCanceladas: citasVencidas.length 
    });
  } catch (error) {
    console.error('Error al verificar citas vencidas:', error);
    res.status(500).json({ 
      message: "Error al verificar citas vencidas", 
      error: error.message 
    });
  }
});

// Obtener todas las citas del usuario autenticado (CLIENTE)
// IMPORTANTE: Auto-cancela las citas vencidas antes de retornar
router.get("/", protectRoute, async (req, res) => {
  try {
    // ⏰ AUTO-CANCELAR CITAS VENCIDAS del usuario antes de retornar
    const ahora = new Date();

    const citasVencidasUsuario = await Cita.find({
      usuario: req.user._id,
      estado: 'Pendiente',
      fecha: { $lt: ahora }
    }).select("_id").lean();
    
    if (citasVencidasUsuario.length > 0) {
      const citasIds = citasVencidasUsuario.map(cita => cita._id);
      await Cita.updateMany(
        { _id: { $in: citasIds } },
        { 
          $set: { 
            estado: 'Cancelada',
            notas: '[Auto-cancelada: La cita venció sin confirmación del prestador]'
          } 
        }
      );
      console.log(`⏰ Cliente ${req.user._id}: ${citasVencidasUsuario.length} citas auto-canceladas por vencimiento`);
    }
    
    const citas = await Cita.find({ usuario: req.user._id })
      .populate("mascota", "nombre tipo raza imagen")
      .populate({
        path: "prestador",
        select: "nombre especialidades imagen rating usuario",
        populate: { path: "usuario", select: "profilePicture username" }
      })
      .populate("servicio", "nombre icono color")
      .sort({ fecha: 1 })
      .lean();
    
    res.status(200).json(citas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener las citas" });
  }
});

// POST /api/citas/verificar-disponibilidad
router.post("/verificar-disponibilidad", protectRoute, async (req, res) => {
  try {
    const { prestadorId, servicioId, fecha, horaInicio } = req.body;
    
    // 1. Validar entrada
    if (!prestadorId || !servicioId || !fecha || !horaInicio) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 2. Obtener servicio y duración
    const servicio = await Servicio.findById(servicioId);
    const duracion = servicio.duracion || 30;

    // 3. Calcular horaFin
    const [hora, minutos] = horaInicio.split(':').map(Number);
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(hora, minutos, 0, 0);
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
    const horaFin = fechaFin.toTimeString().substring(0, 5);

    // 4. Verificar contra Disponibilidad
    const disponibilidad = await Disponibilidad.findOne({
      prestador: prestadorId,
      servicio: servicioId
    }).populate('reservas');

    const estaDisponible = await verificarSlotDisponible(
      disponibilidad,
      fechaInicio,
      fechaFin
    );

    res.status(200).json({
      disponible: estaDisponible,
      horaFin,
      duracion
    });
  } catch (error) {
    res.status(500).json({ message: "Error en verificación", error: error.message });
  }
});

// Función auxiliar para verificar disponibilidad
async function verificarSlotDisponible(disponibilidad, inicio, fin) {
  // Verificar contra horarios regulares
  const dia = inicio.getDay();
  const horarioDia = disponibilidad.horarioEspecifico.horarios.find(h => h.dia === dia);
  
  if (!horarioDia) return false;

  // Verificar turno mañana/tarde
  const horaInicio = inicio.getHours() + inicio.getMinutes() / 60;
  const horaFin = fin.getHours() + fin.getMinutes() / 60;
  
  const enManana = horaInicio >= parseHora(horarioDia.manana.apertura) && 
                  horaFin <= parseHora(horarioDia.manana.cierre);
  
  const enTarde = horaInicio >= parseHora(horarioDia.tarde.apertura) && 
                 horaFin <= parseHora(horarioDia.tarde.cierre);
  
  if (!enManana && !enTarde) return false;

  // Verificar reservas existentes
  const conflicto = disponibilidad.reservas.some(reserva => {
    const rInicio = new Date(reserva.fecha);
    const rFin = new Date(rInicio);
    
    const [rHora, rMinuto] = reserva.horaInicio.split(':').map(Number);
    rInicio.setHours(rHora, rMinuto);
    
    const [rHoraFin, rMinutoFin] = reserva.horaFin.split(':').map(Number);
    rFin.setHours(rHoraFin, rMinutoFin);
    
    return (inicio < rFin && fin > rInicio);
  });

  return !conflicto;
}

function parseHora(horaStr) {
  const [hora, min] = horaStr.split(':').map(Number);
  return hora + min / 60;
}
// Obtener citas por estado (CLIENTE)
// IMPORTANTE: Auto-cancela las citas vencidas antes de retornar
router.get("/estado/:estado", protectRoute, async (req, res) => {
  try {
    const estados = ["Pendiente", "Confirmada", "Cancelada", "Completada"];
    if (!estados.includes(req.params.estado)) {
      return res.status(400).json({ message: "Estado de cita inválido" });
    }
    
    // ⏰ AUTO-CANCELAR CITAS VENCIDAS del usuario antes de retornar
    const ahora = new Date();

    const citasVencidasUsuario = await Cita.find({
      usuario: req.user._id,
      estado: 'Pendiente',
      fecha: { $lt: ahora }
    }).select("_id").lean();
    
    if (citasVencidasUsuario.length > 0) {
      const citasIds = citasVencidasUsuario.map(cita => cita._id);
      await Cita.updateMany(
        { _id: { $in: citasIds } },
        { 
          $set: { 
            estado: 'Cancelada',
            notas: '[Auto-cancelada: La cita venció sin confirmación del prestador]'
          } 
        }
      );
      console.log(`⏰ Cliente ${req.user._id}: ${citasVencidasUsuario.length} citas auto-canceladas por vencimiento`);
    }
    
    const citas = await Cita.find({ 
      usuario: req.user._id,
      estado: req.params.estado
    })
      .populate("mascota", "nombre tipo raza imagen")
      .populate("prestador", "nombre especialidades imagen rating")
      .populate("servicio", "nombre icono color")
      .sort({ fecha: 1 })
      .lean();
    
    res.status(200).json(citas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener las citas" });
  }
});

// Obtener prestadores que ofrecen el servicio de consulta general
router.get("/prestadores/consulta-general", protectRoute, async (req, res) => {
  try {
    // Buscar servicios de consulta general
    const serviciosConsultaGeneral = await Servicio.find({
      categoria: 'Consulta general',
      activo: true
    }).select('prestadorId');

    if (!serviciosConsultaGeneral || serviciosConsultaGeneral.length === 0) {
      return res.status(200).json([]);
    }

    // Obtener IDs únicos de prestadores
    const prestadorIds = [...new Set(serviciosConsultaGeneral.map(s => s.prestadorId))];

    // Buscar prestadores activos que ofrecen estos servicios
    const prestadoresConsultaGeneral = await Prestador.find({
      _id: { $in: prestadorIds },
      activo: true
    }).select('_id nombre tipo imagen direccion especialidades rating');

    res.status(200).json(prestadoresConsultaGeneral);
  } catch (error) {
    console.error('Error al obtener prestadores con consulta general:', error);
    res.status(500).json({ 
      message: "Error interno al buscar prestadores", 
      error: error.message 
    });
  }
});

// Obtener disponibilidad de un prestador para un servicio específico
router.get("/prestadores/:prestadorId/disponibilidad", protectRoute, async (req, res) => {
  try {
    const { prestadorId } = req.params;
    const { servicioId, fecha } = req.query;

    // 1. Agregar logs de depuración aquí
    console.log('=== INICIO DE SOLICITUD DE DISPONIBILIDAD ===');
    console.log('Prestador ID recibido:', prestadorId);
    console.log('Servicio ID recibido:', servicioId);
    console.log('Query params completos:', req.query);

    let fechaSolicitada = null;
    if (fecha) {
      fechaSolicitada = new Date(`${fecha}T00:00:00`);
      if (Number.isNaN(fechaSolicitada.getTime())) {
        return res.status(400).json({ message: "Fecha inválida" });
      }
      console.log('Fecha puntual solicitada:', fecha);
    }

    // Validaciones básicas
    if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
      console.log('ID de prestador inválido');
      return res.status(400).json({ message: "ID de prestador inválido" });
    }

    // 2. Obtener el prestador
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      console.log('Prestador no encontrado en BD');
      return res.status(404).json({ message: "Prestador no encontrado" });
    }
    console.log('Prestador encontrado:', prestador.nombre);

    // 3. Obtener el servicio si se proporcionó servicioId
    let servicio;
    if (servicioId) {
      servicio = await Servicio.findOne({ 
        _id: servicioId, 
        prestadorId: prestador._id 
      });
      
      if (!servicio) {
        console.log('Servicio no encontrado o no pertenece al prestador');
        return res.status(404).json({ 
          message: "Este prestador no ofrece el servicio solicitado" 
        });
      }
      console.log('Servicio encontrado:', servicio.nombre, 'Duración:', servicio.duracion || 30);
    }

    // 4. Obtener citas existentes que bloquean horarios
    // IMPORTANTE: Solo las citas con estado "Pendiente" o "Confirmada" bloquean horarios.
    // Las citas "Canceladas" NO bloquean, por lo que esos horarios vuelven a estar disponibles.
    const filtroCitas = {
      prestador: prestadorId,
      estado: { $in: ["Pendiente", "Confirmada"] } // Excluye "Cancelada" y "Completada"
    };

    if (fechaSolicitada) {
      const finDiaSolicitado = new Date(fechaSolicitada);
      finDiaSolicitado.setDate(finDiaSolicitado.getDate() + 1);
      filtroCitas.fecha = {
        $gte: fechaSolicitada,
        $lt: finDiaSolicitado
      };
    } else {
      filtroCitas.fecha = { $gte: new Date() };
    }

    const citasExistentes = await Cita.find(filtroCitas);
    console.log('Citas existentes encontradas:', citasExistentes.length);

    // 5. Generar disponibilidad
    const disponibilidad = [];
    const duracionServicio = servicio?.duracion || 30;
    console.log('Duración usada para slots:', duracionServicio, 'minutos');

    const fechasAProcesar = [];
    if (fechaSolicitada) {
      fechasAProcesar.push(new Date(fechaSolicitada));
    } else {
      const hoy = new Date();
      for (let i = 0; i < 14; i++) {
        const fechaIterada = new Date(hoy);
        fechaIterada.setDate(hoy.getDate() + i);
        fechasAProcesar.push(fechaIterada);
      }
    }

    for (const fechaActual of fechasAProcesar) {
      const fecha = new Date(fechaActual);

      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const fechaFormatted = `${year}-${month}-${day}`;
      console.log('Fecha formateada:', fechaFormatted);
      const diaSemana = fecha.getDay();

      const horarioDia = prestador.horarios.find(h => h.dia === diaSemana);
      if (!horarioDia) {
        console.log(`Día ${diaSemana} (${obtenerNombreDia(diaSemana)}: No trabaja`);
        continue;
      }

      const slotsDisponibles = [];
      
      // Procesar turno mañana
      if (horarioDia.manana?.activo) {
        console.log(`- Día ${diaSemana} (${obtenerNombreDia(diaSemana)}): Turno mañana ${horarioDia.manana.apertura} a ${horarioDia.manana.cierre}`);
        const slotsManana = generarSlotsDisponibles(
          horarioDia.manana.apertura,
          horarioDia.manana.cierre,
          duracionServicio,
          fecha,
          citasExistentes
        );
        slotsDisponibles.push(...slotsManana);
      }

      // Procesar turno tarde
      if (horarioDia.tarde?.activo) {
        console.log(`- Día ${diaSemana} (${obtenerNombreDia(diaSemana)}): Turno tarde ${horarioDia.tarde.apertura} a ${horarioDia.tarde.cierre}`);
        const slotsTarde = generarSlotsDisponibles(
          horarioDia.tarde.apertura,
          horarioDia.tarde.cierre,
          duracionServicio,
          fecha,
          citasExistentes
        );
        slotsDisponibles.push(...slotsTarde);
      }

      if (slotsDisponibles.length > 0) {
        disponibilidad.push({
          fecha: fechaFormatted,
          diaSemana: diaSemana,
          nombreDia: obtenerNombreDia(diaSemana),
          slots: slotsDisponibles
        });
      }
    }

    console.log('=== FIN DE PROCESAMIENTO ===');
    console.log('Días con disponibilidad:', disponibilidad.length);
    console.log('Total slots disponibles:', disponibilidad.reduce((acc, curr) => acc + curr.slots.length, 0));

    res.status(200).json(disponibilidad);
  } catch (error) {
    console.error('Error en endpoint disponibilidad:', error);
    res.status(500).json({ 
      message: "Error al obtener disponibilidad", 
      error: error.message 
    });
  }
});

// Función auxiliar para generar slots disponibles
function generarSlotsDisponibles(horaInicio, horaFin, duracionMinutos, fecha, citasExistentes) {
  const slots = [];
  const [inicioHora, inicioMinuto] = horaInicio.split(':').map(Number);
  const [finHora, finMinuto] = horaFin.split(':').map(Number);
  
  let horaActual = inicioHora;
  let minutoActual = inicioMinuto;
  const finEnMinutos = finHora * 60 + finMinuto;
  
  while (horaActual * 60 + minutoActual < finEnMinutos) {
    const horaFinSlot = new Date(fecha);
    horaFinSlot.setHours(horaActual, minutoActual + duracionMinutos, 0, 0);
    
    // Verificar si este slot está ocupado por alguna cita existente (solo Pendiente y Confirmada)
    const slotInicio = new Date(fecha);
    slotInicio.setHours(horaActual, minutoActual, 0, 0);
    
    const estaOcupado = citasExistentes.some(cita => {
      // Verificar que la cita sea del mismo día
      const citaFecha = new Date(cita.fecha);
      const mismaFecha = citaFecha.toDateString() === fecha.toDateString();
      
      if (!mismaFecha) return false;
      
      const citaInicio = new Date(cita.fecha);
      const [citaHora, citaMinuto] = cita.horaInicio.split(':').map(Number);
      citaInicio.setHours(citaHora, citaMinuto, 0, 0);
      
      const citaFin = new Date(cita.fecha);
      const [citaFinHora, citaFinMinuto] = cita.horaFin.split(':').map(Number);
      citaFin.setHours(citaFinHora, citaFinMinuto, 0, 0);
      
      // Verificar si hay conflicto de horarios
      return (
        (slotInicio >= citaInicio && slotInicio < citaFin) ||
        (horaFinSlot > citaInicio && horaFinSlot <= citaFin) ||
        (slotInicio <= citaInicio && horaFinSlot >= citaFin)
      );
    });
    
    // Agregar TODOS los slots (disponibles y ocupados)
    const slotStr = `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`;
    
    slots.push({
      id: `slot-${fecha.toISOString()}-${horaActual}-${minutoActual}`, // ID único
      inicio: slotStr,
      fin: horaFinSlot.toTimeString().substring(0, 5),
      disponible: !estaOcupado // true si está libre, false si está ocupado
    });
    
    // Avanzar al siguiente slot
    minutoActual += duracionMinutos;
    if (minutoActual >= 60) {
      horaActual += Math.floor(minutoActual / 60);
      minutoActual = minutoActual % 60;
    }
  }
  return slots;
}

// Función auxiliar para obtener nombre del día
function obtenerNombreDia(numeroDia) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[numeroDia];
}

// Obtener una cita por ID
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id)
      .populate("mascota", "nombre tipo raza imagen edad genero color")
      .populate("prestador", "nombre especialidades imagen rating experiencia ubicacion")
      .populate("servicio", "nombre descripcion icono color precio duracion");

    
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (cita.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para ver esta cita" });
    }
    
    res.status(200).json(cita);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener la cita" });
  }
});

// Crear una nueva cita
// POST /api/citas
router.post("/", protectRoute, async (req, res) => {
  try {
    const { mascota, prestador, servicio, fecha, horaInicio, motivo, ubicacion, metodoPago } = req.body;
    
    console.log('=== INICIO DE CREACI�N DE CITA ===');
    console.log('Datos recibidos:', { mascota, prestador, servicio, fecha, horaInicio, motivo, ubicacion });
    
    // 1. Validación básica
    if (!mascota || !prestador || !servicio || !fecha || !horaInicio) {
      console.log('Error: Datos incompletos');
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 2. Obtener duración del servicio
    const servicioObj = await Servicio.findById(servicio);
    const duracion = servicioObj.duracion || 30;
    console.log('Servicio encontrado:', servicioObj.nombre, '- Duración:', duracion, 'minutos');

    // 3. Calcular horaFin automáticamente
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(hora, minuto, 0, 0);
    
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
    const horaFin = fechaFin.toTimeString().substring(0, 5);
    console.log('Rango horario calculado:', horaInicio, '-', horaFin);

    // 4. Primero buscar la disponibilidad específica del servicio
    let disponibilidad = await Disponibilidad.findOne({
      prestador: prestador,
      servicio: servicio
    });
    
    // Variable para controlar si usamos horario específico o general
    let usandoHorarioGeneral = false;
    let estaDisponible = false;
    let prestadorObj = null;

    if (metodoPago === "Efectivo") {
      await assertPrestadorCanAcceptCash(prestador);
    }
    
    // 4.1 Si no hay disponibilidad específica o no está activa, usar horarios generales del prestador
    if (!disponibilidad || !disponibilidad.horarioEspecifico || !disponibilidad.horarioEspecifico.activo) {
      console.log('No se encontró disponibilidad específica para el servicio o no está activa');
      console.log('Buscando prestador para usar horario general...');
      
      // Buscar el prestador para usar sus horarios generales
      prestadorObj = await Prestador.findById(prestador);
      
      if (!prestadorObj) {
        console.log('Error: Prestador no encontrado');
        return res.status(400).json({ 
          message: "Error creando cita", 
          error: "Prestador no encontrado" 
        });
      }
      
      // Verificar si el prestador tiene horarios generales configurados
      if (!prestadorObj.horarios || prestadorObj.horarios.length === 0) {
        console.log('Error: El prestador no tiene configurado un horario general');
        return res.status(400).json({
          message: "Error creando cita",
          error: "El prestador no tiene configurado un horario general"
        });
      }
      
      console.log('Usando horario general del prestador con', prestadorObj.horarios.length, 'días configurados');
      usandoHorarioGeneral = true;
      
      // Verificar disponibilidad con los horarios generales
      const diaSemana = fechaInicio.getDay(); // 0=Domingo, 1=Lunes, ...
      const horarioDia = prestadorObj.horarios.find(h => h.dia === diaSemana);
      
      if (!horarioDia) {
        console.log(`Error: El prestador no trabaja los ${obtenerNombreDia(diaSemana)}`);
        return res.status(400).json({
          message: "Horario no disponible",
          error: `El prestador no atiende los ${obtenerNombreDia(diaSemana)}`
        });
      }
      
      // Verificar si la hora está dentro del horario de trabajo del prestador
      const horaNum = hora + minuto / 60;
      const horaFinNum = parseFloat(horaFin.split(':')[0]) + parseFloat(horaFin.split(':')[1]) / 60;
      
      // Verificar turno de mañana
      const enManana = horarioDia.manana && horarioDia.manana.activo &&
                       horaNum >= parseHora(horarioDia.manana.apertura) && 
                       horaFinNum <= parseHora(horarioDia.manana.cierre);
      
      // Verificar turno de tarde
      const enTarde = horarioDia.tarde && horarioDia.tarde.activo &&
                     horaNum >= parseHora(horarioDia.tarde.apertura) && 
                     horaFinNum <= parseHora(horarioDia.tarde.cierre);
      
      // La cita es válida si está dentro de alguno de los turnos
      estaDisponible = enManana || enTarde;
      console.log('Verificación con horario general:', estaDisponible ? 'DISPONIBLE' : 'NO DISPONIBLE');
      
      // Si no hay disponibilidad específica, crearla para este servicio usando los horarios generales
      if (!disponibilidad && estaDisponible) {
        console.log('Creando registro de disponibilidad para este servicio basado en horarios generales');
        disponibilidad = new Disponibilidad({
          prestador: prestador,
          servicio: servicio,
          horarioEspecifico: {
            activo: false,
            horarios: [] // No copiamos los horarios porque usaremos los generales
          },
          reservas: []
        });
        await disponibilidad.save();
        console.log('Registro de disponibilidad creado con ID:', disponibilidad._id);
      }
    }
    // 4.2 Si hay disponibilidad específica activa, verificarla
    else {
      console.log('Encontrada disponibilidad específica para el servicio, verificando...');
      estaDisponible = await verificarSlotDisponible(
        disponibilidad,
        fechaInicio,
        fechaFin
      );
      console.log('Verificación con horario específico:', estaDisponible ? 'DISPONIBLE' : 'NO DISPONIBLE');
    }

    // Si no está disponible con ningún método, retornar error
    if (!estaDisponible) {
      console.log('Error: Horario no disponible');
      return res.status(400).json({ message: "Horario no disponible" });
    }

    // 5. Crear cita
    const nuevaCita = new Cita({
      mascota,
      prestador,
      servicio,
      fecha: fechaInicio,
      horaInicio,
      horaFin,
      motivo,
      ubicacion: ubicacion || "Clínica",
      usuario: req.user._id,
      costoEstimado: servicioObj.precio || 0,
      metodoPago: metodoPago || "Por definir",
      disponibilidad: disponibilidad._id
    });

    const citaCreada = await nuevaCita.save();
    console.log('Cita creada con ID:', citaCreada._id);

    // 6. Actualizar disponibilidad con la reserva
    disponibilidad.reservas.push({
      fecha: fechaInicio,
      horaInicio,
      horaFin,
      cita: citaCreada._id
    });

    await disponibilidad.save();
    console.log('Disponibilidad actualizada con la nueva reserva');

    // 7. Obtener la cita con los datos poblados antes de devolverla
    const citaConDatos = await Cita.findById(citaCreada._id)
      .populate("mascota", "nombre tipo raza imagen edad genero color")
      .populate("prestador", "nombre tipo especialidades imagen rating direccion")
      .populate("servicio", "nombre descripcion icono color precio duracion categoria");

    const [usuarioNotificacion, mascotaNotificacion, servicioNotificacion, prestadorNotificacion] = await Promise.all([
      User.findById(req.user._id).select("username email"),
      Mascota.findById(mascota).select("nombre"),
      Servicio.findById(servicio).select("nombre"),
      Prestador.findById(prestador).populate("usuario", "deviceToken")
    ]);

    await notificarPrestadorNuevaCita({
      cita: citaCreada,
      usuario: usuarioNotificacion,
      mascota: mascotaNotificacion,
      servicio: servicioNotificacion,
      prestador: prestadorNotificacion
    });

    console.log('=== FIN DE CREACI�N DE CITA ===');
    res.status(201).json(citaConDatos);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Error creando cita",
      code: error.code,
      cashStatus: error.cashStatus,
      error: error.message
    });
  }
});

// Actualizar estado de una cita
router.patch("/:id/estado", protectRoute, async (req, res) => {
  try {
    const { estado } = req.body;
    const estados = ["Pendiente", "Confirmada", "Cancelada", "Completada"];
    
    if (!estado || !estados.includes(estado)) {
      return res.status(400).json({ message: "Estado de cita inválido" });
    }
    
    const cita = await Cita.findById(req.params.id);
    
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (cita.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para modificar esta cita" });
    }
    
    const estadoAnterior = cita.estado;
    cita.estado = estado;

    if (estado === "Cancelada" && estadoAnterior !== "Cancelada") {
      await liberarReservaDisponibilidad(cita);
    }
    
    // Si se completa la cita, agregar automáticamente al historial médico de la mascota
    if (estado === "Completada" && estadoAnterior !== "Completada") {
      const mascota = await Mascota.findById(cita.mascota);
      
      if (mascota) {
        mascota.historialMedico.push({
          fecha: cita.fecha,
          descripcion: cita.motivo || "Cita completada",
          veterinario: cita.veterinario,
          tipoVisita: "Consulta"
        });
        
        mascota.ultimaVisita = cita.fecha;
        await mascota.save();
      }
    }
    
    await cita.save();
    
    const citaActualizada = await Cita.findById(cita._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate("prestador", "nombre especialidad imagen")
      .populate("servicio", "nombre icono color");
    
    res.status(200).json(citaActualizada);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al actualizar el estado de la cita" });
  }
});

router.patch("/:id/reprogramar", protectRoute, async (req, res) => {
  try {
    const { fecha, horaInicio, motivo, ubicacion } = req.body;

    if (!fecha || !horaInicio) {
      return res.status(400).json({ message: "La nueva fecha y hora son obligatorias" });
    }

    const cita = await Cita.findById(req.params.id)
      .populate("prestador", "nombre usuario")
      .populate("servicio", "nombre precio duracion")
      .populate("mascota", "nombre")
      .populate("usuario", "username nombre email");

    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }

    if (cita.usuario._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para reprogramar esta cita" });
    }

    if (!["Pendiente", "Confirmada"].includes(cita.estado)) {
      return res.status(400).json({
        message: "Solo se pueden reprogramar citas pendientes o confirmadas"
      });
    }

    const fechaNueva = new Date(fecha);
    if (Number.isNaN(fechaNueva.getTime())) {
      return res.status(400).json({ message: "La nueva fecha es inválida" });
    }

    const mismaFecha = new Date(cita.fecha).toDateString() === fechaNueva.toDateString();
    const mismaHora = cita.horaInicio === horaInicio;
    if (mismaFecha && mismaHora) {
      return res.status(400).json({ message: "La nueva fecha y hora deben ser distintas a la cita actual" });
    }

    const estadoAnterior = cita.estado;
    const horarioValidado = await validarHorarioCita({
      prestadorId: cita.prestador._id,
      servicioId: cita.servicio._id,
      fecha: fechaNueva,
      horaInicio,
      citaExcluirId: cita._id
    });

    await liberarReservaDisponibilidad(cita);

    cita.fecha = horarioValidado.fechaInicio;
    cita.horaInicio = horaInicio;
    cita.horaFin = horarioValidado.horaFin;
    cita.estado = "Pendiente";
    cita.ubicacion = ubicacion || cita.ubicacion;
    cita.motivo = motivo || cita.motivo;
    cita.disponibilidad = horarioValidado.disponibilidad._id;
    cita.notas = `${cita.notas || ""}${cita.notas ? " " : ""}[Reprogramada por el cliente el ${new Date().toLocaleString("es-AR")}]`;

    await cita.save();
    await registrarReservaDisponibilidad({
      disponibilidadId: horarioValidado.disponibilidad._id,
      fecha: horarioValidado.fechaInicio,
      horaInicio,
      horaFin: horarioValidado.horaFin,
      citaId: cita._id
    });

    const citaActualizada = await Cita.findById(cita._id)
      .populate("mascota", "nombre tipo raza imagen")
      .populate({
        path: "prestador",
        select: "nombre especialidades imagen rating usuario",
        populate: { path: "usuario", select: "profilePicture username deviceToken" }
      })
      .populate("servicio", "nombre icono color precio duracion categoria");

    await notificarPrestadorReprogramacionCita({
      cita: citaActualizada,
      usuario: cita.usuario,
      mascota: cita.mascota,
      servicio: cita.servicio,
      prestador: citaActualizada.prestador,
      estadoAnterior
    });

    res.status(200).json({
      message: "Cita reprogramada correctamente. El prestador debe aprobarla nuevamente.",
      cita: citaActualizada
    });
  } catch (error) {
    console.error("Error al reprogramar la cita:", error);
    const erroresCliente = [
      "La nueva fecha y hora son obligatorias",
      "La nueva fecha es inválida",
      "La nueva fecha y hora deben ser distintas a la cita actual",
      "Solo se pueden reprogramar citas pendientes o confirmadas",
      "Servicio no encontrado",
      "Prestador no encontrado",
      "Horario no disponible",
      "El horario seleccionado ya fue reservado por otro cliente"
    ];

    const status = erroresCliente.includes(error.message) || error.message?.includes("no atiende los")
      ? 400
      : 500;

    res.status(status).json({
      message: error.message || "Error al reprogramar la cita"
    });
  }
});

// Eliminar una cita
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    
    // Verificar si el usuario actual es el propietario
    if (cita.usuario.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "No autorizado para eliminar esta cita" });
    }
    
    // Solo se pueden eliminar citas pendientes o canceladas
    if (cita.estado !== "Pendiente" && cita.estado !== "Cancelada") {
      return res.status(400).json({ message: "Solo se pueden eliminar citas pendientes o canceladas" });
    }
    
    await liberarReservaDisponibilidad(cita);
    await Cita.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Cita eliminada con éxito" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al eliminar la cita" });
  }
});

// =====================================================================
// RUTAS ESPECÍFICAS PARA PRESTADORES
// =====================================================================

/**
 * Obtener todas las citas para un prestador, filtradas por estado
 * GET /api/citas/prestador/:prestadorId?estado=Pendiente
 * 
 * IMPORTANTE: Esta ruta auto-cancela las citas vencidas antes de retornar
 */
router.get("/prestador/:prestadorId", protectRoute, async (req, res) => {
  try {
    const { prestadorId } = req.params;
    const { estado } = req.query;
    
    // Verificar que el prestadorId sea válido
    if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
      return res.status(400).json({ message: "ID de prestador inválido" });
    }
    
    // Verificar que el usuario actual tenga acceso al prestador
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }
    
    // Verificar que el usuario actual sea el propietario del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para ver citas de este prestador" });
    }
    
    // ⏰ AUTO-CANCELAR CITAS VENCIDAS antes de retornar
    // Esto asegura que las citas pendientes que ya pasaron se marquen como canceladas
    const citasCanceladas = await autoCancelarCitasVencidas(prestadorId);
    if (citasCanceladas > 0) {
      console.log(`�x9 Prestador ${prestadorId}: ${citasCanceladas} citas auto-canceladas por vencimiento`);
    }
    
    // Construir filtro de búsqueda
    const filtro = { prestador: prestadorId };
    
    // Filtrar por estado si se proporciona
    if (estado && ["Pendiente", "Confirmada", "Cancelada", "Completada"].includes(estado)) {
      filtro.estado = estado;
    }
    
    // Obtener citas filtradas con populate de los datos relevantes
    const citas = await Cita.find(filtro)
      .populate("mascota", "nombre tipo raza imagen edad")
      .populate("servicio", "nombre descripcion precio duracion")
      .populate({
        path: "usuario",
        select: "username apellido email telefono profilePicture",
        model: "User"
      })
      .sort({ fecha: 1, horaInicio: 1 });
    
    res.status(200).json(citas);
  } catch (error) {
    console.log('Error al obtener citas del prestador:', error);
    res.status(500).json({ message: "Error al obtener citas del prestador", error: error.message });
  }
});

/**
 * Actualizar el estado de una cita por el prestador
 * PATCH /api/citas/prestador/:prestadorId/cita/:citaId
 */
router.patch("/prestador/:prestadorId/cita/:citaId", protectRoute, async (req, res) => {
  try {
    const { prestadorId, citaId } = req.params;
    const { estado } = req.body;
    
    // Validar estado
    if (!estado || !["Confirmada", "Completada", "Cancelada"].includes(estado)) {
      return res.status(400).json({ 
        message: "Estado inválido. Debe ser 'Confirmada', 'Completada' o 'Cancelada'" 
      });
    }
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(prestadorId) || !mongoose.Types.ObjectId.isValid(citaId)) {
      return res.status(400).json({ message: "IDs inválidos" });
    }
    
    // Verificar que el prestador exista y pertenezca al usuario autenticado
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }
    
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para modificar citas de este prestador" });
    }
    
    // Buscar la cita y verificar que pertenezca al prestador
    const cita = await Cita.findById(citaId);
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    
    if (cita.prestador.toString() !== prestadorId) {
      return res.status(403).json({ message: "Esta cita no corresponde al prestador indicado" });
    }
    
    // Verificar transiciones de estado válidas
    if (cita.estado === "Pendiente" && estado === "Completada") {
      return res.status(400).json({ 
        message: "No se puede marcar como completada una cita pendiente. Primero debe confirmarla" 
      });
    }
    
    if (cita.estado === "Cancelada") {
      return res.status(400).json({ message: "No se puede modificar una cita ya cancelada" });
    }
    
    if (cita.estado === "Completada") {
      return res.status(400).json({ message: "No se puede modificar una cita ya completada" });
    }
    
    // Actualizar estado
    const estadoAnterior = cita.estado;
    cita.estado = estado;

    if (estado === "Cancelada" && estadoAnterior !== "Cancelada") {
      await liberarReservaDisponibilidad(cita);
    }
    
    // Si se completa la cita, agregar al historial médico de la mascota
    if (estado === "Completada") {
      const pagoSincronizado = await sincronizarPagoCitaCompletada(cita);
      cita.pagado = true;

      if (pagoSincronizado?.monto && !cita.costoEstimado) {
        cita.costoEstimado = pagoSincronizado.monto;
      }

      const mascota = await Mascota.findById(cita.mascota);
      
      if (mascota) {
        mascota.historialMedico = mascota.historialMedico || [];
        mascota.historialMedico.push({
          fecha: cita.fecha,
          descripcion: cita.motivo || `Cita de ${cita.servicio}`,
          prestador: cita.prestador,
          tipoVisita: "Consulta"
        });
        
        mascota.ultimaVisita = cita.fecha;
        await mascota.save();
        console.log(`Historial médico actualizado para mascota ${mascota._id}`);
      }
    }
    
    await cita.save();
    
    // Devolver cita actualizada con datos populados
    const citaActualizada = await Cita.findById(citaId)
      .populate("mascota", "nombre tipo raza imagen edad")
      .populate("servicio", "nombre descripcion precio duracion")
      .populate({
        path: "usuario",
        select: "username apellido email telefono profilePicture deviceToken",
        model: "User"
      });

    const tipoNotificacion = estado === "Confirmada"
      ? "cita_confirmada"
      : estado === "Cancelada"
        ? "cita_cancelada"
        : "cita_completada";
    const tituloNotificacion = estado === "Confirmada"
      ? "Tu cita fue confirmada"
      : estado === "Cancelada"
        ? "Tu cita fue cancelada"
        : "Tu cita fue completada";
    const mensajeNotificacion = estado === "Confirmada"
      ? `${prestador.nombre} confirmó tu cita para el ${formatearFechaCita(citaActualizada.fecha)} a las ${citaActualizada.horaInicio}.`
      : estado === "Cancelada"
        ? `${prestador.nombre} canceló tu cita programada para el ${formatearFechaCita(citaActualizada.fecha)} a las ${citaActualizada.horaInicio}.`
        : `${prestador.nombre} marcó como completada tu cita del ${formatearFechaCita(citaActualizada.fecha)}.`;

    await notificarClienteCambioEstadoCita({
      cita: citaActualizada,
      usuario: citaActualizada.usuario,
      prestador,
      servicio: citaActualizada.servicio,
      tipo: tipoNotificacion,
      titulo: tituloNotificacion,
      mensaje: mensajeNotificacion,
      prioridad: estado === "Cancelada" ? "Alta" : "Media"
    });
    
    res.status(200).json(citaActualizada);
  } catch (error) {
    console.log('Error al actualizar estado de cita:', error);
    res.status(500).json({ message: "Error al actualizar estado de cita" });
  }
});

/**
 * Registrar método de pago de una cita sin alterar su estado de aprobación
 * La cita debe permanecer en Pendiente hasta que el prestador la acepte o rechace
 * PATCH /api/citas/prestador/:prestadorId/cita/:citaId/confirmar-pago
 */
router.patch("/prestador/:prestadorId/cita/:citaId/confirmar-pago", protectRoute, async (req, res) => {
  try {
    const { prestadorId, citaId } = req.params;
    const { metodoPago } = req.body; // 'MercadoPago' o 'Efectivo'
    
    console.log('=== REGISTRAR PAGO EN CITA PENDIENTE ===');
    console.log('Prestador ID:', prestadorId);
    console.log('Cita ID:', citaId);
    console.log('Método de pago:', metodoPago);
    
    // Validar que sea solo efectivo
    if (metodoPago !== 'Efectivo') {
      return res.status(400).json({ 
        message: "Esta ruta es solo para pagos en efectivo. Para Mercado Pago, use el flujo de creación de preferencia." 
      });
    }
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(prestadorId) || !mongoose.Types.ObjectId.isValid(citaId)) {
      return res.status(400).json({ message: "IDs inválidos" });
    }
    
    // Verificar que el prestador exista
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }

    await assertPrestadorCanAcceptCash(prestador._id);
    
    // Buscar la cita y verificar que pertenezca al prestador
    const cita = await Cita.findById(citaId)
      .populate('usuario', 'nombre email')
      .populate('servicio', 'nombre precio');
    
    if (!cita) {
      return res.status(404).json({ message: "Cita no encontrada" });
    }
    
    if (cita.prestador.toString() !== prestadorId) {
      return res.status(403).json({ message: "Esta cita no corresponde al prestador indicado" });
    }
    
    // Verificar que el usuario autenticado sea el cliente que creó la cita
    if (cita.usuario._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para modificar esta cita" });
    }
    
    // Verificar que la cita esté en estado pendiente
    if (cita.estado !== "Pendiente") {
      return res.status(400).json({ 
        message: "Solo se puede registrar el pago de citas en estado 'Pendiente'" 
      });
    }
    
    // Registrar método de pago sin aprobar la cita
    cita.metodoPago = 'Efectivo';
    
    await cita.save();
    
    // Devolver cita actualizada
    const citaActualizada = await Cita.findById(citaId)
      .populate("mascota", "nombre tipo raza imagen edad")
      .populate("servicio", "nombre descripcion precio duracion")
      .populate({
        path: "usuario",
        select: "username apellido email telefono profilePicture deviceToken",
        model: "User"
      });
    
    console.log('�S& Método de pago en efectivo registrado para cita pendiente');

    res.status(200).json({
      cita: citaActualizada,
      message: 'Método de pago registrado. La cita continúa pendiente hasta la aprobación del prestador.'
    });
    
  } catch (error) {
    console.error('�R Error al confirmar cita con pago:', error);
    res.status(500).json({ 
      message: "Error al confirmar cita con método de pago", 
      error: error.message 
    });
  }
});

/**
 * Obtener resumen de citas para un prestador (dashboard)
 * GET /api/citas/prestador/:prestadorId/resumen
 */
router.get("/prestador/:prestadorId/resumen", protectRoute, async (req, res) => {
  try {
    const { prestadorId } = req.params;
    console.log("Prestador ID:", prestadorId);
    
    // Verificar que el prestadorId sea válido
    if (!mongoose.Types.ObjectId.isValid(prestadorId)) {
      return res.status(400).json({ message: "ID de prestador inválido" });
    }
    
    // Verificar que el usuario actual tenga acceso al prestador
    const prestador = await Prestador.findById(prestadorId);
    if (!prestador) {
      return res.status(404).json({ message: "Prestador no encontrado" });
    }
    
    // Verificar que el usuario actual sea el propietario del prestador
    if (prestador.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado para ver citas de este prestador" });
    }
    
    // Fecha actual (sin hora)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    
    const proximaSemana = new Date(hoy);
    proximaSemana.setDate(hoy.getDate() + 7);
    
    // Citas pendientes
    const citasPendientes = await Cita.countDocuments({ 
      prestador: prestadorId,
      estado: "Pendiente"
    });
    
    // Citas confirmadas
    const citasConfirmadas = await Cita.countDocuments({ 
      prestador: prestadorId,
      estado: "Confirmada"
    });
    
    // Citas para hoy
    const citasHoy = await Cita.countDocuments({
      prestador: prestadorId,
      fecha: {
        $gte: hoy,
        $lt: manana
      },
      estado: { $in: ["Pendiente", "Confirmada"] }
    });
    
    // Citas para esta semana
    const citasSemana = await Cita.countDocuments({
      prestador: prestadorId,
      fecha: {
        $gte: hoy,
        $lt: proximaSemana
      },
      estado: { $in: ["Pendiente", "Confirmada"] }
    });
    
    // Citas completadas este mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const citasCompletadasMes = await Cita.countDocuments({
      prestador: prestadorId,
      estado: "Completada",
      fecha: {
        $gte: inicioMes,
        $lte: finMes
      }
    });
    
    // Próximas 3 citas
    const proximasCitas = await Cita.find({
      prestador: prestadorId,
      fecha: { $gte: hoy },
      estado: { $in: ["Pendiente", "Confirmada"] }
    })
    .sort({ fecha: 1, horaInicio: 1 })
    .limit(3)
    .populate("mascota", "nombre tipo raza imagen")
    .populate({
      path: "usuario",
      select: "username apellido profilePicture",
      model: "User"
    })
    .populate("servicio", "nombre precio");
    
    res.status(200).json({
      pendientes: citasPendientes,
      confirmadas: citasConfirmadas,
      hoy: citasHoy,
      semana: citasSemana,
      completadasMes: citasCompletadasMes,
      proximasCitas
    });
    
  } catch (error) {
    console.log('Error al obtener resumen de citas:', error);
    res.status(500).json({ message: "Error al obtener resumen de citas", error: error.message });
  }
});

// Obtener horarios disponibles de un veterinario en una fecha específica
router.get("/horarios-disponibles/:veterinarioId/:fecha", async (req, res) => {
  try {
    const { veterinarioId, fecha } = req.params;
    
    // Verificar que el veterinario exista
    const veterinario = await Veterinario.findById(veterinarioId);
    if (!veterinario) {
      return res.status(404).json({ message: "Veterinario no encontrado" });
    }
    
    // Convertir la fecha a objeto Date
    const fechaConsulta = new Date(fecha);
    const diaSemana = fechaConsulta.getDay(); // 0: Domingo, 1: Lunes, etc.
    
    // Mapear el día de la semana a su nombre en español
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const nombreDia = diasSemana[diaSemana];
    
    // Verificar si el veterinario trabaja ese día
    const horarioDia = veterinario.horarios.find(h => h.dia === nombreDia && h.disponible);
    if (!horarioDia) {
      return res.status(400).json({ message: "El veterinario no atiende este día" });
    }
    
    // Obtener las horas de inicio y fin del horario del veterinario
    const [horaInicioStr, minInicioStr] = horarioDia.horaInicio.split(':');
    const [horaFinStr, minFinStr] = horarioDia.horaFin.split(':');
    
    const horaInicio = parseInt(horaInicioStr);
    const minInicio = parseInt(minInicioStr || 0);
    const horaFin = parseInt(horaFinStr);
    const minFin = parseInt(minFinStr || 0);
    
    // Generar bloques de 30 minutos
    const bloquesDisponibles = [];
    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (let min = 0; min < 60; min += 30) {
        // Si es la hora de inicio, verificar los minutos
        if (hora === horaInicio && min < minInicio) continue;
        // Si es la hora de fin, verificar los minutos
        if (hora === horaFin && min >= minFin) continue;
        
        const horaFormateada = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        bloquesDisponibles.push(horaFormateada);
      }
    }
    
    // Obtener citas existentes para ese día y veterinario
    const citasExistentes = await Cita.find({
      veterinario: veterinarioId,
      fecha: {
        $gte: new Date(fechaConsulta.setHours(0, 0, 0, 0)),
        $lte: new Date(fechaConsulta.setHours(23, 59, 59, 999))
      },
      estado: { $in: ["Pendiente", "Confirmada"] }
    }).select("horaInicio horaFin");
    
    // Filtrar bloques que ya están ocupados
    const bloquesOcupados = citasExistentes.flatMap(cita => {
      const [horaInicioStr, minInicioStr] = cita.horaInicio.split(':');
      const [horaFinStr, minFinStr] = cita.horaFin.split(':');
      
      const horaInicioCita = parseInt(horaInicioStr);
      const minInicioCita = parseInt(minInicioStr || 0);
      const horaFinCita = parseInt(horaFinStr);
      const minFinCita = parseInt(minFinStr || 0);
      
      const bloques = [];
      for (let hora = horaInicioCita; hora <= horaFinCita; hora++) {
        for (let min = 0; min < 60; min += 30) {
          // Si es la hora de inicio, verificar los minutos
          if (hora === horaInicioCita && min < minInicioCita) continue;
          // Si es la hora de fin, verificar los minutos
          if (hora === horaFinCita && min >= minFinCita) continue;
          
          const horaFormateada = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
          bloques.push(horaFormateada);
        }
      }
      return bloques;
    });
    
    const horariosDisponibles = bloquesDisponibles.filter(bloque => !bloquesOcupados.includes(bloque));
    
    res.status(200).json(horariosDisponibles);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al obtener horarios disponibles" });
  }
});

export default router;

