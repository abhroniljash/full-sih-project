const fs = require('fs');
let js = fs.readFileSync('backend/public/teacher-dashboard.js', 'utf8');

const regex = /showToast\('Session created! Starting live attendance\.\.\.', 'success'\);\s*createForm\.reset\(\);\s*(?:\/\/.*\s*)*switchSec\('live'\);/g;

if (regex.test(js)) {
    const replacement = `showToast('Session created! Starting live attendance...', 'success');
                createForm.reset();
                loadLiveSession();
                switchSec('live');`;
    js = js.replace(regex, replacement);
    fs.writeFileSync('backend/public/teacher-dashboard.js', js);
    console.log('Successfully patched teacher-dashboard.js');
} else {
    console.log('Regex did not match.');
}
