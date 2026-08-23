const fs = require('fs');
let code = fs.readFileSync('backend/src/controllers/dashboard.controller.js', 'utf8');

const absencesBlock = `
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
`;

// Insert it before `res.json({`
code = code.replace(/res\.json\(\{[\s\S]*?success: true,/, absencesBlock + '\n  res.json({\n    success: true,\n    absences: absences,');
fs.writeFileSync('backend/src/controllers/dashboard.controller.js', code);
console.log('Added absences logic to studentDashboard');
