const repo = require('../db/repository');
const { asyncHandler } = require('../utils/helpers');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = [];
  
  const sessions = repo.all('sessions');
  const activeSessions = sessions.filter(s => s.status === 'active');
  if (activeSessions.length > 0) {
    notifications.push({
      id: `notif-active-${Date.now()}`,
      type: 'info',
      title: 'Active Sessions',
      message: `You have ${activeSessions.length} active session(s) running`,
      time: new Date().toISOString(),
      read: false
    });
  }

  const students = repo.all('students');
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentStudents = students.filter(s => {
    if (!s.createdAt) return false;
    return new Date(s.createdAt) > oneDayAgo;
  });

  if (recentStudents.length > 0) {
    notifications.push({
      id: `notif-students-${Date.now()}`,
      type: 'success',
      title: 'New Registrations',
      message: `${recentStudents.length} new student(s) registered recently`,
      time: new Date().toISOString(),
      read: false
    });
  }

  notifications.push({
    id: `notif-welcome-${Date.now()}`,
    type: 'info',
    title: 'Welcome',
    message: 'Welcome to the Smart Attendance Teacher Dashboard',
    time: new Date().toISOString(),
    read: true
  });

  // Append broadcast notifications
  const broadcasts = repo.all('broadcast_notifications') || [];
  broadcasts.forEach(b => {
    notifications.push({
      id: b.id,
      type: b.type || 'info',
      title: b.title,
      message: b.message,
      time: b.createdAt,
      read: false
    });
  });

  res.json({ success: true, notifications });
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) throw new ApiError(400, 'Title and message are required');

  const notification = await repo.insert('broadcast_notifications', {
    title,
    message,
    type: type || 'info'
  });

  res.status(201).json({ success: true, notification });
});

module.exports = { getNotifications, broadcastNotification };
