const fs = require('fs');

let js = fs.readFileSync('backend/public/teacher-dashboard.js', 'utf8');

// Find the loadMessages part and inject a reply button, plus the modal logic at the bottom.
const startMsg = js.indexOf('// --- Messages Panel ---');
const endMsg = js.indexOf('})();', startMsg) + 5;

const oldPanel = js.substring(startMsg, endMsg);

const newPanel = `
// --- Messages Panel ---
(function() {
    var msgBtn = document.getElementById('msgBtn');
    var msgDot = document.getElementById('msgDot');
    if (!msgBtn) return;

    var panel = document.createElement('div');
    panel.id = 'msgPanel';
    panel.style.cssText = 'display:none;position:fixed;top:60px;right:120px;width:380px;max-height:480px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);z-index:200;overflow:hidden;';
    panel.innerHTML = '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:15px;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">Messages <button id="msgClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;">✕</button></div><div id="msgList" style="overflow-y:auto;max-height:400px;padding:8px 0;"></div>';
    document.body.appendChild(panel);

    // Reply Modal
    var replyModal = document.createElement('div');
    replyModal.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;';
    replyModal.innerHTML = \`
      <div style="background:#fff;width:400px;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:600;">Reply to Student</div>
        <div style="padding:20px;">
          <textarea id="replyBody" style="width:100%;height:100px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;resize:none;font-family:inherit;font-size:14px;" placeholder="Type your reply here..."></textarea>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button id="cancelReply" style="padding:8px 16px;background:#f1f5f9;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Cancel</button>
            <button id="sendReply" style="padding:8px 16px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Send Reply</button>
          </div>
        </div>
      </div>
    \`;
    document.body.appendChild(replyModal);
    var currentReplyTo = null;

    document.getElementById('cancelReply').addEventListener('click', function() {
        replyModal.style.display = 'none';
        document.getElementById('replyBody').value = '';
    });
    
    document.getElementById('sendReply').addEventListener('click', function() {
        var body = document.getElementById('replyBody').value;
        if(!body.trim()) return showToast('Please type a reply', 'warning');
        if(!currentReplyTo) return;

        API.post('/messages', {
            to: currentReplyTo,
            subject: 'Re: Your Concern',
            body: body
        }, teacherToken).then(function() {
            showToast('Reply sent successfully!', 'success');
            replyModal.style.display = 'none';
            document.getElementById('replyBody').value = '';
        }).catch(function(e) {
            showToast(e.message || 'Failed to send reply', 'danger');
        });
    });

    window.openReply = function(studentUsername) {
        currentReplyTo = studentUsername;
        replyModal.style.display = 'flex';
        document.getElementById('replyBody').focus();
    };

    msgBtn.addEventListener('click', function() {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            loadMessages();
        } else {
            panel.style.display = 'none';
        }
    });

    document.getElementById('msgClose').addEventListener('click', function() {
        panel.style.display = 'none';
    });

    function loadMessages() {
        var list = document.getElementById('msgList');
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Loading...</div>';
        API.get('/messages', teacherToken).then(function(res) {
            var msgs = res.messages || [];
            if (msgs.length === 0) {
                list.innerHTML = '<div style="padding:30px;text-align:center;color:#94a3b8;"><i class="fa-regular fa-comment" style="font-size:24px;display:block;margin-bottom:8px;"></i>No messages yet<br><span style="font-size:12px;">Students can message you from their dashboard</span></div>';
                if (msgDot) msgDot.style.display = 'none';
                return;
            }
            var html = '';
            msgs.forEach(function(m) {
                var isUnread = !m.read;
                var bg = isUnread ? '#f0f9ff' : '#fff';
                html += '<div style="padding:12px 20px;border-bottom:1px solid #f1f5f9;background:' + bg + ';" onclick="markMsgRead(\\'' + m.id + '\\', this)">';
                html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
                html += '<div style="font-weight:600;font-size:13px;color:#0f172a;">' + (m.fromName || m.from) + '</div>';
                html += '<div style="font-size:11px;color:#94a3b8;">' + new Date(m.timestamp).toLocaleString() + '</div>';
                html += '</div>';
                html += '<div style="font-weight:500;font-size:12px;color:#334155;margin-top:2px;">' + m.subject + '</div>';
                html += '<div style="font-size:12px;color:#475569;margin-top:4px;line-height:1.4;">' + m.body + '</div>';
                
                if (m.fromRole === 'student') {
                    html += '<button onclick="openReply(\\'' + m.from + '\\'); event.stopPropagation();" style="margin-top:8px;padding:4px 10px;font-size:11px;background:#e0e7ff;color:#4338ca;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Reply</button>';
                }
                
                html += '</div>';
            });
            var unread = msgs.filter(function(m){ return !m.read; }).length;
            if (msgDot) msgDot.style.display = unread > 0 ? 'block' : 'none';
            list.innerHTML = html;
        }).catch(function() {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Failed to load messages</div>';
        });
    }

    window.markMsgRead = function(id, el) {
        API.patch('/messages/' + id + '/read', {}, teacherToken).then(function() {
            if (el) el.style.background = '#fff';
        }).catch(function(){});
    };

    // Auto-check for unread messages on load
    API.get('/messages', teacherToken).then(function(res) {
        var unread = (res.messages || []).filter(function(m){ return !m.read; }).length;
        if (msgDot) msgDot.style.display = unread > 0 ? 'block' : 'none';
    }).catch(function(){});
})();
`;

js = js.replace(oldPanel, newPanel);
fs.writeFileSync('backend/public/teacher-dashboard.js', js);
console.log('Teacher dashboard JS patched');

// ALSO BUMP CACHE VER
let thtml = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');
thtml = thtml.replace(/teacher-dashboard\.js\?v=\d+/, 'teacher-dashboard.js?v=' + Date.now());
fs.writeFileSync('backend/public/teacher-dashboard.html', thtml);
