
// --- Toast Notification ---
function showToast(message, type) {
    var container = document.querySelector('.toast-box');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-box';
        /* Anchored to the BOTTOM, not top:20px. At the top a toast is ~52px tall
           (line-height 1.6 is inherited) and lands squarely on the "Back to Home"
           link at z-index 9999, so the only navigation on the login pages was
           covered and untappable for the full 4s. left+right instead of a bare
           right:20px also lets the stack shrink to the screen. */
        container.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;';
        document.body.appendChild(container);
    }
    var colors = { success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', info: '#4f46e5' };
    var icons = { success: '✓', warning: '⚠', danger: '✕', info: 'ℹ' };
    var t = document.createElement('div');
    /* min-width:300px was the load-bearing bug: a border-box 300px floor forced
       the toast to ~94% of a 360px screen. width:100% + max-width:400px keeps the
       desktop size while letting it shrink on a phone. */
    t.style.cssText = 'min-width:0;width:100%;max-width:400px;padding:14px 18px;background:#fff;border:1px solid #e2e8f0;border-left:4px solid '+(colors[type]||colors.info)+';border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-family:Inter,sans-serif;font-size:14px;color:#1e293b;animation:toastSlide .3s ease;';
    /* The dismiss glyph was a ~16x19px target (login.css's *{padding:0} strips the
       UA button padding); negative margins keep the row height unchanged. */
    t.innerHTML = '<span style="color:'+(colors[type]||colors.info)+';font-size:16px;font-weight:700;">'+( icons[type]||icons.info)+'</span><span style="flex:1;min-width:0;overflow-wrap:anywhere;">'+message+'</span><button onclick="this.parentElement.style.opacity=0;setTimeout(()=>this.parentElement.remove(),200)" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:8px;margin:-8px -6px -8px 0;line-height:1;flex-shrink:0;">✕</button>';
    container.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },200); }, 4000);
}

// Add toast animation
(function(){
    var s = document.createElement('style');
    s.textContent = '@keyframes toastSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
})();

// --- API client ---
// Thin wrapper around fetch() that talks to the Express backend
// (see /backend). Every call returns a parsed JSON body and throws
// an Error with the backend's message on non-2xx responses.
var API = {
    request: function(method, path, body, token) {
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return fetch(API_BASE + path, {
            method: method,
            headers: headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        }).then(function(res) {
            return res.json().catch(function(){ return {}; }).then(function(data) {
                if (!res.ok) {
                    throw new Error(data.message || ('Request failed (' + res.status + ')'));
                }
                return data;
            });
        });
    },
    get: function(path, token) { return this.request('GET', path, undefined, token); },
    post: function(path, body, token) { return this.request('POST', path, body, token); },
    put: function(path, body, token) { return this.request('PUT', path, body, token); },
    patch: function(path, body, token) { return this.request('PATCH', path, body, token); },
    del: function(path, token) { return this.request('DELETE', path, undefined, token); }
};

// --- Auth / session helpers (sessionStorage) ---
// Replaces the old Store.setUser/getUser/clearUser. Keeps a JWT + the user
// object per role so student and teacher can, in theory, be logged in
// side-by-side in different tabs.
var Auth = {
    setSession: function(role, token, user) {
        sessionStorage.setItem(role + '_token', token);
        sessionStorage.setItem(role + '_user', JSON.stringify(user));
    },
    getToken: function(role) {
        return sessionStorage.getItem(role + '_token');
    },
    getUser: function(role) {
        var d = sessionStorage.getItem(role + '_user');
        return d ? JSON.parse(d) : null;
    },
    clearSession: function(role) {
        sessionStorage.removeItem(role + '_token');
        sessionStorage.removeItem(role + '_user');
    }
};

// --- Date Formatting ---
function formatDate(d) {
    var date = new Date(d);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}
function formatTime(d) {
    var date = new Date(d);
    var h = date.getHours();
    var m = date.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}
function formatDateTime(d) { return formatDate(d) + ', ' + formatTime(d); }

function todayDate() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// --- Page Navigation ---
function goTo(url) {
    window.location.href = url;
}

// --- Copy to clipboard ---
function copyText(text) {
    navigator.clipboard.writeText(text).then(function(){
        showToast('Copied: ' + text, 'success');
    }).catch(function(){
        var inp = document.createElement('input');
        inp.value = text;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        inp.remove();
        showToast('Copied: ' + text, 'success');
    });
}

// --- Logout Confirmation ---
function confirmLogout(role) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:12px;padding:24px;width:320px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.2);transform:scale(0.9);transition:transform 0.2s;';

    modal.innerHTML = `
        <div style="font-size:40px;color:#ef4444;margin-bottom:12px;"><i class="fa-solid fa-right-from-bracket"></i></div>
        <h3 style="font-size:18px;color:#1e293b;margin-bottom:8px;">Are you sure?</h3>
        <p style="font-size:14px;color:#64748b;margin-bottom:20px;">Do you really want to log out of your account?</p>
        <div style="display:flex;gap:12px;justify-content:center;">
            <button id="cancelLogout" style="padding:8px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-weight:600;cursor:pointer;">Cancel</button>
            <button id="confirmLogout" style="padding:8px 16px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-weight:600;cursor:pointer;">Yes, Logout</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });

    document.getElementById('cancelLogout').onclick = function() {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('confirmLogout').onclick = function() {
        if (role === 'teacher') {
            API.post('/auth/teacher/logout', {}, Auth.getToken('teacher')).finally(() => {
                Auth.clearSession(role);
                goTo('/');
            });
        } else {
            Auth.clearSession(role);
            if (role === 'admin') goTo('/secure-admin-portal');
            else goTo('/');
        }
    };
}
