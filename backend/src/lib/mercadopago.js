import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

/**
 * Configuración del cliente de Mercado Pago
 * Utiliza las credenciales del archivo .env
 */
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

// Exportar instancias de los clientes necesarios
export const preferenceClient = new Preference(client);
export const paymentClient = new Payment(client);

export default client;
