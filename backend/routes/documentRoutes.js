const express = require('express');
const documentController = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/auth');
const { enforceTenant, requireTenant } = require('../middleware/tenant');
const { uploadAny } = require('../middleware/upload');
const { ROLES } = require('../utils/constants');

const router = express.Router();

const STAFF_ROLES = [ROLES.COMPANY_ADMIN, ROLES.AGENT, ROLES.BROKER, ROLES.PROPERTY_MANAGER, ROLES.DEVELOPER];

router.use(protect, restrictTo(...STAFF_ROLES), enforceTenant, requireTenant);

router.get('/', documentController.listDocuments);
router.post('/', uploadAny.single('file'), documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
