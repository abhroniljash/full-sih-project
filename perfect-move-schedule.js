const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

// 1. Extract Schedule Auto-Session block
const regex = /<!-- Schedule Auto-Session -->[\s\S]*?<button class="btn btn-primary" id="btnSchedule"[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
const match = html.match(regex);
if (!match) {
    console.error("Regex failed to match schedule block");
    process.exit(1);
}
const scheduleCard = match[0];

// Remove it from current location
html = html.replace(scheduleCard, '');

// Create new section wrapper with the exact same class "section" as others!
const newSection = `
                <div class="section" id="sec-schedule" style="display:none;">
                    <div class="page-header">
                        <div>
                            <h2>Schedule Classes</h2>
                            <p class="subtitle">Plan upcoming sessions in advance</p>
                        </div>
                    </div>
                    ${scheduleCard}
                </div>
`;

// 2. Insert the new section immediately before <div class="section" id="sec-settings">
const settingsTarget = '<div class="section" id="sec-settings">';
const settingsIdx = html.indexOf(settingsTarget);
if (settingsIdx === -1) {
    console.error("Could not find sec-settings");
    process.exit(1);
}
html = html.substring(0, settingsIdx) + newSection + '\n' + html.substring(settingsIdx);

// 3. Add to sidebar navigation right after 'Create Session'
const createNav = '<button class="nav-item" data-sec="create"><span class="icon"><i class="fa-solid fa-square-plus"></i></span> Create Session</button>';
const scheduleNav = '<button class="nav-item" data-sec="schedule"><span class="icon"><i class="fa-regular fa-calendar-plus"></i></span> Schedule Session</button>';
html = html.replace(createNav, createNav + '\n                ' + scheduleNav);

// 4. Bump cache ver
html = html.replace(/teacher-dashboard\.js\?v=\d+/, 'teacher-dashboard.js?v=' + Date.now());

fs.writeFileSync('backend/public/teacher-dashboard.html', html);
console.log('Successfully patched teacher-dashboard.html');
