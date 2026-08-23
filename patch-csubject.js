const fs = require('fs');
let js = fs.readFileSync('backend/public/teacher-dashboard.js', 'utf8');

const regex = /createForm\.reset\(\);/g;
js = js.replace(regex, `createForm.reset();
                var elCSubject = document.getElementById('cSubject');
                if (elCSubject && typeof teacher !== 'undefined') {
                    elCSubject.value = teacher.subject || 'General';
                }`);

fs.writeFileSync('backend/public/teacher-dashboard.js', js);
console.log('Fixed cSubject reset issue');
