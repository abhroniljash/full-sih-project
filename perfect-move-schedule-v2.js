const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

// 1. We know exactly what the schedule card starts and ends with.
const startStr = '<!-- Schedule Auto-Session -->';
const endStr = '<button class="btn btn-primary" id="btnSchedule" style="width:100%;background:#059669;border-color:#059669;border-radius:6px;padding:8px;font-weight:600;">Schedule Session</button>\r\n                                </div>\r\n                            </div>';

let endStrCRLF = endStr;
let endStrLF = endStr.replace(/\r\n/g, '\n');

let startIdx = html.indexOf(startStr);
let endIdx = html.indexOf(endStrCRLF);
let strLen = endStrCRLF.length;

if (endIdx === -1) {
    endIdx = html.indexOf(endStrLF);
    strLen = endStrLF.length;
}

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find start or end bounds.");
    process.exit(1);
}

const scheduleCard = html.substring(startIdx, endIdx + strLen);

// Remove from current pos
html = html.replace(scheduleCard, '');

// The wrapper for the new section:
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

// Insert right before sec-settings
const settingsTarget = '<div class="section" id="sec-settings">';
const settingsIdx = html.indexOf(settingsTarget);
if (settingsIdx === -1) {
    console.error("Could not find sec-settings");
    process.exit(1);
}

html = html.substring(0, settingsIdx) + newSection + html.substring(settingsIdx);

// Navigation insert
const createNav = '<button class="nav-item" data-sec="create"><span class="icon"><i class="fa-solid fa-square-plus"></i></span> Create Session</button>';
const scheduleNav = '<button class="nav-item" data-sec="schedule"><span class="icon"><i class="fa-regular fa-calendar-plus"></i></span> Schedule Session</button>';
html = html.replace(createNav, createNav + '\n                ' + scheduleNav);

// Cache bump
html = html.replace(/teacher-dashboard\.js\?v=\d+/, 'teacher-dashboard.js?v=' + Date.now());

fs.writeFileSync('backend/public/teacher-dashboard.html', html);
console.log('Successfully patched without breaking layout divs!');
