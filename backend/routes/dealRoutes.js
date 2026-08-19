const express = require('express');
const { body } = require('express-validator');
const dealController = require('../controllers/dealController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const CRM_ROLES = [ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER];
router.use(protect, restrictTo(...CRM_ROLES), enforceTenant, requireTenant);

router.get('/', dealController.listDeals);
router.post(
  '/',
  [
    body('lead').notEmpty(),
    body('property').notEmpty(),
    body('customer').notEmpty(),
    body('agent').notEmpty(),
    body('dealValue').isFloat({ min: 0 }),
  ],
  validate,
  dealController.createDeal
);
router.patch(
  '/:id/stage',
  [body('stage').isIn(['OPEN', 'WON', 'LOST'])],
  validate,
  dealController.updateDealStage
);

module.exports = router;
