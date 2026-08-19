const express = require('express');
const { body } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { uploadImages } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const STAFF_WRITE_ROLES = [ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER, ROLES.SUPER_ADMIN];

const createPropertyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('listingType').isIn(['SALE', 'RENT']),
  body('propertyType').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('location.city').trim().notEmpty().withMessage('City is required.'),
  body('area.value').isFloat({ min: 1 }),
];

// Public / customer-facing routes
router.get('/', optionalAuth, propertyController.listProperties);
router.get('/map', propertyController.getPropertiesForMap);
router.get('/favorites', protect, propertyController.listFavorites);
router.post('/compare', propertyController.compareProperties);

// Staff dashboard routes (must precede the generic /:idOrSlug catch-all)
router.get(
  '/staff',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  propertyController.listStaffProperties
);

router.post(
  '/',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  createPropertyValidation,
  validate,
  propertyController.createProperty
);

router.patch(
  '/:id/status',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  body('status').isIn(['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'SOLD', 'RENTED']),
  validate,
  propertyController.updatePropertyStatus
);

router.post(
  '/:id/images',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  uploadImages.array('images', 20),
  propertyController.uploadPropertyImages
);

router.patch(
  '/:id',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  propertyController.updateProperty
);

router.delete(
  '/:id',
  protect,
  restrictTo(...STAFF_WRITE_ROLES),
  enforceTenant,
  requireTenant,
  propertyController.deleteProperty
);

router.post('/:id/favorite', protect, propertyController.toggleFavorite);

// Generic detail route — kept last so it doesn't shadow the routes above
router.get('/:idOrSlug', optionalAuth, propertyController.getProperty);

module.exports = router;
