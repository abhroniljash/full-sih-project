const repo = require('../db/repository');
const { asyncHandler } = require('../utils/helpers');

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = repo.all('teachers') || [];
  res.json({ success: true, teachers });
});

const getTeacherActivity = asyncHandler(async (req, res) => {
  const activity = repo.all('teacher_activity') || [];
  res.json({ success: true, activity });
});

module.exports = { getTeachers, getTeacherActivity };
