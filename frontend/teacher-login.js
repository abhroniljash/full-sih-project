function togglePass() {
    var p = document.getElementById('password');
    var btn = document.querySelector('.toggle-pass');
    if (p.type === 'password') { p.type = 'text'; btn.innerHTML = '<i class="fa-regular fa-eye"></i>'; }
    else { p.type = 'password'; btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>'; }
}

var isRegisterMode = false;
var subjectGroup = document.getElementById('subjectGroup');

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    var btn = document.getElementById('submitBtn');
    var switchText = document.getElementById('modeSwitchText');

    if (isRegisterMode) {
        btn.querySelector('.btn-text').textContent = 'Create Account';
        if (subjectGroup) subjectGroup.style.display = 'block';
        switchText.innerHTML = 'Already have an account? <a href="#" onclick="toggleMode(); return false;">Sign In</a>';
    } else {
        btn.querySelector('.btn-text').textContent = 'Sign In';
        if (subjectGroup) subjectGroup.style.display = 'none';
        switchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleMode(); return false;">Register</a>';
    }
}

// Hide subject field by default (only show in register mode)
if (subjectGroup) subjectGroup.style.display = 'none';

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('email').value.trim();
    var subject = document.getElementById('subject') ? document.getElementById('subject').value.trim() : '';
    var password = document.getElementById('password').value;

    if (!email || !email.includes('@')) { showToast('Enter a valid email', 'warning'); return; }
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

    var btn = document.getElementById('submitBtn');
    btn.classList.add('loading'); btn.disabled = true;

    if (isRegisterMode) {
        // --- REGISTER MODE ---
        if (!subject) { showToast('Please enter the subject you teach', 'warning'); btn.classList.remove('loading'); btn.disabled = false; return; }

        API.post('/auth/teacher/register', { email: email, password: password, subject: subject })
            .then(function(res) {
                Auth.setSession('teacher', res.token, res.user);
                showToast('Account created & logged in!', 'success');
                setTimeout(function(){ goTo('teacher-dashboard.html'); }, 800);
            })
            .catch(function(err) {
                showToast(err.message || 'Registration failed', 'danger');
            })
            .finally(function() {
                btn.classList.remove('loading'); btn.disabled = false;
            });
    } else {
        // --- LOGIN MODE ---
        API.post('/auth/teacher/login', { email: email, password: password })
            .then(function(res) {
                Auth.setSession('teacher', res.token, res.user);
                showToast('Login successful!', 'success');
                setTimeout(function(){ goTo('teacher-dashboard.html'); }, 800);
            })
            .catch(function(err) {
                showToast(err.message || 'Invalid credentials', 'danger');
            })
            .finally(function() {
                btn.classList.remove('loading'); btn.disabled = false;
            });
    }
});
