import { MercadoPagoConfig, Preference, Payment, OAuth } from 'mercadopago';
import crypto from 'crypto';

const DEFAULT_TIMEOUT = 5000;
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;
const oauthStateStore = new Map();

function getMarketplaceAccessToken() {
  return process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
}

const client = new MercadoPagoConfig({
  accessToken: getMarketplaceAccessToken(),
  options: {
    timeout: DEFAULT_TIMEOUT
  }
});

export function createMercadoPagoClient(accessToken = getMarketplaceAccessToken()) {
  if (!accessToken) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN');
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: DEFAULT_TIMEOUT
    }
  });
}

export function createSellerPreferenceClient(sellerAccessToken) {
  return new Preference(createMercadoPagoClient(sellerAccessToken));
}

export function getMercadoPagoOAuthClient() {
  return new OAuth(createMercadoPagoClient());
}

export function getMercadoPagoClientId() {
  return process.env.MP_CLIENT_ID || process.env.NEXT_PUBLIC_MP_CLIENT_ID;
}

export function getMercadoPagoClientSecret() {
  return process.env.MP_CLIENT_SECRET || process.env.MERCADOPAGO_CLIENT_SECRET;
}

function base64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getStateSecret() {
  return process.env.MP_OAUTH_STATE_SECRET || process.env.JWT_SECRET || getMercadoPagoClientSecret();
}

function signOAuthState(prestadorId, nonce) {
  const secret = getStateSecret();

  if (!secret) {
    throw new Error('Falta configurar MP_OAUTH_STATE_SECRET o JWT_SECRET para OAuth de Mercado Pago');
  }

  return base64Url(crypto.createHmac('sha256', secret).update(`${prestadorId}.${nonce}`).digest());
}

function createPkcePair() {
  const codeVerifier = base64Url(crypto.randomBytes(64));
  const codeChallenge = base64Url(crypto.createHash('sha256').update(codeVerifier).digest());

  return { codeVerifier, codeChallenge };
}

function cleanExpiredOAuthStates() {
  const now = Date.now();
  for (const [state, value] of oauthStateStore.entries()) {
    if (value.expiresAt <= now) oauthStateStore.delete(state);
  }
}

function createMercadoPagoOAuthState(prestadorId, codeVerifier) {
  if (!prestadorId) {
    throw new Error('Falta el prestador para iniciar la conexion con Mercado Pago');
  }

  cleanExpiredOAuthStates();
  const nonce = base64Url(crypto.randomBytes(16));
  const signature = signOAuthState(prestadorId.toString(), nonce);
  const state = `${prestadorId}.${nonce}.${signature}`;

  oauthStateStore.set(state, {
    prestadorId: prestadorId.toString(),
    codeVerifier,
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS
  });

  return state;
}

export function resolveMercadoPagoOAuthState(state) {
  if (!state || typeof state !== 'string') {
    throw new Error('Falta el prestador asociado a la conexion');
  }

  const [prestadorId, nonce, signature] = state.split('.');

  if (!prestadorId || !nonce || !signature) {
    return { prestadorId: state };
  }

  const expectedSignature = signOAuthState(prestadorId, nonce);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new Error('La conexion con Mercado Pago no pudo validarse. Intenta nuevamente.');
  }

  const storedState = oauthStateStore.get(state);
  if (!storedState || storedState.expiresAt <= Date.now()) {
    oauthStateStore.delete(state);
    throw new Error('La conexion con Mercado Pago expiro. Inicia la vinculacion nuevamente.');
  }

  oauthStateStore.delete(state);
  return {
    prestadorId: storedState.prestadorId,
    codeVerifier: storedState.codeVerifier
  };
}

export function getMercadoPagoRedirectUri() {
  const configuredRedirectUri = process.env.MP_REDIRECT_URI?.trim();
  const backendUrl = process.env.BACKEND_URL || process.env.APP_URL;

  if (!configuredRedirectUri && !backendUrl) {
    throw new Error('Falta configurar MP_REDIRECT_URI, BACKEND_URL o APP_URL para OAuth de Mercado Pago');
  }

  if (configuredRedirectUri) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredRedirectUri)) {
      throw new Error('Mercado Pago OAuth requiere una URL publica. MP_REDIRECT_URI no puede apuntar a localhost.');
    }

    return configuredRedirectUri;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(backendUrl)) {
    throw new Error('Mercado Pago OAuth requiere una URL publica. Configura MP_REDIRECT_URI con la URL registrada en Mercado Pago.');
  }

  return `${backendUrl.replace(/\/$/, '')}/api/pagos/mercadopago/connect`;
}

export function getMercadoPagoAuthorizationUrl({ prestadorId } = {}) {
  const clientId = getMercadoPagoClientId();

  if (!clientId) {
    throw new Error('Falta configurar MP_CLIENT_ID o NEXT_PUBLIC_MP_CLIENT_ID');
  }

  const redirectUri = getMercadoPagoRedirectUri();
  const usePkce = process.env.MP_USE_PKCE !== 'false';
  const pkce = usePkce ? createPkcePair() : null;
  const state = createMercadoPagoOAuthState(prestadorId, pkce?.codeVerifier);
  const authorizationUrl = new URL(process.env.MP_AUTHORIZATION_URL || 'https://auth.mercadopago.com/authorization');

  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('platform_id', 'mp');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);

  if (pkce) {
    authorizationUrl.searchParams.set('code_challenge', pkce.codeChallenge);
    authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  }

  return authorizationUrl.toString();
}

export async function exchangeMercadoPagoCode(code, codeVerifier) {
  const clientId = getMercadoPagoClientId();
  const clientSecret = getMercadoPagoClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error('Faltan credenciales OAuth de Mercado Pago');
  }

  const body = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: getMercadoPagoRedirectUri()
  };

  if (codeVerifier) body.code_verifier = codeVerifier;

  return getMercadoPagoOAuthClient().create({ body });
}

export function calcularComisionMarketplace(monto, porcentaje = 0.3) {
  const total = Number(monto);

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('El monto debe ser mayor a 0');
  }

  const marketplaceFee = Math.round(total * porcentaje * 100) / 100;
  const netAmount = Math.round((total - marketplaceFee) * 100) / 100;

  return {
    marketplaceFee,
    netAmount,
    marketplacePercentage: porcentaje
  };
}

export async function createMarketplacePreference({
  sellerAccessToken,
  preferenceData,
  marketplacePercentage = 0.3
}) {
  if (!sellerAccessToken) {
    throw new Error('El prestador debe conectar su cuenta de Mercado Pago antes de cobrar por Mercado Pago');
  }

  const total = preferenceData?.items?.reduce((sum, item) => {
    return sum + Number(item.unit_price || 0) * Number(item.quantity || 1);
  }, 0);
  const split = calcularComisionMarketplace(total, marketplacePercentage);
  const preferenceClientForSeller = createSellerPreferenceClient(sellerAccessToken);

  const preference = await preferenceClientForSeller.create({
    body: {
      ...preferenceData,
      marketplace_fee: split.marketplaceFee,
      metadata: {
        ...(preferenceData.metadata || {}),
        marketplace_fee: split.marketplaceFee,
        seller_net_amount: split.netAmount,
        marketplace_percentage: split.marketplacePercentage
      }
    }
  });

  return {
    preference,
    split
  };
}

export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);
export const oauthClient = new OAuth(client);

export default client;
