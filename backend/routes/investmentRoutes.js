const express = require('express');
const investmentController = require('../controllers/investmentController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/emi', optionalAuth, investmentController.emiCalculator);
router.post('/rental-yield', optionalAuth, investmentController.rentalYieldCalculator);
router.post('/appreciation', optionalAuth, investmentController.appreciationCalculator);
router.post('/roi', optionalAuth, investmentController.roiCalculator);

module.exports = router;
