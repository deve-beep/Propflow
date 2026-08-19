const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/query', optionalAuth, [body('query').trim().notEmpty()], validate, aiController.query);

module.exports = router;
