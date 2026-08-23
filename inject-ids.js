const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

// 1. Upcoming Today List
const upcomingStr = '<div class="space-y-4">\n  <div class="flex gap-4 group">';
if(html.includes(upcomingStr)) {
    html = html.replace(upcomingStr, '<div class="space-y-4" id="upcomingTodayList">\n  <div class="flex gap-4 group">');
} else {
    // try looser match
    html = html.replace(/<div class="space-y-4">(\s*<div class="flex gap-4 group">)/, '<div class="space-y-4" id="upcomingTodayList">$1');
}

// 2. Internal Marks overview
// In section-internal-marks, there are elements for % and points.
// Let's replace the whole card content if possible, or add IDs to the numbers.
// Current Attendance: <div class="text-4xl font-bold text-primary mb-2">88<span class="text-2xl text-onSurface-variant">%</span></div>
html = html.replace(/<div class="text-4xl font-bold text-primary mb-2">88<span class="text-2xl text-onSurface-variant">%<\/span><\/div>/, 
  '<div class="text-4xl font-bold text-primary mb-2" id="imCurrentPerc">0<span class="text-2xl text-onSurface-variant">%</span></div>');

// Projected CA3 points: <div class="text-5xl font-black text-white mb-2 tracking-tight">3.0<span class="text-2xl text-primary-light font-semibold"> /5.0</span></div>
html = html.replace(/<div class="text-5xl font-black text-white mb-2 tracking-tight">3.0<span class="text-2xl text-primary-light font-semibold"> \/5.0<\/span><\/div>/,
  '<div class="text-5xl font-black text-white mb-2 tracking-tight" id="imProjectedPoints">0.0<span class="text-2xl text-primary-light font-semibold"> /5.0</span></div>');

// 3. Attendance Overview
// We need to inject an ID for the table body in section-attendance.
// The table is under `Subject-wise Attendance Report`
// <tbody class="divide-y divide-outline-variant bg-surface-lowest">
html = html.replace(/<tbody class="divide-y divide-outline-variant bg-surface-lowest">/, 
  '<tbody id="attendanceTableBody" class="divide-y divide-outline-variant bg-surface-lowest">');

// 4. "Today at a Glance" in My Schedule
// Add IDs to the attended/skipped numbers.
// <div class="text-2xl font-bold text-primary">2</div>
// There are multiple of these, let's find the 'ATTENDED' block
html = html.replace(/<div class="text-2xl font-bold text-primary">2<\/div>(\s*<div class="text-xs font-semibold tracking-wider text-onSurface-variant mt-1">ATTENDED<\/div>)/,
  '<div class="text-2xl font-bold text-primary" id="todayAttendedCount">0</div>$1');
html = html.replace(/<div class="text-2xl font-bold text-error">1<\/div>(\s*<div class="text-xs font-semibold tracking-wider text-onSurface-variant mt-1">SKIPPED<\/div>)/,
  '<div class="text-2xl font-bold text-error" id="todaySkippedCount">0</div>$1');
  
// Add ID to the wrapper for upcoming classes under "Today at a Glance"
// <div class="p-4 rounded-xl border border-error/20 bg-error/5 flex gap-4 items-start relative overflow-hidden">
// Let's wrap the 2 cards in a div with ID
html = html.replace(/<div class="p-4 rounded-xl border border-error\/20/, 
  '<div id="todayGlanceList"><div class="p-4 rounded-xl border border-error/20');
html = html.replace(/<div class="p-4 rounded-xl border border-warning\/30 bg-warning\/5 flex gap-4 items-start">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, 
  (match) => match + '\n</div>'); // close todayGlanceList

// Add ID for the text "3 Classes &middot; 4.5 Hours"
html = html.replace(/<span class="px-4 py-1\.5 bg-tertiary-container\/10 text-tertiary font-label-sm text-label-sm rounded-full">3 Classes/, 
  '<span id="scheduleSummaryPill" class="px-4 py-1.5 bg-tertiary-container/10 text-tertiary font-label-sm text-label-sm rounded-full">0 Classes');


fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log("Injected IDs into HTML successfully");
