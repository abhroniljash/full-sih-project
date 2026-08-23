const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

let historyRegex = /<h2 class="font-headline-md text-headline-md text-on-surface">Recent Logs<\/h2>[\s\S]*?<button class="mt-auto w-full py-2\.5/g;
html = html.replace(historyRegex, '<h2 class="font-headline-md text-headline-md text-on-surface">Recent Logs</h2>\n</div>\n<div class="flex flex-col gap-0" id="historyTable"></div>\n<button class="mt-auto w-full py-2.5');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('History table replaced!');
