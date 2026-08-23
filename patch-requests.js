const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');
html = html.replace('<div class="space-y-4 flex-1 overflow-y-auto pr-2">', '<div id="recentRequestsList" class="space-y-4 flex-1 overflow-y-auto pr-2">');
fs.writeFileSync('backend/public/student-dashboard.html', html);

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');
const loadReqs = `
function loadRecentRequests() {
    API.get('/messages', studentToken).then(res => {
        const list = document.getElementById('recentRequestsList');
        if (!list) return;
        const msgs = res.messages || [];
        if (msgs.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">No recent requests found.</div>';
            return;
        }
        
        let html = '';
        msgs.forEach(m => {
            const date = new Date(m.timestamp).toLocaleDateString();
            html += \`
            <div class="p-4 rounded-custom border-l-4 border-l-primary bg-surface flex flex-col gap-2 relative">
              <div class="flex justify-between items-start">
                <div class="text-xs font-semibold text-onSurface-variant tracking-wide">\${date}</div>
                <span class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  FROM: \${m.fromName || m.from}
                </span>
              </div>
              <div class="font-bold text-sm text-onSurface">\${m.subject}</div>
              <div class="text-xs text-onSurface-variant">\${m.body}</div>
            </div>\`;
        });
        list.innerHTML = html;
    }).catch(err => console.error(err));
}
setTimeout(loadRecentRequests, 600);
`;
if (!js.includes('loadRecentRequests')) {
    fs.writeFileSync('backend/public/student-dashboard.js', js + loadReqs);
}
