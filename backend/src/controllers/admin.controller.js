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

module.exports = { getTeachers, getTeacherActivity, deleteTeacher };
