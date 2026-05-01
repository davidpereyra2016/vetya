import { MercadoPagoConfig, Preference, Payment, OAuth } from 'mercadopago';

const DEFAULT_TIMEOUT = 5000;

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

export function getMercadoPagoRedirectUri() {
  const backendUrl = process.env.BACKEND_URL || process.env.APP_URL;

  if (!backendUrl) {
    throw new Error('Falta configurar BACKEND_URL o APP_URL para OAuth de Mercado Pago');
  }

  return `${backendUrl.replace(/\/$/, '')}/api/pagos/mercadopago/connect`;
}

export function getMercadoPagoAuthorizationUrl({ prestadorId } = {}) {
  const clientId = getMercadoPagoClientId();

  if (!clientId) {
    throw new Error('Falta configurar MP_CLIENT_ID o NEXT_PUBLIC_MP_CLIENT_ID');
  }

  return getMercadoPagoOAuthClient().getAuthorizationURL({
    options: {
      client_id: clientId,
      redirect_uri: getMercadoPagoRedirectUri(),
      state: prestadorId?.toString()
    }
  });
}

export async function exchangeMercadoPagoCode(code) {
  const clientId = getMercadoPagoClientId();
  const clientSecret = getMercadoPagoClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error('Faltan credenciales OAuth de Mercado Pago');
  }

  return getMercadoPagoOAuthClient().create({
    body: {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: getMercadoPagoRedirectUri()
    }
  });
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
