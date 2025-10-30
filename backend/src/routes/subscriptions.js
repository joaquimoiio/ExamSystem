const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Rotas públicas (sem autenticação)
 */

// Webhook do Mercado Pago (não requer autenticação)
router.post('/webhook', subscriptionController.handleWebhook);

// Listar planos disponíveis
router.get('/planos', subscriptionController.listPlans);

/**
 * Rotas protegidas (requer autenticação)
 */

// Criar nova assinatura
router.post('/criar', authenticateToken, subscriptionController.createSubscription);

// Obter status da assinatura do usuário
router.get('/status', authenticateToken, subscriptionController.getSubscriptionStatus);

// Cancelar assinatura
router.post('/cancelar', authenticateToken, subscriptionController.cancelSubscription);

module.exports = router;
