const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/teachers', authenticate, requireRole('admin'), ctrl.getTeachers);
router.delete('/teachers/:id', authenticate, requireRole('admin'), ctrl.deleteTeacher);
router.get('/teacher-activity', authenticate, requireRole('admin'), ctrl.getTeacherActivity);

module.exports = router;
