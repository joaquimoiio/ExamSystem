const { Plan, User } = require('../models');

const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.getActivePlans();

    return res.status(200).json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        price: parseFloat(plan.price),
        maxSubjects: plan.maxSubjects === -1 ? 'Ilimitado' : plan.maxSubjects,
        maxQuestions: plan.maxQuestions === -1 ? 'Ilimitado' : plan.maxQuestions,
        maxExams: plan.maxExams === -1 ? 'Ilimitado' : plan.maxExams,
        features: plan.features,
        isActive: plan.isActive
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getCurrentUserPlan = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.plan) {
      const freePlan = await Plan.findByName('free');
      if (freePlan) {
        user.planId = freePlan.id;
        await user.save();
        user.plan = freePlan;
      }
    }

    const usageStats = await user.getUsageStats();

    return res.status(200).json({
      success: true,
      data: {
        plan: {
          id: user.plan.id,
          name: user.plan.name,
          displayName: user.plan.displayName,
          description: user.plan.description,
          price: parseFloat(user.plan.price),
          maxSubjects: user.plan.maxSubjects === -1 ? 'Ilimitado' : user.plan.maxSubjects,
          maxQuestions: user.plan.maxQuestions === -1 ? 'Ilimitado' : user.plan.maxQuestions,
          maxExams: user.plan.maxExams === -1 ? 'Ilimitado' : user.plan.maxExams,
          features: user.plan.features
        },
        usage: usageStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar plano do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getUserUsageStats = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const usageStats = await user.getUsageStats();

    return res.status(200).json({
      success: true,
      data: {
        usage: usageStats,
        plan: {
          name: user.plan?.name || 'free',
          displayName: user.plan?.displayName || 'Plano Free'
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const upgradeUserPlan = async (req, res) => {
  try {
    const { planName } = req.body;

    if (!planName || !['free', 'plus'].includes(planName)) {
      return res.status(400).json({
        success: false,
        message: 'Nome do plano inválido. Use "free" ou "plus"'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const newPlan = await Plan.findByName(planName);
    if (!newPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    user.planId = newPlan.id;
    await user.save();

    const updatedUser = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    return res.status(200).json({
      success: true,
      message: `Plano atualizado para ${newPlan.displayName} com sucesso`,
      data: {
        plan: {
          id: updatedUser.plan.id,
          name: updatedUser.plan.name,
          displayName: updatedUser.plan.displayName,
          description: updatedUser.plan.description,
          price: parseFloat(updatedUser.plan.price),
          maxSubjects: updatedUser.plan.maxSubjects === -1 ? 'Ilimitado' : updatedUser.plan.maxSubjects,
          maxQuestions: updatedUser.plan.maxQuestions === -1 ? 'Ilimitado' : updatedUser.plan.maxQuestions,
          maxExams: updatedUser.plan.maxExams === -1 ? 'Ilimitado' : updatedUser.plan.maxExams,
          features: updatedUser.plan.features
        }
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar plano do usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const checkPlanLimits = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const usageStats = await user.getUsageStats();
    const canCreateSubjects = await user.canCreateSubjects();
    const canCreateQuestions = await user.canCreateQuestions();
    const canCreateExams = await user.canCreateExams();

    return res.status(200).json({
      success: true,
      data: {
        plan: user.plan?.name || 'free',
        usage: usageStats,
        permissions: {
          canCreateSubjects,
          canCreateQuestions,
          canCreateExams
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar limites do plano:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getAllPlans,
  getCurrentUserPlan,
  getUserUsageStats,
  upgradeUserPlan,
  checkPlanLimits
};