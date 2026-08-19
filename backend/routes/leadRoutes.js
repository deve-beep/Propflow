const express = require('express');
const { body } = require('express-validator');
const leadController = require('../controllers/leadController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const CRM_ROLES = [ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER];

router.use(protect, restrictTo(...CRM_ROLES), enforceTenant, requireTenant);

router.get('/', leadController.listLeads);
router.get('/pipeline', leadController.getPipeline);
router.get('/:id', leadController.getLead);
router.get('/:id/activity', leadController.getLeadActivity);

router.post(
  '/',
  [body('name').trim().notEmpty(), body('phone').trim().notEmpty()],
  validate,
  leadController.createLead
);

router.patch('/:id', leadController.updateLead);
router.patch(
  '/:id/status',
  [body('status').notEmpty()],
  validate,
  leadController.updateLeadStatus
);
router.post('/:id/notes', leadController.addNote);
router.delete('/:id', leadController.archiveLead);

module.exports = router;
