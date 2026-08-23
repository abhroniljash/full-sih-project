const fs = require('fs');

const dashboardPath = 'backend/public/student-dashboard.html';
let dashboard = fs.readFileSync(dashboardPath, 'utf8');

const headerStart = dashboard.indexOf('<!-- BEGIN: Top Header -->');
if (headerStart === -1) {
    console.error("Could not find Top Header");
    process.exit(1);
}

const headerEnd = dashboard.indexOf('</header>', headerStart) + 9; // 9 is length of </header>

const firstPart = dashboard.substring(0, headerStart);
const secondPart = dashboard.substring(headerEnd);

let finalHtml = firstPart + secondPart;

// Bump JS cache version
finalHtml = finalHtml.replace(/student-dashboard\.js\?v=\d+/, 'student-dashboard.js?v=' + Date.now());

fs.writeFileSync(dashboardPath, finalHtml);
console.log("Successfully removed Top Header!");
