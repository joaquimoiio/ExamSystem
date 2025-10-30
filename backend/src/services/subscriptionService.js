const { PreApproval } = require('mercadopago');
const client = require('../config/mercadopago');
const { User } = require('../models');

// Definição dos planos disponíveis
const PLANS = {
  monthly: {
    name: 'Plano Mensal - Exam System',
    reason: 'Assinatura mensal do sistema de provas',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 49.90,
      currency_id: 'BRL'
    }
  },
  annual: {
    name: 'Plano Anual - Exam System',
    reason: 'Assinatura anual do sistema de provas (economize 20%)',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'years',
      transaction_amount: 479.00,
      currency_id: 'BRL'
    }
  }
};

/**
 * Cria uma assinatura no Mercado Pago
 * @param {Object} user - Usuário que está criando a assinatura
 * @param {String} planType - Tipo do plano ('monthly' ou 'annual')
 * @returns {Object} - Dados da assinatura criada com init_point para checkout
 */
async function createSubscription(user, planType) {
  try {
    // Validar tipo de plano
    if (!PLANS[planType]) {
      throw new Error('Tipo de plano inválido. Use "monthly" ou "annual".');
    }

    const plan = PLANS[planType];
    const preapproval = new PreApproval(client);

    // Preparar dados da assinatura
    const subscriptionData = {
      reason: plan.reason,
      auto_recurring: plan.auto_recurring,
      payer_email: user.email,
      back_url: `${process.env.FRONTEND_URL}/assinatura/sucesso`,
      status: 'pending'
    };

    // Criar assinatura no Mercado Pago
    const response = await preapproval.create({ body: subscriptionData });

    // Atualizar usuário com informações da assinatura
    await user.update({
      mercadoPagoSubscriptionId: response.id,
      subscriptionPlan: planType,
      subscriptionStatus: 'pending'
    });

    return {
      subscriptionId: response.id,
      initPoint: response.init_point,
      status: response.status,
      planType: planType,
      amount: plan.auto_recurring.transaction_amount
    };

  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw new Error(`Falha ao criar assinatura: ${error.message}`);
  }
}

/**
 * Cancela uma assinatura no Mercado Pago
 * @param {Object} user - Usuário que está cancelando a assinatura
 * @returns {Object} - Confirmação do cancelamento
 */
async function cancelSubscription(user) {
  try {
    // Verificar se o usuário tem uma assinatura ativa
    if (!user.mercadoPagoSubscriptionId) {
      throw new Error('Usuário não possui assinatura ativa.');
    }

    const preapproval = new PreApproval(client);

    // Cancelar assinatura no Mercado Pago
    await preapproval.update({
      id: user.mercadoPagoSubscriptionId,
      body: { status: 'cancelled' }
    });

    // Atualizar status no banco de dados
    await user.update({
      subscriptionStatus: 'cancelled',
      subscriptionEndDate: new Date()
    });

    return {
      success: true,
      message: 'Assinatura cancelada com sucesso',
      cancelledAt: new Date()
    };

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw new Error(`Falha ao cancelar assinatura: ${error.message}`);
  }
}

/**
 * Atualiza o status da assinatura com base no webhook
 * @param {String} preapprovalId - ID da assinatura no Mercado Pago
 * @param {String} status - Novo status da assinatura
 * @returns {Object} - Usuário atualizado
 */
async function updateSubscriptionStatus(preapprovalId, status) {
  try {
    // Buscar usuário pela assinatura
    const user = await User.findOne({
      where: { mercadoPagoSubscriptionId: preapprovalId }
    });

    if (!user) {
      throw new Error(`Usuário não encontrado para assinatura ${preapprovalId}`);
    }

    // Mapear status do Mercado Pago para nosso sistema
    const statusMap = {
      'authorized': 'authorized',
      'paused': 'paused',
      'cancelled': 'cancelled',
      'pending': 'pending'
    };

    const newStatus = statusMap[status] || 'pending';

    // Atualizar dados do usuário
    const updateData = {
      subscriptionStatus: newStatus
    };

    // Se a assinatura foi autorizada, definir data de início
    if (newStatus === 'authorized' && !user.subscriptionStartDate) {
      updateData.subscriptionStartDate = new Date();

      // Para planos anuais, definir data de fim
      if (user.subscriptionPlan === 'annual') {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        updateData.subscriptionEndDate = endDate;
      }
    }

    // Se foi cancelada, definir data de fim
    if (newStatus === 'cancelled') {
      updateData.subscriptionEndDate = new Date();
    }

    await user.update(updateData);

    console.log(`✅ Assinatura ${preapprovalId} atualizada para ${newStatus}`);

    return user;

  } catch (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
    throw error;
  }
}

/**
 * Obtém detalhes da assinatura do usuário
 * @param {Object} user - Usuário
 * @returns {Object} - Detalhes da assinatura
 */
async function getSubscriptionDetails(user) {
  try {
    const subscriptionInfo = {
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      mercadoPagoId: user.mercadoPagoSubscriptionId,
      isActive: user.subscriptionStatus === 'authorized',
      planDetails: null
    };

    // Adicionar detalhes do plano se existir
    if (user.subscriptionPlan && PLANS[user.subscriptionPlan]) {
      const plan = PLANS[user.subscriptionPlan];
      subscriptionInfo.planDetails = {
        name: plan.name,
        amount: plan.auto_recurring.transaction_amount,
        frequency: `${plan.auto_recurring.frequency} ${plan.auto_recurring.frequency_type}`,
        currency: plan.auto_recurring.currency_id
      };
    }

    return subscriptionInfo;

  } catch (error) {
    console.error('Erro ao buscar detalhes da assinatura:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário tem assinatura ativa
 * @param {Object} user - Usuário
 * @returns {Boolean} - True se a assinatura está ativa
 */
function hasActiveSubscription(user) {
  return user.subscriptionStatus === 'authorized';
}

module.exports = {
  PLANS,
  createSubscription,
  cancelSubscription,
  updateSubscriptionStatus,
  getSubscriptionDetails,
  hasActiveSubscription
};
