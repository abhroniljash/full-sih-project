const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

const fabStart = html.indexOf('<!-- Face ID Attendance FAB -->');
const modalEnd = html.indexOf('    <script src="config.js">', fabStart);
if (fabStart !== -1 && modalEnd !== -1) {
    html = html.substring(0, fabStart) + html.substring(modalEnd);
}

html = html.replace(/<script src="liveness\.js\?v=1"><\/script>\r?\n\s*/g, '');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('Reverted student-dashboard.html');
