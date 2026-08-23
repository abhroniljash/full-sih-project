const fs = require('fs');

let dashboard = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');
const html1 = fs.readFileSync('1/code.html', 'utf8');
const html2 = fs.readFileSync('2/code.html', 'utf8');

// Extract the contents of <main> from 1 and 2
const mainContent1Match = html1.match(/<main[^>]*>([\s\S]*?)<\/main>/);
const mainContent2Match = html2.match(/<main[^>]*>([\s\S]*?)<\/main>/);

if (!mainContent1Match || !mainContent2Match) {
    console.error("Could not find <main> in new designs");
    process.exit(1);
}

// Build the new sections
const newSections = `
    <div id="section-internal-marks" class="nav-section hidden">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
${mainContent1Match[1]}
        </main>
    </div>
    
    <div id="section-communication" class="nav-section hidden">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
${mainContent2Match[1]}
        </main>
    </div>
`;

// Remove the old courses section
// It starts with <div id="section-courses" class="nav-section hidden">
// We need to find its end. A simple regex might be tricky if there are nested divs.
// Instead, let's use string manipulation based on known markers.

const courseStart = dashboard.indexOf('<div id="section-courses" class="nav-section hidden">');
if (courseStart === -1) {
    console.error("Could not find section-courses");
    process.exit(1);
}

// Find the end of section-courses by looking for the script tags which are right after the last section
// The last section was courses, so after courses is the </div></div> closing for main wrapper and then scripts.
// Let's find <!-- Face ID Enrollment (Student Dashboard) --> or just </div></div>\s*<script src="config.js">
const scriptStart = dashboard.indexOf('<script src="config.js">');
// Let's find the closing div of section-courses
// Actually, I can just replace the whole section-courses until the end of its block.
// Since it's the last section in the nav-sections list.
let lastDivClose = dashboard.lastIndexOf('</div>\n</div>\n\n    <script src="config.js">');
if (lastDivClose === -1) {
    // try different spacing
    lastDivClose = dashboard.lastIndexOf('<script src="config.js">');
}

// Better way: use a small regex to match section-courses since we know it ends before the final wrapper divs
// Wait, I can just find `<div id="section-courses"` and replace everything from there until `<script src="config.js">` 
// with `newSections` + `</div></div>\n    <script src="config.js">`

// Let's check what's right before <script src="config.js">
const beforeScript = dashboard.substring(scriptStart - 20, scriptStart);
console.log("Before script:", beforeScript);

const courseBlockRegex = /<div id="section-courses" class="nav-section hidden">[\s\S]*?(?=<\/div>\r?\n<\/div>\r?\n\s*<script src="config\.js">)/;

let updatedDashboard = dashboard.replace(courseBlockRegex, newSections);

// Now update the sidebar
// We want to remove the Courses nav-link and add Internal Marks and Communication
const navCoursesRegex = /<a[^>]*data-target="courses"[^>]*>[\s\S]*?<\/a>/;

const newNavLinks = `
<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-target="internal-marks">
    <span class="material-symbols-outlined">menu_book</span>
    <span class="font-label-sm text-label-sm">Internal Marks</span>
</a>
<a href="#" class="nav-link flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-target="communication">
    <span class="material-symbols-outlined">chat_bubble</span>
    <span class="font-label-sm text-label-sm">Communication</span>
</a>
`;

updatedDashboard = updatedDashboard.replace(navCoursesRegex, newNavLinks.trim());

fs.writeFileSync('backend/public/student-dashboard.html', updatedDashboard);
console.log("Successfully updated student-dashboard.html");
