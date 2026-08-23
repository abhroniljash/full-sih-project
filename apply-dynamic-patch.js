const fs = require('fs');
let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

// The new dynamic JS patch
const dynamicPatch = `
// --- Extracted logic to update all new UI components dynamically ---
function updateExtendedDashboard(res) {
    // 1. Internal Marks (dummy calculation: 5 points for >=95%, etc)
    const imCurrentPerc = document.getElementById('imCurrentPerc');
    const imProjectedPoints = document.getElementById('imProjectedPoints');
    if (imCurrentPerc && imProjectedPoints) {
        imCurrentPerc.innerHTML = res.overallPercentage + '<span class="text-2xl text-onSurface-variant">%</span>';
        let points = 0;
        if(res.overallPercentage >= 95) points = 5;
        else if(res.overallPercentage >= 90) points = 4;
        else if(res.overallPercentage >= 85) points = 3;
        else if(res.overallPercentage >= 80) points = 2;
        else if(res.overallPercentage >= 75) points = 1;
        imProjectedPoints.innerHTML = points.toFixed(1) + '<span class="text-2xl text-primary-light font-semibold"> /5.0</span>';
    }

    // 2. Subject-wise Attendance Report Table
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    if (attendanceTableBody) {
        let rowsHtml = '';
        res.tracker.forEach(t => {
            const isSafe = t.percentage >= 75;
            const statusBg = isSafe ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error';
            const statusText = isSafe ? 'ON TRACK' : 'BELOW THRESHOLD';
            const recoText = isSafe ? (t.classesNeededFor75 === 0 ? 'Maintain current pace' : 'Safe margin') : ('Need to attend next ' + t.classesNeededFor75 + ' classes');
            
            rowsHtml += \`
            <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-surface flex items-center justify-center font-bold text-xs text-onSurface-variant border border-outline-variant">\${t.subject.substring(0,2).toUpperCase()}</div>
                    <div class="font-medium text-sm text-onSurface">\${t.subject}</div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-onSurface-variant font-medium">\${t.total}</td>
                <td class="px-6 py-4 text-sm text-onSurface-variant font-medium">\${t.attended}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold \${isSafe ? 'text-primary' : 'text-error'}">\${t.percentage}%</span>
                    <div class="w-16 h-1.5 rounded-full bg-surface">
                      <div class="h-full rounded-full \${isSafe ? 'bg-primary' : 'bg-error'}" style="width: \${Math.min(100, t.percentage)}%"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider \${statusBg}">\${statusText}</span>
                </td>
                <td class="px-6 py-4 text-xs font-medium text-onSurface-variant">\${recoText}</td>
            </tr>\`;
        });
        if(rowsHtml === '') rowsHtml = '<tr><td colspan="6" class="px-6 py-4 text-center">No attendance data found</td></tr>';
        attendanceTableBody.innerHTML = rowsHtml;
    }
}

// Hook into the existing loadDashboard promise
const originalLoadDashboard = loadDashboard;
loadDashboard = function() {
    API.get('/dashboard/student', studentToken).then(function(res) {
        // Run old code manually here to ensure we don't break it
        document.getElementById('totalClasses').textContent = res.totalClasses;
        document.getElementById('totalAttended').textContent = res.totalAttended;
        var overallEl = document.getElementById('overallPerc');
        overallEl.textContent = res.overallPercentage + '%';
        overallEl.style.color = res.overallPercentage >= 75 ? '#16a34a' : '#ef4444';

        var trackerHtml = '';
        var trackerContainer = document.getElementById('trackerList');
        if (trackerContainer) {
            if (res.tracker.length === 0) {
                trackerContainer.innerHTML = '<div class="empty" style="padding:24px 0;"><p>No classes found.</p></div>';
            } else {
                trackerHtml += '<div class="absolute left-0 right-0 bottom-8 border-b border-dashed border-error/40 z-0"><span class="absolute -top-6 left-0 font-label-sm text-label-sm text-error/80">75% Minimum</span></div>';
                res.tracker.forEach(function(t) {
                    var bgClass = t.percentage >= 75 ? 'bg-primary' : 'bg-error/80';
                    trackerHtml += '<div class="w-8 ' + bgClass + ' rounded-t-sm relative group transition-all hover:opacity-80 z-10" style="height:' + Math.max(10, t.percentage) + '%"><div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-inverse-surface text-inverse-on-surface font-label-sm text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">' + t.percentage + '% - ' + t.subject + '</div><div class="absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-sm text-[10px] text-on-surface-variant">' + t.subject.substring(0, 3).toUpperCase() + '</div></div>';
                });
                trackerContainer.innerHTML = trackerHtml;
            }
        }

        var tHtml = '';
        if (res.history.length === 0) {
            tHtml = '<div style="text-align:center;padding:24px;">No attendance records found.</div>';
        } else {
            res.history.forEach(function(h) {
                tHtml += '<div class="flex items-center justify-between py-3 border-b border-surface-variant/40"><div><p class="font-body-md text-label-sm text-on-surface font-medium">' + h.subject + '</p><p class="font-label-sm text-[12px] text-on-surface-variant mt-0.5">' + formatDateTime(h.timestamp) + '</p></div><div class="px-2.5 py-1 bg-secondary-container/50 text-primary font-label-sm text-[11px] rounded-full font-semibold">Present</div></div>';
            });
        }
        document.getElementById('historyTable').innerHTML = tHtml;

        // Run the new dynamic updates
        updateExtendedDashboard(res);

        // Also update today at a glance counts based on today's attendance history
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttended = res.history.filter(h => h.timestamp.startsWith(todayStr)).length;
        const todayAttendedEl = document.getElementById('todayAttendedCount');
        if (todayAttendedEl) todayAttendedEl.textContent = todayAttended;
        // Skipped is hard to know without scheduled classes, so let's just leave it 0 or calc from schedule minus history
        const todaySkippedEl = document.getElementById('todaySkippedCount');
        if (todaySkippedEl) todaySkippedEl.textContent = "0";

    }).catch(function(err) {
        showToast(err.message || 'Failed to load dashboard', 'danger');
    });
};

// 3. Upcoming Today in Home & Today at a Glance Schedule
function loadUpcomingDashboard() {
    API.get('/sessions/schedule', studentToken).then(res => {
        const upcomingList = document.getElementById('upcomingTodayList');
        const glanceList = document.getElementById('todayGlanceList');
        const summaryPill = document.getElementById('scheduleSummaryPill');
        
        let upHtml = '';
        let glHtml = '';
        
        const scheduled = res.scheduled || [];
        if (summaryPill) {
            summaryPill.textContent = scheduled.length + ' Classes Scheduled';
        }

        if (scheduled.length === 0) {
            upHtml = '<div class="text-sm text-onSurface-variant">No classes today.</div>';
            glHtml = '<div class="text-sm text-onSurface-variant">Nothing scheduled.</div>';
        } else {
            scheduled.forEach((s, idx) => {
                const colorClass = idx % 2 === 0 ? 'bg-primary text-primary' : 'bg-secondary text-secondary';
                upHtml += \`
                <div class="flex gap-4 group">
                  <div class="flex flex-col items-center min-w-[60px]">
                    <span class="font-label-sm text-label-sm text-on-surface">\${s.scheduledTime}</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low rounded-xl p-4 border border-transparent group-hover:border-outline-variant transition-colors relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1 \${colorClass.split(' ')[0]}"></div>
                    <p class="font-label-sm text-label-sm \${colorClass.split(' ')[1]} mb-1">\${s.className}</p>
                    <p class="font-body-md text-body-md text-on-surface font-medium leading-tight">\${s.subject}</p>
                    <div class="flex items-center gap-2 mt-3 text-on-surface-variant">
                      <span class="font-label-sm text-[12px]">\${s.teacher}</span>
                    </div>
                  </div>
                </div>\`;

                glHtml += \`
                <div class="p-4 rounded-xl border border-surface-variant bg-surface flex gap-4 items-start relative overflow-hidden mt-3">
                  <div class="absolute left-0 top-0 bottom-0 w-1 \${colorClass.split(' ')[0]}"></div>
                  <div class="flex-1">
                    <h5 class="text-sm font-bold text-onSurface mb-1">\${s.subject}</h5>
                    <p class="text-xs font-medium text-onSurface-variant flex items-center gap-1.5"><span class="w-2 h-2 rounded-full \${colorClass.split(' ')[0]}"></span>\${s.scheduledTime}</p>
                  </div>
                </div>\`;
            });
        }
        if (upcomingList) upcomingList.innerHTML = upHtml;
        if (glanceList) glanceList.innerHTML = glHtml;
    });
}
setTimeout(loadUpcomingDashboard, 600);
`;

// Remove original loadDashboard call at bottom so we can redefine it, or just let our re-definition handle it if it runs after.
// Actually, our code overrides loadDashboard function pointer, and the original file has `loadDashboard();` right below it.
// To ensure it runs our new one, we can just replace `// Initialize Dashboard\nloadDashboard();` with nothing, then append our code and call it.
js = js.replace(/\/\/\s*Initialize Dashboard\s*loadDashboard\(\);/g, '');
js = js + dynamicPatch + '\nloadDashboard();\n';

fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Dynamic patch applied successfully.');
