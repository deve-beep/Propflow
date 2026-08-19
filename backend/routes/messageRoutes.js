const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/conversations', messageController.listConversations);
router.post('/conversations', messageController.startConversation);
router.get('/conversations/:id', messageController.getConversationMessages);

module.exports = router;
