import crypto from 'node:crypto';
import { Payment, MerchantOrder } from 'mercadopago';
import Pago from '../models/Pago.js';
import Cita from '../models/Cita.js';
import Emergencia from '../models/Emergencia.js';
import { createMercadoPagoClient, createMarketplacePreference } from '../lib/mercadopago.js';
import { sellerCredential } from './mercadoPagoSellerService.js';
import { mpDiagnostic } from '../utils/mercadoPagoCredentials.js';

export function notificationUrl() {
  let url;
  const candidates = [process.env.BACKEND_URL, process.env.APP_URL];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'https:' && parsed.pathname === '/' && !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
          !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) { url = parsed; break; }
    } catch {}
  }
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('BACKEND_URL debe ser un origen HTTPS público sin credenciales ni ruta');
  }
  return `${url.origin}/api/pagos/mercadopago/webhook`;
}

// The unique service key reserves the charge BEFORE calling the remote provider.
// An uncertain remote result remains reserved for reconciliation, never blind retry.
export async function createServiceCheckout({ prestador, preferenceData, pagoData }) {
  if (String(prestador._id) !== String(pagoData.prestador)) {
    throw Object.assign(new Error('El vendedor no corresponde al prestador del servicio'), { status: 409 });
  }
  prestador = await sellerCredential(prestador._id, { requireConnected: true });
  const checkoutKey = `${pagoData.referencia.tipo}:${pagoData.referencia.id}`;
  let pago;
  try {
    pago = await Pago.create({ ...pagoData, checkoutKey, estado: 'Procesando', mercadoPago: {
      collectorId: String(prestador.mercadoPago.userId),
      externalReference: preferenceData.external_reference,
      currency: 'ARS', liveMode: prestador.mercadoPago.liveMode,
    } });
  } catch (error) {
    if (error.code !== 11000) throw error;
    throw Object.assign(new Error('Ya existe un intento de cobro para este servicio; consultar su estado'), { status: 409 });
  }
  try {
    const { preference, split } = await createMarketplacePreference({
      sellerAccessToken: prestador.mercadoPago.accessToken, preferenceData,
    });
    pago.estado = 'Pendiente';
    Object.assign(pago.mercadoPago, {
      preferenceId: preference.id, initPoint: preference.init_point, status: 'pending',
      metadata: preferenceData.metadata, marketplaceFee: split.marketplaceFee,
      sellerNetAmount: split.netAmount, marketplacePercentage: split.marketplacePercentage,
    });
    await pago.save();
    mpDiagnostic('checkout_created', { prestadorId: String(prestador._id), sellerId: prestador.mercadoPago.userId,
      preferenceId: preference.id, marketplaceFee: split.marketplaceFee });
    return { pago, preference, split };
  } catch (error) {
    await Pago.updateOne({ _id: pago._id }, { $set: { notasAdicionales: 'Creación de checkout no confirmada. Conciliar antes de reintentar.' } });
    throw error;
  }
}

export function verifyWebhook(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) throw Object.assign(new Error('Webhook no configurado'), { status: 503 });
  const id = req.query['data.id'];
  const requestId = req.get('x-request-id');
  const fields = Object.fromEntries((req.get('x-signature') || '').split(',').map(v => v.trim().split('=')));
  const { ts, v1 } = fields;
  const time = Number(ts) * (String(ts).length <= 10 ? 1000 : 1);
  if (typeof id !== 'string' || !id || String(req.body.data?.id) !== id || !requestId || !/^\d+$/.test(ts || '') || Math.abs(Date.now() - time) > 5 * 60 * 1000 || !/^[a-f0-9]{64}$/i.test(v1 || '')) {
    throw Object.assign(new Error('Notificación inválida'), { status: 401 });
  }
  const expected = crypto.createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(v1, 'hex'))) throw Object.assign(new Error('Firma inválida'), { status: 401 });
  return id;
}

export async function sellerPayment(prestadorId, id) {
  const seller = await sellerCredential(prestadorId);
  if (!seller?.mercadoPago?.accessToken) throw new Error('Credencial del vendedor no disponible');
  return new Payment(createMercadoPagoClient(seller.mercadoPago.accessToken)).get({ id });
}

export async function searchSellerPayments(prestadorId, externalReference) {
  const seller = await sellerCredential(prestadorId);
  if (!seller?.mercadoPago?.accessToken) throw new Error('Credencial del vendedor no disponible');
  return new Payment(createMercadoPagoClient(seller.mercadoPago.accessToken)).search({ options: { external_reference: externalReference } });
}

export async function reconcilePayment(payment) {
  const pago = await Pago.findOne({ 'mercadoPago.externalReference': payment.external_reference });
  if (!pago) throw Object.assign(new Error('Referencia de pago desconocida'), { status: 404 });
  const mp = pago.mercadoPago;
  let preferenceId = payment.preference_id;
  // Payments API links Checkout Pro through a merchant order, not always preference_id.
  if (!preferenceId && payment.order?.id && payment.order.type === 'mercadopago') {
    const seller = await sellerCredential(pago.prestador);
    const order = await new MerchantOrder(createMercadoPagoClient(seller.mercadoPago.accessToken)).get({ merchantOrderId: payment.order.id });
    if (order.external_reference !== mp.externalReference ||
        !order.payments?.some(item => String(item.id) === String(payment.id))) {
      throw Object.assign(new Error('El pago no pertenece a la orden esperada'), { status: 409 });
    }
    preferenceId = order.preference_id;
  }
  if (String(payment.collector_id) !== mp.collectorId || payment.currency_id !== mp.currency || Number(payment.transaction_amount) !== pago.monto || preferenceId !== mp.preferenceId || payment.live_mode !== mp.liveMode) {
    throw Object.assign(new Error('El pago no coincide con importe, moneda, vendedor o ambiente esperado'), { status: 409 });
  }
  const updated = new Date(payment.date_last_updated);
  if (!Number.isFinite(updated.getTime())) throw Object.assign(new Error('Falta fecha de actualización del pago'), { status: 409 });
  if (mp.verifiedAt && updated <= mp.providerUpdatedAt) { await syncReferencePayment(pago); return pago; }
  // A second attempt cannot replace a previously approved transaction.
  if (['approved', 'refunded', 'charged_back'].includes(mp.status) &&
      (String(payment.id) !== mp.paymentId || !['approved', 'refunded', 'charged_back'].includes(payment.status))) return pago;
  if (['refunded', 'charged_back'].includes(mp.status) && payment.status === 'approved') return pago;
  const states = { approved: 'Pagado', rejected: 'Fallido', cancelled: 'Cancelado', pending: 'Pendiente', in_process: 'Procesando', authorized: 'Procesando', refunded: 'Reembolsado', charged_back: 'Reembolsado' };
  if (!states[payment.status]) throw Object.assign(new Error('Estado MP desconocido'), { status: 409 });
  const evidence = {
    paymentId: String(payment.id), status: payment.status, statusDetail: payment.status_detail,
    collectorId: String(payment.collector_id), payerId: String(payment.payer?.id || ''),
    amount: payment.transaction_amount, currency: payment.currency_id, liveMode: payment.live_mode,
    externalReference: payment.external_reference, providerUpdatedAt: updated,
    netReceivedAmount: payment.transaction_details?.net_received_amount,
    feeDetails: payment.fee_details || [], moneyReleaseDate: payment.money_release_date,
    moneyReleaseStatus: payment.money_release_status, verifiedAt: new Date(),
  };
  const values = Object.fromEntries(Object.entries(evidence).filter(([,v]) => v !== undefined).map(([k,v]) => [`mercadoPago.${k}`,v]));
  values.estado = payment.status === 'approved' && ['Capturado','Completado'].includes(pago.estado) ? pago.estado : states[payment.status];
  if (payment.status === 'approved') {
    values.fechaPago = pago.fechaPago || new Date(payment.date_approved || updated);
    values.idTransaccion = String(payment.id);
  }
  // Optimistic concurrency: only one notification may replace the observed version.
  const result = await Pago.findOneAndUpdate({ _id: pago._id, __v: pago.__v }, {
    $set: values, $inc: { __v: 1 }, $push: { paymentEvidence: evidence },
  }, { new: true });
  if (!result) throw Object.assign(new Error('Pago actualizado concurrentemente; reintentar'), { status: 503 });
  await syncReferencePayment(result);
  mpDiagnostic('payment_reconciled', { prestadorId: String(pago.prestador), sellerId: mp.collectorId,
    paymentId: String(payment.id), status: payment.status, marketplaceFee: mp.marketplaceFee });
  return result;
}

async function syncReferencePayment(pago) {
  const Model = pago.referencia.tipo === 'Cita' ? Cita : pago.referencia.tipo === 'Emergencia' ? Emergencia : null;
  if (!Model || !pago.mercadoPago.verifiedAt) return;
  await Model.updateOne({ _id: pago.referencia.id }, { $set: {
    metodoPago: 'MercadoPago', pagado: ['Pagado', 'Capturado', 'Completado'].includes(pago.estado),
  } });
}
