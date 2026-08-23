const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const strictLogicV3 = `
// ==========================================
// USER REQUESTED STRICT LOGIC V3 (PREDICTABLE STATE-DRIVEN)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. STATE MANAGEMENT ---
    let calendarState = {
        weekOffset: 0,
        currentWeekNumber: 3, // Default starting week
        selectedDate: new Date().toISOString().split('T')[0], // Today's date (System)
        attendanceHistory: [],
        absencesHistory: []
    };

    // --- 2. DOM ELEMENTS ---
    const calendarContainer = document.querySelector('.grid.grid-cols-7.gap-card-gap');
    const calendarSection = document.querySelector('.mb-section-margin.w-full');
    
    let leftArrow, rightArrow, monthHeader, weekSubheader;
    if (calendarSection) {
        const buttons = calendarSection.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.innerHTML.includes('chevron_left')) leftArrow = btn;
            if (btn.innerHTML.includes('chevron_right')) rightArrow = btn;
        });
        monthHeader = calendarSection.querySelector('h2.font-headline-lg');
        weekSubheader = calendarSection.querySelector('p.font-body-md');
    }

    // Glance Panel Elements
    let glanceContainer = null;
    let attendedCounter = null;
    let skippedCounter = null;
    const headings = document.querySelectorAll('h3');
    headings.forEach(h => {
        if (h.textContent.trim() === 'Today at a Glance') {
            const parentCard = h.parentElement;
            glanceContainer = parentCard.querySelector('.space-y-4');
            const statBoxes = parentCard.querySelectorAll('.grid.grid-cols-2 > div');
            if (statBoxes.length >= 2) {
                attendedCounter = statBoxes[0].querySelector('.font-headline-md');
                skippedCounter = statBoxes[1].querySelector('.font-headline-md');
            }
        }
    });

    // --- 3. HELPER FUNCTIONS ---
    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(date.setDate(diff));
    }

    function fetchAttendanceData(callback) {
        if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
            API.get('/dashboard/student', studentToken).then(res => {
                calendarState.attendanceHistory = res.history || [];
                calendarState.absencesHistory = res.absences || [];
                if (callback) callback();
            }).catch(e => {
                console.warn('Failed to fetch attendance', e);
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    }

    // --- 4. RENDER CALENDAR CORE LOGIC ---
    function renderCalendar() {
        if (!calendarContainer) return;
        
        // Wipe container strictly to kill old listeners and DOM
        calendarContainer.innerHTML = '';

        const today = new Date();
        const startOfWeek = getMonday(today);
        startOfWeek.setDate(startOfWeek.getDate() + (calendarState.weekOffset * 7));
        
        // Update Headers dynamically
        if (monthHeader) {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthHeader.textContent = monthNames[startOfWeek.getMonth()] + " " + startOfWeek.getFullYear();
        }
        if (weekSubheader) {
            weekSubheader.textContent = \`Week \${calendarState.currentWeekNumber} \u2022 Summer Semester\`;
        }

        // Check if currently selected date falls in this new week
        let selectedInWeek = false;
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            weekDates.push(dStr);
            if (dStr === calendarState.selectedDate) {
                selectedInWeek = true;
            }
        }

        // Smooth state persistence: default to Monday if selected date isn't in view
        if (!selectedInWeek) {
            calendarState.selectedDate = weekDates[0];
        }

        // Generate 7 days HTML
        const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let newHtml = '';
        
        weekDates.forEach((dateStr, i) => {
            const dObj = new Date(dateStr);
            const dateNum = dObj.getDate();
            const isActive = (dateStr === calendarState.selectedDate);
            
            // Check dynamic dot
            const attendedThisDay = calendarState.attendanceHistory.some(a => a.timestamp && a.timestamp.startsWith(dateStr));
            let dotClass = '';
            
            if (isActive) {
                // Active blue card
                dotClass = attendedThisDay ? 'bg-white' : 'bg-transparent';
                newHtml += \`
                <button class="date-card flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-on-primary shadow-lg transform -translate-y-1 scale-105 relative overflow-hidden" data-date="\${dateStr}">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container relative z-10">\${daysShort[i]}</span>
                    <span class="font-headline-lg text-headline-lg mt-1 relative z-10">\${dateNum}</span>
                    <div class="w-1.5 h-1.5 rounded-full \${dotClass} mt-2 relative z-10" \${!attendedThisDay ? 'style="border: 1px solid rgba(255,255,255,0.5);"' : ''}></div>
                </button>\`;
            } else {
                // Inactive white/surface card
                dotClass = attendedThisDay ? 'bg-primary' : 'bg-outline-variant';
                newHtml += \`
                <button class="date-card flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-transform hover:-translate-y-1 shadow-sm group" data-date="\${dateStr}">
                    <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant group-hover:text-on-surface transition-colors">\${daysShort[i]}</span>
                    <span class="font-headline-lg text-headline-lg mt-1">\${dateNum}</span>
                    <div class="w-1.5 h-1.5 rounded-full \${dotClass} mt-2" \${!attendedThisDay ? 'style="background-color: transparent; border: 1px solid #cbd5e1;"' : ''}></div>
                </button>\`;
            }
        });

        // Inject new HTML
        calendarContainer.innerHTML = newHtml;

        // Attach fresh delegated event listener to the container (or individual buttons)
        const newCards = calendarContainer.querySelectorAll('.date-card');
        newCards.forEach(card => {
            card.addEventListener('click', function() {
                calendarState.selectedDate = this.getAttribute('data-date');
                // Re-render calendar UI to swap classes accurately based on State
                renderCalendar(); 
            });
        });

        // Update the Glance panel with the current selected date
        updateGlanceCounters();
    }

    // --- 5. RENDER GLANCE PANEL ---
    function updateGlanceCounters() {
        if (!glanceContainer) return;
        
        glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">Checking data...</div>';

        const selDate = calendarState.selectedDate;
        
        const dayAttended = calendarState.attendanceHistory.filter(h => h.timestamp && h.timestamp.startsWith(selDate));
        const dayAbsences = calendarState.absencesHistory.filter(a => a.timestamp && a.timestamp.startsWith(selDate));
        
        // Zero state
        if (attendedCounter) attendedCounter.innerHTML = dayAttended.length.toString();
        if (skippedCounter) skippedCounter.innerHTML = dayAbsences.length.toString();

        if (dayAbsences.length === 0 && dayAttended.length === 0) {
            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">No classes scheduled or held on this date.</div>';
        } else if (dayAbsences.length === 0) {
            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">All caught up! No skipped classes.</div>';
        } else {
            let html = '';
            dayAbsences.forEach(a => {
                html += \`
                <div class="flex items-center gap-4 p-3 bg-error-container/30 rounded-xl">
                    <div class="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[20px]">cancel</span>
                    </div>
                    <div>
                        <p class="font-label-sm text-label-sm text-on-surface font-bold">\${a.subject} skipped</p>
                        <p class="font-body-md text-[13px] text-on-surface-variant">Class marked absent</p>
                    </div>
                </div>\`;
            });
            glanceContainer.innerHTML = html;
        }
    }

    // --- 6. EVENT LISTENERS FOR ARROWS ---
    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            calendarState.weekOffset--;
            calendarState.currentWeekNumber--;
            renderCalendar();
        });
    }
    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            calendarState.weekOffset++;
            calendarState.currentWeekNumber++;
            renderCalendar();
        });
    }

    // --- 7. GEOLOCATION MAP FIX ---
    const mapContainer = document.getElementById('studentMap');
    if (mapContainer) {
        mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-on-surface-variant rounded-2xl"><p>Locating...</p></div>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    mapContainer.innerHTML = \`<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=\${lat},\${lon}&hl=en&z=15&output=embed" style="border-radius:1rem; min-height: 200px;"></iframe>\`;
                },
                function(error) {
                    mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-error rounded-2xl font-semibold"><p>Location permission denied.</p></div>';
                }
            );
        } else {
            mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-error rounded-2xl font-semibold"><p>Geolocation not supported.</p></div>';
        }
    }

    // --- 8. INITIALIZE ---
    fetchAttendanceData(() => {
        renderCalendar();
    });
});
`;

js = js + '\n' + strictLogicV3;
fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Appended strict logic V3');
