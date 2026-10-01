import crypto from 'node:crypto';

function key() {
  const secret = process.env.MP_TOKEN_ENCRYPTION_KEY || process.env.MP_OAUTH_STATE_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta una clave estable para cifrar credenciales de Mercado Pago');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptCredential(value) {
  if (!value || value.startsWith('mpenc:v1:')) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['mpenc', 'v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
}

export function decryptCredential(value) {
  // Legacy records remain readable and are encrypted on the next OAuth/refresh write.
  if (!value || !value.startsWith('mpenc:v1:')) return value;
  const [, , iv, tag, data] = value.split(':');
  const cipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  cipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([cipher.update(Buffer.from(data, 'base64url')), cipher.final()]).toString('utf8');
}

export function mpDiagnostic(event, fields = {}) {
  const allowed = ['prestadorId', 'sellerId', 'paymentId', 'preferenceId', 'marketplaceFee', 'status', 'code', 'httpStatus'];
  console.info(JSON.stringify({ component: 'mercadopago', event, ...Object.fromEntries(
    Object.entries(fields).filter(([key]) => allowed.includes(key))
  ) }));
}

export function mpErrorDetails(error) {
  const code = error?.error || error?.code;
  return { httpStatus: Number(error?.status || error?.statusCode) || 500,
    code: typeof code === 'string' && /^[a-z_0-9-]{1,80}$/i.test(code) ? code : 'provider_error' };
}
