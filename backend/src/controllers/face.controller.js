const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * Face verification runs entirely in the browser with face-api.js — this
 * backend never receives or processes an image. It only stores/serves the
 * numeric face "descriptor" (a 128-length float array) that face-api.js
 * computes client-side, and matching also happens client-side (teacher's
 * live-session page compares the camera's descriptor against every
 * enrolled student's descriptor using face-api's Euclidean distance).
 */

// PUT /api/students/face  (student only) — save/replace my own descriptor
const enrollFace = asyncHandler(async (req, res) => {
  const { descriptor } = req.body;

  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    throw new ApiError(400, 'descriptor must be a 128-length numeric array from face-api.js');
  }
  if (!descriptor.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    throw new ApiError(400, 'descriptor must contain only finite numbers');
  }

  const student = repo.findOne('students', (s) => s.id === req.user.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const updated = await repo.update('students', (s) => s.id === req.user.id, {
    faceDescriptor: descriptor,
    faceImage: req.body.faceImage || null,
    faceEnrolledAt: new Date().toISOString(),
  });

  const { passwordHash, ...safe } = updated;
  res.json({ success: true, student: safe });
});

// GET /api/students/face-descriptors  (teacher only)
// Returns every enrolled student's descriptor so the live-session page can
// run face-api's matching entirely client-side, once per session load.
const listFaceDescriptors = asyncHandler(async (req, res) => {
  const students = repo
    .all('students')
    .filter((s) => Array.isArray(s.faceDescriptor))
    .map((s) => ({
      rollNumber: s.rollNumber,
      name: s.name,
      descriptor: s.faceDescriptor,
    }));

  res.json({ success: true, count: students.length, students });
});

// DELETE /api/students/face  (student only) — remove my enrollment, e.g. to re-enroll
const deleteFace = asyncHandler(async (req, res) => {
  const updated = await repo.update('students', (s) => s.id === req.user.id, {
    faceDescriptor: null,
    faceEnrolledAt: null,
  });
  if (!updated) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Face enrollment removed' });
});

module.exports = { enrollFace, listFaceDescriptors, deleteFace };
