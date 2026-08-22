const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function sanitizeStudent(s) {
  const { passwordHash, ...rest } = s;
  return rest;
}
function sanitizeTeacher(t) {
  const { passwordHash, ...rest } = t;
  return rest;
}

// POST /api/auth/student/register
const studentRegister = asyncHandler(async (req, res) => {
  const { rollNumber, name, password, department, semester } = req.body;

  if (!rollNumber || !name || !password) {
    throw new ApiError(400, 'rollNumber, name and password are required');
  }
  if (!/^\d+$/.test(rollNumber.trim())) {
    throw new ApiError(400, 'Roll Number must contain only numbers');
  }
  if (req.body.registrationNumber && !/^\d+$/.test(req.body.registrationNumber.trim())) {
    throw new ApiError(400, 'Registration Number must contain only numbers');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const roll = rollNumber.trim().toUpperCase();
  const existing = repo.findOne('students', (s) => s.rollNumber === roll);
  if (existing) throw new ApiError(409, 'A student with this roll number already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const student = await repo.insert('students', {
    rollNumber: roll,
    registrationNumber: req.body.registrationNumber || null,
    name: name.trim(),
    department: department || 'Computer Science',
    semester: semester || '5th Semester',
    passwordHash,
  });

  const token = signToken({ id: student.id, role: 'student', rollNumber: student.rollNumber });
  res.status(201).json({ success: true, token, user: sanitizeStudent(student) });
});

// POST /api/auth/student/login
const studentLogin = asyncHandler(async (req, res) => {
  const { rollNumber, password } = req.body;
  if (!rollNumber || !password) {
    throw new ApiError(400, 'rollNumber and password are required');
  }

  const roll = rollNumber.trim().toUpperCase();
  const student = repo.findOne('students', (s) => s.rollNumber === roll);
  if (!student) throw new ApiError(401, 'Invalid roll number or password');

  const ok = await bcrypt.compare(password, student.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid roll number or password');

  const token = signToken({ id: student.id, role: 'student', rollNumber: student.rollNumber });
  res.json({ success: true, token, user: sanitizeStudent(student) });
});

// POST /api/auth/teacher/register
const teacherRegister = asyncHandler(async (req, res) => {
  const { email, name, password, department } = req.body;

  if (!email || !email.includes('@') || !password) {
    throw new ApiError(400, 'A valid email and password are required');
  }
  if (!email.trim().toLowerCase().endsWith('@agemc.ac.in')) {
    throw new ApiError(400, 'Email not supported. Must use @agemc.ac.in domain.');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = repo.findOne('teachers', (t) => t.email === normalizedEmail);
  if (existing) throw new ApiError(409, 'A teacher with this email already exists');

  const derivedName =
    name && name.trim()
      ? name.trim()
      : normalizedEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

  const passwordHash = await bcrypt.hash(password, 10);
  const teacher = await repo.insert('teachers', {
    email: normalizedEmail,
    name: derivedName,
    department: department || 'Computer Science',
    subject: req.body.subject || 'General',
    employeeId: 'TCH-' + Math.floor(Math.random() * 9000 + 1000),
    passwordHash,
  });

  const token = signToken({ id: teacher.id, role: 'teacher', email: teacher.email });
  res.status(201).json({ success: true, token, user: sanitizeTeacher(teacher) });
});

// POST /api/auth/teacher/login
const teacherLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.includes('@') || !password) {
    throw new ApiError(400, 'A valid email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const teacher = repo.findOne('teachers', (t) => t.email === normalizedEmail);
  if (!teacher) throw new ApiError(401, 'Invalid email or password');

  const ok = await bcrypt.compare(password, teacher.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid email or password');

  const token = signToken({ id: teacher.id, role: 'teacher', email: teacher.email });
  
  await repo.insert('teacher_activity', {
    teacherId: teacher.id,
    teacherName: teacher.name,
    type: 'login'
  });

  res.json({ success: true, token, user: sanitizeTeacher(teacher) });
});

function sanitizeAdmin(a) {
  const { passwordHash, ...rest } = a;
  return rest;
}

// POST /api/auth/admin/login
const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, 'username and password required');

  let admin = repo.findOne('admins', (a) => a.username === username);
  
  // Seed default admin if no admins exist
  if (!admin && repo.all('admins').length === 0 && username === 'admin') {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await repo.insert('admins', {
      username: 'admin',
      name: 'Super Admin',
      passwordHash
    });
  }

  if (!admin) throw new ApiError(401, 'Invalid credentials');
  
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  const token = signToken({ id: admin.id, role: 'admin', username: admin.username });
  res.json({ success: true, token, user: sanitizeAdmin(admin) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    const student = repo.findOne('students', (s) => s.id === req.user.id);
    if (!student) throw new ApiError(404, 'Student not found');
    return res.json({ success: true, user: sanitizeStudent(student), role: 'student' });
  }
  if (req.user.role === 'admin') {
    const admin = repo.findOne('admins', (a) => a.id === req.user.id);
    if (!admin) throw new ApiError(404, 'Admin not found');
    return res.json({ success: true, user: sanitizeAdmin(admin), role: 'admin' });
  }
  const teacher = repo.findOne('teachers', (t) => t.id === req.user.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  res.json({ success: true, user: sanitizeTeacher(teacher), role: 'teacher' });
});

// POST /api/auth/teacher/logout
const teacherLogout = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'teacher') {
    const teacher = repo.findOne('teachers', (t) => t.id === req.user.id);
    if (teacher) {
      await repo.insert('teacher_activity', {
        teacherId: teacher.id,
        teacherName: teacher.name,
        type: 'logout'
      });
    }
  }
  res.json({ success: true });
});

module.exports = { studentRegister, studentLogin, teacherRegister, teacherLogin, teacherLogout, adminLogin, me };
