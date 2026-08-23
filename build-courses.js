const fs = require('fs');

const dashHtml = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');
const coursesCodeHtml = fs.readFileSync('stitch_student_portal_dashboard (4)/code.html', 'utf8');

// Extract the <main> part from the new design
const match = coursesCodeHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/);
if (!match) {
    console.error('Could not find <main> in courses html');
    process.exit(1);
}
const coursesMainContent = match[1];

// Create the new section string
const coursesSection = `
    <div id="section-courses" class="nav-section hidden">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
            ${coursesMainContent}
        </main>
    </div>
`;

// Insert the section just before the closing </div> of the main layout, which is just before the scripts
let newDashHtml = dashHtml.replace(/(<\/div>\s*<\/div>\s*<script src="config\.js">)/, coursesSection + '\n$1');

// Update the Sidebar link for Courses
newDashHtml = newDashHtml.replace(/<a class="flex items-center gap-4 px-4 py-3\.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-path="courses" href="#">/, 
    '<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-target="courses">');

fs.writeFileSync('backend/public/student-dashboard.html', newDashHtml);
console.log('Courses section added successfully!');
