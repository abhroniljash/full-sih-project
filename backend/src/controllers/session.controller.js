const repo = require('../db/repository');
const { asyncHandler, ApiError, generateSessionId } = require('../utils/helpers');

// POST /api/sessions  (teacher only)
const createSession = asyncHandler(async (req, res) => {
  const { subject, className, room, description } = req.body;
  if (!subject || !className) {
    throw new ApiError(400, 'subject and className are required');
  }

  const teacher = repo.findOne('teachers', (t) => t.id === req.user.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  let sessionId = generateSessionId();
  // Guard against the (extremely unlikely) random collision.
  while (repo.findOne('sessions', (s) => s.sessionId === sessionId)) {
    sessionId = generateSessionId();
  }

  const session = await repo.insert('sessions', {
    sessionId,
    subject: subject.trim(),
    className: className.trim(),
    room: (room || '').trim(),
    description: (description || '').trim(),
    teacherId: teacher.id,
    teacher: teacher.name,
    date: new Date().toISOString(),
    status: 'active',
  });

  res.status(201).json({ success: true, session });
});

// GET /api/sessions?mine=true&status=active
const listSessions = asyncHandler(async (req, res) => {
  let sessions = repo.all('sessions');

  if (req.query.mine === 'true' && req.user?.role === 'teacher') {
    sessions = sessions.filter((s) => s.teacherId === req.user.id);
  }
  if (req.query.status) {
    sessions = sessions.filter((s) => s.status === req.query.status);
  }
  if (req.query.subject) {
    sessions = sessions.filter((s) => s.subject === req.query.subject);
  }

  res.json({ success: true, count: sessions.length, sessions });
});

// GET /api/sessions/active  (most recent active session, optionally scoped to the logged-in teacher)
const getActiveSession = asyncHandler(async (req, res) => {
  let sessions = repo.all('sessions').filter((s) => s.status === 'active');
  if (req.user?.role === 'teacher') {
    sessions = sessions.filter((s) => s.teacherId === req.user.id);
  }
  const active = sessions[sessions.length - 1] || null;
  res.json({ success: true, session: active });
});

// GET /api/sessions/:sessionId
const getSession = asyncHandler(async (req, res) => {
  const session = repo.findOne('sessions', (s) => s.sessionId === req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  res.json({ success: true, session });
});

// PATCH /api/sessions/:sessionId/end  (teacher only, must own the session)
const endSession = asyncHandler(async (req, res) => {
  const session = repo.findOne('sessions', (s) => s.sessionId === req.params.sessionId);
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.teacherId !== req.user.id) {
    throw new ApiError(403, 'You can only end sessions you created');
  }

  const updated = await repo.update(
    'sessions',
    (s) => s.sessionId === req.params.sessionId,
    { status: 'ended' }
  );
  res.json({ success: true, session: updated });
});

// POST /api/sessions/schedule (teacher only)
const scheduleSession = asyncHandler(async (req, res) => {
  const { subject, className, date, time } = req.body;
  if (!subject || !className || !date || !time) {
    throw new ApiError(400, 'subject, className, date, and time are required');
  }

  const teacher = repo.findOne('teachers', (t) => t.id === req.user.id);
  if (!teacher) throw new ApiError(404, 'Teacher not found');

  const scheduled = await repo.insert('scheduled_sessions', {
    id: Date.now().toString(),
    subject: subject.trim(),
    className: className.trim(),
    teacherId: teacher.id,
    teacher: teacher.name,
    scheduledDate: date,
    scheduledTime: time,
    status: 'pending' // will change to 'started' when cron runs it
  });

  res.json({ success: true, scheduledSession: scheduled });
});


// GET /api/sessions/schedule (student and teacher)
const getScheduledSessions = asyncHandler(async (req, res) => {
  let scheduled = repo.all('scheduled_sessions');
  scheduled = scheduled.filter(s => s.status === 'pending');
  // Sort by date/time
  scheduled.sort((a, b) => new Date(a.scheduledDate + 'T' + a.scheduledTime) - new Date(b.scheduledDate + 'T' + b.scheduledTime));
  res.json({ success: true, count: scheduled.length, scheduled });
});

module.exports = { createSession, listSessions, getActiveSession, getSession, endSession, scheduleSession, getScheduledSessions };
