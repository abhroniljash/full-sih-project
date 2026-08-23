const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

// The new strict logic according to user's exact instructions
const strictLogic = `
// ==========================================
// USER REQUESTED STRICT LOGIC (DOM MANIPULATION)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Fix the Interactive Calendar (DOM Manipulation)
    const dateCards = document.querySelectorAll('.grid.grid-cols-7.gap-card-gap button');
    if (dateCards.length > 0) {
        const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-lg', 'transform', '-translate-y-1', 'scale-105', 'relative', 'overflow-hidden'];
        const inactiveClasses = ['bg-surface-container', 'text-on-surface', 'hover:bg-surface-container-high', 'transition-transform', 'hover:-translate-y-1', 'shadow-sm', 'group'];
        
        const todayDate = new Date().getDate().toString();

        dateCards.forEach(card => {
            // override any previous inline clicks
            card.onclick = null; 
            
            card.addEventListener('click', function(e) {
                // Remove active classes from all cards
                dateCards.forEach(c => {
                    activeClasses.forEach(cls => c.classList.remove(cls));
                    inactiveClasses.forEach(cls => c.classList.add(cls));
                    
                    // Reset internal spans/dots to inactive
                    const innerBg = c.querySelector('.absolute.inset-0.bg-gradient-to-br');
                    if (innerBg) innerBg.remove();
                    
                    const spans = c.querySelectorAll('span');
                    spans.forEach(s => {
                        s.classList.remove('text-on-primary-container', 'relative', 'z-10');
                        if (s.textContent.length === 3) {
                            // The day abbreviation
                            s.classList.add('text-on-surface-variant', 'group-hover:text-on-surface', 'transition-colors');
                        }
                    });
                    
                    const dot = c.querySelector('.rounded-full.w-1\\\\.5');
                    if (dot) {
                        dot.classList.remove('bg-on-primary', 'relative', 'z-10');
                        dot.classList.add('bg-outline-variant');
                    }
                });

                // Add active classes to currentTarget
                const current = e.currentTarget;
                inactiveClasses.forEach(cls => current.classList.remove(cls));
                activeClasses.forEach(cls => current.classList.add(cls));
                
                // Add active internal elements
                current.insertAdjacentHTML('afterbegin', '<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>');
                
                const spans = current.querySelectorAll('span');
                spans.forEach(s => {
                    s.classList.remove('text-on-surface-variant', 'group-hover:text-on-surface', 'transition-colors');
                    s.classList.add('text-on-primary-container', 'relative', 'z-10');
                });
                
                const dot = current.querySelector('.rounded-full.w-1\\\\.5');
                if (dot) {
                    dot.classList.remove('bg-outline-variant');
                    dot.classList.add('bg-on-primary', 'relative', 'z-10');
                }
            });
            
            // On page load, auto-select today's date
            const dateNumSpan = card.querySelector('.font-headline-lg');
            if (dateNumSpan && dateNumSpan.textContent.trim() === todayDate) {
                // trigger click safely
                setTimeout(() => card.click(), 100);
            }
        });
    }

    // 2. Remove Dummy Data in "Today at a Glance"
    // Find the wrapper by targeting the heading "Today at a Glance"
    const headings = document.querySelectorAll('h3');
    let glanceContainer = null;
    headings.forEach(h => {
        if (h.textContent.trim() === 'Today at a Glance') {
            const parentCard = h.parentElement;
            // The dummy data is inside the last .space-y-4 div
            const spaceY4 = parentCard.querySelector('.space-y-4');
            if (spaceY4) {
                glanceContainer = spaceY4;
            }
        }
    });

    if (glanceContainer) {
        // Clear inner HTML immediately
        glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">Checking for skipped classes...</div>';
        
        // Fetch API for skipped classes
        if (typeof API !== 'undefined' && typeof studentToken !== 'undefined') {
            API.get('/dashboard/student', studentToken).then(res => {
                const absences = res.absences || [];
                if (absences.length === 0) {
                    glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">All caught up! No skipped classes.</div>';
                } else {
                    let html = '';
                    absences.forEach(a => {
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
            }).catch(e => {
                glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">All caught up! No skipped classes.</div>';
            });
        } else {
            glanceContainer.innerHTML = '<div class="p-4 text-center text-sm font-semibold text-primary/70">All caught up! No skipped classes.</div>';
        }
    }

    // 3. Fix the Geolocation & Map Display (Google Maps Iframe)
    const mapContainer = document.getElementById('studentMap');
    if (mapContainer) {
        mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full p-4 text-sm text-on-surface-variant">Locating...</div>';
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    mapContainer.innerHTML = \`<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=\${lat},\${lon}&hl=en&z=15&output=embed" style="border-radius:1rem; min-height: 200px;"></iframe>\`;
                },
                function(error) {
                    console.warn('Geolocation error:', error);
                    mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-on-surface-variant rounded-2xl"><p class="font-semibold text-error">Location permission denied.</p></div>';
                }
            );
        } else {
            mapContainer.innerHTML = '<div class="flex items-center justify-center w-full h-full min-h-[200px] bg-surface-variant/30 text-on-surface-variant rounded-2xl"><p class="font-semibold text-error">Geolocation not supported.</p></div>';
        }
    }
});
`;

js = js + '\n' + strictLogic;
fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Appended strict logic to student-dashboard.js');
