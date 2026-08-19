const express = require('express');
const agentController = require('../controllers/agentController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get('/', optionalAuth, agentController.listAgents);
router.get('/:id', optionalAuth, agentController.getAgent);

router.get(
  '/:id/performance',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.SUPER_ADMIN),
  enforceTenant,
  agentController.getAgentPerformance
);

router.patch(
  '/:id',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN),
  enforceTenant,
  requireTenant,
  agentController.updateAgent
);

router.delete(
  '/:id',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN),
  enforceTenant,
  requireTenant,
  agentController.deactivateAgent
);

module.exports = router;
