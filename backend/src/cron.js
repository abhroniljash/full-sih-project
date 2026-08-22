const cron = require('node-cron');
const repo = require('./db/repository');
const { generateSessionId } = require('./utils/helpers');

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('[CRON] Checking for scheduled sessions...');
  const now = new Date();
  // We'll format current date as YYYY-MM-DD and time as HH:MM
  // Note: local time comparison
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  // Find pending scheduled sessions that are due
  const pendingSessions = repo.findMany('scheduled_sessions', s => 
    s.status === 'pending' && 
    (s.scheduledDate < currentDate || (s.scheduledDate === currentDate && s.scheduledTime <= currentTime))
  );

  for (const s of pendingSessions) {
    try {
      console.log(`[CRON] Auto-starting session for ${s.subject} by ${s.teacher}`);
      
      let sessionId = generateSessionId();
      while (repo.findOne('sessions', (x) => x.sessionId === sessionId)) {
        sessionId = generateSessionId();
      }

      // Automatically end any currently active session for this teacher
      await repo.update('sessions', 
        x => x.teacherId === s.teacherId && x.status === 'active',
        { status: 'ended' }
      );

      // Create the new active session
      await repo.insert('sessions', {
        sessionId,
        subject: s.subject,
        className: s.className,
        room: 'Auto-Scheduled',
        description: 'Automatically started session',
        teacherId: s.teacherId,
        teacher: s.teacher,
        date: new Date().toISOString(),
        status: 'active'
      });

      // Mark the schedule as started
      await repo.update('scheduled_sessions', x => x.id === s.id, { status: 'started' });
    } catch(err) {
      console.error('[CRON] Error auto-starting session:', err);
    }
  }
});
