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
(function initNavigation() {
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

            // Store active tab
            sessionStorage.setItem('activeStudentTab', target);

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

            // Load specific data based on tab
            if (target === 'communication' && typeof fetchAndRenderRecentRequests === 'function') {
                fetchAndRenderRecentRequests();
            }
        });
    });

    // Restore active tab on load
    const savedTab = sessionStorage.getItem('activeStudentTab');
    if (savedTab) {
        const targetLink = document.querySelector('.nav-link[data-target="' + savedTab + '"]');
        if (targetLink) {
            targetLink.click();
        }
    }
})();

// --- Recent Requests ---
window.fetchAndRenderRecentRequests = function() {
    const container = document.getElementById('recent-requests-list') || document.getElementById('recentRequestsList');
    if (!container) return;
    
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">Loading your requests...</div>';

    API.get('/messages', studentToken).then(res => {
        const msgs = res.messages || [];
        if (msgs.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">No recent requests found.</div>';
            return;
        }

        let html = '';
        msgs.forEach(m => {
            const dateStr = new Date(m.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
            const subjectLabel = m.subject || 'Concern';
            const status = (m.status || '').toLowerCase();
            
            let borderColor, badgeBg, badgeText, badgeTextColor, badgeRing, badgeIcon;

            if (status === 'resolved') {
                borderColor = 'border-l-green-500';
                badgeBg = 'bg-green-50';
                badgeTextColor = 'text-green-700';
                badgeRing = 'ring-green-600/20';
                badgeText = 'RESOLVED';
                badgeIcon = '<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>';
            } else if (status === 'denied') {
                borderColor = 'border-l-red-500';
                badgeBg = 'bg-red-50';
                badgeTextColor = 'text-red-700';
                badgeRing = 'ring-red-600/10';
                badgeText = 'DENIED';
                badgeIcon = '<path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>';
            } else {
                borderColor = 'border-l-amber-500';
                badgeBg = 'bg-amber-50';
                badgeTextColor = 'text-amber-700';
                badgeRing = 'ring-amber-600/20';
                badgeText = 'PENDING';
                badgeIcon = '<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>';
            }

            html += `
            <div class="p-4 rounded-custom ${borderColor} border-l-4 bg-surface flex flex-col gap-2 relative">
                <div class="flex justify-between items-start">
                    <div class="text-xs font-semibold text-onSurface-variant tracking-wide">${dateStr}</div>
                    <span class="inline-flex items-center gap-1.5 rounded-md ${badgeBg} px-2 py-1 text-xs font-medium ${badgeTextColor} ring-1 ring-inset ${badgeRing}">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${badgeIcon}"></path></svg>
                        ${badgeText}
                    </span>
                </div>
                <div class="font-bold text-sm text-onSurface">${subjectLabel}</div>
                <div class="text-xs text-onSurface-variant truncate">${m.body || ''}</div>
            </div>`;
        });
        container.innerHTML = html;
    }).catch(err => {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;font-size:13px;">Failed to load requests.</div>';
    });
};



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

// ==========================================
// CONCERN SECTION — RUNS IMMEDIATELY (IIFE)
// ==========================================
(function initConcernSection() {
    var subjectDropdown   = document.getElementById('subject-dropdown');
    var issueType         = document.getElementById('issue-type');
    var concernForm       = document.getElementById('concern-form');
    var fileUploadInput   = document.getElementById('file-upload');
    var fileNameDisplay   = document.getElementById('file-name-display');
    var recentRequestsList = document.getElementById('recentRequestsList');

    // --- 1. Populate Subjects Dynamically ---
    function populateSubjects() {
        // Try fetching from dashboard tracker (already has subjects)
        fetch('/api/dashboard/student', {
            headers: { 'Authorization': 'Bearer ' + studentToken }
        })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (!subjectDropdown) return;
            var tracker = res.tracker || [];
            if (tracker.length === 0) return;
            // Clear existing options except placeholder
            while (subjectDropdown.options.length > 1) {
                subjectDropdown.remove(1);
            }
            tracker.forEach(function(t) {
                var opt = document.createElement('option');
                opt.value = t.subject;
                opt.textContent = t.subject;
                subjectDropdown.appendChild(opt);
            });
        })
        .catch(function(err) {
            console.warn('Could not populate subjects:', err);
        });
    }
    populateSubjects();

    // --- 2. File Upload Handling ---
    if (fileUploadInput && fileNameDisplay) {
        // Click on the dashed upload zone triggers file input
        var uploadZone = fileUploadInput.closest('.border-dashed');
        if (uploadZone) {
            uploadZone.addEventListener('click', function() {
                fileUploadInput.click();
            });

            // Drag and drop
            uploadZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadZone.classList.add('bg-primary/5');
            });
            uploadZone.addEventListener('dragleave', function() {
                uploadZone.classList.remove('bg-primary/5');
            });
            uploadZone.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadZone.classList.remove('bg-primary/5');
                if (e.dataTransfer.files.length > 0) {
                    fileUploadInput.files = e.dataTransfer.files;
                    showFileName(e.dataTransfer.files[0].name);
                }
            });
        }

        fileUploadInput.addEventListener('change', function() {
            if (fileUploadInput.files.length > 0) {
                showFileName(fileUploadInput.files[0].name);
            }
        });

        function showFileName(name) {
            fileNameDisplay.textContent = 'Selected: ' + name;
            fileNameDisplay.classList.remove('hidden');
        }
    }

    // --- 3. Form Submission ---
    if (concernForm) {
        concernForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var subject = subjectDropdown ? subjectDropdown.value : '';
            var type    = issueType ? issueType.value : '';
            var dateEl  = document.getElementById('date');
            var dateVal = dateEl ? dateEl.value : '';
            var desc    = document.getElementById('concernDescription');
            var descVal = desc ? desc.value : '';

            if (!subject || !type || !descVal) {
                if (typeof showToast === 'function') {
                    showToast('Please fill in all required fields.', 'danger');
                } else {
                    alert('Please fill in all required fields.');
                }
                return;
            }

            var messageBody = descVal;
            if (dateVal) messageBody = '[Date: ' + dateVal + '] ' + messageBody;

            API.post('/messages', {
                to: 'teacher',
                subject: '[' + subject + '] Concern: ' + type,
                body: messageBody
            }, studentToken).then(function(res) {
                if (typeof showToast === 'function') {
                    showToast('Concern submitted successfully!', 'success');
                } else {
                    alert('Concern submitted successfully!');
                }
                concernForm.reset();
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = '';
                    fileNameDisplay.classList.add('hidden');
                }
                // Refresh recent requests
                if(window.fetchAndRenderRecentRequests) window.fetchAndRenderRecentRequests();
            }).catch(function(err) {
                if (typeof showToast === 'function') {
                    showToast(err.message || 'Failed to submit concern', 'danger');
                } else {
                    alert('Failed to submit concern');
                }
            });
        });
    }

    })();


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


// --- Dynamic Calendar, Absences & Location Patch ---
window.selectedScheduleDate = new Date().toISOString().split('T')[0];
window.cachedSchedule = [];
window.cachedAbsences = [];
window.cachedHistory = [];
let studentMapInstance = null;

function renderWeeklyCalendar() {
    const container = document.getElementById('weeklyCalendarContainer');
    if (!container) return;
    
    // Get current week Monday to Sunday
    const curr = new Date();
    const day = curr.getDay(); // 0 = Sun, 1 = Mon
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(curr.setDate(diff));
    
    let html = '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dateNum = d.getDate();
        const isSelected = dateStr === window.selectedScheduleDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        if (isSelected) {
            html += `
            <button onclick="selectScheduleDate('${dateStr}')" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-on-primary shadow-lg transform -translate-y-1 scale-105 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container relative z-10">${days[i]}</span>
                <span class="font-headline-lg text-headline-lg mt-1 relative z-10">${dateNum}</span>
                <div class="w-1.5 h-1.5 rounded-full ${isToday ? 'bg-on-primary' : 'bg-transparent'} mt-2 relative z-10"></div>
            </button>`;
        } else {
            html += `
            <button onclick="selectScheduleDate('${dateStr}')" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-transform hover:-translate-y-1 shadow-sm group">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant group-hover:text-on-surface transition-colors">${days[i]}</span>
                <span class="font-headline-lg text-headline-lg mt-1">${dateNum}</span>
                <div class="w-1.5 h-1.5 rounded-full ${isToday ? 'bg-primary' : 'bg-outline-variant'} mt-2"></div>
            </button>`;
        }
    }
    container.innerHTML = html;
}

window.selectScheduleDate = function(dateStr) {
    window.selectedScheduleDate = dateStr;
    renderWeeklyCalendar();
    renderScheduleGlance();
};

function renderScheduleGlance() {
    const upcomingList = document.getElementById('upcomingTodayList'); // Home tab
    const glanceList = document.getElementById('todayGlanceList'); // My Schedule tab
    const summaryPill = document.getElementById('scheduleSummaryPill');
    const attCount = document.getElementById('todayAttendedCount');
    const skipCount = document.getElementById('todaySkippedCount');
    
    // Filter by selected date
    const dayScheduled = window.cachedSchedule.filter(s => s.scheduledDate === window.selectedScheduleDate);
    const dayAbsences = window.cachedAbsences.filter(a => a.timestamp && a.timestamp.startsWith(window.selectedScheduleDate));
    const dayHistory = window.cachedHistory.filter(h => h.timestamp && h.timestamp.startsWith(window.selectedScheduleDate));
    
    if (summaryPill) summaryPill.innerHTML = dayScheduled.length + ' Classes';
    if (attCount) attCount.innerText = dayHistory.length;
    if (skipCount) skipCount.innerText = dayAbsences.length;

    let upHtml = '';
    let glHtml = '';

    // Render Home Upcoming (Pending only)
    if (dayScheduled.length === 0) {
        upHtml = '<div class="text-sm text-onSurface-variant">No classes scheduled.</div>';
    } else {
        dayScheduled.forEach((s, idx) => {
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
              </div>
            </div>`;
        });
    }
    
    // Render Glance (Pending + Absences)
    if (dayScheduled.length === 0 && dayAbsences.length === 0) {
        glHtml = '<div class="text-sm font-semibold text-primary/70">All classes attended or nothing scheduled!</div>';
    } else {
        dayScheduled.forEach((s, idx) => {
            const colorClass = idx % 2 === 0 ? 'bg-primary text-primary' : 'bg-secondary text-secondary';
            glHtml += `
            <div class="p-4 rounded-xl border border-surface-variant bg-surface flex gap-4 items-start relative overflow-hidden mt-3">
              <div class="absolute left-0 top-0 bottom-0 w-1 ${colorClass.split(' ')[0]}"></div>
              <div class="flex-1">
                <h5 class="text-sm font-bold text-onSurface mb-1">${s.subject}</h5>
                <p class="text-xs font-medium text-onSurface-variant flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${colorClass.split(' ')[0]}"></span>${s.scheduledTime}</p>
              </div>
            </div>`;
        });
        dayAbsences.forEach(a => {
            glHtml += `
            <div class="p-4 rounded-xl border border-error/20 bg-error/5 flex gap-4 items-start relative overflow-hidden mt-3">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
              <div class="flex-1">
                <h5 class="text-sm font-bold text-error mb-1">${a.subject} skipped</h5>
                <p class="text-xs font-medium text-error flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">cancel</span>Absent</p>
              </div>
            </div>`;
        });
    }

    if (upcomingList) upcomingList.innerHTML = upHtml;
    if (glanceList) glanceList.innerHTML = glHtml;
}

// Override loadUpcomingDashboard
loadUpcomingDashboard = function() {
    Promise.all([
        API.get('/sessions/schedule', studentToken),
        API.get('/dashboard/student', studentToken)
    ]).then(responses => {
        const schedRes = responses[0];
        const dashRes = responses[1];
        
        window.cachedSchedule = schedRes.scheduled || [];
        window.cachedAbsences = dashRes.absences || [];
        window.cachedHistory = dashRes.history || [];
        
        renderWeeklyCalendar();
        renderScheduleGlance();
    }).catch(e => console.error(e));
};

// Initialize Leaflet Map with Geolocation
function initStudentMap() {
    const mapEl = document.getElementById('studentMap');
    if (!mapEl || typeof L === 'undefined') return;
    
    // Clear dummy styles if any
    mapEl.innerHTML = '';
    
    // Default location (fallback)
    const fallbackLat = 22.5726; 
    const fallbackLng = 88.3639;
    
    if (!studentMapInstance) {
        studentMapInstance = L.map('studentMap').setView([fallbackLat, fallbackLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(studentMapInstance);
    }
    
    // Try to get real location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            studentMapInstance.setView([lat, lng], 17);
            
            // Custom pin
            const markerHtml = `
                <div class="flex flex-col items-center animate-bounce">
                    <span class="material-symbols-outlined text-primary text-[32px] drop-shadow-md" style="font-variation-settings: 'FILL' 1;">location_on</span>
                    <div class="w-3 h-1 bg-black/40 blur-[2px] rounded-full mt-1"></div>
                </div>
            `;
            const customIcon = L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: [32, 40],
                iconAnchor: [16, 40]
            });
            
            L.marker([lat, lng], {icon: customIcon}).addTo(studentMapInstance)
                .bindPopup('<b>Current Location</b>').openPopup();
                
        }, (err) => {
            console.warn("Geolocation denied or error", err);
            L.marker([fallbackLat, fallbackLng]).addTo(studentMapInstance)
                .bindPopup('<b>Campus Location (Default)</b>');
        });
    }
}
setTimeout(initStudentMap, 1500);





// ==========================================
// USER REQUESTED STRICT LOGIC V3 (PREDICTABLE STATE-DRIVEN)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. STATE MANAGEMENT ---
    let calendarState = {
        weekOffset: 0,
                selectedDate: new Date().toISOString().split('T')[0], // Today's date (System)
        attendanceHistory: [],
        absencesHistory: []
    };

    // --- 2. DOM ELEMENTS ---
    const calendarContainer = document.querySelector('.grid.grid-cols-7.gap-card-gap');
    const calendarSection = document.querySelector('.mb-section-margin.w-full');
    
    let leftArrow, rightArrow, monthHeader, weekSubheader;
    if (calendarSection) {
        const buttons = calendarSection.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.innerHTML.includes('chevron_left')) leftArrow = btn;
            if (btn.innerHTML.includes('chevron_right')) rightArrow = btn;
        });
        monthHeader = calendarSection.querySelector('h2.font-headline-lg');
        weekSubheader = calendarSection.querySelector('p.font-body-md');
    }

    // Glance Panel Elements
    let glanceContainer = null;
    let attendedCounter = null;
    let skippedCounter = null;
    const headings = document.querySelectorAll('h3');
    headings.forEach(h => {
        if (h.textContent.trim() === 'Today at a Glance') {
            const parentCard = h.parentElement;
            glanceContainer = parentCard.querySelector('.space-y-4');
            const statBoxes = parentCard.querySelectorAll('.grid.grid-cols-2 > div');
            if (statBoxes.length >= 2) {
                attendedCounter = statBoxes[0].querySelector('.font-headline-md');
                skippedCounter = statBoxes[1].querySelector('.font-headline-md');
            }
        }
    });

    // --- 3. HELPER FUNCTIONS ---
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(date.setDate(diff));
    }

    function fetchAttendanceData(callback) {
        if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
            API.get('/dashboard/student', studentToken).then(res => {
                calendarState.attendanceHistory = res.history || [];
                calendarState.absencesHistory = res.absences || [];
                if (callback) callback();
            }).catch(e => {
                console.warn('Failed to fetch attendance', e);
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    }

    // --- 4. RENDER CALENDAR CORE LOGIC ---
    function renderCalendar() {
        if (!calendarContainer) return;
        
        // Wipe container strictly to kill old listeners and DOM
        calendarContainer.innerHTML = '';

        const today = new Date();
        const startOfWeek = getMonday(today);
        startOfWeek.setDate(startOfWeek.getDate() + (calendarState.weekOffset * 7));
        
        // Update Headers dynamically
        if (monthHeader) {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthHeader.textContent = monthNames[startOfWeek.getMonth()] + " " + startOfWeek.getFullYear();
        }
        if (weekSubheader) {
            const weekOfMonth = Math.ceil(startOfWeek.getDate() / 7);
            weekSubheader.innerHTML = `Week ${weekOfMonth}`;
        }

        // Check if currently selected date falls in this new week
        let selectedInWeek = false;
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            weekDates.push(dStr);
            if (dStr === calendarState.selectedDate) {
                selectedInWeek = true;
            }
        }

        // Smooth state persistence: default to Monday if selected date isn't in view
        if (!selectedInWeek) {
            calendarState.selectedDate = weekDates[0];
        }

        // Generate 7 days HTML
        const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let newHtml = '';
        
        weekDates.forEach((dateStr, i) => {
            const dObj = new Date(dateStr);
            const dateNum = dObj.getDate();
            const isActive = (dateStr === calendarState.selectedDate);
            
            // Check dynamic dot
            const attendedThisDay = calendarState.attendanceHistory.some(a => a.timestamp && a.timestamp.startsWith(dateStr));
            let dotClass = '';
            
            if (isActive) {
                // Active blue card
                dotClass = attendedThisDay ? 'bg-white' : 'bg-transparent';
                newHtml += `
                <button class="date-card flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-on-primary shadow-lg transform -translate-y-1 scale-105 relative overflow-hidden" data-date="${dateStr}">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container relative z-10">${daysShort[i]}</span>
                    <span class="font-headline-lg text-headline-lg mt-1 relative z-10">${dateNum}</span>
                    <div class="w-1.5 h-1.5 rounded-full ${dotClass} mt-2 relative z-10" ${!attendedThisDay ? 'style="border: 1px solid rgba(255,255,255,0.5);"' : ''}></div>
                </button>`;
            } else {
                // Inactive white/surface card
                dotClass = attendedThisDay ? 'bg-primary' : 'bg-outline-variant';
                newHtml += `
                <button class="date-card flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-transform hover:-translate-y-1 shadow-sm group" data-date="${dateStr}">
                    <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant group-hover:text-on-surface transition-colors">${daysShort[i]}</span>
                    <span class="font-headline-lg text-headline-lg mt-1">${dateNum}</span>
                    <div class="w-1.5 h-1.5 rounded-full ${dotClass} mt-2" ${!attendedThisDay ? 'style="background-color: transparent; border: 1px solid #cbd5e1;"' : ''}></div>
                </button>`;
            }
        });

        // Inject new HTML
        calendarContainer.innerHTML = newHtml;

        // Attach fresh delegated event listener to the container (or individual buttons)
        const newCards = calendarContainer.querySelectorAll('.date-card');
        newCards.forEach(card => {
            card.addEventListener('click', function() {
                calendarState.selectedDate = this.getAttribute('data-date');
                // Re-render calendar UI to swap classes accurately based on State
                renderCalendar(); 
            });
        });

        // Update the Glance panel with the current selected date
        updateGlanceCounters();
    }

    // --- 5. RENDER GLANCE PANEL ---
    function updateGlanceCounters() {
        if (!glanceContainer) return;
        
        glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">Checking data...</div>';

        const selDate = calendarState.selectedDate;
        
        const dayAttended = calendarState.attendanceHistory.filter(h => h.timestamp && h.timestamp.startsWith(selDate));
        const dayAbsences = calendarState.absencesHistory.filter(a => a.timestamp && a.timestamp.startsWith(selDate));
        
        // Zero state
        if (attendedCounter) attendedCounter.innerHTML = dayAttended.length.toString();
        if (skippedCounter) skippedCounter.innerHTML = dayAbsences.length.toString();

        if (dayAbsences.length === 0 && dayAttended.length === 0) {
            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">No classes scheduled or held on this date.</div>';
        } else if (dayAbsences.length === 0) {
            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">All caught up! No skipped classes.</div>';
        } else {
            let html = '';
            dayAbsences.forEach(a => {
                html += `
                <div class="flex items-center gap-4 p-3 bg-error-container/30 rounded-xl">
                    <div class="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[20px]">cancel</span>
                    </div>
                    <div>
                        <p class="font-label-sm text-label-sm text-on-surface font-bold">${a.subject} skipped</p>
                        <p class="font-body-md text-[13px] text-on-surface-variant">Class marked absent</p>
                    </div>
                </div>`;
            });
            glanceContainer.innerHTML = html;
        }
    }

    // --- 6. EVENT LISTENERS FOR ARROWS ---
    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            calendarState.weekOffset--;
                        renderCalendar();
        });
    }
    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            calendarState.weekOffset++;
                        renderCalendar();
        });
    }

    // --- 7. GEOLOCATION MAP FIX ---
    const mapContainer = document.getElementById('studentMap');
    if (mapContainer) {
        mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-on-surface-variant rounded-2xl"><p>Locating...</p></div>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    mapContainer.innerHTML = `<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=${lat},${lon}&hl=en&z=15&output=embed" style="border-radius:1rem; min-height: 200px;"></iframe>`;
                },
                function(error) {
                    mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-error rounded-2xl font-semibold"><p>Location permission denied.</p></div>';
                }
            );
        } else {
            mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-error rounded-2xl font-semibold"><p>Geolocation not supported.</p></div>';
        }
    }

    // --- 8. INITIALIZE ---
    fetchAttendanceData(() => {
        renderCalendar();
    });
});






// ==========================================
// ATTENDANCE OVERVIEW — RUNS IMMEDIATELY (no DOMContentLoaded — DOM already parsed since script is at bottom of body)
// ==========================================
(function initAttendanceOverview() {
    var btnSemester = document.getElementById('btn-semester');
    var btnMonthly = document.getElementById('btn-monthly');
    var tableBody = document.getElementById('attendance-table-body');

    if (!btnSemester || !btnMonthly || !tableBody) {
        console.error('Attendance Overview: Missing DOM elements.',
            'btn-semester:', !!btnSemester,
            'btn-monthly:', !!btnMonthly,
            'attendance-table-body:', !!tableBody);
        return;
    }

    var ACTIVE = ['bg-primary', 'text-on-primary', 'shadow-sm'];
    var INACTIVE = ['text-on-surface-variant', 'hover:bg-surface-container'];

    function setActive(btn) {
        INACTIVE.forEach(function(c) { btn.classList.remove(c); });
        ACTIVE.forEach(function(c) { btn.classList.add(c); });
    }
    function setInactive(btn) {
        ACTIVE.forEach(function(c) { btn.classList.remove(c); });
        INACTIVE.forEach(function(c) { btn.classList.add(c); });
    }

    function fetchAttendanceStats(timeframe) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px;" class="text-on-surface-variant font-semibold">Loading data...</td></tr>';

        fetch('/api/dashboard/student?timeframe=' + timeframe, {
            headers: { 'Authorization': 'Bearer ' + studentToken }
        })
        .then(function(response) { return response.json(); })
        .then(function(res) {
            if (!res.tracker || res.tracker.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px;" class="text-on-surface-variant font-semibold">No data found for this period.</td></tr>';
                return;
            }

            var rows = '';
            res.tracker.forEach(function(t) {
                var pct = t.total > 0 ? Math.round((t.attended / t.total) * 100) : 0;
                var onTrack = pct >= 75;

                var pctColor = onTrack ? 'text-primary' : 'text-error';
                var barColor = onTrack ? 'bg-primary' : 'bg-error';
                var badgeCls = onTrack ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error';
                var badgeTxt = onTrack ? 'ON TRACK' : 'BELOW THRESHOLD';
                var recColor = onTrack ? 'text-on-surface-variant' : 'text-error font-semibold';
                var recText  = onTrack
                    ? (t.classesNeededFor75 === 0 ? 'Maintain current pace' : 'Safe margin: ' + t.classesNeededFor75 + ' classes')
                    : 'Need to attend next ' + t.classesNeededFor75 + ' classes';

                rows += '<tr class="hover:bg-surface-container-low/30 transition-colors">'
                    + '<td class="px-6 py-4 font-semibold text-on-surface">' + t.subject + '</td>'
                    + '<td class="px-6 py-4 text-on-surface-variant">' + t.total + '</td>'
                    + '<td class="px-6 py-4 text-on-surface-variant">' + t.attended + '</td>'
                    + '<td class="px-6 py-4">'
                    +   '<div class="flex items-center gap-2">'
                    +     '<span class="font-semibold ' + pctColor + '">' + pct + '%</span>'
                    +     '<div class="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">'
                    +       '<div class="h-full ' + barColor + '" style="width:' + pct + '%"></div>'
                    +     '</div>'
                    +   '</div>'
                    + '</td>'
                    + '<td class="px-6 py-4">'
                    +   '<span class="px-3 py-1 rounded-full ' + badgeCls + ' text-[11px] font-bold uppercase">' + badgeTxt + '</span>'
                    + '</td>'
                    + '<td class="px-6 py-4 text-label-sm ' + recColor + '">' + recText + '</td>'
                    + '</tr>';
            });

            tableBody.innerHTML = rows;
        })
        .catch(function(err) {
            console.error('Attendance fetch failed:', err);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px;" class="text-error font-semibold">Failed to fetch data. Please try again.</td></tr>';
        });
    }

    btnSemester.addEventListener('click', function() {
        setActive(btnSemester);
        setInactive(btnMonthly);
        fetchAttendanceStats('semester');
    });

    btnMonthly.addEventListener('click', function() {
        setActive(btnMonthly);
        setInactive(btnSemester);
        fetchAttendanceStats('monthly');
    });

    // Load semester view immediately
    fetchAttendanceStats('semester');
})();


// ==========================================
// INTERNAL MARKS SECTION — RUNS IMMEDIATELY (IIFE)
// ==========================================
(function initInternalMarks() {
    var elPercentage      = document.getElementById('internal-current-percentage');
    var elProgressBar     = document.getElementById('internal-progress-bar');
    var elPoints          = document.getElementById('internal-current-points');
    var elTierMessage     = document.getElementById('internal-tier-message');
    var elNextClasses     = document.getElementById('internal-next-tier-classes');
    var elNextTarget      = document.getElementById('internal-next-tier-target');
    var elRadialPct       = document.getElementById('internal-radial-percentage');
    var elRadialCircle    = document.getElementById('internal-radial-circle');
    var elMilestoneLabel  = document.getElementById('internal-milestone-label');
    var elMilestoneDesc   = document.getElementById('internal-milestone-desc');
    var btnDetailedLog    = document.getElementById('btn-detailed-log');

    if (!elPercentage || !elPoints || !elNextClasses) {
        console.error('Internal Marks: Missing DOM elements.',
            'percentage:', !!elPercentage,
            'points:', !!elPoints,
            'nextClasses:', !!elNextClasses);
        return;
    }

    // ---- Tier Matrix (STRICT EXAM RULES) ----
    function getPointsAndNextTier(percentage) {
        if (percentage >= 95) return { points: 5, nextTierPct: null,   tierName: 'Tier 5', tierLabel: 'Excellent',  nextTierPoints: null };
        if (percentage >= 90) return { points: 4, nextTierPct: 95,     tierName: 'Tier 4', tierLabel: 'Good',       nextTierPoints: 5 };
        if (percentage >= 85) return { points: 3, nextTierPct: 90,     tierName: 'Tier 3', tierLabel: 'Average',    nextTierPoints: 4 };
        if (percentage >= 80) return { points: 2, nextTierPct: 85,     tierName: 'Tier 2', tierLabel: 'Warning',    nextTierPoints: 3 };
        if (percentage >= 75) return { points: 1, nextTierPct: 80,     tierName: 'Tier 1', tierLabel: 'Critical',   nextTierPoints: 2 };
        return                       { points: 0, nextTierPct: 75,     tierName: 'Tier 0', tierLabel: 'Debarment',  nextTierPoints: 1 };
    }

    // ---- Fetch real data and update DOM ----
    function updateInternalMarksSection() {
        fetch('/api/dashboard/student', {
            headers: { 'Authorization': 'Bearer ' + studentToken }
        })
        .then(function(response) { return response.json(); })
        .then(function(res) {
            var totalClasses    = res.totalClasses || 0;
            var attendedClasses = res.totalAttended || 0;
            var percentage      = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

            var tier = getPointsAndNextTier(percentage);

            // --- Calculate consecutive classes needed ---
            var classesNeeded = 0;
            if (tier.nextTierPct !== null && totalClasses > 0) {
                var P = tier.nextTierPct;
                classesNeeded = Math.ceil(((P * totalClasses) - (100 * attendedClasses)) / (100 - P));
                if (classesNeeded < 0) classesNeeded = 0;
            }

            // --- 1. Current Attendance card ---
            elPercentage.innerHTML = percentage + '<span class="text-headline-md">%</span>';
            if (elProgressBar) elProgressBar.style.width = percentage + '%';

            // --- 2. Projected CA3 Points card ---
            elPoints.textContent = tier.points + '.0';
            if (elTierMessage) {
                if (tier.nextTierPct === null) {
                    elTierMessage.textContent = 'Maximum tier reached!';
                } else {
                    elTierMessage.textContent = 'On track for next tier';
                }
            }

            // --- 3. Days to Next Tier card ---
            if (tier.nextTierPct === null) {
                elNextClasses.textContent = '0';
                if (elNextTarget) elNextTarget.textContent = 'Maximum tier reached';
            } else {
                elNextClasses.textContent = classesNeeded.toString();
                if (elNextTarget) elNextTarget.textContent = 'Reach ' + tier.nextTierPct + '% for ' + tier.nextTierPoints + ' CA3 Points';
            }

            // --- 4. Radial chart ---
            if (elRadialPct) {
                elRadialPct.innerHTML = percentage + '<span class="text-[20px]">%</span>';
            }
            if (elRadialCircle) {
                // circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.2
                var circumference = 251.2;
                var offset = circumference - (circumference * percentage / 100);
                elRadialCircle.setAttribute('stroke-dashoffset', offset.toFixed(2));
            }

            // --- 5. Milestone box ---
            if (elMilestoneLabel) {
                if (tier.nextTierPct === null) {
                    elMilestoneLabel.textContent = 'Maximum Tier Reached!';
                } else {
                    elMilestoneLabel.textContent = 'Next Milestone: ' + tier.nextTierPct + '%';
                }
            }
            if (elMilestoneDesc) {
                if (tier.nextTierPct === null) {
                    elMilestoneDesc.textContent = 'Congratulations! You are at the highest tier (5 Points).';
                } else {
                    elMilestoneDesc.textContent = 'Attend ' + classesNeeded + ' more consecutive classes to reach ' + tier.tierName.replace('Tier ', 'Tier ') + ' (' + tier.nextTierPoints + ' Points).';
                }
            }

            // --- 6. Highlight current tier row in the Points Allocation Matrix ---
            var tierRows = document.querySelectorAll('#section-internal-marks .grid.grid-cols-4');
            // Tier rows: index 1=Tier5(>=95), 2=Tier4(90-94), 3=Tier3(85-89), 4=Tier2(80-84), 5=Tier1(75-79), 6=Tier0(<75)
            // Map points to row index: 5->1, 4->2, 3->3, 2->4, 1->5, 0->6
            var tierRowIndex = 5 - tier.points + 1;
            tierRows.forEach(function(row, i) {
                if (i === 0) return; // skip header
                // Remove any existing highlight
                row.classList.remove('bg-primary/5');
                row.classList.remove('hover:bg-primary/10');
                var indicator = row.querySelector('.absolute.left-0');
                if (indicator) indicator.remove();
                var badge = row.querySelector('[class*="Current Tier"]');
                // We won't remove text badges to keep it simpler — just reset background
                if (i === tierRowIndex) {
                    row.classList.add('bg-primary/5');
                    row.classList.add('hover:bg-primary/10');
                    row.style.position = 'relative';
                    row.style.overflow = 'hidden';
                    if (!row.querySelector('.tier-indicator')) {
                        var div = document.createElement('div');
                        div.className = 'absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl tier-indicator';
                        row.appendChild(div);
                    }
                }
            });

            // --- 7. Store for button alert ---
            if (btnDetailedLog) {
                btnDetailedLog._data = {
                    attended: attendedClasses,
                    total: totalClasses,
                    percentage: percentage,
                    points: tier.points,
                    classesNeeded: classesNeeded,
                    nextTierPct: tier.nextTierPct
                };
            }
        })
        .catch(function(err) {
            console.error('Internal Marks fetch failed:', err);
        });
    }

    // ---- Button binding ----
    if (btnDetailedLog) {
        btnDetailedLog.addEventListener('click', function() {
            var d = btnDetailedLog._data || {};
            alert(
                'Classes Attended: ' + (d.attended || 0)
                + '\nTotal Classes: ' + (d.total || 0)
                + '\nCurrent Attendance: ' + (d.percentage || 0) + '%'
                + '\nCurrent CA Points: ' + (d.points !== undefined ? d.points : '?') + ' / 5'
                + '\nClasses needed for next tier: ' + (d.classesNeeded !== undefined ? d.classesNeeded : '?')
            );
        });
    }

    // Fire immediately
    updateInternalMarksSection();
})();
