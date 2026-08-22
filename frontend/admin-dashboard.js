// --- Auth & Setup ---
var admin = Auth.getUser('admin');
var adminToken = Auth.getToken('admin');
if (!admin || !adminToken) goTo('admin-login.html');

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
        'broadcast': ['Broadcast Alert', 'Send notifications to all teachers']
    };
    if(titles[secId]) {
        var elPgTitle = document.getElementById('pgTitle');
        if(elPgTitle) elPgTitle.textContent = titles[secId][0];
        var elPgSub = document.getElementById('pgSub');
        if(elPgSub) elPgSub.textContent = titles[secId][1];
    }
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

// Init
switchSec('register-teacher');
