const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

html = html.replace(/<script src="teacher-dashboard\.js\?v=2"><\/script>/, '<script src="teacher-dashboard.js?v=3"></script>');

fs.writeFileSync('backend/public/teacher-dashboard.html', html);
console.log('Bumped HTML cache version successfully');
