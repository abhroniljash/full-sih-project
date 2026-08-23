const fs=require('fs'); 
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8'); 
html = html.replace(/teacher-dashboard\.js\?v=\d+/, 'teacher-dashboard.js?v=' + Date.now()); 
fs.writeFileSync('backend/public/teacher-dashboard.html', html); 
