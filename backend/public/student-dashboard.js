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

// Initialize Dashboard
loadDashboard();



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
