// --- Liveness Challenge Logic ---
document.addEventListener('DOMContentLoaded', function() {
    var fabMarkAttendance = document.getElementById('fabMarkAttendance');
    var attendanceModal = document.getElementById('attendanceModal');
    var closeModalBtn = document.getElementById('closeModalBtn');
    var startVerificationBtn = document.getElementById('startVerificationBtn');
    var faceVideo = document.getElementById('faceVideo');
    var cameraPlaceholder = document.getElementById('cameraPlaceholder');
    var livenessStatus = document.getElementById('livenessStatus');
    var promptOverlay = document.getElementById('promptOverlay');
    var progressRing = document.getElementById('progressRing');
    var challengeStepsContainer = document.getElementById('challengeStepsContainer');
    var videoFrameRing = document.getElementById('videoFrameRing');

    var stream = null;
    var livenessInterval = null;
    var livenessTimer = null;
    var currentChallengeIndex = 0;
    var challenges = [];
    var finalDescriptor = null;
    
    // Pool of actions
    var actionPool = [
        { id: 'blink', text: 'Blink your eyes', icon: 'visibility' },
        { id: 'smile', text: 'Smile', icon: 'sentiment_satisfied' },
        { id: 'left', text: 'Turn head left', icon: 'arrow_back' },
        { id: 'right', text: 'Turn head right', icon: 'arrow_forward' },
        { id: 'mouth', text: 'Open your mouth', icon: 'face' }
    ];

    function openModal() {
        attendanceModal.classList.remove('hidden');
        attendanceModal.classList.add('flex');
    }

    function closeModal() {
        attendanceModal.classList.add('hidden');
        attendanceModal.classList.remove('flex');
        stopCamera();
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        if (livenessInterval) clearInterval(livenessInterval);
        if (livenessTimer) clearTimeout(livenessTimer);
        
        faceVideo.classList.add('hidden');
        cameraPlaceholder.classList.remove('hidden');
        promptOverlay.style.opacity = '0';
        videoFrameRing.classList.remove('border-success', 'border-error');
        videoFrameRing.classList.add('border-surface-container-high');
        progressRing.style.strokeDashoffset = '301.59';
        startVerificationBtn.textContent = 'Start Camera';
        startVerificationBtn.disabled = false;
        startVerificationBtn.classList.remove('hidden');
        challengeStepsContainer.innerHTML = '';
        livenessStatus.textContent = "Start camera to begin the challenge.";
        livenessStatus.className = "font-body-md text-label-sm text-on-surface-variant mb-6 text-center";
    }

    // Pick 3 random challenges
    function generateChallenges() {
        challenges = [];
        var pool = [...actionPool];
        for (let i = 0; i < 3; i++) {
            var idx = Math.floor(Math.random() * pool.length);
            challenges.push(pool[idx]);
            pool.splice(idx, 1);
        }
        
        var html = '';
        challenges.forEach((ch, idx) => {
            html += `
                <div class="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low transition-colors" id="step-${idx}">
                    <div class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition-colors" id="icon-${idx}">
                        <span class="material-symbols-outlined text-[16px]">${ch.icon}</span>
                    </div>
                    <span class="font-body-md text-label-sm text-on-surface flex-1">${ch.text}</span>
                    <span class="material-symbols-outlined text-success opacity-0 transition-opacity" id="check-${idx}">check_circle</span>
                </div>
            `;
        });
        challengeStepsContainer.innerHTML = html;
        currentChallengeIndex = 0;
    }

    function updateProgressRing(timeLeft, totalTime) {
        var dash = 301.59; // 2*PI*48
        var offset = dash - (dash * (timeLeft / totalTime));
        progressRing.style.strokeDashoffset = offset;
    }

    function failLiveness(reason) {
        if (livenessInterval) clearInterval(livenessInterval);
        if (livenessTimer) clearTimeout(livenessTimer);
        livenessStatus.textContent = "Failed: " + reason;
        livenessStatus.className = "font-body-md text-label-sm text-error mb-6 text-center font-bold";
        promptOverlay.style.opacity = '0';
        videoFrameRing.classList.remove('border-surface-container-high', 'border-success');
        videoFrameRing.classList.add('border-error');
        
        startVerificationBtn.textContent = 'Try Again';
        startVerificationBtn.disabled = false;
        startVerificationBtn.classList.remove('hidden');
    }

    function successLiveness() {
        if (livenessInterval) clearInterval(livenessInterval);
        if (livenessTimer) clearTimeout(livenessTimer);
        livenessStatus.textContent = "Verification Successful!";
        livenessStatus.className = "font-body-md text-label-sm text-success mb-6 text-center font-bold";
        promptOverlay.style.opacity = '0';
        videoFrameRing.classList.remove('border-surface-container-high', 'border-error');
        videoFrameRing.classList.add('border-success');
        progressRing.style.strokeDashoffset = '0';
        
        startVerificationBtn.textContent = 'Processing Attendance...';
        startVerificationBtn.disabled = true;
        startVerificationBtn.classList.remove('hidden');
        
        // Finalize attendance API call
        markAttendance();
    }

    function nextChallenge() {
        if (currentChallengeIndex >= challenges.length) {
            successLiveness();
            return;
        }

        // Highlight active step
        for (let i = 0; i < challenges.length; i++) {
            var step = document.getElementById('step-' + i);
            var icon = document.getElementById('icon-' + i);
            if (i === currentChallengeIndex) {
                step.classList.add('bg-primary/10', 'border', 'border-primary/30');
                icon.classList.add('bg-primary', 'text-on-primary');
                icon.classList.remove('bg-surface-container-highest', 'text-on-surface-variant');
            }
        }

        var ch = challenges[currentChallengeIndex];
        promptOverlay.textContent = "Step " + (currentChallengeIndex + 1) + ": " + ch.text;
        promptOverlay.style.opacity = '1';
        
        var totalTimeMs = 5000;
        var timeLeftMs = totalTimeMs;
        var startTs = Date.now();
        
        if (livenessInterval) clearInterval(livenessInterval);
        if (livenessTimer) clearTimeout(livenessTimer);

        // Verification Loop
        livenessInterval = setInterval(async function() {
            var elapsed = Date.now() - startTs;
            timeLeftMs = totalTimeMs - elapsed;
            if (timeLeftMs <= 0) {
                updateProgressRing(0, totalTimeMs);
                failLiveness("Time expired for: " + ch.text);
                return;
            }
            updateProgressRing(timeLeftMs, totalTimeMs);

            var result = await FaceEngine.detectWithLandmarks(faceVideo);
            if (!result) return;
            
            // Save descriptor for identity matching
            if (result.descriptor) finalDescriptor = Array.from(result.descriptor);

            var passed = false;
            if (ch.id === 'blink') passed = FaceEngine.detectBlink(result.landmarks);
            else if (ch.id === 'left') passed = FaceEngine.detectHeadTurn(result.landmarks, 'left');
            else if (ch.id === 'right') passed = FaceEngine.detectHeadTurn(result.landmarks, 'right');
            else if (ch.id === 'smile') passed = FaceEngine.detectSmile(result.landmarks);
            else if (ch.id === 'mouth') passed = FaceEngine.detectOpenMouth(result.landmarks);

            if (passed) {
                clearInterval(livenessInterval);
                
                // Mark step complete visually
                document.getElementById('check-' + currentChallengeIndex).style.opacity = '1';
                var step = document.getElementById('step-' + currentChallengeIndex);
                step.classList.remove('bg-primary/10', 'border-primary/30');
                step.classList.add('bg-success/10', 'border-success/30');
                
                currentChallengeIndex++;
                setTimeout(nextChallenge, 500); // short pause before next
            }
        }, 150);
    }

    function markAttendance() {
        if (!finalDescriptor) {
            failLiveness("Could not extract face descriptor. Try again.");
            return;
        }

        API.post('/attendance/mark', studentToken, { descriptor: finalDescriptor })
            .then(function(res) {
                showToast(res.message || 'Attendance Marked', 'success');
                setTimeout(() => {
                    closeModal();
                    loadDashboard(); // Refresh data
                }, 1500);
            })
            .catch(function(err) {
                failLiveness(err.message || 'Face does not match or session not active');
            });
    }

    startVerificationBtn.addEventListener('click', async function() {
        if (stream) {
            // Already running, maybe it's "Try Again"
            stopCamera();
        }

        startVerificationBtn.disabled = true;
        startVerificationBtn.textContent = 'Loading Camera...';
        
        try {
            await FaceEngine.loadModels();
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            faceVideo.srcObject = stream;
            
            faceVideo.onloadedmetadata = function() {
                cameraPlaceholder.classList.add('hidden');
                faceVideo.classList.remove('hidden');
                startVerificationBtn.classList.add('hidden');
                livenessStatus.textContent = "Please follow the instructions below.";
                livenessStatus.className = "font-body-md text-label-sm text-on-surface-variant mb-6 text-center";
                
                generateChallenges();
                setTimeout(nextChallenge, 1000); // Start after 1s
            };
        } catch (err) {
            console.error(err);
            startVerificationBtn.disabled = false;
            startVerificationBtn.textContent = 'Camera Error';
            livenessStatus.textContent = 'Camera access denied or failed.';
        }
    });

    fabMarkAttendance.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
});
