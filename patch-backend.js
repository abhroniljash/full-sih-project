const fs = require('fs');

const ctrlFile = 'backend/src/controllers/session.controller.js';
let ctrl = fs.readFileSync(ctrlFile, 'utf8');

if (!ctrl.includes('getScheduledSessions')) {
  const newFunc = `
// GET /api/sessions/schedule (student and teacher)
const getScheduledSessions = asyncHandler(async (req, res) => {
  let scheduled = repo.all('scheduled_sessions');
  scheduled = scheduled.filter(s => s.status === 'pending');
  // Sort by date/time
  scheduled.sort((a, b) => new Date(a.scheduledDate + 'T' + a.scheduledTime) - new Date(b.scheduledDate + 'T' + b.scheduledTime));
  res.json({ success: true, count: scheduled.length, scheduled });
});
`;
  ctrl = ctrl.replace('module.exports = {', newFunc + '\nmodule.exports = {');
  ctrl = ctrl.replace('scheduleSession }', 'scheduleSession, getScheduledSessions }');
  fs.writeFileSync(ctrlFile, ctrl);
  console.log('Added getScheduledSessions to controller');
}

const routesFile = 'backend/src/routes/session.routes.js';
let routes = fs.readFileSync(routesFile, 'utf8');
if (!routes.includes('router.get(\'/schedule\', authenticate, ctrl.getScheduledSessions);')) {
  routes = routes.replace('router.post(\'/schedule\',', 'router.get(\'/schedule\', authenticate, ctrl.getScheduledSessions);\nrouter.post(\'/schedule\',');
  fs.writeFileSync(routesFile, routes);
  console.log('Added GET /schedule to routes');
}
