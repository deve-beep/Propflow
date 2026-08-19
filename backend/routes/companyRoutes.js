const express = require('express');
const companyController = require('../controllers/companyController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.get('/', protect, restrictTo(ROLES.SUPER_ADMIN), companyController.listCompanies);

router.get('/me', protect, restrictTo(ROLES.COMPANY_ADMIN), companyController.getMyCompany);
router.patch('/me', protect, restrictTo(ROLES.COMPANY_ADMIN), companyController.updateMyCompany);

router.get(
  '/staff',
  protect,
  restrictTo(ROLES.COMPANY_ADMIN),
  enforceTenant,
  requireTenant,
  companyController.listCompanyStaff
);

router.patch(
  '/:id/status',
  protect,
  restrictTo(ROLES.SUPER_ADMIN),
  companyController.updateCompanyStatus
);

module.exports = router;
