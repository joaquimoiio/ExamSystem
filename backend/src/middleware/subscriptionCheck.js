const { User } = require('../models');

/**
 * Middleware para verificar se o usuário possui assinatura ativa
 * Bloqueia acesso caso subscription_status != 'authorized'
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Buscar usuário com informações de assinatura
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se a assinatura está ativa
    if (user.subscriptionStatus !== 'authorized') {
      return res.status(403).json({
        success: false,
        message: 'Assinatura inativa. Você precisa de uma assinatura ativa para acessar este recurso.',
        subscriptionStatus: user.subscriptionStatus,
        requiresSubscription: true
      });
    }

    // Assinatura ativa - permitir acesso
    next();

  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar assinatura'
    });
  }
};

/**
 * Middleware opcional que adiciona informações de assinatura ao request
 * mas não bloqueia o acesso
 */
const attachSubscriptionInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (user) {
      req.subscription = {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        isActive: user.subscriptionStatus === 'authorized'
      };
    }

    next();

  } catch (error) {
    console.error('Erro ao anexar informações de assinatura:', error);
    // Não bloqueia em caso de erro
    next();
  }
};

module.exports = {
  requireActiveSubscription,
  attachSubscriptionInfo
};
