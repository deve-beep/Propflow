const express = require('express');
const { body } = require('express-validator');
const appointmentController = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant } = require('../middleware/tenant');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(protect, enforceTenant);

router.post(
  '/',
  restrictTo(ROLES.CUSTOMER),
  [
    body('property').notEmpty(),
    body('scheduledDate').notEmpty(),
    body('scheduledTime').notEmpty(),
  ],
  validate,
  appointmentController.requestAppointment
);

router.get('/', appointmentController.listAppointments);

router.patch(
  '/:id/status',
  [body('status').isIn(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])],
  validate,
  appointmentController.updateAppointmentStatus
);

module.exports = router;
