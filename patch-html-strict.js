const fs = require('fs');

let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

// 1. Replace Semester button
html = html.replace(
    /<button class="px-6 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm shadow-sm[^>]*>Semester<\/button>/g,
    '<button id="btn-semester" class="px-6 py-2 rounded-full bg-primary text-on-primary font-label-sm text-label-sm shadow-sm transition-all">Semester</button>'
);

// 2. Replace Monthly button
html = html.replace(
    /<button class="px-6 py-2 rounded-full text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container[^>]*>Monthly<\/button>/g,
    '<button id="btn-monthly" class="px-6 py-2 rounded-full text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-all">Monthly</button>'
);

// 3. Replace tbody and clear rows
const tbodyStart = '<tbody class="divide-y divide-surface-variant/20">';
const tableEnd = '</tbody></table>';

const startIndex = html.indexOf(tbodyStart);
const endIndex = html.indexOf(tableEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const beforeTbody = html.substring(0, startIndex);
    const afterTbody = html.substring(endIndex);
    html = beforeTbody + '<tbody id="attendance-table-body" class="divide-y divide-surface-variant/20">' + afterTbody;
}

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('HTML updated');
