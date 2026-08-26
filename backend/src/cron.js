const cron = require('node-cron');
const repo = require('./db/repository');
const { generateSessionId } = require('./utils/helpers');

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('[CRON] Checking for scheduled sessions...');

  // Get current time in IST (Asia/Kolkata)
  const dateString = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
  const istDate = new Date(dateString);

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
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
        // Carry the room the teacher entered when scheduling through to the live
        // session, so "Next Location" keeps naming the same place once it starts.
        room: (s.room || '').trim() || 'Auto-Scheduled',
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
