const fs = require('fs');
let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const strictTableLogic = `
// ==========================================
// USER REQUESTED ATTENDANCE OVERVIEW (TABLE & TIMEFRAME)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const sectionAttendance = document.querySelector('#section-attendance');
    if (!sectionAttendance) return;

    const buttons = sectionAttendance.querySelectorAll('button.rounded-full');
    let btnSemester, btnMonthly;
    buttons.forEach(btn => {
        if (btn.textContent.trim() === 'Semester') btnSemester = btn;
        if (btn.textContent.trim() === 'Monthly') btnMonthly = btn;
    });

    const tableHeaders = sectionAttendance.querySelectorAll('th');
    let tbody = null;
    if (tableHeaders.length > 0) {
        tbody = tableHeaders[0].closest('table').querySelector('tbody');
    }

    if (!btnSemester || !btnMonthly || !tbody) return;

    let currentTimeframe = 'semester'; 

    const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-sm'];
    const inactiveClasses = ['text-on-surface-variant', 'hover:bg-surface-container'];

    function updateToggles() {
        if (currentTimeframe === 'semester') {
            inactiveClasses.forEach(c => btnSemester.classList.remove(c));
            activeClasses.forEach(c => btnSemester.classList.add(c));
            
            activeClasses.forEach(c => btnMonthly.classList.remove(c));
            inactiveClasses.forEach(c => btnMonthly.classList.add(c));
        } else {
            inactiveClasses.forEach(c => btnMonthly.classList.remove(c));
            activeClasses.forEach(c => btnMonthly.classList.add(c));
            
            activeClasses.forEach(c => btnSemester.classList.remove(c));
            inactiveClasses.forEach(c => btnSemester.classList.add(c));
        }
    }

    function fetchAttendanceStats(timeframe) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">Loading data...</td></tr>';
        
        if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
            API.get(\`/dashboard/student?timeframe=\${timeframe}\`, studentToken)
            .then(res => {
                if (!res.tracker || res.tracker.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-on-surface-variant font-semibold">No attendance records found.</td></tr>';
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
                
                tbody.innerHTML = html;
            })
            .catch(err => {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-error font-semibold">Failed to fetch data</td></tr>';
            });
        }
    }

    btnSemester.addEventListener('click', () => {
        if (currentTimeframe !== 'semester') {
            currentTimeframe = 'semester';
            updateToggles();
            fetchAttendanceStats('semester');
        }
    });

    btnMonthly.addEventListener('click', () => {
        if (currentTimeframe !== 'monthly') {
            currentTimeframe = 'monthly';
            updateToggles();
            fetchAttendanceStats('monthly');
        }
    });

    // Ensure it loads if the section is ever shown or immediately if already active
    updateToggles();
    fetchAttendanceStats(currentTimeframe);
});
`;

js = js + '\n' + strictTableLogic;
fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Table logic appended');
