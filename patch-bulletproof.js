const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

const targetStr = `    const btnSemester = document.getElementById('btn-semester');
    const btnMonthly = document.getElementById('btn-monthly');
    const tableBody = document.getElementById('attendance-table-body');
    
    if (!btnSemester || !btnMonthly || !tableBody) return;`;

const replacementStr = `    let btnSemester = document.getElementById('btn-semester');
    if (!btnSemester) {
        const btns = document.querySelectorAll('#section-attendance button.rounded-full');
        if (btns) btnSemester = Array.from(btns).find(b => b.textContent.trim() === 'Semester');
    }

    let btnMonthly = document.getElementById('btn-monthly');
    if (!btnMonthly) {
        const btns = document.querySelectorAll('#section-attendance button.rounded-full');
        if (btns) btnMonthly = Array.from(btns).find(b => b.textContent.trim() === 'Monthly');
    }

    let tableBody = document.getElementById('attendance-table-body');
    if (!tableBody) {
        const section = document.querySelector('#section-attendance');
        if (section) {
            const headers = section.querySelectorAll('th');
            if (headers.length > 0) {
                tableBody = headers[0].closest('table').querySelector('tbody');
            }
        }
    }
    
    if (!btnSemester || !btnMonthly || !tableBody) {
        console.error("CRITICAL DOM ERROR: Missing DOM elements for Attendance Overview.", 
            "btnSemester:", !!btnSemester, 
            "btnMonthly:", !!btnMonthly, 
            "tableBody:", !!tableBody);
        return;
    }`;

if (js.includes(targetStr)) {
    js = js.replace(targetStr, replacementStr);
    fs.writeFileSync('backend/public/student-dashboard.js', js);
    console.log("Replaced DOM selectors to be bulletproof!");
} else {
    console.log("Could not find exact string to replace");
}
