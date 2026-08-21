const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/student/register', ctrl.studentRegister);
router.post('/student/login', ctrl.studentLogin);
router.post('/teacher/register', ctrl.teacherRegister);
router.post('/teacher/login', ctrl.teacherLogin);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
