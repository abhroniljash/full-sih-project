const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

const modalHtml = `
<!-- Face ID Attendance FAB -->
<button id="fabMarkAttendance" class="fixed bottom-8 right-8 bg-primary text-on-primary rounded-full p-4 shadow-[0_8px_24px_rgba(53,37,205,0.4)] hover:scale-105 transition-transform z-50 flex items-center gap-2">
    <span class="material-symbols-outlined text-[28px]">face</span>
    <span class="font-label-sm font-semibold pr-2">Face Attendance</span>
</button>

<!-- Face Verification Modal -->
<div id="attendanceModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] hidden flex-col items-center justify-center p-4">
    <div class="bg-surface-container-lowest rounded-3xl p-6 shadow-2xl w-full max-w-md flex flex-col items-center relative overflow-hidden border border-outline-variant/30">
        <!-- Close Button -->
        <button id="closeModalBtn" class="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors">
            <span class="material-symbols-outlined">close</span>
        </button>
        
        <h2 class="font-headline-md text-headline-md text-on-surface mb-2">Live Verification</h2>
        <p class="font-body-md text-label-sm text-on-surface-variant mb-6 text-center" id="livenessStatus">Start camera to begin the challenge.</p>
        
        <!-- Camera Frame -->
        <div class="relative w-64 h-64 rounded-full overflow-hidden border-4 border-surface-container-high shadow-inner bg-surface-container mb-6 transition-colors duration-300" id="videoFrameRing">
            <video id="faceVideo" class="w-full h-full object-cover hidden" autoplay playsinline muted style="transform: scaleX(-1);"></video>
            <div id="cameraPlaceholder" class="w-full h-full flex items-center justify-center text-on-surface-variant">
                <span class="material-symbols-outlined text-[48px] opacity-50">videocam_off</span>
            </div>
            
            <!-- Dynamic Prompt Overlay -->
            <div class="absolute inset-0 flex flex-col items-center justify-end pb-8 pointer-events-none">
                <span id="promptOverlay" class="bg-inverse-surface/90 text-inverse-on-surface font-label-sm px-4 py-2 rounded-full opacity-0 transition-opacity text-center w-4/5 shadow-lg">
                    Please blink
                </span>
            </div>
            
            <!-- Progress Ring (SVG) -->
            <svg class="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" class="text-primary/10"></circle>
                <circle id="progressRing" cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="301.59" stroke-dashoffset="301.59" class="text-primary transition-all duration-300"></circle>
            </svg>
        </div>
        
        <!-- Challenge steps display -->
        <div class="w-full space-y-2 mb-6" id="challengeStepsContainer">
            <!-- Dynamically populated steps -->
        </div>
        
        <div class="flex gap-4 w-full">
            <button id="startVerificationBtn" class="flex-1 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm">Start Camera</button>
        </div>
    </div>
</div>
`;

// Inject before scripts
html = html.replace(/<script src="config\.js">/, modalHtml + '\n    <script src="config.js">');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('Injected FAB and Modal into HTML');
