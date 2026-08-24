// --- Auth & Setup ---
var teacher = Auth.getUser('teacher');
var teacherToken = Auth.getToken('teacher');
if (!teacher || !teacherToken) goTo('/teacher-login');

var elUName = document.getElementById('uName');
if(elUName) elUName.textContent = teacher.name;

var elHUName = document.getElementById('hUName');
if(elHUName) elHUName.textContent = teacher.name;

var elCSubject = document.getElementById('cSubject');
if (elCSubject) {
    elCSubject.value = teacher.subject || 'General';
    elCSubject.readOnly = true;
    elCSubject.style.backgroundColor = '#f1f5f9';
    elCSubject.style.color = '#64748b';
}

var elUAvatar = document.getElementById('uAvatar');
if(elUAvatar) elUAvatar.textContent = teacher.name.charAt(0);

var elTodayDate = document.getElementById('todayDate');
if(elTodayDate) elTodayDate.textContent = formatDateTime(new Date());

// Pre-fill Settings Profile
var setNameEl = document.getElementById('setName');
if(setNameEl) setNameEl.value = teacher.name || '';
var setDeptEl = document.getElementById('setDept');
if(setDeptEl) setDeptEl.value = teacher.department || '';

// --- Dark/Light Theme Toggle ---
(function() {
    var toggle = document.getElementById('darkModeToggle');
    var track = document.getElementById('toggleTrack');
    var dot = document.getElementById('toggleDot');
    var statusBox = document.getElementById('themeStatusBox');
    var statusText = document.getElementById('themeStatusText');

    function applyDark(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
            if(track) track.style.background = '#6366f1';
            if(dot) dot.style.left = '27px';
            if(statusBox) statusBox.style.background = '#312e81';
            if(statusText) statusText.innerHTML = '<i class="fa-solid fa-moon" style="color:#a5b4fc;font-size:20px;margin-right:8px;"></i>Dark Mode Active';
        } else {
            document.body.classList.remove('dark-theme');
            if(track) track.style.background = '#cbd5e1';
            if(dot) dot.style.left = '3px';
            if(statusBox) statusBox.style.background = '#f8fafc';
            if(statusText) statusText.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b;font-size:20px;margin-right:8px;"></i>Light Mode Active';
        }
    }

    // Load saved preference
    var saved = localStorage.getItem('sa_theme');
    if (saved === 'dark') {
        if(toggle) toggle.checked = true;
        applyDark(true);
    }

    if(toggle) {
        toggle.addEventListener('change', function() {
            var isDark = this.checked;
            applyDark(isDark);
            localStorage.setItem('sa_theme', isDark ? 'dark' : 'light');
            showToast(isDark ? 'Dark Mode enabled' : 'Light Mode enabled', 'success');
        });
    }

    // Populate Settings Sched Subject
    setTimeout(function() {
        if(typeof populateSubjectSelect === 'function') {
            populateSubjectSelect(document.getElementById('schedSubject')).catch(function(){});
        }
    }, 500);

    var btnSchedule = document.getElementById('btnSchedule');
    if (btnSchedule) {
        btnSchedule.addEventListener('click', function() {
            var subj = document.getElementById('schedSubject').value;
            var cls = document.getElementById('schedClass').value.trim();
            var dt = document.getElementById('schedDate').value;
            var tm = document.getElementById('schedTime').value;
            
            if (!subj || !cls || !dt || !tm) {
                showToast('Please fill all scheduling fields', 'warning');
                return;
            }

            var btn = this;
            btn.disabled = true;
            btn.textContent = 'Scheduling...';

            API.post('/sessions/schedule', {
                subject: subj,
                className: cls,
                date: dt,
                time: tm
            }, teacherToken).then(function() {
                showToast('Session scheduled for ' + dt + ' ' + tm, 'success');
                document.getElementById('schedClass').value = '';
                document.getElementById('schedDate').value = '';
                document.getElementById('schedTime').value = '';
            }).catch(function(err) {
                showToast(err.message || 'Failed to schedule', 'danger');
            }).finally(function() {
                btn.disabled = false;
                btn.textContent = 'Schedule Session';
            });
        });
    }

})();

var currentLiveSessionId = null;
var faceDetectInterval = null;
var knownFaces = [];  
var markedThisSession = {};

// --- Sidebar Navigation ---
var navItems = document.querySelectorAll('.nav-item');
var sections = document.querySelectorAll('.section');
var overlay = document.getElementById('overlay');
var sidebar = document.getElementById('sidebar');

// skipDataLoad: switch the visible tab without firing its fetch. Used by the init
// block below, which runs before the per-section loaders further down are defined.
function switchSec(secId, skipDataLoad) {

    sessionStorage.setItem('teacher_current_sec', secId);

    // Close performance dropdown if navigating away from performance sections
    var perfSections = ['report-class', 'report-date'];
    if (perfSections.indexOf(secId) === -1) {
        var perfLabel = document.querySelector('.nav-group-label.collapsible[data-toggle="performance-group"]');
        var perfGroup = document.getElementById('performance-group');
        if (perfLabel) perfLabel.classList.remove('open');
        if (perfGroup) perfGroup.classList.remove('open');
    }

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

    if (!skipDataLoad) loadSectionData(secId);
}

// Fetches + renders the data for one section. Split out of switchSec() so the
// initial page load can call it too, once every section's loader exists.
function loadSectionData(secId) {
    if(secId === 'students' && typeof window.loadStudentDetails === 'function') window.loadStudentDetails();
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

        // --- Weekly Attendance Trends (real data) ---
        var weeklyCanvas = document.getElementById('weeklyChart');
        if(weeklyCanvas) {
            if(window._weeklyChartInstance) window._weeklyChartInstance.destroy();
            var wCtx = weeklyCanvas.getContext('2d');
            var gradient = wCtx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.01)');
            var wData = res.weeklyData || [];
            window._weeklyChartInstance = new Chart(weeklyCanvas, {
                type: 'line',
                data: {
                    labels: wData.map(function(d){ return d.day; }),
                    datasets: [{
                        label: 'Attendance',
                        data: wData.map(function(d){ return d.count; }),
                        borderColor: '#6366f1',
                        backgroundColor: gradient,
                        fill: true, tension: 0.4, pointRadius: 5,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#fff', pointBorderWidth: 2,
                        pointHoverRadius: 7, borderWidth: 3
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false },
                        tooltip: { backgroundColor: '#1e293b', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 8 }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
                        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } }
                    }
                }
            });
        }

        // --- Participation Chart (real data) ---
        var donutCanvas = document.getElementById('participationChart');
        if(donutCanvas) {
            if(window._participationChartInstance) window._participationChartInstance.destroy();
            var pData = res.participationData || { totalParticipated: 0, neverAttended: 0 };
            window._participationChartInstance = new Chart(donutCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Active Students', 'Never Attended'],
                    datasets: [{
                        data: [pData.totalParticipated, pData.neverAttended],
                        backgroundColor: ['#6366f1', '#e2e8f0'],
                        hoverBackgroundColor: ['#4f46e5', '#cbd5e1'],
                        borderWidth: 0, borderRadius: 4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
                        tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 }
                    }
                }
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
            // Always add the teacher's default subject if they have one
            if (teacher && teacher.subject) {
                selectEl.innerHTML += '<option value="'+teacher.subject+'">'+teacher.subject+'</option>';
            }
            for(var k in subjs) {
                // Avoid duplicating the default subject
                if (!teacher || k !== teacher.subject) {
                    selectEl.innerHTML += '<option value="'+k+'">'+k+'</option>';
                }
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

// Init — restore the active tab's VISUAL state only (highlight + page title).
// The data fetch is deliberately deferred to bootstrapActiveSection() at the very
// bottom of this file: the per-section loaders (window.loadStudentDetails in
// particular) are assigned inside IIFEs further down and do not exist yet here.
var activeSec = 'dashboard';
try {
    activeSec = sessionStorage.getItem('teacher_current_sec') || 'dashboard';
} catch (e) {
    console.warn('sessionStorage unavailable, defaulting to dashboard.', e);
}
try {
    switchSec(activeSec, true);
} catch (e) {
    console.error("Section loaded with missing elements, but execution continued.", e);
}
document.querySelectorAll('.nav-group-label.collapsible').forEach(function(label) {
    label.addEventListener('click', function() {
        var targetId = label.dataset.toggle;
        var target = document.getElementById(targetId);
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

// --- Notification Panel ---
(function() {
    var notifBtn = document.getElementById('notifBtn');
    var notifDot = document.getElementById('notifDot');
    if (!notifBtn) return;

    var panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.style.cssText = 'display:none;position:fixed;top:60px;right:80px;width:360px;max-height:440px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);z-index:200;overflow:hidden;';
    panel.innerHTML = '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:15px;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">Notifications <button id="notifClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;">✕</button></div><div id="notifList" style="overflow-y:auto;max-height:370px;padding:8px 0;"></div>';
    document.body.appendChild(panel);

    notifBtn.addEventListener('click', function() {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            loadNotifications();
        } else {
            panel.style.display = 'none';
        }
    });

    document.getElementById('notifClose').addEventListener('click', function() {
        panel.style.display = 'none';
    });

    function loadNotifications() {
        var list = document.getElementById('notifList');
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Loading...</div>';
        API.get('/notifications', teacherToken).then(function(res) {
            var notifs = res.notifications || [];
            if (notifs.length === 0) {
                list.innerHTML = '<div style="padding:30px;text-align:center;color:#94a3b8;"><i class="fa-regular fa-bell" style="font-size:24px;display:block;margin-bottom:8px;"></i>No notifications</div>';
                if (notifDot) notifDot.style.display = 'none';
                return;
            }
            var unread = notifs.filter(function(n){ return !n.read; }).length;
            if (notifDot) notifDot.style.display = unread > 0 ? 'block' : 'none';
            var html = '';
            notifs.forEach(function(n) {
                var icons = { info: 'fa-circle-info', warning: 'fa-triangle-exclamation', success: 'fa-circle-check', system: 'fa-gear' };
                var colors = { info: '#6366f1', warning: '#f59e0b', success: '#22c55e', system: '#64748b' };
                var icon = icons[n.type] || icons.info;
                var color = colors[n.type] || colors.info;
                html += '<div style="padding:12px 20px;border-bottom:1px solid #f8fafc;display:flex;gap:12px;align-items:flex-start;' + (!n.read ? 'background:#f8fafc;' : '') + '">';
                html += '<i class="fa-solid ' + icon + '" style="color:' + color + ';font-size:16px;margin-top:2px;"></i>';
                html += '<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:#1e293b;">' + n.title + '</div><div style="font-size:12px;color:#64748b;margin-top:2px;">' + n.message + '</div><div style="font-size:11px;color:#94a3b8;margin-top:4px;">' + n.time + '</div></div></div>';
            });
            list.innerHTML = html;
        }).catch(function() {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Failed to load</div>';
        });
    }

    // Auto-check for notifications on load
    API.get('/notifications', teacherToken).then(function(res) {
        var unread = (res.notifications || []).filter(function(n){ return !n.read; }).length;
        if (notifDot) notifDot.style.display = unread > 0 ? 'block' : 'none';
    }).catch(function(){});
})();

// --- Messages Panel ---
(function() {
    var msgBtn = document.getElementById('msgBtn');
    var msgDot = document.getElementById('msgDot');
    if (!msgBtn) return;

    var panel = document.createElement('div');
    panel.id = 'msgPanel';
    panel.style.cssText = 'display:none;position:fixed;top:60px;right:120px;width:380px;max-height:480px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.12);z-index:200;overflow:hidden;';
    panel.innerHTML = '<div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:15px;color:#1e293b;display:flex;justify-content:space-between;align-items:center;">Messages <button id="msgClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;">✕</button></div><div id="msgList" style="overflow-y:auto;max-height:400px;padding:8px 0;"></div>';
    document.body.appendChild(panel);

    msgBtn.addEventListener('click', function() {
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            loadMessages();
        } else {
            panel.style.display = 'none';
        }
    });

    document.getElementById('msgClose').addEventListener('click', function() {
        panel.style.display = 'none';
    });

    function loadMessages() {
        var list = document.getElementById('msgList');
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Loading...</div>';
        API.get('/messages', teacherToken).then(function(res) {
            var msgs = res.messages || [];
            if (msgs.length === 0) {
                list.innerHTML = '<div style="padding:30px;text-align:center;color:#94a3b8;"><i class="fa-regular fa-comment" style="font-size:24px;display:block;margin-bottom:8px;"></i>No messages yet<br><span style="font-size:12px;">Students can message you from their dashboard</span></div>';
                if (msgDot) msgDot.style.display = 'none';
                return;
            }
            var unread = msgs.filter(function(m){ return !m.read; }).length;
            if (msgDot) msgDot.style.display = unread > 0 ? 'block' : 'none';
            var html = '';
            msgs.forEach(function(m) {
                html += '<div style="padding:12px 20px;border-bottom:1px solid #f8fafc;cursor:pointer;' + (!m.read ? 'background:#f0f9ff;' : '') + '" onclick="markMsgRead(\'' + m.id + '\', this)">';
                html += '<div style="display:flex;justify-content:space-between;align-items:center;"><div style="font-size:13px;font-weight:600;color:#1e293b;">' + m.fromName + ' <span style="font-size:11px;font-weight:400;color:#94a3b8;">(' + (m.fromRole || 'Student') + ')</span></div>';
                html += '<span style="font-size:11px;color:#94a3b8;">' + formatTime(m.timestamp) + '</span></div>';
                html += '<div style="font-size:13px;font-weight:500;color:#475569;margin-top:4px;">' + (m.subject || 'No subject') + '</div>';
                html += '<div style="font-size:12px;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + m.body + '</div></div>';
            });
            list.innerHTML = html;
        }).catch(function() {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;">Failed to load messages</div>';
        });
    }

    window.markMsgRead = function(id, el) {
        API.patch('/messages/' + id + '/read', {}, teacherToken).then(function() {
            if (el) el.style.background = '#fff';
        }).catch(function(){});
    };

    // Auto-check for unread messages on load
    API.get('/messages', teacherToken).then(function(res) {
        var unread = (res.messages || []).filter(function(m){ return !m.read; }).length;
        if (msgDot) msgDot.style.display = unread > 0 ? 'block' : 'none';
    }).catch(function(){});
})();

// --- Initial data bootstrap -------------------------------------------------
// BUGFIX: the student details table used to sit on its static
// "Loading student details..." placeholder until the user clicked away and back.
// switchSec() runs near the top of this file, at which point the Student Details
// IIFE has not yet assigned window.loadStudentDetails, so the guard silently
// no-opped and no fetch was ever issued for the initially-active tab. The sidebar
// click listener was the only thing that ever triggered it.
// Fix: run the active section's loader here, after every loader is defined.
var sectionBootstrapped = false;

function bootstrapActiveSection() {
    if (sectionBootstrapped) return;   // never fetch the same initial tab twice
    sectionBootstrapped = true;

    var secId = 'dashboard';
    try {
        secId = sessionStorage.getItem('teacher_current_sec') || 'dashboard';
    } catch (e) {
        console.warn('sessionStorage unavailable, bootstrapping dashboard.', e);
    }

    try {
        loadSectionData(secId);
    } catch (e) {
        console.error('Failed to load initial data for section "' + secId + '".', e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapActiveSection);
} else {
    bootstrapActiveSection();   // script was deferred/async and DOM is already parsed
}
