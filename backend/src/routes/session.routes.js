const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/session.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/', authenticate, requireRole('teacher'), ctrl.createSession);
router.get('/schedule', authenticate, ctrl.getScheduledSessions);
router.post('/schedule', authenticate, requireRole('teacher'), ctrl.scheduleSession);
router.get('/', authenticate, ctrl.listSessions);
router.get('/active', authenticate, ctrl.getActiveSession);
router.get('/:sessionId', authenticate, ctrl.getSession);
router.patch('/:sessionId/end', authenticate, requireRole('teacher'), ctrl.endSession);

module.exports = router;
