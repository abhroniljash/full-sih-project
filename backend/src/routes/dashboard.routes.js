const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/student', authenticate, requireRole('student'), ctrl.studentDashboard);
router.get('/teacher', authenticate, requireRole('teacher'), ctrl.teacherDashboard);

module.exports = router;
