const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

// Replace Map dummy image with map div
const mapRegex = /<div class="flex-grow w-full min-h-\[200px\] rounded-2xl overflow-hidden shadow-sm border-2\s*border-surface-container-highest relative">[\s\S]*?<button class="mt-4 w-full py-3/;

html = html.replace(mapRegex, `<div id="studentMap" class="flex-grow w-full min-h-[200px] rounded-2xl overflow-hidden shadow-sm border-2 border-surface-container-highest relative z-0"></div>\n  <button class="mt-4 w-full py-3`);

// Inject leaflet into head
if (!html.includes('leaflet.css')) {
  html = html.replace('</head>', `  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>\n</head>`);
}

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('Map HTML replaced');
