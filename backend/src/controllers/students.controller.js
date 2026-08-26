const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

// GET /api/students
const listStudents = asyncHandler(async (req, res) => {
  const students = repo.all('students').map((s) => {
    const { passwordHash, ...safeData } = s;
    return safeData;
  });
  res.json({ success: true, students });
});

// DELETE /api/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await repo.remove('students', (s) => s.id === id);
  if (!deleted) throw new ApiError(404, 'Student not found');
  res.json({ success: true, message: 'Student deleted successfully' });
});

// PUT /api/students/:id
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, rollNumber, registrationNumber, department, semester } = req.body;

  const student = repo.findOne('students', (s) => s.id === id);
  if (!student) throw new ApiError(404, 'Student not found');

  const updated = await repo.update('students', (s) => s.id === id, {
    name: name || student.name,
    rollNumber: rollNumber || student.rollNumber,
    registrationNumber: registrationNumber || student.registrationNumber,
    department: department || student.department,
    semester: semester || student.semester,
  });

  const { passwordHash, ...safeData } = updated;
  res.json({ success: true, student: safeData });
});

module.exports = { listStudents, deleteStudent, updateStudent };
