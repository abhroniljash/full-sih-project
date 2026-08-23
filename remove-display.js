const fs=require('fs'); 
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8'); 
html = html.replace('<div class="section" id="sec-schedule" style="display:none;">', '<div class="section" id="sec-schedule">'); 
fs.writeFileSync('backend/public/teacher-dashboard.html', html); 
console.log('Removed inline display style!');
