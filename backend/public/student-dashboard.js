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
            trackerContainer.innerHTML = '<div style="padding:24px 0; color: var(--text-muted);">No classes found.</div>';
        } else {
            trackerHtml += '<div class="tracker-min-line"></div><div class="tracker-min-label">75% Minimum</div>';
            res.tracker.forEach(function(t) {
                var isSafe = t.percentage >= 75;
                var dangerClass = isSafe ? '' : 'danger';
                var htmlPercentage = Math.max(10, t.percentage); // Minimum 10% height to be visible
                var subjectAbbr = t.subject.substring(0, 3).toUpperCase();
                
                trackerHtml += '<div class="tracker-bar ' + dangerClass + '" style="height:' + htmlPercentage + '%">' +
                    '<div class="tracker-tooltip">' + t.percentage + '% - ' + t.subject + '</div>' +
                    '<div class="tracker-label">' + subjectAbbr + '</div>' +
                '</div>';
            });
            trackerContainer.innerHTML = trackerHtml;
        }

        // Render History Table
        var tHtml = '';
        if (res.history.length === 0) {
            tHtml = '<div style="text-align:center;padding:24px;color:var(--text-muted);">No attendance records found.</div>';
        } else {
            res.history.forEach(function(h) {
                tHtml += '<div class="history-item">' +
                    '<div>' +
                    '<div class="history-subj">' + h.subject + '</div>' +
                    '<div class="history-time">' + formatDateTime(h.timestamp) + '</div>' +
                    '</div>' +
                    '<div class="history-badge">Present</div>' +
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


