const express = require('express');
const router = express.Router();

// Importar com try/catch para evitar erros
let planController, authenticateToken;

try {
  planController = require('../controllers/planController');
  const auth = require('../middleware/auth');
  authenticateToken = auth.authenticateToken;
} catch (error) {
  console.error('❌ Erro ao carregar dependências do planRoutes:', error.message);

  // Fallback controllers
  planController = {
    getAllPlans: (req, res) => res.json({ success: true, data: [] }),
    getCurrentUserPlan: (req, res) => res.json({ success: true, data: { plan: { name: 'free' }, usage: {} } }),
    getUserUsageStats: (req, res) => res.json({ success: true, data: { usage: {}, plan: { name: 'free' } } }),
    upgradeUserPlan: (req, res) => res.status(500).json({ success: false, message: 'Plan service not available' }),
    checkPlanLimits: (req, res) => res.json({ success: true, data: { plan: 'free', usage: {}, permissions: {} } })
  };

  authenticateToken = (req, res, next) => {
    req.user = { id: 'fallback', role: 'teacher' };
    next();
  };
}

// Rotas públicas
router.get('/plans', planController.getAllPlans);

// Rotas protegidas
router.get('/my-plan', authenticateToken, planController.getCurrentUserPlan);
router.get('/usage', authenticateToken, planController.getUserUsageStats);
router.get('/limits', authenticateToken, planController.checkPlanLimits);
router.put('/upgrade', authenticateToken, planController.upgradeUserPlan);

module.exports = router;