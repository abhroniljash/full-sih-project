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
document.getElementById('rollTag').textContent = 'Roll: ' + student.rollNumber;

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
        if (res.tracker.length === 0) {
            trackerHtml = '<div class="empty" style="padding:24px 0;"><p>No classes found in the system yet.</p></div>';
        } else {
            res.tracker.forEach(function(t) {
                var pColor = t.percentage >= 75 ? 'green' : (t.percentage >= 60 ? 'yellow' : 'red');
                var nClass = t.safe ? 'needed-ok' : (t.classesNeededFor75 <= 3 ? 'needed-warn' : 'needed-danger');
                var nText = t.safe ? 'Safe (≥75%)' : 'Need ' + t.classesNeededFor75 + ' more class' + (t.classesNeededFor75 > 1 ? 'es' : '');

                trackerHtml += '<div class="tracker-row">' +
                    '<div style="width:30%">' +
                        '<div class="subj">'+t.subject+'</div>' +
                        '<div class="teacher">by '+t.teacher+'</div>' +
                    '</div>' +
                    '<div style="width:40%">' +
                        '<div style="font-size:12px;color:#64748b;margin-bottom:4px;">Attended '+t.attended+' of '+t.total+'</div>' +
                        '<div class="pbar-wrap">' +
                            '<div class="pbar"><div class="pbar-fill '+pColor+'" style="width:'+t.percentage+'%"></div></div>' +
                            '<div class="pbar-val" style="color:var(--'+pColor+')">'+t.percentage+'%</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="width:30%;text-align:right;">' +
                        '<span class="needed '+nClass+'">'+nText+'</span>' +
                    '</div>' +
                '</div>';
            });
        }
        document.getElementById('trackerList').innerHTML = trackerHtml;

        // Render History Table
        var tHtml = '<table><tr><th>Date & Time</th><th>Subject</th><th>Session ID</th><th>Status</th></tr>';
        if (res.history.length === 0) {
            tHtml += '<tr><td colspan="4" style="text-align:center;">No attendance records found.</td></tr>';
        } else {
            res.history.forEach(function(h) {
                tHtml += '<tr><td>'+formatDateTime(h.timestamp)+'</td><td><b>'+h.subject+'</b></td><td class="mono">'+h.sessionId+'</td><td><span class="badge badge-green">Present</span></td></tr>';
            });
        }
        tHtml += '</table>';
        document.getElementById('historyTable').innerHTML = tHtml;
    }).catch(function(err) {
        showToast(err.message || 'Failed to load dashboard', 'danger');
    });
}

// Initialize Dashboard
loadDashboard();


