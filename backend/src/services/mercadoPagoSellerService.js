import crypto from 'node:crypto';
import Prestador from '../models/Prestador.js';
import { getMercadoPagoOAuthClient, getMercadoPagoClientId, getMercadoPagoClientSecret } from '../lib/mercadopago.js';
import { mpDiagnostic, mpErrorDetails } from '../utils/mercadoPagoCredentials.js';

export function credentialFields(credentials) {
  if (!credentials?.access_token || !credentials.refresh_token || !credentials.user_id ||
      !Number.isFinite(Number(credentials.expires_in)) || Number(credentials.expires_in) <= 0 ||
      typeof credentials.live_mode !== 'boolean' || !String(credentials.scope || '').split(/[ ,]+/).includes('offline_access')) {
    throw Object.assign(new Error('Mercado Pago no devolvio credenciales OAuth completas con acceso offline'), { status: 502 });
  }
  return Object.fromEntries(Object.entries({
    accessToken: credentials.access_token, refreshToken: credentials.refresh_token,
    publicKey: credentials.public_key, userId: String(credentials.user_id),
    tokenType: credentials.token_type, scope: credentials.scope, liveMode: credentials.live_mode,
    expiresIn: Number(credentials.expires_in), expiresAt: new Date(Date.now() + Number(credentials.expires_in) * 1000),
  }).filter(([, value]) => value !== undefined).map(([key, value]) => [`mercadoPago.${key}`, value]));
}

export async function sellerCredential(prestadorId, { requireConnected = false } = {}) {
  const select = '+mercadoPago.accessToken +mercadoPago.refreshToken +mercadoPago.refreshLockUntil +mercadoPago.refreshLockId';
  for (let attempt = 0; attempt < 40; attempt++) {
    const seller = await Prestador.findById(prestadorId).select(select);
    if (!seller?.mercadoPago?.accessToken || (requireConnected && !seller.mercadoPago.conectado)) {
      throw Object.assign(new Error('El prestador debe vincular Mercado Pago'), { status: 409 });
    }
    const mp = seller.mercadoPago;
    if (!mp.expiresAt || mp.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) return seller;
    if (!mp.refreshToken) throw Object.assign(new Error('El prestador debe volver a vincular Mercado Pago'), { status: 409 });
    if (!getMercadoPagoClientId() || !getMercadoPagoClientSecret()) {
      throw Object.assign(new Error('Faltan credenciales OAuth del Marketplace'), { status: 503 });
    }
    const lockId = crypto.randomUUID();
    const locked = await Prestador.findOneAndUpdate({ _id: seller._id,
      'mercadoPago.expiresAt': mp.expiresAt,
      $or: [{ 'mercadoPago.refreshLockUntil': { $exists: false } }, { 'mercadoPago.refreshLockUntil': { $lte: new Date() } }],
    }, { $set: { 'mercadoPago.refreshLockUntil': new Date(Date.now() + 30000), 'mercadoPago.refreshLockId': lockId } });
    if (!locked) { await new Promise(resolve => setTimeout(resolve, 200)); continue; }
    try {
      const credentials = await getMercadoPagoOAuthClient().refresh({ body: {
        client_id: getMercadoPagoClientId(), client_secret: getMercadoPagoClientSecret(), refresh_token: mp.refreshToken,
      } });
      const fields = credentialFields(credentials);
      if (String(credentials.user_id) !== mp.userId || credentials.live_mode !== mp.liveMode) {
        throw Object.assign(new Error('La renovacion no corresponde al vendedor y ambiente vinculados'), { status: 409 });
      }
      const updated = await Prestador.findOneAndUpdate({ _id: seller._id,
        'mercadoPago.refreshLockId': lockId, 'mercadoPago.connectionVersion': mp.connectionVersion,
      }, { $set: { ...fields, 'mercadoPago.lastRefreshAt': new Date() },
        $unset: { 'mercadoPago.refreshLockUntil': '', 'mercadoPago.refreshLockId': '' },
      }, { new: true }).select(select);
      if (!updated) throw Object.assign(new Error('La vinculacion cambio durante la renovacion'), { status: 409 });
      mpDiagnostic('token_refreshed', { prestadorId: String(seller._id), sellerId: mp.userId });
      return updated;
    } catch (error) {
      mpDiagnostic('refresh_failed', { prestadorId: String(seller._id), sellerId: mp.userId, ...mpErrorDetails(error) });
      throw Object.assign(new Error('No se pudo renovar Mercado Pago; reintentar o volver a vincular la cuenta'), { status: 503 });
    } finally {
      await Prestador.updateOne({ _id: seller._id, 'mercadoPago.refreshLockId': lockId }, {
        $unset: { 'mercadoPago.refreshLockUntil': '', 'mercadoPago.refreshLockId': '' },
      });
    }
  }
  throw Object.assign(new Error('Renovacion de Mercado Pago en curso; reintentar'), { status: 503 });
}
