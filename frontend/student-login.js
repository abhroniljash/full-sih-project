function togglePass() {
    var p = document.getElementById('password');
    var icon = document.querySelector('.toggle-pass i');
    if (p.type === 'password') {
        p.type = 'text';
        icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye');
    } else {
        p.type = 'password';
        icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash');
    }
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var roll = document.getElementById('roll').value.trim();
    var name = document.getElementById('name').value.trim();
    var password = document.getElementById('password').value;

    if (!roll) { showToast('Enter your roll number', 'warning'); return; }
    if (!name) { showToast('Enter your full name', 'warning'); return; }
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

    var btn = document.getElementById('submitBtn');
    btn.classList.add('loading'); btn.disabled = true;

    // Try logging in first. If this roll number has never been used before,
    // register it on the fly with the name just entered — this keeps the
    // original single-form UX (no separate "sign up" screen) while data is
    // now persisted for real on the backend.
    API.post('/auth/student/login', { rollNumber: roll, password: password })
        .then(function(res) {
            Auth.setSession('student', res.token, res.user);
            showToast('Login successful!', 'success');
            setTimeout(function(){ goTo('student-dashboard.html'); }, 800);
        })
        .catch(function(loginErr) {
            // If login failed, try registering (first-time user)
            API.post('/auth/student/register', { rollNumber: roll, name: name, password: password })
                .then(function(res) {
                    Auth.setSession('student', res.token, res.user);
                    showToast('Account created & logged in!', 'success');
                    setTimeout(function(){ goTo('student-dashboard.html'); }, 800);
                })
                .catch(function(regErr) {
                    // Both login and register failed — show the login error
                    showToast(loginErr.message || 'Invalid credentials', 'danger');
                })
                .finally(function() {
                    btn.classList.remove('loading'); btn.disabled = false;
                });
        });
});
