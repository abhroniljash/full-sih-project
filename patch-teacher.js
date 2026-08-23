const fs = require('fs');

let js = fs.readFileSync('backend/public/teacher-dashboard.js', 'utf8');

// We need to inject global liveness variables
const livenessGlobals = `
// --- Liveness Detection System ---
var livenessActive = false;
var livenessTimer = null;
var livenessCheckInterval = null;
var livenessChallenges = [];
var currentLivenessIdx = 0;
var livenessActionPool = [
    { id: 'blink', text: 'Blink your eyes' },
    { id: 'smile', text: 'Smile' },
    { id: 'left', text: 'Turn head left' },
    { id: 'right', text: 'Turn head right' },
    { id: 'mouth', text: 'Open your mouth' }
];

function resetLivenessUI() {
    var overlay = document.getElementById('liveLivenessOverlay');
    if (overlay) overlay.style.display = 'none';
    livenessActive = false;
    if (livenessTimer) clearTimeout(livenessTimer);
    if (livenessCheckInterval) clearInterval(livenessCheckInterval);
}

function startLivenessSequence(roll, name) {
    if (livenessActive) return;
    livenessActive = true;
    
    var overlay = document.getElementById('liveLivenessOverlay');
    var promptEl = document.getElementById('liveLivenessPrompt');
    var barEl = document.getElementById('liveLivenessBar');
    var vid = document.getElementById('camVideo');
    
    if (overlay) overlay.style.display = 'flex';
    
    // Pick 2-3 random challenges
    var numChallenges = Math.floor(Math.random() * 2) + 2; // 2 or 3
    var pool = [...livenessActionPool];
    livenessChallenges = [];
    for (var i = 0; i < numChallenges; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        livenessChallenges.push(pool[idx]);
        pool.splice(idx, 1);
    }
    
    currentLivenessIdx = 0;
    
    function failLiveness() {
        if (promptEl) {
            promptEl.textContent = 'Liveness Failed. Try Again.';
            promptEl.style.color = '#dc2626';
        }
        setTimeout(function() {
            delete markedThisSession[roll]; // Release lock
            resetLivenessUI();
        }, 1500);
    }
    
    function nextChallenge() {
        if (currentLivenessIdx >= livenessChallenges.length) {
            // Success!
            if (promptEl) {
                promptEl.textContent = 'Verified! Marking Attendance...';
                promptEl.style.color = '#16a34a';
            }
            if (barEl) barEl.style.width = '100%';
            
            API.post('/attendance/mark-manual', {
                sessionId: currentLiveSessionId,
                rollNumber: roll,
                studentName: name
            }, teacherToken).then(function() {
                refreshLiveList();
                showToast(name + ' marked present securely!', 'success');
                setTimeout(resetLivenessUI, 1500);
            }).catch(function(err) {
                if (!/already marked/i.test(err.message || '')) {
                    showToast(err.message || 'Could not mark attendance', 'danger');
                }
                setTimeout(resetLivenessUI, 1500);
            });
            return;
        }
        
        var ch = livenessChallenges[currentLivenessIdx];
        if (promptEl) {
            promptEl.style.color = '#3525cd';
            promptEl.textContent = "Hi " + name.split(' ')[0] + "! Step " + (currentLivenessIdx + 1) + ": " + ch.text;
        }
        
        var totalTimeMs = 5000;
        var timeLeftMs = totalTimeMs;
        var startTs = Date.now();
        
        if (livenessCheckInterval) clearInterval(livenessCheckInterval);
        
        livenessCheckInterval = setInterval(function() {
            var elapsed = Date.now() - startTs;
            timeLeftMs = totalTimeMs - elapsed;
            if (timeLeftMs <= 0) {
                clearInterval(livenessCheckInterval);
                failLiveness();
                return;
            }
            
            if (barEl) barEl.style.width = (timeLeftMs / totalTimeMs * 100) + '%';
            
            FaceEngine.detectWithLandmarks(vid).then(function(result) {
                if (!result) return;
                var passed = false;
                if (ch.id === 'blink') passed = FaceEngine.detectBlink(result.landmarks);
                else if (ch.id === 'left') passed = FaceEngine.detectHeadTurn(result.landmarks, 'left');
                else if (ch.id === 'right') passed = FaceEngine.detectHeadTurn(result.landmarks, 'right');
                else if (ch.id === 'smile') passed = FaceEngine.detectSmile(result.landmarks);
                else if (ch.id === 'mouth') passed = FaceEngine.detectOpenMouth(result.landmarks);
                
                if (passed) {
                    clearInterval(livenessCheckInterval);
                    currentLivenessIdx++;
                    setTimeout(nextChallenge, 500);
                }
            });
        }, 150);
    }
    
    nextChallenge();
}
`;

// Insert the liveness functions at the top after variables
js = js.replace('var markedThisSession = {};', 'var markedThisSession = {};\n' + livenessGlobals);

// Ensure stopFaceScanning resets UI
js = js.replace('markedThisSession = {};\n}', 'markedThisSession = {};\n    resetLivenessUI();\n}');

// Replace the normal interval with liveness check trigger
const originalInterval = `
            if (!faceDetectInterval) {
                faceDetectInterval = setInterval(function() {
                    if (!currentLiveSessionId || !vid || vid.readyState < 2) return;

                    FaceEngine.getDescriptor(vid).then(function(descriptor) {
                        if (!descriptor) return; // no face in frame right now

                        var result = FaceEngine.bestMatch(descriptor, knownFaces);
                        if (!result) return; // no confident match

                        var roll = result.match.rollNumber;
                        if (markedThisSession[roll]) return; // already marked

                        markedThisSession[roll] = true; // optimistic lock to avoid duplicate calls

                        API.post('/attendance/mark-manual', {
                            sessionId: currentLiveSessionId,
                            rollNumber: roll,
                            studentName: result.match.name
                        }, teacherToken).then(function() {
                            refreshLiveList();
                            showToast(result.match.name + ' marked present via face recognition!', 'info');
                        }).catch(function(err) {
                            // Someone else may have marked them between our check and this call – safe to ignore 409s.
                            if (!/already marked/i.test(err.message || '')) {
                                showToast(err.message || 'Could not mark attendance', 'danger');
                            }
                        });
                    }).catch(function() { /* ignore transient detection errors */ });
                }, 1500);
            }
`;

const newInterval = `
            if (!faceDetectInterval) {
                faceDetectInterval = setInterval(function() {
                    if (!currentLiveSessionId || !vid || vid.readyState < 2 || livenessActive) return;

                    FaceEngine.getDescriptor(vid).then(function(descriptor) {
                        if (!descriptor) return; // no face in frame right now

                        var result = FaceEngine.bestMatch(descriptor, knownFaces);
                        if (!result) return; // no confident match

                        var roll = result.match.rollNumber;
                        if (markedThisSession[roll]) return; // already marked

                        markedThisSession[roll] = true; // Set optimistic lock
                        
                        // INSTEAD OF MARKING DIRECTLY, START LIVENESS
                        startLivenessSequence(roll, result.match.name);
                        
                    }).catch(function() { /* ignore transient detection errors */ });
                }, 1500);
            }
`;

// It's tricky to match the exact string due to indentation/line breaks, let's use regex
const regex = /if \(\!faceDetectInterval\) \{[\s\S]*?1500\);\s*\}/;
if (regex.test(js)) {
    js = js.replace(regex, newInterval.trim());
    fs.writeFileSync('backend/public/teacher-dashboard.js', js);
    console.log('Successfully patched teacher-dashboard.js');
} else {
    console.log('Could not find faceDetectInterval block to patch.');
}
