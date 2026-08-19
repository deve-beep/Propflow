const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.patch(
  '/:unitId/status',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.DEVELOPER, ROLES.PROPERTY_MANAGER),
  enforceTenant,
  requireTenant,
  [body('status').isIn(['AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED'])],
  validate,
  projectController.updateUnitStatus
);

module.exports = router;
