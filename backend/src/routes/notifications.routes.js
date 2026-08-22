const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifications.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('teacher'), ctrl.getNotifications);
router.post('/broadcast', authenticate, requireRole('admin'), ctrl.broadcastNotification);

module.exports = router;
