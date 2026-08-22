const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getMessages);
router.post('/', authenticate, ctrl.sendMessage);
router.patch('/:id/read', authenticate, ctrl.markRead);

module.exports = router;
