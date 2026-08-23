const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

const getMessages = asyncHandler(async (req, res) => {
  const allMessages = repo.all('messages') || [];
  // For teachers, they might match on ID or username. We include messages to them.
  let messages = allMessages.filter(m => 
    m.toId === req.user.id || 
    m.to === req.user.username || 
    (req.user.role === 'teacher' && m.to === 'teacher' && !m.toId) ||
    m.from === req.user.username || 
    m.from === req.user.id
  );;
  
  // Populate real name
  messages = messages.map(m => {
    let realName = m.fromName;
    if (!realName || realName === 'Unknown') {
      if (m.fromRole === 'student') {
        const student = repo.findOne('students', s => s.username === m.from || s.id === m.from);
        if (student) realName = student.name;
      } else if (m.fromRole === 'teacher') {
        const teacher = repo.findOne('teachers', t => t.employeeId === m.from || t.id === m.from);
        if (teacher) realName = teacher.name;
      }
    }
    return { ...m, fromName: realName || m.fromName };
  });

  messages = messages.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({ success: true, messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { to, toId, subject, body, replyTo, status } = req.body;
  if (!body) throw new ApiError(400, 'Message body is required');

  const newMessage = await repo.insert('messages', {
    from: req.user.username || req.user.id,
    fromName: req.user.name || 'Unknown',
    fromRole: req.user.role,
    to,
    toId,
    subject: subject || 'No Subject',
    body,
    timestamp: new Date().toISOString(),
    read: false
  });

  // If this is a reply to an existing concern, mark the original with the provided status (or 'resolved')
  if (replyTo) {
    const updateStatus = status || 'resolved';
    await repo.update('messages', m => m.id === replyTo, { status: updateStatus });
  }

  res.json({ success: true, message: newMessage });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const message = repo.findOne('messages', m => m.id === id);
  if (!message) throw new ApiError(404, 'Message not found');
  
  const updated = await repo.update('messages', m => m.id === id, { read: true });
  res.json({ success: true, message: updated });
});

module.exports = { getMessages, sendMessage, markRead };
