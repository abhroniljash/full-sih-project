const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

const regex = /<!-- Schedule Auto-Session -->[\s\S]*?<button class="btn btn-primary" id="btnSchedule"[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/;
const match = html.match(regex);
const scheduleCard = match[0];
html = html.replace(scheduleCard, '');

const newSection = `
        <div id="sec-schedule" class="main-section" style="display:none;">
            <div class="page-header">
                <div>
                    <h2>Schedule Classes</h2>
                    <p class="subtitle">Plan upcoming sessions in advance</p>
                </div>
            </div>
            ${scheduleCard}
        </div>
`;

const settingsIdx = html.indexOf('<div id="sec-settings"');
html = html.substring(0, settingsIdx) + newSection + '\n' + html.substring(settingsIdx);

const navItem = `<button class="nav-item" data-sec="schedule"><span class="icon"><i class="fa-regular fa-calendar-plus"></i></span> Schedule Session</button>`;
html = html.replace('<button class="nav-item" data-sec="create">', navItem + '\n                <button class="nav-item" data-sec="create">');

html = html.replace(/teacher-dashboard\.js\?v=\d+/, 'teacher-dashboard.js?v=' + Date.now());

fs.writeFileSync('backend/public/teacher-dashboard.html', html);
console.log('Has sec-schedule:', html.includes('sec-schedule'));
