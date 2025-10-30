const { MercadoPagoConfig } = require('mercadopago');

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'exam-system'
  }
});

module.exports = client;
