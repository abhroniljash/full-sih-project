const fs = require('fs');

let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

// Add ID to timeline
html = html.replace('<div class="relative z-10 mt-4">', '<div id="scheduleTimelineContainer" class="relative z-10 mt-4">');

// Add ID to concern form
html = html.replace('<form class="space-y-6">', '<form id="concernForm" class="space-y-6">');

// Give IDs to the concern form inputs. The first select is the course, the second is concern type.
html = html.replace(/<select class="block w-full border-outline-variant/g, (match, offset, string) => {
    // If it's the first occurrence after concernForm, it's course
    return `<select id="concern_${offset}" class="block w-full border-outline-variant`;
});

// textarea
html = html.replace('<textarea class="block w-full border-outline-variant', '<textarea id="concernDescription" name="concernDescription" class="block w-full border-outline-variant');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('HTML modified');
