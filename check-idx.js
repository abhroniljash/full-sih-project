const fs = require('fs');
const html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');
const idx1 = html.indexOf('id="sec-schedule"');
const idx2 = html.indexOf('id="sec-dashboard"');
console.log('sec-schedule:', idx1, 'sec-dashboard:', idx2);
