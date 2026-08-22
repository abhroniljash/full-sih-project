const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const studentsRoutes = require('./routes/students.routes');
const notificationRoutes = require('./routes/notifications.routes');
const messageRoutes = require('./routes/messages.routes');

const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(
  cors({
    origin: config.corsOrigin.includes('*') ? true : config.corsOrigin,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic protection for the login endpoints against brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});
app.use('/api/auth/student/login', authLimiter);
app.use('/api/auth/teacher/login', authLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// --- Serve Frontend Static Files ---
const path = require('path');
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath, { extensions: ['html'] }));
app.get('*', (req, res, next) => {
  // If it starts with /api, let the 404 handler catch it
  if (req.url.startsWith('/api')) {
    return next();
  }
  // Otherwise, serve index.html for frontend routing or just let it fall back
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
