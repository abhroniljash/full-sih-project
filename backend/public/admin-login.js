document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;

    if (!username || !password) { showToast('Username and password are required', 'warning'); return; }

    var btn = document.getElementById('submitBtn');
    btn.classList.add('loading'); btn.disabled = true;

    API.post('/auth/admin/login', { username: username, password: password })
        .then(function(res) {
            Auth.setSession('admin', res.token, res.user);
            showToast('Login successful!', 'success');
            setTimeout(function(){ goTo('/secure-admin-dashboard'); }, 800);
        })
        .catch(function(err) {
            showToast(err.message || 'Invalid credentials', 'danger');
        })
        .finally(function() {
            btn.classList.remove('loading'); btn.disabled = false;
        });
});
