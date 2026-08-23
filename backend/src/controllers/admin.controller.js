const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = repo.all('teachers') || [];
  res.json({ success: true, teachers });
});

const getTeacherActivity = asyncHandler(async (req, res) => {
  const activity = repo.all('teacher_activity') || [];
  res.json({ success: true, activity });
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const removed = await repo.remove('teachers', (t) => t.id === id);
  if (!removed) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, message: 'Teacher deleted successfully' });
});

const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, department, subject } = req.body;
  const teacher = repo.findOne('teachers', (t) => t.id === id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (department !== undefined) updates.department = department;
  if (subject !== undefined) updates.subject = subject;
  await repo.update('teachers', (t) => t.id === id, updates);
  res.json({ success: true, message: 'Teacher updated successfully' });
});

module.exports = { getTeachers, getTeacherActivity, deleteTeacher, updateTeacher };
