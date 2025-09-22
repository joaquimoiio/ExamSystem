const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authenticateToken } = require('../middleware/auth');
const { getUserUsage } = require('../middleware/planLimits');

router.get('/plans', planController.getAllPlans);

router.use(authenticateToken);

router.get('/my-plan', planController.getCurrentUserPlan);
router.get('/usage', planController.getUserUsageStats);
router.get('/limits', planController.checkPlanLimits);
router.put('/upgrade', planController.upgradeUserPlan);

module.exports = router;