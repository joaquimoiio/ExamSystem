const { Plan, User, Subject, Question, Exam } = require('../models');

const checkPlanLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

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
        } else {
          return res.status(400).json({
            success: false,
            message: 'Nenhum plano associado ao usuário'
          });
        }
      }

      let canCreate = false;
      let currentCount = 0;
      let limit = 0;

      switch (resourceType) {
        case 'subjects':
          canCreate = await user.canCreateSubjects();
          currentCount = await Subject.count({
            where: { userId: user.id }
          });
          limit = user.plan.maxSubjects;
          break;

        case 'questions':
          canCreate = await user.canCreateQuestions();
          currentCount = await Question.count({
            where: { userId: user.id }
          });
          limit = user.plan.maxQuestions;
          break;

        case 'exams':
          canCreate = await user.canCreateExams();
          currentCount = await Exam.count({
            where: { userId: user.id }
          });
          limit = user.plan.maxExams;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de recurso inválido'
          });
      }

      if (!canCreate) {
        const planName = user.plan.name === 'free' ? 'Free' : 'Plus';
        const limitText = limit === -1 ? 'ilimitado' : limit;

        return res.status(403).json({
          success: false,
          message: `Limite do plano ${planName} atingido para ${resourceType}`,
          details: {
            currentPlan: user.plan.name,
            resource: resourceType,
            currentCount,
            limit,
            maxReached: true
          }
        });
      }

      req.userPlan = user.plan;
      req.usageStats = {
        [resourceType]: {
          current: currentCount,
          limit: limit === -1 ? 'ilimitado' : limit,
          remaining: limit === -1 ? 'ilimitado' : limit - currentCount
        }
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar limites do plano:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao verificar limites do plano'
      });
    }
  };
};

const getUserUsage = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

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
    req.usageStats = usageStats;
    req.userPlan = user.plan;

    next();
  } catch (error) {
    console.error('Erro ao obter estatísticas de uso:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao obter estatísticas de uso'
    });
  }
};

const requirePlusPlan = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan'
      }]
    });

    if (!user || !user.plan) {
      return res.status(403).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    if (user.plan.name !== 'plus') {
      return res.status(403).json({
        success: false,
        message: 'Esta funcionalidade requer o Plano Plus',
        upgradeRequired: true,
        currentPlan: user.plan.name
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar plano Plus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  checkPlanLimits,
  getUserUsage,
  requirePlusPlan
};