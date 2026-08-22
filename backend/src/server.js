// --- POLYFILL FOR HOSTINGER (Older Node.js versions) ---
if (typeof global.crypto === 'undefined') {
  try {
    global.crypto = require('crypto').webcrypto || require('crypto');
  } catch (e) {}
}

require('dotenv').config();
const app = require('./app');
const config = require('./config');
const db = require('./db/cloudDb');

async function startServer() {
  await db.init();
  
  app.listen(config.port, () => {
    console.log(`Smart Attendance API listening on http://localhost:${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/api/health`);
  });
}

startServer();
