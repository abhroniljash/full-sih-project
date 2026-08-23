const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');
const config = require('../config');

// GET /api/dashboard/student  (student only)
// Reproduces the "75% tracker" math from student-dashboard.js loadDashboard().
const studentDashboard = asyncHandler(async (req, res) => {
  const student = repo.findOne('students', (s) => s.id === req.user.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const allSessions = repo.all('sessions');
  const myAttendance = repo.findMany('attendance', (a) => a.rollNumber === student.rollNumber);

  // Only count subjects the student has actually attended at least once;
  // if they haven't attended anything yet, fall back to showing everything
  // so the dashboard isn't completely empty (same bug-fix note as the frontend).
  const enrolledSubjects = {};
  myAttendance.forEach((a) => {
    const session = allSessions.find((s) => s.sessionId === a.sessionId);
    if (session) enrolledSubjects[session.subject] = session.teacher;
  });

  let subjectKeys = Object.keys(enrolledSubjects);
  let relevantSessions;
  if (subjectKeys.length === 0) {
    relevantSessions = allSessions;
    const temp = {};
    relevantSessions.forEach((s) => (temp[s.subject] = s.teacher));
    subjectKeys = Object.keys(temp);
    Object.assign(enrolledSubjects, temp);
  } else {
    relevantSessions = allSessions.filter((s) => subjectKeys.includes(s.subject));
  }

  const timeframe = req.query.timeframe; // 'monthly' or 'semester'
  if (timeframe === 'monthly') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      relevantSessions = relevantSessions.filter(s => {
          if (!s.date) return false;
          const sDate = new Date(s.date);
          return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      });
  }


  const totalClasses = relevantSessions.length;
  const totalAttended = myAttendance.length;
  const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  const subjectData = {};
  subjectKeys.forEach((subj) => {
    subjectData[subj] = { total: 0, attended: 0, teacher: enrolledSubjects[subj] };
  });
  relevantSessions.forEach((s) => {
    if (subjectData[s.subject]) subjectData[s.subject].total++;
  });
  myAttendance.forEach((a) => {
    const session = allSessions.find((s) => s.sessionId === a.sessionId);
    if (session && subjectData[session.subject]) subjectData[session.subject].attended++;
  });

  const threshold = config.attendanceThreshold;
  const tracker = Object.entries(subjectData).map(([subject, d]) => {
    const percentage = d.total > 0 ? Math.round((d.attended / d.total) * 100) : 0;
    // classes needed to reach `threshold`%: n such that (attended+n)/(total+n) >= threshold/100
    const needed = Math.max(
      0,
      Math.ceil((threshold * d.total - 100 * d.attended) / (100 - threshold))
    );
    return {
      subject,
      teacher: d.teacher,
      total: d.total,
      attended: d.attended,
      percentage,
      classesNeededFor75: needed,
      safe: needed === 0,
    };
  });

  const history = myAttendance
    .slice()
    .reverse()
    .slice(0, 10)
    .map((a) => {
      const session = allSessions.find((s) => s.sessionId === a.sessionId);
      return {
        timestamp: a.timestamp,
        subject: session ? session.subject : 'Unknown',
        sessionId: a.sessionId,
        status: 'Present',
      };
    });

  
  // Calculate specific missed/absent sessions
  const absences = [];
  relevantSessions.forEach(session => {
    // only count completed sessions
    if (session.status !== 'completed') return;
    const attendedThisSession = myAttendance.some(a => a.sessionId === session.sessionId);
    if (!attendedThisSession) {
      absences.push({
        sessionId: session.sessionId,
        subject: session.subject,
        timestamp: session.date + 'T' + (session.startTime || '00:00:00'), // approximate timestamp
        status: 'Absent'
      });
    }
  });

  res.json({
    success: true,
    absences: absences,
    totalClasses,
    totalAttended,
    overallPercentage,
    tracker,
    history,
  });
});

// GET /api/dashboard/teacher  (teacher only)
// Returns stats scoped to the logged-in teacher's own sessions & attendance only.
const teacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user.id;

  // Only this teacher's sessions
  const sessions = repo.findMany('sessions', (s) => s.teacherId === teacherId);
  const sessionIds = new Set(sessions.map((s) => s.sessionId));

  // Only attendance from this teacher's sessions
  const attendance = repo.findMany('attendance', (a) => sessionIds.has(a.sessionId));

  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const subjects = [...new Set(sessions.map((s) => s.subject))];

  const recentSessions = sessions
    .slice()
    .reverse()
    .slice(0, 5)
    .map((s) => ({
      sessionId: s.sessionId,
      subject: s.subject,
      className: s.className,
      date: s.date,
      status: s.status,
    }));

  const weeklyData = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = attendance.filter((a) => {
      if (!a.timestamp) return false;
      const aDate = new Date(a.timestamp);
      return !isNaN(aDate) && aDate.toISOString().startsWith(dateStr);
    }).length;
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    weeklyData.push({ day, date: dateStr, count });
  }

  // Participation: only students who attended THIS teacher's sessions
  const uniqueRolls = new Set(attendance.map((a) => a.rollNumber));
  const totalRegistered = repo.all('students').length;
  const totalParticipated = uniqueRolls.size;
  const neverAttended = totalRegistered - totalParticipated;
  const participationData = { totalRegistered, totalParticipated, neverAttended };

  res.json({
    success: true,
    totalSessions: sessions.length,
    activeNow: activeCount,
    totalAttendanceMarks: attendance.length,
    totalSubjects: subjects.length,
    recentSessions,
    weeklyData,
    participationData,
  });
});

module.exports = { studentDashboard, teacherDashboard };
