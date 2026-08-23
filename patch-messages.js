const fs = require('fs');
const file = 'backend/src/controllers/messages.controller.js';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  'm.toId === req.user.id || m.to === req.user.username',
  "m.toId === req.user.id || m.to === req.user.username || (req.user.role === 'teacher' && m.to === 'teacher')"
);
fs.writeFileSync(file, code);
console.log('Patched messages controller');
