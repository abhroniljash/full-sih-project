const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

// Find and remove the previous EXACT DOM LOGIC block
const startMarker = '// ==========================================';
const blockLabel = '// USER REQUESTED ATTENDANCE OVERVIEW (EXACT DOM LOGIC)';
const idx = js.indexOf(blockLabel);
if (idx !== -1) {
    const blockStart = js.lastIndexOf(startMarker, idx);
    js = js.substring(0, blockStart);
}

const asyncLogic = `
// ==========================================
// USER REQUESTED ATTENDANCE OVERVIEW (CRITICAL FIX)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnSemester = document.getElementById('btn-semester');
    const btnMonthly = document.getElementById('btn-monthly');
    const tableBody = document.getElementById('attendance-table-body');
    
    if (!btnSemester || !btnMonthly || !tableBody) return;

    // Helper classes
    const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-sm'];
    const inactiveClasses = ['text-on-surface-variant', 'hover:bg-surface-container'];

    async function loadAttendanceTable(filter) {
        tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">Loading data...</td></tr>';
        
        try {
            if (typeof studentToken === 'undefined') {
                throw new Error("User token missing");
            }
            
            // fetch to backend
            const response = await fetch(\`/api/dashboard/student?timeframe=\${filter}\`, {
                headers: {
                    'Authorization': \`Bearer \${studentToken}\`
                }
            });
            const res = await response.json();
            
            if (!res.tracker || res.tracker.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">No attendance records found for this period.</td></tr>';
                return;
            }

            let html = '';
            res.tracker.forEach(t => {
                // Calculate percentage
                const percentage = t.total > 0 ? Math.round((t.attended / t.total) * 100) : 0;
                const isOnTrack = percentage >= 75;
                
                // CSS Classes
                const percentColor = isOnTrack ? 'text-primary' : 'text-error';
                const barColor = isOnTrack ? 'bg-primary' : 'bg-error';
                const badgeClass = isOnTrack ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error';
                const badgeText = isOnTrack ? 'ON TRACK' : 'BELOW THRESHOLD';
                
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
                            <span class="font-semibold \${percentColor}">\${percentage}%</span>
                            <div class="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div class="h-full \${barColor}" style="width: \${percentage}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full \${badgeClass} text-[11px] font-bold uppercase">\${badgeText}</span>
                    </td>
                    <td class="px-6 py-4 text-label-sm \${recColor}">\${recText}</td>
                </tr>\`;
            });
            tableBody.innerHTML = html;
        } catch (error) {
            console.error('Failed to load attendance table:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-semibold">Failed to fetch data. Please try again.</td></tr>';
        }
    }

    btnSemester.addEventListener('click', () => {
        // Toggle active classes
        inactiveClasses.forEach(c => btnSemester.classList.remove(c));
        activeClasses.forEach(c => btnSemester.classList.add(c));
        
        activeClasses.forEach(c => btnMonthly.classList.remove(c));
        inactiveClasses.forEach(c => btnMonthly.classList.add(c));
        
        loadAttendanceTable('semester');
    });

    btnMonthly.addEventListener('click', () => {
        // Toggle active classes
        inactiveClasses.forEach(c => btnMonthly.classList.remove(c));
        activeClasses.forEach(c => btnMonthly.classList.add(c));
        
        activeClasses.forEach(c => btnSemester.classList.remove(c));
        inactiveClasses.forEach(c => btnSemester.classList.add(c));
        
        loadAttendanceTable('monthly');
    });

    // Initial load
    loadAttendanceTable('semester');
});
`;

js = js + '\n' + asyncLogic;

fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Appended async logic successfully!');
