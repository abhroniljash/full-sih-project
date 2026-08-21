// --- Auth & Setup ---
var teacher = Auth.getUser('teacher');
var teacherToken = Auth.getToken('teacher');
if (!teacher || !teacherToken) goTo('teacher-login.html');

var elUName = document.getElementById('uName');
if(elUName) elUName.textContent = teacher.name;

var elHUName = document.getElementById('hUName');
if(elHUName) elHUName.textContent = teacher.name;

var elUAvatar = document.getElementById('uAvatar');
if(elUAvatar) elUAvatar.textContent = teacher.name.charAt(0);

var elTodayDate = document.getElementById('todayDate');
if(elTodayDate) elTodayDate.textContent = formatDateTime(new Date());

var currentLiveSessionId = null;
var faceDetectInterval = null;
var knownFaces = [];              // [{rollNumber, name, descriptor}] fetched once per live session
var markedThisSession = {};       // rollNumber -> true, to avoid duplicate API calls while scanning

// --- Sidebar Navigation ---
var navItems = document.querySelectorAll('.nav-item');
var sections = document.querySelectorAll('.section');
var overlay = document.getElementById('overlay');
var sidebar = document.getElementById('sidebar');

function switchSec(secId) {
    // Save to sessionStorage so it survives page reloads
    sessionStorage.setItem('teacher_current_sec', secId);

    navItems.forEach(function(btn) {
        if(btn.dataset.sec === secId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    sections.forEach(function(sec) {
        if(sec.id === 'sec-' + secId) sec.classList.add('active');
        else sec.classList.remove('active');
    });

    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');

    var titles = {
        'dashboard': ['Dashboard', 'Overview of your classes'],
        'create': ['Create Session', 'Start a new class attendance session'],
        'live': ['Live Session', 'Real-time face-recognition tracking'],
        'register': ['Student Registration', 'Register a new student with face ID'],
        'students': ['Student Details', 'Manage registered students'],
        'report-class': ['Class Report', 'Overall attendance by subject'],
        'report-date': ['Date Report', 'Daily attendance records']
    };
    if(titles[secId]) {
        var elPgTitle = document.getElementById('pgTitle');
        if(elPgTitle) elPgTitle.textContent = titles[secId][0];
        var elPgSub = document.getElementById('pgSub');
        if(elPgSub) elPgSub.textContent = titles[secId][1];
    }

    if (secId === 'students' && window.loadStudentDetails) {
        window.loadStudentDetails();
    }
    if(secId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    if(secId === 'live' && typeof loadLiveSession === 'function') loadLiveSession();
    if(secId === 'report-class' && typeof loadClassReport === 'function') loadClassReport();
    if(secId === 'report-date' && typeof loadDateReport === 'function') loadDateReport();
}

// Attach clicks to sidebar
navItems.forEach(function(btn) {
    btn.addEventListener('click', function() { switchSec(this.dataset.sec); });
});

var menuBtn = document.getElementById('menuBtn');
if(menuBtn) {
    menuBtn.addEventListener('click', function() {
        if(sidebar) sidebar.classList.add('open');
        if(overlay) overlay.classList.add('show');
    });
}

if (overlay) {
    overlay.addEventListener('click', function() {
        if(sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
}

var logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        confirmLogout('teacher');
    });
}

// --- Dashboard ---
function loadDashboard() {
    API.get('/dashboard/teacher', teacherToken).then(function(res) {
        var sTotalSessions = document.getElementById('sTotalSessions');
        if(sTotalSessions) sTotalSessions.textContent = res.totalSessions;

        var sActiveNow = document.getElementById('sActiveNow');
        if(sActiveNow) sActiveNow.textContent = res.activeNow;

        var sTotalAtt = document.getElementById('sTotalAtt');
        if(sTotalAtt) sTotalAtt.textContent = res.totalAttendanceMarks;

        var sTotalClasses = document.getElementById('sTotalClasses');
        if(sTotalClasses) sTotalClasses.textContent = res.totalSubjects;

        var badge = document.getElementById('liveBadge');
        if(badge) {
            if(res.activeNow > 0) { badge.style.display = 'inline-block'; badge.textContent = res.activeNow; }
            else { badge.style.display = 'none'; }
        }

        var recentTable = document.getElementById('recentTable');
        if(recentTable) {
            var tHTML = '<table><tr><th>Session ID</th><th>Subject</th><th>Class</th><th>Date</th><th>Status</th></tr>';
            if(res.recentSessions.length === 0) {
                tHTML += '<tr><td colspan="5" style="text-align:center;">No sessions yet</td></tr>';
            } else {
                res.recentSessions.forEach(function(s) {
                    var st = s.status === 'active' ? '<span class="badge badge-green">Live</span>' : '<span class="badge badge-yellow">Ended</span>';
                    tHTML += '<tr><td class="mono text-blue">'+s.sessionId+'</td><td>'+s.subject+'</td><td>'+s.className+'</td><td>'+formatDate(s.date)+'</td><td>'+st+'</td></tr>';
                });
            }
            tHTML += '</table>';
            recentTable.innerHTML = tHTML;
        }

        // --- Charts (illustrative — not backed by real weekly data yet) ---
        var weeklyCanvas = document.getElementById('weeklyChart');
        if(weeklyCanvas && !weeklyCanvas.dataset.rendered) {
            weeklyCanvas.dataset.rendered = 'true';
            new Chart(weeklyCanvas, {
                type: 'line',
                data: {
                    labels: ['Mon','Tue','Wed','Thu','Fri'],
                    datasets: [{
                        data: [82,88,80,86,83],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79,70,229,0.08)',
                        fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#4f46e5'
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        }

        var donutCanvas = document.getElementById('participationChart');
        if(donutCanvas && !donutCanvas.dataset.rendered) {
            donutCanvas.dataset.rendered = 'true';
            new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Present','Absent','Late'],
                    datasets: [{ data: [75, 15, 10], backgroundColor: ['#4f46e5','#c7d2fe','#e2e8f0'] }]
                },
                options: { plugins: { legend: { position: 'bottom' } } }
            });
        }
    }).catch(function(err) {
        showToast(err.message || 'Failed to load dashboard', 'danger');
    });
}

// --- Create Session ---
var createForm = document.getElementById('createForm');
if(createForm) {
    createForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var subj = document.getElementById('cSubject') ? document.getElementById('cSubject').value.trim() : 'Class';
        var cls = document.getElementById('cClass') ? document.getElementById('cClass').value.trim() : 'Section';
        var room = document.getElementById('cRoom') ? document.getElementById('cRoom').value.trim() : '';
        var desc = document.getElementById('cDesc') ? document.getElementById('cDesc').value.trim() : '';

        API.post('/sessions', { subject: subj, className: cls, room: room, description: desc }, teacherToken)
            .then(function(res) {
                var sid = res.session.sessionId;

                var genSessionId = document.getElementById('genSessionId');
                if(genSessionId) genSessionId.textContent = sid;

                var sessionResult = document.getElementById('sessionResult');
                if(sessionResult) sessionResult.classList.add('show');

                showToast('Session created! Starting live attendance...', 'success');
                createForm.reset();
                // Switch to live section immediately instead of showing result panel
                switchSec('live');
            })
            .catch(function(err) {
                showToast(err.message || 'Could not create session', 'danger');
            });
    });
}

var copyIdBtn = document.getElementById('copyIdBtn');
if(copyIdBtn) {
    copyIdBtn.addEventListener('click', function() {
        var sid = document.getElementById('genSessionId');
        if(sid) copyText(sid.textContent);
    });
}

// --- Live Session ---
function loadLiveSession() {
    API.get('/sessions/active', teacherToken).then(function(res) {
        var activeSession = res.session;
        var hasLive = document.getElementById('hasLive');
        var noLive = document.getElementById('noLive');

        if(!activeSession) {
            if(hasLive) hasLive.style.display = 'none';
            if(noLive) noLive.style.display = 'block';
            stopFaceScanning();
            currentLiveSessionId = null;
            return;
        }

        if(noLive) noLive.style.display = 'none';
        if(hasLive) hasLive.style.display = 'block';

        currentLiveSessionId = activeSession.sessionId;

        var ls = document.getElementById('liveSubject');
        if(ls) ls.textContent = activeSession.subject + ' (' + activeSession.className + ')';

        var lst = document.getElementById('liveSessionTag');
        if(lst) lst.textContent = activeSession.sessionId;

        var lsn = document.getElementById('liveSubjectName');
        if(lsn) lsn.textContent = activeSession.subject;

        var lm = document.getElementById('liveMeta');
        if(lm) lm.textContent = activeSession.className + ' • ' + (activeSession.room || 'No Room') + ' • Started: ' + formatTime(activeSession.date);

        refreshLiveList();
    }).catch(function(err) {
        showToast(err.message || 'Failed to load live session', 'danger');
    });
}

function refreshLiveList() {
    if(!currentLiveSessionId) return;
    API.get('/attendance/session/' + currentLiveSessionId, teacherToken).then(function(res) {
        var records = res.records;
        records.forEach(function(r) { markedThisSession[r.rollNumber] = true; });

        var lc = document.getElementById('liveCount');
        if(lc) lc.textContent = 'Students Present: ' + records.length;

        var ll = document.getElementById('liveList');
        if(ll) {
            var html = '';
            records.slice().reverse().forEach(function(a, index) {
                html += '<div class="live-row"><div class="num">'+(records.length - index)+'</div><div class="sname">'+a.studentName+'</div><div class="sroll">'+a.rollNumber+'</div><div class="stime">'+formatTime(a.timestamp)+'</div></div>';
            });
            if(records.length === 0) {
                html = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">Waiting for students to scan their face...</div>';
            }
            ll.innerHTML = html;
        }
    }).catch(function(err) {
        showToast(err.message || 'Failed to refresh attendance', 'danger');
    });
}

// --- Real face-recognition scanning loop ---
function stopFaceScanning() {
    if (faceDetectInterval) { clearInterval(faceDetectInterval); faceDetectInterval = null; }
    var vid = document.getElementById('camVideo');
    if (vid && vid.srcObject) { vid.srcObject.getTracks().forEach(function(t){ t.stop(); }); vid.srcObject = null; }
    if (vid) vid.style.display = 'none';
    var cp = document.getElementById('camPlaceholder');
    if (cp) cp.style.display = 'block';
    knownFaces = [];
    markedThisSession = {};
}

var startCamBtn = document.getElementById('startCamBtn');
if(startCamBtn) {
    startCamBtn.addEventListener('click', function() {
        if (!currentLiveSessionId) { showToast('No active session', 'warning'); return; }

        var cp = document.getElementById('camPlaceholder');
        var vid = document.getElementById('camVideo');
        var subText = document.getElementById('camSubText');
        if (subText) subText.textContent = 'Loading face recognition models...';

        Promise.all([
            FaceEngine.loadModels(),
            API.get('/students/face-descriptors', teacherToken)
        ]).then(function(results) {
            knownFaces = results[1].students;
            if (knownFaces.length === 0) {
                showToast('No students have enrolled Face ID yet', 'warning');
            }
            return navigator.mediaDevices.getUserMedia({ video: true });
        }).then(function(stream) {
            if (cp) cp.style.display = 'none';
            if (vid) {
                vid.style.display = 'block';
                vid.srcObject = stream;
            }

            // Re-fetch who's already present so we don't re-mark them.
            API.get('/attendance/session/' + currentLiveSessionId, teacherToken).then(function(res) {
                markedThisSession = {};
                res.records.forEach(function(r) { markedThisSession[r.rollNumber] = true; });
            });

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
                            // Someone else may have marked them between our check and this call — safe to ignore 409s.
                            if (!/already marked/i.test(err.message || '')) {
                                showToast(err.message || 'Could not mark attendance', 'danger');
                            }
                        });
                    }).catch(function() { /* ignore transient detection errors */ });
                }, 1500);
            }
        }).catch(function(err) {
            showToast(err.message || 'Camera not available', 'warning');
            if (subText) subText.textContent = 'Live face-recognition attendance will run here';
        });
    });
}

var endSessionBtn = document.getElementById('endSessionBtn');
if(endSessionBtn) {
    endSessionBtn.addEventListener('click', function() {
        if(!currentLiveSessionId) return;
        API.patch('/sessions/' + currentLiveSessionId + '/end', {}, teacherToken).then(function() {
            showToast('Session ended successfully', 'success');
            stopFaceScanning();
            currentLiveSessionId = null;
            loadLiveSession();
            loadDashboard();
        }).catch(function(err) {
            showToast(err.message || 'Could not end session', 'danger');
        });
    });
}

// --- Reports Shared ---
function getTeacherSubjects() {
    return API.get('/sessions?mine=true', teacherToken).then(function(res) {
        var subjMap = {};
        res.sessions.forEach(function(s) {
            if(!subjMap[s.subject]) subjMap[s.subject] = [];
            subjMap[s.subject].push(s);
        });
        return subjMap;
    });
}

function populateSubjectSelect(selectEl) {
    return getTeacherSubjects().then(function(subjs) {
        if(selectEl) {
            selectEl.innerHTML = '<option value="">-- Select Subject --</option>';
            for(var k in subjs) {
                selectEl.innerHTML += '<option value="'+k+'">'+k+'</option>';
            }
        }
        return subjs;
    });
}

// --- Class Report ---
function loadClassReport() {
    populateSubjectSelect(document.getElementById('rcSubject')).catch(function(err) {
        showToast(err.message || 'Failed to load subjects', 'danger');
    });
}

var rcSubject = document.getElementById('rcSubject');
if(rcSubject) {
    rcSubject.addEventListener('change', function() {
        var subj = this.value;
        var body = document.getElementById('classReportBody');
        if(!body) return;

        if(!subj) { body.innerHTML = '<div class="empty"><div class="empty-icon"></div><h4>Select a Subject</h4><p>Choose a subject above to see student attendance report.</p></div>'; return; }

        API.get('/attendance/reports/class?subject=' + encodeURIComponent(subj), teacherToken).then(function(res) {
            var tHTML = '<table><tr><th>Roll Number</th><th>Student Name</th><th>Classes Attended</th><th>Percentage</th></tr>';
            if(res.rows.length === 0) {
                tHTML += '<tr><td colspan="4" style="text-align:center;">No attendance data found for this subject.</td></tr>';
            } else {
                res.rows.forEach(function(st) {
                    var colorClass = st.percentage >= 75 ? 'text-green' : 'text-red';
                    tHTML += '<tr><td class="mono">'+st.rollNumber+'</td><td>'+st.name+'</td><td>'+st.attended+' / '+st.totalClasses+'</td><td class="'+colorClass+'">'+st.percentage+'%</td></tr>';
                });
            }
            tHTML += '</table>';
            body.innerHTML = tHTML;
        }).catch(function(err) {
            showToast(err.message || 'Failed to load class report', 'danger');
        });
    });
}

// --- Date Report ---
function loadDateReport() {
    populateSubjectSelect(document.getElementById('rdSubject')).catch(function(err) {
        showToast(err.message || 'Failed to load subjects', 'danger');
    });
    var rdDate = document.getElementById('rdDate');
    if(rdDate) rdDate.value = todayDate();
}

function refreshDateReport() {
    var rdSub = document.getElementById('rdSubject');
    var rdDat = document.getElementById('rdDate');
    var body = document.getElementById('dateReportBody');
    if(!rdSub || !rdDat || !body) return;

    var subj = rdSub.value;
    var dt = rdDat.value;

    if(!subj || !dt) { body.innerHTML = '<div class="empty"><div class="empty-icon"></div><h4>Select Subject & Date</h4><p>Choose a subject and date to see who was present.</p></div>'; return; }

    API.get('/attendance/reports/date?subject=' + encodeURIComponent(subj) + '&date=' + encodeURIComponent(dt), teacherToken).then(function(res) {
        var tHTML = '<div style="margin-bottom:12px;font-size:13px;font-weight:600;color:#1e293b;">Total Present: '+res.totalPresent+'</div>';
        tHTML += '<table><tr><th>Roll Number</th><th>Student Name</th><th>Time Marked</th></tr>';
        if(res.records.length === 0) {
            tHTML += '<tr><td colspan="3" style="text-align:center;">Nobody was present.</td></tr>';
        } else {
            res.records.forEach(function(p) {
                tHTML += '<tr><td class="mono">'+p.rollNumber+'</td><td>'+p.studentName+'</td><td>'+formatTime(p.timestamp)+'</td></tr>';
            });
        }
        tHTML += '</table>';
        body.innerHTML = tHTML;
    }).catch(function(err) {
        body.innerHTML = '<div class="empty"><h4>No Class Found</h4><p>'+(err.message || 'No class was conducted for this subject on this date.')+'</p></div>';
    });
}

var rSubj = document.getElementById('rdSubject');
if(rSubj) rSubj.addEventListener('change', refreshDateReport);

var rDate = document.getElementById('rdDate');
if(rDate) rDate.addEventListener('change', refreshDateReport);

// Init
try {
    var savedSec = sessionStorage.getItem('teacher_current_sec') || 'dashboard';
    switchSec(savedSec);
} catch (e) {
    console.error("Section loaded with missing elements, but execution continued.", e);
}
document.querySelectorAll('.nav-group-label.collapsible').forEach(label => {
    label.addEventListener('click', () => {
        const targetId = label.dataset.toggle;
        const target = document.getElementById(targetId);

        label.classList.toggle('open');
        target.classList.toggle('open');
    });
});

// --- Student Registration (Teacher Dashboard) ---
(function() {
    var regForm = document.getElementById('studentRegisterForm');
    if (!regForm) return;

    var captureArea   = document.getElementById('faceCaptureArea');
    var video         = document.getElementById('faceVideo');
    var startBtn      = document.getElementById('startRegCamBtn');
    var recaptureBtn  = document.getElementById('recaptureRegBtn');
    var cancelBtn     = document.getElementById('cancelRegCamBtn');
    var progressRing  = document.getElementById('progressRing');
    var instructionEl = document.getElementById('livenessInstruction');
    var overlayText   = document.getElementById('faceOverlayText');
    var circleFrame   = document.querySelector('.face-circle-frame');
    var submitBtn     = document.getElementById('submitRegBtn');
    var regStatus     = document.getElementById('regFaceStatus');
    
    var stream = null;
    var livenessInterval = null;
    var capturedDescriptor = null;
    var capturedImageBase64 = null;
    var faceHoldTime = 0; // ms face has been continuously detected

    var CIRCUMFERENCE = 2 * Math.PI * 108;
    var REQUIRED_HOLD_TIME = 1500; // 1.5 seconds

    function setProgress(fraction) {
        var offset = CIRCUMFERENCE * (1 - fraction);
        if (progressRing) progressRing.style.strokeDashoffset = offset;
    }

    function stopCamera() {
        if (livenessInterval) { clearInterval(livenessInterval); livenessInterval = null; }
        if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
        if (video) video.srcObject = null;
        if (captureArea) captureArea.classList.remove('active');
        if (circleFrame) circleFrame.classList.remove('pulse');
        
        faceHoldTime = 0;
        setProgress(0);
        if (instructionEl) { instructionEl.textContent = 'Position face in the circle'; instructionEl.classList.remove('success'); }
        if (overlayText) overlayText.style.display = 'none';
        
        startBtn.style.display = 'inline-flex';
        startBtn.disabled = false;
        recaptureBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }

    function startLivenessChecks() {
        faceHoldTime = 0;
        setProgress(0);
        if (circleFrame) circleFrame.classList.add('pulse');
        if (instructionEl) instructionEl.textContent = 'Hold still...';

        livenessInterval = setInterval(function () {
            if (!video || video.readyState < 2) return;

            FaceEngine.detectWithLandmarks(video).then(function (result) {
                if (!result) {
                    if (overlayText) { overlayText.style.display = 'block'; overlayText.textContent = 'No face detected'; }
                    faceHoldTime = 0; // reset if lost
                    setProgress(0);
                    return;
                }
                
                if (overlayText) overlayText.style.display = 'none';
                faceHoldTime += 300; // loop runs every 300ms
                
                var fraction = Math.min(faceHoldTime / REQUIRED_HOLD_TIME, 1);
                setProgress(fraction);

                if (faceHoldTime >= REQUIRED_HOLD_TIME) {
                    if (circleFrame) circleFrame.classList.remove('pulse');
                    if (instructionEl) { instructionEl.textContent = '✓ Face locked! Capturing...'; instructionEl.classList.add('success'); }
                    clearInterval(livenessInterval); livenessInterval = null;
                    setTimeout(doCapture, 500);
                }

            }).catch(function () {});
        }, 300);
    }

    function doCapture() {
        if (instructionEl) instructionEl.textContent = 'Scanning face data...';

        FaceEngine.getDescriptor(video).then(function (descriptor) {
            if (!descriptor) {
                showToast('No face detected — try again', 'warning');
                if (instructionEl) instructionEl.textContent = 'Face lost. Click Re-Capture to try again.';
                recaptureBtn.style.display = 'inline-flex';
                cancelBtn.style.display = 'inline-flex';
                return;
            }
            
            var canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            capturedDescriptor = Array.from(descriptor);
            capturedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            submitBtn.disabled = false;
            regStatus.innerHTML = '<span style="color:#22c55e"><i class="fa-solid fa-check-circle"></i> Face captured successfully. Ready to register.</span>';
            stopCamera();
        }).catch(function (err) {
            showToast(err.message || 'Capture failed', 'danger');
            if (instructionEl) instructionEl.textContent = 'Error occurred. Click Re-Capture.';
            recaptureBtn.style.display = 'inline-flex';
            cancelBtn.style.display = 'inline-flex';
        });
    }

    startBtn.addEventListener('click', function () {
        var name = document.getElementById('srName').value.trim();
        var roll = document.getElementById('srRoll').value.trim();
        var regNo = document.getElementById('srRegNo').value.trim();
        var dept = document.getElementById('srDept').value.trim();
        var sem = document.getElementById('srSem').value.trim();
        var pass = document.getElementById('srPass').value.trim();

        if (!name || !roll || !regNo || !dept || !sem || !pass) {
            showToast('Please fill in all student details before starting the camera.', 'warning');
            return;
        }

        startBtn.disabled = true;
        regStatus.textContent = 'Loading models...';

        FaceEngine.loadModels()
            .then(function () { return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } }); })
            .then(function (s) {
                stream = s; video.srcObject = s;
                captureArea.classList.add('active');
                startBtn.style.display = 'none';
                cancelBtn.style.display = 'inline-flex';
                regStatus.textContent = 'Follow the prompts to capture face.';
                video.onloadeddata = function () { setTimeout(startLivenessChecks, 500); };
            })
            .catch(function (err) {
                showToast(err.message || 'Could not start camera', 'danger');
                startBtn.disabled = false;
            });
    });

    if (recaptureBtn) recaptureBtn.addEventListener('click', function () {
        recaptureBtn.style.display = 'none';
        startLivenessChecks();
    });

    cancelBtn.addEventListener('click', stopCamera);

    regForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!capturedDescriptor || !capturedImageBase64) {
            showToast('Please capture the student\'s face first!', 'warning');
            return;
        }

        var name = document.getElementById('srName').value.trim();
        var roll = document.getElementById('srRoll').value.trim();
        var regNo = document.getElementById('srRegNo').value.trim();
        var dept = document.getElementById('srDept').value.trim();
        var sem = document.getElementById('srSem').value.trim();
        var pass = document.getElementById('srPass').value.trim();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        // Register student to get their token
        API.post('/auth/student/register', { rollNumber: roll, registrationNumber: regNo, name: name, department: dept, semester: sem, password: pass })
            .then(function(res) {
                var sToken = res.token;
                // Enroll face using the newly created student's token
                return API.put('/students/face', { descriptor: capturedDescriptor, faceImage: capturedImageBase64 }, sToken);
            })
            .then(function() {
                showToast('Student registered and face enrolled successfully!', 'success');
                regForm.reset();
                capturedDescriptor = null;
                capturedImageBase64 = null;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Complete Registration';
                regStatus.innerHTML = '* A face must be enrolled before registering the student.';
            })
            .catch(function(err) {
                showToast(err.message || 'Registration failed', 'danger');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Registration';
            });
    });
})();

// --- Student Details ---
(function() {
    var secStudents = document.getElementById('sec-students');
    var wrap = document.getElementById('studentDetailsTableWrap');
    var exportBtn = document.getElementById('exportStudentsBtn');
    if (!secStudents || !wrap) return;

    var loadedStudents = [];

    window.loadStudentDetails = function() {
        wrap.innerHTML = '<div class="empty"><p>Loading student details...</p></div>';
        API.get('/students', teacherToken)
            .then(function(res) {
                loadedStudents = res.students || [];
                renderStudents(loadedStudents);
            })
            .catch(function(err) {
                wrap.innerHTML = '<div class="empty"><p style="color:#ef4444">Failed to load students: ' + (err.message || 'Unknown error') + '</p></div>';
            });
    };

    function renderStudents(students) {
        if (students.length === 0) {
            wrap.innerHTML = '<div class="empty"><h4>No Students Registered</h4><p>Use the Student Registration tab to add students.</p></div>';
            return;
        }

        var html = '<table class="data-table"><thead><tr>' +
                   '<th>Photo</th>' +
                   '<th>Name</th>' +
                   '<th>Roll No</th>' +
                   '<th>Reg No</th>' +
                   '<th>Department</th>' +
                   '<th>Semester</th>' +
                   '<th>Actions</th>' +
                   '</tr></thead><tbody>';

        students.forEach(function(s) {
            var avatar = s.faceImage ? '<img src="'+s.faceImage+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">' 
                                     : '<div style="width:40px;height:40px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:bold;">'+s.name.charAt(0)+'</div>';
            var regNo = s.registrationNumber || 'N/A';
            
            html += '<tr id="row-'+s.id+'">' +
                    '<td>' + avatar + '</td>' +
                    '<td class="val-name"><strong>' + s.name + '</strong></td>' +
                    '<td class="val-roll">' + s.rollNumber + '</td>' +
                    '<td class="val-reg">' + regNo + '</td>' +
                    '<td class="val-dept">' + s.department + '</td>' +
                    '<td class="val-sem">' + (s.semester || 'N/A') + '</td>' +
                    '<td>' +
                        '<div class="action-btns" id="acts-'+s.id+'">' +
                            '<button class="btn btn-sm" style="background:#f1f5f9;color:#475569;" onclick="editStudent(\'' + s.id + '\')"><i class="fa-solid fa-pen"></i> Edit</button>' +
                            '<button class="btn btn-danger btn-sm" onclick="deleteStudent(\'' + s.id + '\')"><i class="fa-solid fa-trash"></i> Delete</button>' +
                        '</div>' +
                    '</td>' +
                    '</tr>';
        });
        html += '</tbody></table>';
        wrap.innerHTML = html;
    }

    window.editStudent = function(id) {
        var student = loadedStudents.find(function(s) { return s.id === id; });
        if (!student) return;
        var row = document.getElementById('row-'+id);
        
        row.querySelector('.val-name').innerHTML = '<input type="text" class="form-input" style="padding:4px 8px;font-size:13px;" id="editName-'+id+'" value="'+student.name+'">';
        row.querySelector('.val-roll').innerHTML = '<input type="text" class="form-input" style="padding:4px 8px;font-size:13px;width:80px;" id="editRoll-'+id+'" value="'+student.rollNumber+'">';
        row.querySelector('.val-reg').innerHTML = '<input type="text" class="form-input" style="padding:4px 8px;font-size:13px;width:100px;" id="editReg-'+id+'" value="'+(student.registrationNumber||'')+'">';
        row.querySelector('.val-dept').innerHTML = '<input type="text" class="form-input" style="padding:4px 8px;font-size:13px;" id="editDept-'+id+'" value="'+student.department+'">';
        row.querySelector('.val-sem').innerHTML = '<input type="text" class="form-input" style="padding:4px 8px;font-size:13px;width:100px;" id="editSem-'+id+'" value="'+(student.semester||'')+'">';
        
        document.getElementById('acts-'+id).innerHTML = 
            '<button class="btn btn-success btn-sm" onclick="saveStudent(\'' + id + '\')"><i class="fa-solid fa-check"></i> Save</button>' +
            '<button class="btn btn-sm" style="background:#e2e8f0;color:#475569;" onclick="loadStudentDetails()">Cancel</button>';
    };

    window.saveStudent = function(id) {
        if (!confirm('Are you sure you want to save these updated details?')) return;
        
        var name = document.getElementById('editName-'+id).value.trim();
        var roll = document.getElementById('editRoll-'+id).value.trim();
        var reg = document.getElementById('editReg-'+id).value.trim();
        var dept = document.getElementById('editDept-'+id).value.trim();
        var sem = document.getElementById('editSem-'+id).value.trim();
        
        API.put('/students/' + id, { name: name, rollNumber: roll, registrationNumber: reg, department: dept, semester: sem }, teacherToken)
            .then(function(res) {
                showToast('Details updated successfully!', 'success');
                loadStudentDetails();
            })
            .catch(function(err) {
                showToast(err.message || 'Update failed', 'danger');
            });
    };

    window.deleteStudent = function(id) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;
        
        API.del('/students/' + id, teacherToken)
            .then(function(res) {
                showToast('Student deleted successfully', 'success');
                loadStudentDetails();
            })
            .catch(function(err) {
                showToast(err.message || 'Failed to delete student', 'danger');
            });
    };

    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            if (loadedStudents.length === 0) {
                showToast('No student data to export.', 'warning');
                return;
            }

            var csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "ID,Name,Roll Number,Registration Number,Department,Semester,Face Enrolled At\n";
            
            loadedStudents.forEach(function(s) {
                var row = [
                    s.id,
                    '"' + s.name + '"',
                    s.rollNumber,
                    s.registrationNumber || '',
                    '"' + s.department + '"',
                    '"' + (s.semester || '') + '"',
                    s.faceEnrolledAt || 'Not Enrolled'
                ].join(",");
                csvContent += row + "\n";
            });

            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "student_details.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }


})();
