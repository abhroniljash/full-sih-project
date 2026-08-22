const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/admin/login', ctrl.adminLogin);
router.post('/student/register', ctrl.studentRegister);
router.post('/student/login', ctrl.studentLogin);
router.post('/teacher/register', authenticate, requireRole('admin'), ctrl.teacherRegister);
router.post('/teacher/login', ctrl.teacherLogin);
router.post('/teacher/logout', authenticate, ctrl.teacherLogout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
