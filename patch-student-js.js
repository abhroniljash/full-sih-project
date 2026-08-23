const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const newCode = `

// --- Schedule API ---
function loadSchedule() {
    API.get('/sessions/schedule', studentToken).then(res => {
        const container = document.getElementById('scheduleTimelineContainer');
        if (!container) return;

        if (res.scheduled.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:24px;">No upcoming classes scheduled.</div>';
            return;
        }

        let html = '';
        html += '<div class="absolute left-[52px] top-4 bottom-8 w-0.5 bg-surface-variant"></div>';
        
        // Let's add a "Now" indicator just for looks
        html += \`
  <div class="absolute left-[47px] top-[10%] w-3 h-3 rounded-full bg-error z-20 shadow-[0_0_0_4px_rgba(255,255,255,1)]"></div>
  <div class="absolute left-[64px] top-[10%] right-0 h-px bg-error/30 z-20 -translate-y-1/2 border-t border-dashed border-error/50"></div>
  <div class="absolute left-0 top-[10%] -translate-y-1/2 -mt-0.5">
    <span class="font-label-sm text-[11px] text-error font-bold tracking-wider">NOW</span>
  </div>\`;

        res.scheduled.forEach(s => {
            html += \`
  <div class="flex items-start mb-12 group relative">
    <div class="w-12 pt-5 text-right pr-4 font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">
      \${s.scheduledTime}
    </div>
    <!-- Node -->
    <div class="w-3 h-3 rounded-full bg-outline-variant mt-6 -ml-[7px] mr-6 z-10 ring-4 ring-surface-container-lowest group-hover:bg-primary transition-colors"></div>
    <!-- Card -->
    <div class="flex-grow bg-surface-container-low rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1 relative overflow-hidden">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
      <div class="flex justify-between items-start mb-3 pl-2">
        <div>
          <span class="inline-block px-2.5 py-1 bg-surface-variant text-on-surface-variant font-label-sm text-[11px] uppercase tracking-wider rounded mb-2">\${s.className}</span>
          <h4 class="font-headline-md text-headline-md text-on-surface">\${s.subject}</h4>
        </div>
        <span class="font-label-sm text-label-sm text-on-surface-variant bg-surface rounded-lg px-3 py-1 shadow-sm">\${s.scheduledDate} \${s.scheduledTime}</span>
      </div>
      <div class="flex items-center gap-6 mt-4 pl-2">
         <span class="text-sm font-medium text-on-surface-variant">Teacher: \${s.teacher}</span>
      </div>
    </div>
  </div>\`;
        });
        container.innerHTML = html;
    }).catch(err => console.error('Failed to load schedule:', err));
}
setTimeout(loadSchedule, 500); // load after a short delay

// --- Concern Form ---
document.addEventListener('DOMContentLoaded', function() {
    const concernForm = document.getElementById('concernForm');
    if (concernForm) {
        concernForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Just get the inputs
            const courseSelect = document.getElementById('concern_227'); // based on offset injection, fallback below
            const course = courseSelect ? courseSelect.value : document.querySelectorAll('select')[0].value;
            const typeSelect = document.getElementById('concern_341');
            const type = typeSelect ? typeSelect.value : document.querySelectorAll('select')[1].value;
            const desc = document.getElementById('concernDescription').value;

            if (!desc) {
                showToast('Please provide a description.', 'danger');
                return;
            }

            API.post('/messages', {
                to: 'teacher', // backend logic handles this or teacher sees all messages to 'teacher'
                subject: \`[\${course}] Concern: \${type}\`,
                body: desc
            }, studentToken).then(res => {
                showToast('Concern submitted successfully!', 'success');
                concernForm.reset();
            }).catch(err => {
                showToast(err.message || 'Failed to submit concern', 'danger');
            });
        });
    }
});
`;

if (!js.includes('loadSchedule')) {
    fs.writeFileSync('backend/public/student-dashboard.js', js + newCode);
    console.log('Appended to student-dashboard.js');
}

// BUMP CACHE VER
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');
html = html.replace(/student-dashboard\.js\?v=\d+/, 'student-dashboard.js?v=' + Date.now());
fs.writeFileSync('backend/public/student-dashboard.html', html);
