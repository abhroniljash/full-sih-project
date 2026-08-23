const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

// Remove the previous block if it exists
const startMarker = '// ==========================================';
const oldBlockMarker = '// USER REQUESTED ATTENDANCE OVERVIEW (TABLE & TIMEFRAME)';

const idx = js.indexOf(oldBlockMarker);
if (idx !== -1) {
    // find where this block starts
    const blockStart = js.lastIndexOf(startMarker, idx);
    js = js.substring(0, blockStart);
}

// Write the new script
const exactScript = `
// ==========================================
// USER REQUESTED ATTENDANCE OVERVIEW (EXACT DOM LOGIC)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const btnSemester = document.getElementById('btn-semester');
    const btnMonthly = document.getElementById('btn-monthly');
    const attendanceTableBody = document.getElementById('attendance-table-body');
    
    if (!btnSemester || !btnMonthly || !attendanceTableBody) return;

    // Helper classes
    const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-sm'];
    const inactiveClasses = ['text-on-surface-variant', 'hover:bg-surface-container'];

    function fetchAttendanceData(timeframe) {
        document.getElementById('attendance-table-body').innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">Loading real data...</td></tr>';
        
        if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
            API.get(\`/dashboard/student?timeframe=\${timeframe}\`, studentToken)
            .then(res => {
                if (!res.tracker || res.tracker.length === 0) {
                    document.getElementById('attendance-table-body').innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">No data found for this period</td></tr>';
                    return;
                }

                let html = '';
                res.tracker.forEach(t => {
                    const isOnTrack = t.percentage >= 75;
                    
                    const percentColor = isOnTrack ? 'text-primary' : 'text-error';
                    const barColor = isOnTrack ? 'bg-primary' : 'bg-error';
                    const badgeClass = isOnTrack ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error';
                    const badgeText = isOnTrack ? 'On Track' : 'Below Threshold';
                    
                    const recColor = isOnTrack ? 'text-on-surface-variant' : 'text-error font-semibold';
                    const recText = isOnTrack 
                        ? (t.classesNeededFor75 === 0 ? 'Maintain current pace' : \`Safe margin: \${t.classesNeededFor75} classes\`)
                        : \`Need to attend next \${t.classesNeededFor75} classes\`;

                    html += \`
                    <tr class="hover:bg-surface-container-low/30 transition-colors">
                        <td class="px-6 py-4 font-semibold text-on-surface">\${t.subject}</td>
                        <td class="px-6 py-4 text-on-surface-variant">\${t.total}</td>
                        <td class="px-6 py-4 text-on-surface-variant">\${t.attended}</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold \${percentColor}">\${t.percentage}%</span>
                                <div class="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                    <div class="h-full \${barColor}" style="width: \${t.percentage}%"></div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full \${badgeClass} text-[11px] font-bold uppercase">\${badgeText}</span>
                        </td>
                        <td class="px-6 py-4 text-label-sm \${recColor}">\${recText}</td>
                    </tr>\`;
                });
                
                document.getElementById('attendance-table-body').innerHTML = html;
            })
            .catch(err => {
                document.getElementById('attendance-table-body').innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-semibold">Failed to fetch data</td></tr>';
            });
        }
    }

    btnSemester.addEventListener('click', function() {
        // Remove active styling from monthly
        activeClasses.forEach(c => btnMonthly.classList.remove(c));
        inactiveClasses.forEach(c => btnMonthly.classList.add(c));
        
        // Add active styling to semester
        inactiveClasses.forEach(c => btnSemester.classList.remove(c));
        activeClasses.forEach(c => btnSemester.classList.add(c));
        
        // Fetch data
        fetchAttendanceData('semester');
    });

    btnMonthly.addEventListener('click', function() {
        // Remove active styling from semester
        activeClasses.forEach(c => btnSemester.classList.remove(c));
        inactiveClasses.forEach(c => btnSemester.classList.add(c));
        
        // Add active styling to monthly
        inactiveClasses.forEach(c => btnMonthly.classList.remove(c));
        activeClasses.forEach(c => btnMonthly.classList.add(c));
        
        // Fetch data
        fetchAttendanceData('monthly');
    });

    // Automatically load default view
    fetchAttendanceData('semester');
});
`;

js = js + '\n' + exactScript;

fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Appended exact script successfully!');
