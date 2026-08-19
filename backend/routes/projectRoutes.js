const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const DEV_ROLES = [ROLES.COMPANY_ADMIN, ROLES.DEVELOPER, ROLES.PROPERTY_MANAGER];

router.get('/', optionalAuth, projectController.listProjects);
router.get('/:idOrSlug', optionalAuth, projectController.getProject);

router.post(
  '/',
  protect,
  restrictTo(...DEV_ROLES),
  enforceTenant,
  requireTenant,
  [body('name').trim().notEmpty(), body('developer').notEmpty(), body('location.city').trim().notEmpty()],
  validate,
  projectController.createProject
);

router.post(
  '/:id/buildings',
  protect,
  restrictTo(...DEV_ROLES),
  enforceTenant,
  requireTenant,
  [body('name').trim().notEmpty(), body('totalFloors').isInt({ min: 1 })],
  validate,
  projectController.addBuilding
);

router.get('/:id/buildings/:buildingId/units', optionalAuth, projectController.listUnits);

router.post(
  '/:id/buildings/:buildingId/units',
  protect,
  restrictTo(...DEV_ROLES),
  enforceTenant,
  requireTenant,
  projectController.addUnits
);

module.exports = router;
