const fs = require('fs');
let html = fs.readFileSync('backend/public/student-schedule.html', 'utf8');

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

html = html.replace(/<script src="config\.js">[\s\S]*?<\/body>/, scripts);
fs.writeFileSync('backend/public/student-schedule.html', html);
console.log('Fixed auth in schedule page!');
