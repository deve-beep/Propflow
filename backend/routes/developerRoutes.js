const express = require('express');
const { body } = require('express-validator');
const developerController = require('../controllers/developerController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get('/', optionalAuth, developerController.listDevelopers);
router.get('/:id', optionalAuth, developerController.getDeveloper);

router.post(
  '/',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.DEVELOPER),
  enforceTenant,
  requireTenant,
  [body('name').trim().notEmpty()],
  validate,
  developerController.createDeveloper
);

router.patch(
  '/:id',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN, ROLES.DEVELOPER),
  enforceTenant,
  requireTenant,
  developerController.updateDeveloper
);

module.exports = router;
