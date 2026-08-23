const fs = require('fs');

const dashboardPath = 'backend/public/student-dashboard.html';
const newDesignPath = '3/code.html';

let dashboard = fs.readFileSync(dashboardPath, 'utf8');
const newDesign = fs.readFileSync(newDesignPath, 'utf8');

// Extract the contents of <main> from new design
const mainMatch = newDesign.match(/<main[^>]*>([\s\S]*?)<\/main>/);
if (!mainMatch) {
    console.error("Could not find <main> in new design");
    process.exit(1);
}

const newMainContent = mainMatch[1];

const replacement = `<div id="section-communication" class="nav-section hidden">
        <main class="relative pt-20 px-container-padding pb-section-margin bg-background min-h-screen">
${newMainContent}
        </main>
    </div>`;

const splitParts = dashboard.split('<div id="section-communication" class="nav-section hidden">');
if (splitParts.length === 2) {
    let tail = splitParts[1];
    // Find the LAST `</div>` before the script tag.
    const endMatch = tail.match(/<\/div>\s*<\/div>\s*<\/div>\s*<script src="config\.js">/);
    if (endMatch) {
        // The remaining part of the document starting from the closing divs
        const remaining = tail.substring(endMatch.index);
        
        let finalHtml = splitParts[0] + replacement + "\n" + remaining;
        
        // Bump cache version
        finalHtml = finalHtml.replace(/student-dashboard\.js\?v=\d+/, 'student-dashboard.js?v=' + Date.now());
        
        fs.writeFileSync(dashboardPath, finalHtml);
        console.log("Successfully replaced Communication section!");
    } else {
        console.error("Could not find the end wrappers. Tail end is:\n", tail.substring(tail.length - 200));
    }
} else {
    console.error("section-communication not found");
}
