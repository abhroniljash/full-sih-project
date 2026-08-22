const express = require('express');
const router = express.Router();
const faceCtrl = require('../controllers/face.controller');
const stdCtrl = require('../controllers/students.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// --- Face routes MUST come before /:id to avoid 'face' being matched as an id ---
router.put('/face', authenticate, requireRole('student'), faceCtrl.enrollFace);
router.delete('/face', authenticate, requireRole('student'), faceCtrl.deleteFace);
router.get('/face-descriptors', authenticate, requireRole('teacher'), faceCtrl.listFaceDescriptors);

router.get('/', authenticate, requireRole('teacher'), stdCtrl.listStudents);
router.put('/:id', authenticate, requireRole('teacher'), stdCtrl.updateStudent);
router.delete('/:id', authenticate, requireRole('teacher'), stdCtrl.deleteStudent);

module.exports = router;
