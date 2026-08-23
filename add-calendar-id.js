const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

const dateStripRegex = /<!-- Date Strip -->\s*<div class="grid grid-cols-7 gap-card-gap">/;
html = html.replace(dateStripRegex, '<!-- Date Strip -->\n  <div id="weeklyCalendarContainer" class="grid grid-cols-7 gap-card-gap">');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('Added weeklyCalendarContainer ID');
