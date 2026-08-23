const repo = require('../db/repository');
const { asyncHandler, ApiError } = require('../utils/helpers');

const getMessages = asyncHandler(async (req, res) => {
  const allMessages = repo.all('messages') || [];
  // For teachers, they might match on ID or username. We include messages to them.
  const messages = allMessages.filter(m => m.toId === req.user.id || m.to === req.user.username || (req.user.role === 'teacher' && m.to === 'teacher'));
  res.json({ success: true, messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { to, toId, subject, body } = req.body;
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
