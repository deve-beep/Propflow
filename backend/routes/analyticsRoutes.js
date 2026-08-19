const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get(
  '/dashboard',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER),
  enforceTenant,
  requireTenant,
  analyticsController.getCrmDashboard
);

router.get(
  '/company',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN),
  enforceTenant,
  requireTenant,
  analyticsController.getCompanyAnalytics
);

router.get('/platform', protect, restrictTo(ROLES.SUPER_ADMIN), analyticsController.getPlatformAnalytics);

module.exports = router;
