const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get(
  '/:reportType',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.PROPERTY_MANAGER),
  enforceTenant,
  requireTenant,
  reportController.generateReport
);

module.exports = router;
