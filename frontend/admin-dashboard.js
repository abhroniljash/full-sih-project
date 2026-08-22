// --- Auth & Setup ---
var admin = Auth.getUser('admin');
var adminToken = Auth.getToken('admin');
if (!admin || !adminToken) goTo('secure-admin-portal.html');

var elHUName = document.getElementById('hUName');
if(elHUName) elHUName.textContent = admin.name;

// --- Sidebar Navigation ---
var navItems = document.querySelectorAll('.nav-item');
var sections = document.querySelectorAll('.section');

function switchSec(secId) {
    navItems.forEach(function(btn) {
        if(btn.dataset.sec === secId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    sections.forEach(function(sec) {
        if(sec.id === 'sec-' + secId) {
            sec.style.display = 'block';
            sec.classList.add('active');
        } else {
            sec.style.display = 'none';
            sec.classList.remove('active');
        }
    });

    var titles = {
        'register-teacher': ['Register Teacher', 'Create a new teacher account'],
        'teachers-list': ['Manage Teachers', 'View and manage registered teachers'],
        'activity-logs': ['Activity Logs', 'Monitor teacher session history'],
        'broadcast': ['Broadcast Alert', 'Send notifications to all teachers']
    };
    if(titles[secId]) {
        var elPgTitle = document.getElementById('pgTitle');
        if(elPgTitle) elPgTitle.textContent = titles[secId][0];
        var elPgSub = document.getElementById('pgSub');
        if(elPgSub) elPgSub.textContent = titles[secId][1];
    }
    
    if (secId === 'teachers-list') fetchTeachers();
    if (secId === 'activity-logs') fetchActivityLogs();
}

navItems.forEach(function(btn) {
    btn.addEventListener('click', function() { switchSec(this.dataset.sec); });
});

var logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        confirmLogout('admin');
    });
}

// --- Teacher Registration ---
var regForm = document.getElementById('teacherRegisterForm');
if(regForm) {
    regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var tName = document.getElementById('tName').value.trim();
        var tEmail = document.getElementById('tEmail').value.trim();
        var tDept = document.getElementById('tDept').value.trim();
        var tSubj = document.getElementById('tSubj').value.trim();
        var tPass = document.getElementById('tPass').value;

        if (!tEmail || !tEmail.includes('@') || !tPass) {
            showToast('Valid email and password required', 'warning');
            return;
        }

        var btn = document.getElementById('submitRegBtn');
        btn.disabled = true;
        btn.textContent = 'Creating...';

        API.post('/auth/teacher/register', { 
            name: tName, 
            email: tEmail, 
            department: tDept, 
            subject: tSubj, 
            password: tPass 
        }, adminToken)
        .then(function(res) {
            showToast('Teacher account created successfully!', 'success');
            regForm.reset();
            document.getElementById('tPass').value = 'teacher123';
        })
        .catch(function(err) {
            showToast(err.message || 'Failed to create teacher account', 'danger');
        })
        .finally(function() {
            btn.disabled = false;
            btn.textContent = 'Create Teacher Account';
        });
    });
}

// --- Broadcast Notification ---
var broadcastForm = document.getElementById('broadcastForm');
if(broadcastForm) {
    broadcastForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        var bTitle = document.getElementById('bTitle').value.trim();
        var bMessage = document.getElementById('bMessage').value.trim();
        var bType = document.getElementById('bType').value;

        if (!bTitle || !bMessage) {
            showToast('Title and message required', 'warning');
            return;
        }

        var btn = document.getElementById('submitBroadcastBtn');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        API.post('/notifications/broadcast', { 
            title: bTitle, 
            message: bMessage, 
            type: bType 
        }, adminToken)
        .then(function(res) {
            showToast('Broadcast sent to all teachers!', 'success');
            broadcastForm.reset();
        })
        .catch(function(err) {
            showToast(err.message || 'Failed to send broadcast', 'danger');
        })
        .finally(function() {
            btn.disabled = false;
            btn.textContent = 'Send Broadcast';
        });
    });
}

// --- Data Fetching ---
var allTeachersData = [];

window.fetchTeachers = function() {
    var tbody = document.getElementById('teachersTbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading teachers...</td></tr>';
    
    API.get('/admin/teachers', adminToken)
    .then(function(res) {
        allTeachersData = res.teachers || [];
        if (allTeachersData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No teachers registered yet.</td></tr>';
            return;
        }
        var html = '';
        allTeachersData.forEach(function(t) {
            html += '<tr>';
            html += '<td><strong>' + (t.employeeId || '-') + '</strong></td>';
            html += '<td>' + (t.name || '-') + '</td>';
            html += '<td>' + (t.email || '-') + '</td>';
            html += '<td>' + (t.department || '-') + '</td>';
            html += '<td>' + (t.subject || '-') + '</td>';
            html += '<td>' + (t.createdAt ? formatDate(t.createdAt) : '-') + '</td>';
            html += '<td><button class="btn btn-sm" style="background:#fee2e2;color:#ef4444;padding:4px 8px;font-size:12px;" onclick="deleteTeacher(\'' + t.id + '\')"><i class="fa-solid fa-trash"></i></button></td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    })
    .catch(function(err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;">Failed to load teachers</td></tr>';
    });
};

window.deleteTeacher = function(id) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    API.request('DELETE', '/admin/teachers/' + id, null, adminToken)
    .then(function() {
        showToast('Teacher deleted successfully', 'success');
        fetchTeachers();
    })
    .catch(function(err) {
        showToast(err.message || 'Failed to delete teacher', 'danger');
    });
};

window.exportTeachersCSV = function() {
    if (!allTeachersData || allTeachersData.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    var csv = 'Employee ID,Name,Email,Department,Subject,Registered On\n';
    allTeachersData.forEach(function(t) {
        var date = t.createdAt ? formatDate(t.createdAt) : '-';
        csv += `"${t.employeeId || '-'}","${t.name || '-'}","${t.email || '-'}","${t.department || '-'}","${t.subject || '-'}","${date}"\n`;
    });
    
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.fetchActivityLogs = function() {
    var tbody = document.getElementById('activityTbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading activity...</td></tr>';
    
    API.get('/admin/teacher-activity', adminToken)
    .then(function(res) {
        var logs = res.activity || [];
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No activity logged yet.</td></tr>';
            return;
        }
        
        // Sort descending
        logs.sort(function(a, b) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        var html = '';
        logs.forEach(function(log) {
            var badge = log.type === 'login' ? '<span class="badge" style="background:#22c55e;">Login</span>' : '<span class="badge" style="background:#f59e0b;">Logout</span>';
            html += '<tr>';
            html += '<td>' + (log.createdAt ? formatDateTime(log.createdAt) : '-') + '</td>';
            html += '<td><strong>' + (log.teacherName || '-') + '</strong></td>';
            html += '<td>' + badge + '</td>';
            html += '</tr>';
        });
        tbody.innerHTML = html;
    })
    .catch(function(err) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#ef4444;">Failed to load activity logs</td></tr>';
    });
};

// Init
switchSec('register-teacher');
