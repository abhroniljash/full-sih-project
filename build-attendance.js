const fs = require('fs');

let html = fs.readFileSync('stitch_student_portal_dashboard (3)/code.html', 'utf8');

// Dashboard Link
html = html.replace(/<a class="flex items-center gap-4 px-4 py-3\.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-path="dashboard" href="#">/, '<a class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" href="student-dashboard.html">');

// Schedule Link
html = html.replace(/<a class="flex items-center gap-4 px-4 py-3\.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" data-path="my-schedule" href="#">/, '<a class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all" href="student-schedule.html">');

// Attendance Link
html = html.replace(/<a aria-current="page" class="flex items-center gap-4 px-4 py-3\.5 rounded-xl transition-all bg-secondary-container text-on-secondary-container font-semibold" data-path="attendance" href="#">/, '<a aria-current="page" class="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all bg-secondary-container text-on-secondary-container font-semibold" href="student-attendance.html">');

// Logo
html = html.replace(/<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-on-primary">school<\/span><\/div><span class="font-headline-md text-headline-md tracking-tight text-primary">Lumina Portal<\/span>/, '<div class="logo"></div>');

let styleInjection = `<style>
.logo {
    width: 220px;
    height: 50px;
    background-image: url('logo.jpeg');
    background-size: contain; 
    background-repeat: no-repeat;
    background-position: left center;
    animation: changeLogo 4s infinite;
}
@keyframes changeLogo {
    0%, 49.9% { background-image: url('logo.jpeg'); }
    50%, 100% { background-image: url('logo2.jpeg'); }
}
</style>
</head>`;
html = html.replace(/<\/head>/, styleInjection);

// Profile Update
let oldProfile = '<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[20px]">person</span></div><div class="overflow-hidden"><p class="text-label-sm font-semibold truncate">Alex Rivers</p><p class="text-[11px] text-on-surface-variant truncate">ID: 2024-8891</p></div>';
let newProfile = '<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden" id="uAvatar"><span class="material-symbols-outlined text-on-primary text-[20px]">person</span></div><div class="overflow-hidden"><p class="text-label-sm font-semibold truncate" id="uName">Student</p><p class="text-[11px] text-on-surface-variant truncate" id="rollTag">ID: ---</p></div><button class="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors" id="logoutBtn" title="Logout"><span class="material-symbols-outlined text-[18px]">logout</span></button>';
html = html.replace(oldProfile, newProfile);

let scripts = `
    <script src="config.js"></script>
    <script src="common.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var student = Auth.getUser('student');
        var studentToken = Auth.getToken('student');
        if (!student || !studentToken) {
            window.location.href = 'student-login.html';
            return;
        }

        document.getElementById('uName').textContent = student.name;
        document.getElementById('rollTag').textContent = 'ID: ' + student.rollNumber;
        if (student.faceImage) {
            document.getElementById('uAvatar').innerHTML = '<img src="' + student.faceImage + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
        } else {
            document.getElementById('uAvatar').textContent = student.name.charAt(0);
        }
        
        document.getElementById('logoutBtn').addEventListener('click', function() {
            confirmLogout('student');
        });
    });
    </script>
</body>
`;
html = html.replace(/<\/body>/, scripts);

fs.writeFileSync('backend/public/student-attendance.html', html);
console.log('Attendance HTML built');
