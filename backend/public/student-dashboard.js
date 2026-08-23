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


