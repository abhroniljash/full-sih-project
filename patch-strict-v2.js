const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const strictLogicV2 = `
// ==========================================
// USER REQUESTED STRICT LOGIC V2
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Fix Calendar Navigation & Active Date ---
    let currentWeekOffset = 0;
    const calendarSection = document.querySelector('.mb-section-margin.w-full');
    let leftArrow, rightArrow, monthHeader;
    
    if (calendarSection) {
        const buttons = calendarSection.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.innerHTML.includes('chevron_left')) leftArrow = btn;
            if (btn.innerHTML.includes('chevron_right')) rightArrow = btn;
        });
        monthHeader = calendarSection.querySelector('h2.font-headline-lg');
    }
    
    const dateCards = document.querySelectorAll('.grid.grid-cols-7.gap-card-gap button');
    
    // Attendance dots reference
    let cachedAttendance = window.cachedHistory || []; 
    
    // Counters & Glance Container
    const headings = document.querySelectorAll('h3');
    let glanceContainer = null;
    let attendedCounter = null;
    let skippedCounter = null;
    
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

    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(date.setDate(diff));
    }

    function renderWeek() {
        const today = new Date();
        const startOfWeek = getMonday(today);
        startOfWeek.setDate(startOfWeek.getDate() + (currentWeekOffset * 7));
        
        if (monthHeader) {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            monthHeader.textContent = monthNames[startOfWeek.getMonth()] + " " + startOfWeek.getFullYear();
        }

        const todaySystemStr = new Date().toISOString().split('T')[0];

        dateCards.forEach((card, index) => {
            const cardDate = new Date(startOfWeek);
            cardDate.setDate(startOfWeek.getDate() + index);
            const dateStr = cardDate.toISOString().split('T')[0];
            const dateNum = cardDate.getDate();
            
            card.dataset.fulldate = dateStr;
            
            const numSpan = card.querySelector('.font-headline-lg');
            if (numSpan) numSpan.textContent = dateNum;
            
            // --- 2. Dynamic Attendance Dots ---
            const dot = card.querySelector('div[class*="rounded-full"][class*="w-1.5"]');
            if (dot) {
                dot.className = 'w-1.5 h-1.5 rounded-full mt-2 transition-colors'; // reset baseline
                
                const attendedThisDay = cachedAttendance.some(a => a.timestamp && a.timestamp.startsWith(dateStr));
                if (attendedThisDay) {
                    dot.classList.add('bg-primary'); // blue dot
                } else {
                    dot.classList.add('bg-white'); // white dot
                    dot.style.border = '1px solid #e2e8f0'; // make it slightly visible if card is white
                }
            }
        });
        
        // Auto-select
        let autoSelected = false;
        dateCards.forEach(card => {
            if (card.dataset.fulldate === todaySystemStr) {
                card.click();
                autoSelected = true;
            }
        });
        if (!autoSelected && dateCards.length > 0) {
            dateCards[0].click();
        }
    }

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            currentWeekOffset--;
            renderWeek();
        });
    }
    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            currentWeekOffset++;
            renderWeek();
        });
    }

    const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-lg', 'transform', '-translate-y-1', 'scale-105', 'relative', 'overflow-hidden'];
    const inactiveClasses = ['bg-surface-container', 'text-on-surface', 'hover:bg-surface-container-high', 'transition-transform', 'hover:-translate-y-1', 'shadow-sm', 'group'];

    dateCards.forEach(card => {
        card.onclick = null;
        card.addEventListener('click', function(e) {
            // Remove active classes from all cards
            dateCards.forEach(c => {
                activeClasses.forEach(cls => c.classList.remove(cls));
                inactiveClasses.forEach(cls => c.classList.add(cls));
                
                const innerBg = c.querySelector('.inner-bg');
                if (innerBg) innerBg.remove();
                
                const spans = c.querySelectorAll('span');
                spans.forEach(s => {
                    s.classList.remove('text-on-primary-container', 'relative', 'z-10');
                    if (s.textContent.length === 3) s.classList.add('text-on-surface-variant', 'group-hover:text-on-surface', 'transition-colors');
                });
            });

            // Add active classes to currentTarget
            const current = e.currentTarget;
            inactiveClasses.forEach(cls => current.classList.remove(cls));
            activeClasses.forEach(cls => current.classList.add(cls));
            current.insertAdjacentHTML('afterbegin', '<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent inner-bg"></div>');
            
            const spans = current.querySelectorAll('span');
            spans.forEach(s => {
                s.classList.remove('text-on-surface-variant', 'group-hover:text-on-surface', 'transition-colors');
                s.classList.add('text-on-primary-container', 'relative', 'z-10');
            });
            
            // Adjust dot for active blue card contrast
            const dot = current.querySelector('div[class*="rounded-full"][class*="w-1.5"]');
            if (dot) {
                dot.classList.add('relative', 'z-10');
                if (dot.classList.contains('bg-primary')) {
                    dot.classList.remove('bg-primary');
                    dot.classList.add('bg-on-primary'); // turn blue dot white so it's visible on blue card
                }
            }

            // --- 3. Dynamic "Today at a Glance" Counters (Zero State) ---
            const selDate = current.dataset.fulldate;
            if (glanceContainer) glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">Loading...</div>';
            
            if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
                API.get('/dashboard/student', studentToken).then(res => {
                    const allAbsences = res.absences || [];
                    const allHistory = res.history || [];
                    cachedAttendance = allHistory;
                    
                    const dayAbsences = allAbsences.filter(a => a.timestamp && a.timestamp.startsWith(selDate));
                    const dayAttended = allHistory.filter(h => h.timestamp && h.timestamp.startsWith(selDate));
                    
                    // Explicitly update to 0 if none
                    if (attendedCounter) attendedCounter.innerHTML = dayAttended.length.toString();
                    if (skippedCounter) skippedCounter.innerHTML = dayAbsences.length.toString();

                    if (glanceContainer) {
                        if (dayAbsences.length === 0 && dayAttended.length === 0) {
                            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">No classes scheduled or held today.</div>';
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
                });
            } else {
                if (attendedCounter) attendedCounter.innerHTML = "0";
                if (skippedCounter) skippedCounter.innerHTML = "0";
            }
        });
    });

    // --- Restore Map Fix ---
    const mapContainer = document.getElementById('studentMap');
    if (mapContainer) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    mapContainer.innerHTML = \`<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=\${position.coords.latitude},\${position.coords.longitude}&hl=en&z=15&output=embed" style="border-radius:1rem; min-height: 200px;"></iframe>\`;
                },
                function(error) {
                    mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 rounded-2xl text-error font-semibold">Location permission denied.</div>';
                }
            );
        }
    }

    // Initial Fetch -> Render
    if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
        API.get('/dashboard/student', studentToken).then(res => {
            cachedAttendance = res.history || [];
            renderWeek();
        });
    } else {
        renderWeek();
    }
});
`;

js = js + '\n' + strictLogicV2;
fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Strict logic V2 applied');
