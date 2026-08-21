const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/mark', authenticate, requireRole('student'), ctrl.markSelf);
router.post('/mark-manual', authenticate, requireRole('teacher'), ctrl.markManual);
router.get('/session/:sessionId', authenticate, ctrl.listBySession);
router.get('/student/:rollNumber', authenticate, ctrl.listByStudent);
router.get('/reports/class', authenticate, requireRole('teacher'), ctrl.classReport);
router.get('/reports/date', authenticate, requireRole('teacher'), ctrl.dateReport);

module.exports = router;
