const subscriptionService = require('../services/subscriptionService');
const { User } = require('../models');

/**
 * Cria uma nova assinatura
 * POST /api/assinatura/criar
 */
exports.createSubscription = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    // Validar entrada
    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de plano inválido. Use "monthly" ou "annual".'
      });
    }

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se já possui assinatura ativa
    if (user.subscriptionStatus === 'authorized') {
      return res.status(400).json({
        success: false,
        message: 'Você já possui uma assinatura ativa. Cancele antes de criar uma nova.'
      });
    }

    // Criar assinatura
    const subscription = await subscriptionService.createSubscription(user, planType);

    res.status(201).json({
      success: true,
      message: 'Assinatura criada com sucesso',
      data: subscription
    });

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar assinatura'
    });
  }
};

/**
 * Obtém o status da assinatura do usuário
 * GET /api/assinatura/status
 */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Obter detalhes da assinatura
    const subscriptionDetails = await subscriptionService.getSubscriptionDetails(user);

    res.json({
      success: true,
      data: subscriptionDetails
    });

  } catch (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status da assinatura'
    });
  }
};

/**
 * Cancela a assinatura do usuário
 * POST /api/assinatura/cancelar
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Cancelar assinatura
    const result = await subscriptionService.cancelSubscription(user);

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
      data: result
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar assinatura'
    });
  }
};

/**
 * Webhook do Mercado Pago para receber notificações de mudança de status
 * POST /api/assinatura/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('📩 Webhook recebido:', { type, data });

    // Verificar se é uma notificação de preapproval (assinatura)
    if (type === 'preapproval') {
      const preapprovalId = data.id;

      // Buscar informações atualizadas da assinatura no MP
      const { PreApproval } = require('mercadopago');
      const client = require('../config/mercadopago');
      const preapproval = new PreApproval(client);

      const subscriptionInfo = await preapproval.get({ id: preapprovalId });

      // Atualizar status no banco de dados
      await subscriptionService.updateSubscriptionStatus(
        preapprovalId,
        subscriptionInfo.status
      );

      console.log(`✅ Webhook processado: ${preapprovalId} -> ${subscriptionInfo.status}`);
    }

    // Sempre retornar 200 para o Mercado Pago
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    // Mesmo com erro, retornar 200 para evitar reenvios
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * Lista os planos disponíveis
 * GET /api/assinatura/planos
 */
exports.listPlans = async (req, res) => {
  try {
    const plans = Object.entries(subscriptionService.PLANS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.reason,
      price: value.auto_recurring.transaction_amount,
      frequency: value.auto_recurring.frequency,
      frequencyType: value.auto_recurring.frequency_type,
      currency: value.auto_recurring.currency_id
    }));

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar planos'
    });
  }
};
