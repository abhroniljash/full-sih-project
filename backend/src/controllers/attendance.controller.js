const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

function getActiveOrThrow(sessionId) {
  const session = repo.findOne('sessions', (s) => s.sessionId === sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status !== 'active') throw new ApiError(400, 'This session has already ended');
  return session;
}


const markSelf = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) throw new ApiError(400, 'sessionId is required');

  const session = getActiveOrThrow(sessionId);
  const student = repo.findOne('students', (s) => s.id === req.user.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const already = repo.findOne(
    'attendance',
    (a) => a.sessionId === sessionId && a.rollNumber === student.rollNumber
  );
  if (already) throw new ApiError(409, 'Attendance already marked for this session');

  const record = await repo.insert('attendance', {
    sessionId,
    subject: session.subject,
    rollNumber: student.rollNumber,
    studentName: student.name,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ success: true, record });
});


const markManual = asyncHandler(async (req, res) => {
  const { sessionId, rollNumber, studentName } = req.body;
  if (!sessionId || !rollNumber || !studentName) {
    throw new ApiError(400, 'sessionId, rollNumber and studentName are required');
  }

  const session = getActiveOrThrow(sessionId);
  if (session.teacherId !== req.user.id) {
    throw new ApiError(403, 'You can only mark attendance for your own session');
  }

  const roll = rollNumber.trim().toUpperCase();
  const already = repo.findOne(
    'attendance',
    (a) => a.sessionId === sessionId && a.rollNumber === roll
  );
  if (already) throw new ApiError(409, 'Attendance already marked for this student');

  const record = await repo.insert('attendance', {
    sessionId,
    subject: session.subject,
    rollNumber: roll,
    studentName: studentName.trim(),
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ success: true, record });
});


const listBySession = asyncHandler(async (req, res) => {
  const session = repo.findOne('sessions', (s) => s.sessionId === req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  if (req.user.role === 'teacher' && session.teacherId !== req.user.id) {
    throw new ApiError(403, 'You can only view attendance for your own session');
  }

  const records = repo.findMany('attendance', (a) => a.sessionId === req.params.sessionId);
  res.json({ success: true, count: records.length, records });
});


const listByStudent = asyncHandler(async (req, res) => {
  const roll = req.params.rollNumber.trim().toUpperCase();
  if (req.user.role === 'student' && req.user.rollNumber !== roll) {
    throw new ApiError(403, 'You can only view your own attendance');
  }

  const records = repo.findMany('attendance', (a) => a.rollNumber === roll);
  res.json({ success: true, count: records.length, records });
});

const myRecords = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    throw new ApiError(403, 'Only students can view their own records');
  }
  const roll = req.user.rollNumber;
  const records = repo.findMany('attendance', (a) => a.rollNumber === roll);

  // Calculate total sessions per subject
  const sessions = repo.all('sessions') || [];
  const subjectTotals = {};
  sessions.forEach(s => {
    subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + 1;
  });

  const studentTotals = {};
  records.forEach(r => {
    studentTotals[r.subject] = (studentTotals[r.subject] || 0) + 1;
  });

  const aggregates = [];
  for (const subject in subjectTotals) {
    const total = subjectTotals[subject];
    const attended = studentTotals[subject] || 0;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    aggregates.push({ subject, total, attended, percentage });
  }

  res.json({ success: true, records, aggregates });
});


const classReport = asyncHandler(async (req, res) => {
  const { subject } = req.query;
  if (!subject) throw new ApiError(400, 'subject query param is required');

  const sessions = repo.findMany(
    'sessions',
    (s) => s.subject === subject && s.teacherId === req.user.id
  );
  const totalClasses = sessions.length;
  const sessionIds = new Set(sessions.map((s) => s.sessionId));
  const attendance = repo.findMany('attendance', (a) => sessionIds.has(a.sessionId));

  const studentMap = {};
  attendance.forEach((a) => {
    if (!studentMap[a.rollNumber]) {
      studentMap[a.rollNumber] = { rollNumber: a.rollNumber, name: a.studentName, attended: 0 };
    }
    studentMap[a.rollNumber].attended++;
  });

  const rows = Object.values(studentMap).map((s) => ({
    ...s,
    totalClasses,
    percentage: totalClasses > 0 ? Math.round((s.attended / totalClasses) * 100) : 0,
  }));

  res.json({ success: true, subject, totalClasses, rows });
});


const dateReport = asyncHandler(async (req, res) => {
  const { subject, date } = req.query;
  if (!subject || !date) throw new ApiError(400, 'subject and date query params are required');

  const sessions = repo.findMany(
    'sessions',
    (s) => s.subject === subject && s.teacherId === req.user.id && s.date.startsWith(date)
  );
  const sessionIds = new Set(sessions.map((s) => s.sessionId));
  const present = repo.findMany('attendance', (a) => sessionIds.has(a.sessionId));

  res.json({ success: true, subject, date, totalPresent: present.length, records: present });
});

module.exports = { markSelf, markManual, listBySession, listByStudent, myRecords, classReport, dateReport };
