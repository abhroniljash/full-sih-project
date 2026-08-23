const fs = require('fs');
let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const dynamicScript = `
// --- Dynamic Calendar, Absences & Location Patch ---
window.selectedScheduleDate = new Date().toISOString().split('T')[0];
window.cachedSchedule = [];
window.cachedAbsences = [];
window.cachedHistory = [];
let studentMapInstance = null;

function renderWeeklyCalendar() {
    const container = document.getElementById('weeklyCalendarContainer');
    if (!container) return;
    
    // Get current week Monday to Sunday
    const curr = new Date();
    const day = curr.getDay(); // 0 = Sun, 1 = Mon
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(curr.setDate(diff));
    
    let html = '';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dateNum = d.getDate();
        const isSelected = dateStr === window.selectedScheduleDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        if (isSelected) {
            html += \`
            <button onclick="selectScheduleDate('\${dateStr}')" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-on-primary shadow-lg transform -translate-y-1 scale-105 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container relative z-10">\${days[i]}</span>
                <span class="font-headline-lg text-headline-lg mt-1 relative z-10">\${dateNum}</span>
                <div class="w-1.5 h-1.5 rounded-full \${isToday ? 'bg-on-primary' : 'bg-transparent'} mt-2 relative z-10"></div>
            </button>\`;
        } else {
            html += \`
            <button onclick="selectScheduleDate('\${dateStr}')" class="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-transform hover:-translate-y-1 shadow-sm group">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant group-hover:text-on-surface transition-colors">\${days[i]}</span>
                <span class="font-headline-lg text-headline-lg mt-1">\${dateNum}</span>
                <div class="w-1.5 h-1.5 rounded-full \${isToday ? 'bg-primary' : 'bg-outline-variant'} mt-2"></div>
            </button>\`;
        }
    }
    container.innerHTML = html;
}

window.selectScheduleDate = function(dateStr) {
    window.selectedScheduleDate = dateStr;
    renderWeeklyCalendar();
    renderScheduleGlance();
};

function renderScheduleGlance() {
    const upcomingList = document.getElementById('upcomingTodayList'); // Home tab
    const glanceList = document.getElementById('todayGlanceList'); // My Schedule tab
    const summaryPill = document.getElementById('scheduleSummaryPill');
    const attCount = document.getElementById('todayAttendedCount');
    const skipCount = document.getElementById('todaySkippedCount');
    
    // Filter by selected date
    const dayScheduled = window.cachedSchedule.filter(s => s.scheduledDate === window.selectedScheduleDate);
    const dayAbsences = window.cachedAbsences.filter(a => a.timestamp && a.timestamp.startsWith(window.selectedScheduleDate));
    const dayHistory = window.cachedHistory.filter(h => h.timestamp && h.timestamp.startsWith(window.selectedScheduleDate));
    
    if (summaryPill) summaryPill.innerHTML = dayScheduled.length + ' Classes';
    if (attCount) attCount.innerText = dayHistory.length;
    if (skipCount) skipCount.innerText = dayAbsences.length;

    let upHtml = '';
    let glHtml = '';

    // Render Home Upcoming (Pending only)
    if (dayScheduled.length === 0) {
        upHtml = '<div class="text-sm text-onSurface-variant">No classes scheduled.</div>';
    } else {
        dayScheduled.forEach((s, idx) => {
            const colorClass = idx % 2 === 0 ? 'bg-primary text-primary' : 'bg-secondary text-secondary';
            upHtml += \`
            <div class="flex gap-4 group">
              <div class="flex flex-col items-center min-w-[60px]">
                <span class="font-label-sm text-label-sm text-on-surface">\${s.scheduledTime}</span>
              </div>
              <div class="flex-1 bg-surface-container-low rounded-xl p-4 border border-transparent group-hover:border-outline-variant transition-colors relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 \${colorClass.split(' ')[0]}"></div>
                <p class="font-label-sm text-label-sm \${colorClass.split(' ')[1]} mb-1">\${s.className}</p>
                <p class="font-body-md text-body-md text-on-surface font-medium leading-tight">\${s.subject}</p>
              </div>
            </div>\`;
        });
    }
    
    // Render Glance (Pending + Absences)
    if (dayScheduled.length === 0 && dayAbsences.length === 0) {
        glHtml = '<div class="text-sm font-semibold text-primary/70">All classes attended or nothing scheduled!</div>';
    } else {
        dayScheduled.forEach((s, idx) => {
            const colorClass = idx % 2 === 0 ? 'bg-primary text-primary' : 'bg-secondary text-secondary';
            glHtml += \`
            <div class="p-4 rounded-xl border border-surface-variant bg-surface flex gap-4 items-start relative overflow-hidden mt-3">
              <div class="absolute left-0 top-0 bottom-0 w-1 \${colorClass.split(' ')[0]}"></div>
              <div class="flex-1">
                <h5 class="text-sm font-bold text-onSurface mb-1">\${s.subject}</h5>
                <p class="text-xs font-medium text-onSurface-variant flex items-center gap-1.5"><span class="w-2 h-2 rounded-full \${colorClass.split(' ')[0]}"></span>\${s.scheduledTime}</p>
              </div>
            </div>\`;
        });
        dayAbsences.forEach(a => {
            glHtml += \`
            <div class="p-4 rounded-xl border border-error/20 bg-error/5 flex gap-4 items-start relative overflow-hidden mt-3">
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
              <div class="flex-1">
                <h5 class="text-sm font-bold text-error mb-1">\${a.subject} skipped</h5>
                <p class="text-xs font-medium text-error flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">cancel</span>Absent</p>
              </div>
            </div>\`;
        });
    }

    if (upcomingList) upcomingList.innerHTML = upHtml;
    if (glanceList) glanceList.innerHTML = glHtml;
}

// Override loadUpcomingDashboard
loadUpcomingDashboard = function() {
    Promise.all([
        API.get('/sessions/schedule', studentToken),
        API.get('/dashboard/student', studentToken)
    ]).then(responses => {
        const schedRes = responses[0];
        const dashRes = responses[1];
        
        window.cachedSchedule = schedRes.scheduled || [];
        window.cachedAbsences = dashRes.absences || [];
        window.cachedHistory = dashRes.history || [];
        
        renderWeeklyCalendar();
        renderScheduleGlance();
    }).catch(e => console.error(e));
};

// Initialize Leaflet Map with Geolocation
function initStudentMap() {
    const mapEl = document.getElementById('studentMap');
    if (!mapEl || typeof L === 'undefined') return;
    
    // Clear dummy styles if any
    mapEl.innerHTML = '';
    
    // Default location (fallback)
    const fallbackLat = 22.5726; 
    const fallbackLng = 88.3639;
    
    if (!studentMapInstance) {
        studentMapInstance = L.map('studentMap').setView([fallbackLat, fallbackLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(studentMapInstance);
    }
    
    // Try to get real location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            studentMapInstance.setView([lat, lng], 17);
            
            // Custom pin
            const markerHtml = \`
                <div class="flex flex-col items-center animate-bounce">
                    <span class="material-symbols-outlined text-primary text-[32px] drop-shadow-md" style="font-variation-settings: 'FILL' 1;">location_on</span>
                    <div class="w-3 h-1 bg-black/40 blur-[2px] rounded-full mt-1"></div>
                </div>
            \`;
            const customIcon = L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: [32, 40],
                iconAnchor: [16, 40]
            });
            
            L.marker([lat, lng], {icon: customIcon}).addTo(studentMapInstance)
                .bindPopup('<b>Current Location</b>').openPopup();
                
        }, (err) => {
            console.warn("Geolocation denied or error", err);
            L.marker([fallbackLat, fallbackLng]).addTo(studentMapInstance)
                .bindPopup('<b>Campus Location (Default)</b>');
        });
    }
}
setTimeout(initStudentMap, 1500);

`;

// Append script
js = js + '\n' + dynamicScript;
fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Dynamic patch applied!');
