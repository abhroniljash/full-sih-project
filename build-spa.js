const fs = require('fs');

const dashHtml = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');
const schHtml = fs.readFileSync('backend/public/student-schedule.html', 'utf8');
const attHtml = fs.readFileSync('backend/public/student-attendance.html', 'utf8');

// Extract contents of <main>
const getMain = (html) => {
    const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    return match ? match[1] : '';
};

const mainDash = getMain(dashHtml);
const mainSch = getMain(schHtml);
const mainAtt = getMain(attHtml);

// Build unified dashboard
let newHtml = dashHtml.replace(/<main[^>]*>[\s\S]*?<\/main>/, `
    <div id="section-dashboard" class="nav-section block">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
            ${mainDash}
        </main>
    </div>
    <div id="section-schedule" class="nav-section hidden" style="display: none;">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
            ${mainSch}
        </main>
    </div>
    <div id="section-attendance" class="nav-section hidden" style="display: none;">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
            ${mainAtt}
        </main>
    </div>
`);

// Fix Sidebar links
newHtml = newHtml.replace(/<a[^>]*data-path="dashboard"[^>]*>([\s\S]*?)<\/a>/,
    '<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all bg-secondary-container text-on-secondary-container font-semibold" data-target="dashboard">$1</a>');

newHtml = newHtml.replace(/<a[^>]*data-path="my-schedule"[^>]*>([\s\S]*?)<\/a>/,
    '<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-target="schedule">$1</a>');

newHtml = newHtml.replace(/<a[^>]*data-path="attendance"[^>]*>([\s\S]*?)<\/a>/,
    '<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-target="attendance">$1</a>');

fs.writeFileSync('backend/public/student-dashboard.html', newHtml);
console.log('Unified dashboard built!');
