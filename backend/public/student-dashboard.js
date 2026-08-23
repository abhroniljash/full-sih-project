// --- Auth & Setup ---
var student = Auth.getUser('student');
var studentToken = Auth.getToken('student');
if (!student || !studentToken) goTo('/student-login');

document.getElementById('uName').textContent = student.name;
document.getElementById('welcomeName').textContent = student.name.split(' ')[0];
var uAvatar = document.getElementById('uAvatar');
if (student.faceImage) {
    uAvatar.innerHTML = '<img src="' + student.faceImage + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
} else {
    uAvatar.textContent = student.name.charAt(0);
}
document.getElementById('rollTag').textContent = 'ID: ' + student.rollNumber;
var rollTagFull = document.getElementById('rollTagFull');
if (rollTagFull) {
    rollTagFull.textContent = 'Roll Number: ' + student.rollNumber + ' • Dept: ' + (student.department || 'CSE') + ' • Reg No: ' + (student.registrationNumber || '---');
}

document.getElementById('logoutBtn').addEventListener('click', function() {
    confirmLogout('student');
});

// --- Dashboard data (from backend) ---
function loadDashboard() {
    API.get('/dashboard/student', studentToken).then(function(res) {
        document.getElementById('totalClasses').textContent = res.totalClasses;
        document.getElementById('totalAttended').textContent = res.totalAttended;

        var overallEl = document.getElementById('overallPerc');
        overallEl.textContent = res.overallPercentage + '%';
        overallEl.style.color = res.overallPercentage >= 75 ? '#16a34a' : '#ef4444';

        // Render 75% Tracker
        var trackerHtml = '';
        var trackerContainer = document.getElementById('trackerList');
        if (res.tracker.length === 0) {
            trackerHtml = '<div class="empty" style="padding:24px 0;"><p>No classes found.</p></div>';
            trackerContainer.innerHTML = trackerHtml;
        } else {
            trackerHtml += '<div class="absolute left-0 right-0 bottom-8 border-b border-dashed border-error/40 z-0"><span class="absolute -top-6 left-0 font-label-sm text-label-sm text-error/80">75% Minimum</span></div>';
            res.tracker.forEach(function(t) {
                var isSafe = t.percentage >= 75;
                var bgClass = isSafe ? 'bg-primary' : 'bg-error/80';
                var htmlPercentage = Math.max(10, t.percentage); // Minimum 10% height to be visible
                var subjectAbbr = t.subject.substring(0, 3).toUpperCase();
                
                trackerHtml += '<div class="w-8 ' + bgClass + ' rounded-t-sm relative group transition-all hover:opacity-80 z-10" style="height:' + htmlPercentage + '%">' +
                    '<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-inverse-surface text-inverse-on-surface font-label-sm text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">' + t.percentage + '% - ' + t.subject + '</div>' +
                    '<div class="absolute -bottom-6 left-1/2 -translate-x-1/2 font-label-sm text-[10px] text-on-surface-variant">' + subjectAbbr + '</div>' +
                '</div>';
            });
            trackerContainer.innerHTML = trackerHtml;
        }

        // Render History Table
        var tHtml = '';
        if (res.history.length === 0) {
            tHtml = '<div style="text-align:center;padding:24px;">No attendance records found.</div>';
        } else {
            res.history.forEach(function(h) {
                tHtml += '<div class="flex items-center justify-between py-3 border-b border-surface-variant/40">' +
                    '<div>' +
                    '<p class="font-body-md text-label-sm text-on-surface font-medium">' + h.subject + '</p>' +
                    '<p class="font-label-sm text-[12px] text-on-surface-variant mt-0.5">' + formatDateTime(h.timestamp) + '</p>' +
                    '</div>' +
                    '<div class="px-2.5 py-1 bg-secondary-container/50 text-primary font-label-sm text-[11px] rounded-full font-semibold">Present</div>' +
                    '</div>';
            });
        }
        document.getElementById('historyTable').innerHTML = tHtml;
    }).catch(function(err) {
        showToast(err.message || 'Failed to load dashboard', 'danger');
    });
}





// --- Navigation (SPA logic) ---
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.nav-section');

    const activeClasses = ['bg-secondary-container', 'text-on-secondary-container', 'font-semibold'];
    const inactiveClasses = ['text-on-surface-variant', 'hover:bg-surface-container-low'];

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Allow clicked link to work even if clicked on a child element
            const anchor = e.target.closest('a');
            if (!anchor) return;
            const target = anchor.getAttribute('data-target');
            
            if (!target) return;
            console.log("Switching to tab: " + target);

            // 1. Hide all sections, show target
            sections.forEach(sec => {
                if (sec.id === 'section-' + target) {
                    sec.classList.remove('hidden');
                    sec.style.display = ''; // Clear inline styles just in case
                } else {
                    sec.classList.add('hidden');
                }
            });

            // 2. Update link classes
            links.forEach(l => {
                l.classList.remove(...activeClasses);
                l.classList.add(...inactiveClasses);
            });
            this.classList.remove(...inactiveClasses);
            this.classList.add(...activeClasses);
        });
    });
});


// --- Schedule API ---
function loadSchedule() {
    API.get('/sessions/schedule', studentToken).then(res => {
        const container = document.getElementById('scheduleTimelineContainer');
        if (!container) return;

        if (res.scheduled.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:24px;">No upcoming classes scheduled.</div>';
            return;
        }

        let html = '';
        html += '<div class="absolute left-[52px] top-4 bottom-8 w-0.5 bg-surface-variant"></div>';
        
        // Let's add a "Now" indicator just for looks
        html += `
  <div class="absolute left-[47px] top-[10%] w-3 h-3 rounded-full bg-error z-20 shadow-[0_0_0_4px_rgba(255,255,255,1)]"></div>
  <div class="absolute left-[64px] top-[10%] right-0 h-px bg-error/30 z-20 -translate-y-1/2 border-t border-dashed border-error/50"></div>
  <div class="absolute left-0 top-[10%] -translate-y-1/2 -mt-0.5">
    <span class="font-label-sm text-[11px] text-error font-bold tracking-wider">NOW</span>
  </div>`;

        res.scheduled.forEach(s => {
            html += `
  <div class="flex items-start mb-12 group relative">
    <div class="w-12 pt-5 text-right pr-4 font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">
      ${s.scheduledTime}
    </div>
    <!-- Node -->
    <div class="w-3 h-3 rounded-full bg-outline-variant mt-6 -ml-[7px] mr-6 z-10 ring-4 ring-surface-container-lowest group-hover:bg-primary transition-colors"></div>
    <!-- Card -->
    <div class="flex-grow bg-surface-container-low rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1 relative overflow-hidden">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
      <div class="flex justify-between items-start mb-3 pl-2">
        <div>
          <span class="inline-block px-2.5 py-1 bg-surface-variant text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider rounded mb-2">${s.className}</span>
          <h4 class="font-headline-md text-headline-md text-on-surface">${s.subject}</h4>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface-variant bg-surface rounded-lg px-3 py-1 shadow-sm">${s.scheduledDate} ${s.scheduledTime}</span>
      </div>
      <div class="flex items-center gap-6 mt-4 pl-2">
         <span class="text-sm font-medium text-on-surface-variant">Teacher: ${s.teacher}</span>
      </div>
    </div>
  </div>`;
        });
        container.innerHTML = html;
    }).catch(err => console.error('Failed to load schedule:', err));
}
setTimeout(loadSchedule, 500); // load after a short delay

// --- Concern Form ---
document.addEventListener('DOMContentLoaded', function() {
    const concernForm = document.getElementById('concernForm');
    if (concernForm) {
        concernForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Just get the inputs
            const courseSelect = document.getElementById('concern_227'); // based on offset injection, fallback below
            const course = courseSelect ? courseSelect.value : document.querySelectorAll('select')[0].value;
            const typeSelect = document.getElementById('concern_341');
            const type = typeSelect ? typeSelect.value : document.querySelectorAll('select')[1].value;
            const desc = document.getElementById('concernDescription').value;

            if (!desc) {
                showToast('Please provide a description.', 'danger');
                return;
            }

            API.post('/messages', {
                to: 'teacher', // backend logic handles this or teacher sees all messages to 'teacher'
                subject: `[${course}] Concern: ${type}`,
                body: desc
            }, studentToken).then(res => {
                showToast('Concern submitted successfully!', 'success');
                concernForm.reset();
            }).catch(err => {
                showToast(err.message || 'Failed to submit concern', 'danger');
            });
        });
    }
});

function loadRecentRequests() {
    API.get('/messages', studentToken).then(res => {
        const list = document.getElementById('recentRequestsList');
        if (!list) return;
        const msgs = res.messages || [];
        if (msgs.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">No recent requests found.</div>';
            return;
        }
        
        let html = '';
        msgs.forEach(m => {
            const date = new Date(m.timestamp).toLocaleDateString();
            html += `
            <div class="p-4 rounded-custom border-l-4 border-l-primary bg-surface flex flex-col gap-2 relative">
              <div class="flex justify-between items-start">
                <div class="text-xs font-semibold text-onSurface-variant tracking-wide">${date}</div>
                <span class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  FROM: ${m.fromName || m.from}
                </span>
              </div>
              <div class="font-bold text-sm text-onSurface">${m.subject}</div>
              <div class="text-xs text-onSurface-variant">${m.body}</div>
            </div>`;
        });
        list.innerHTML = html;
    }).catch(err => console.error(err));
}
setTimeout(loadRecentRequests, 600);

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
            
            rowsHtml += `
            <tr class="hover:bg-surface-low transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-surface flex items-center justify-center font-bold text-xs text-onSurface-variant border border-outline-variant">${t.subject.substring(0,2).toUpperCase()}</div>
                    <div class="font-medium text-sm text-onSurface">${t.subject}</div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-onSurface-variant font-medium">${t.total}</td>
                <td class="px-6 py-4 text-sm text-onSurface-variant font-medium">${t.attended}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold ${isSafe ? 'text-primary' : 'text-error'}">${t.percentage}%</span>
                    <div class="w-16 h-1.5 rounded-full bg-surface">
                      <div class="h-full rounded-full ${isSafe ? 'bg-primary' : 'bg-error'}" style="width: ${Math.min(100, t.percentage)}%"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${statusBg}">${statusText}</span>
                </td>
                <td class="px-6 py-4 text-xs font-medium text-onSurface-variant">${recoText}</td>
            </tr>`;
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
                upHtml += `
                <div class="flex gap-4 group">
                  <div class="flex flex-col items-center min-w-[60px]">
                    <span class="font-label-sm text-label-sm text-on-surface">${s.scheduledTime}</span>
                  </div>
                  <div class="flex-1 bg-surface-container-low rounded-xl p-4 border border-transparent group-hover:border-outline-variant transition-colors relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-1 ${colorClass.split(' ')[0]}"></div>
                    <p class="font-label-sm text-label-sm ${colorClass.split(' ')[1]} mb-1">${s.className}</p>
                    <p class="font-body-md text-body-md text-on-surface font-medium leading-tight">${s.subject}</p>
                    <div class="flex items-center gap-2 mt-3 text-on-surface-variant">
                      <span class="font-label-sm text-[12px]">${s.teacher}</span>
                    </div>
                  </div>
                </div>`;

                glHtml += `
                <div class="p-4 rounded-xl border border-surface-variant bg-surface flex gap-4 items-start relative overflow-hidden mt-3">
                  <div class="absolute left-0 top-0 bottom-0 w-1 ${colorClass.split(' ')[0]}"></div>
                  <div class="flex-1">
                    <h5 class="text-sm font-bold text-onSurface mb-1">${s.subject}</h5>
                    <p class="text-xs font-medium text-onSurface-variant flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${colorClass.split(' ')[0]}"></span>${s.scheduledTime}</p>
                  </div>
                </div>`;
            });
        }
        if (upcomingList) upcomingList.innerHTML = upHtml;
        if (glanceList) glanceList.innerHTML = glHtml;
    });
}
setTimeout(loadUpcomingDashboard, 600);

loadDashboard();
