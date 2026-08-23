const html = require('fs').readFileSync('backend/public/teacher-dashboard.html', 'utf8');
const idx = html.indexOf('id="sec-schedule"');
console.log(html.substring(idx - 300, idx + 50));
