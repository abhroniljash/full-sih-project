function togglePass() {
    var p = document.getElementById('password');
    var btn = document.querySelector('.toggle-pass');
    if (p.type === 'password') { p.type = 'text'; btn.innerHTML = '<i class="fa-regular fa-eye"></i>'; }
    else { p.type = 'password'; btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>'; }
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    if (!email || !email.includes('@')) { showToast('Enter a valid email', 'warning'); return; }
    if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

    var btn = document.getElementById('submitBtn');
    btn.classList.add('loading'); btn.disabled = true;

    API.post('/auth/teacher/login', { email: email, password: password })
        .then(function(res) {
            Auth.setSession('teacher', res.token, res.user);
            showToast('Login successful!', 'success');
            setTimeout(function(){ goTo('/teacher-dashboard'); }, 800);
        })
        .catch(function(err) {
            showToast(err.message || 'Invalid credentials', 'danger');
        })
        .finally(function() {
            btn.classList.remove('loading'); btn.disabled = false;
        });
});
