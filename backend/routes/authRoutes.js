const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long.');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('phone').optional().trim(),
    passwordRule,
  ],
  validate,
  authController.registerCustomer
);

router.post(
  '/register-company',
  [
    body('companyName').trim().notEmpty().withMessage('Company name is required.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    passwordRule,
  ],
  validate,
  authController.registerCompany
);

router.post(
  '/invite',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn([ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER, ROLES.DEVELOPER]),
    passwordRule,
  ],
  validate,
  authController.inviteStaff
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

router.post('/reset-password/:token', [passwordRule], validate, authController.resetPassword);

router.post('/verify-email/:token', authController.verifyEmail);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validate,
  authController.changePassword
);

router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);

module.exports = router;
