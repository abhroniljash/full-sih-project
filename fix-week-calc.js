const fs = require('fs');

let js = fs.readFileSync('backend/public/student-dashboard.js', 'utf8');

// 1. Remove the currentWeekNumber from state
js = js.replace('currentWeekNumber: 3, // Default starting week\n', '');

// 2. Replace the textContent update with absolute calculation
const oldHeaderLogic = `if (weekSubheader) {
            weekSubheader.textContent = \`Week \${calendarState.currentWeekNumber} \u2022 Summer Semester\`;
        }`;
const newHeaderLogic = `if (weekSubheader) {
            const weekOfMonth = Math.ceil(startOfWeek.getDate() / 7);
            weekSubheader.innerHTML = \`Week \${weekOfMonth}\`;
        }`;

// Let's use regex just in case there are invisible characters
const regexHeaderLogic = /if\s*\(weekSubheader\)\s*\{\s*weekSubheader\.textContent\s*=\s*`Week\s*\$\{calendarState\.currentWeekNumber\}\s*[^`]*`;\s*\}/g;
js = js.replace(regexHeaderLogic, newHeaderLogic);

// 3. Remove increment/decrement
js = js.replace('calendarState.currentWeekNumber--;\n', '');
js = js.replace('calendarState.currentWeekNumber++;\n', '');

fs.writeFileSync('backend/public/student-dashboard.js', js);
console.log('Fixed week calculation bug!');
