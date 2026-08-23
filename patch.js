const fs = require('fs');
let html = fs.readFileSync('backend/public/student-dashboard.html', 'utf8');

// 1. Head elements
html = html.replace('</head>', '<style>.logo { width: 220px; height: 50px; background-image: url(\"logo.j`eg\"); background-size: contain; background-repeat: no-repeat; background-position: left center; animation: changeLogo 4s infinite; } @keyframes changeLogo { 0%, 49.9% { background-image: url(\"logo.j`eg\"); } 50%, 100% { background-image: url(\"logo2.jpeg\"); } } #toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; } .toast { background: #333; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; opacity: 0; transform: translateY(20px); transition: 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); } .toast.show { opacity: 1; transform: translateY(0); } .toast.success { background: #16a34a; } .toast.danger { background: #dc2626; }</style></head>');

// 2. Scripts
html = html.replace('</body>', '<script src="config.js"></script><script src="common.js"></script><script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script><script src="face.js"></script><script src="student-dashboard.js"></script></body>');

// 3. Brand
html = html.replace('<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><span class="material-symbols-outlined text-on-primary">school</span></div><span class="font-headline-md text-headline-md tracking-tight text-primary">Lumina Portal</span>', '<div class="logo"></div>');

// 4. User profile
html = html.replace('<div class="w-10 i-10 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[20px]">person</span></div><div class="overflow-hidden"><p class="text-label-sm font-semibold truncate">Alex Rivers</p><p class="text-[11px] text-on-surface-variant truncate">ID: 2024-8891</p></div>', '<div class="w-10 i-10 rounded-full bg-primary flex items-center justify-center overflow-hidden" id="uAvatar"><span class="material-symbols-outlined text-on-primary text-[20px]">person</span></div><div class="overflow-hidden"><p class="text-label-sm font-semibold truncate" id="uName">Student</p><p class="text-[11px] text-on-surface-variant truncate" id="rollTag">ID: ---</p></div><button class="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors" id="logoutBtn" title="Logout"><span class="material-symbols-outlined text-[18px]">logout</span></button>');

// 5. Hero Text
html = html.replace('<h1 class="font-stat-display text-stat-display tracking-tight">Abhranil</h1>', '<h1 class="font-stat-display text-stat-display tracking-tight" id="welcomeName">Student</h1>');
html = html.replace('<p class="font-body-md text-body-md text-on-primary/90 mt-1">Roll Number: 2024-8891 • Dept: CSE • Reg No: 2024-REG-1234</p>', '<p class="font-body-md text-body-md text-on-primary/90 mt-1" id="rollTagFull">Roll Number: ---</p>');

// 6. Stats
html = html.replace('<p class="font-headline-lg text-headline-lg text-on-surface">82.5%</p>', '<p class="font-headline-lg text-headline-lg text-on-surface" id="overallPerc">0%</p>');
html = html.replace('<p class="font-headline-lg text-headline-lg text-on-surface">120</p>', '<p class="font-headline-lg text-headline-lg text-on-surface" id="totalClasses">0</p>');
html = html.replace('<p class="font-headline-lg text-headline-lg text-on-surface">99</p>', '<p class="font-headline-lg text-headline-lg text-on-surface" id="totalAttended">0</p>');

// 7. Tracker & History
let trackerRegex = /<div class="relative h-48 w-full flex items-end justify-between pb-8 pt-4">[\s\S]*?<div class="flex items-start gap-3 p-4 bg-secondary-container\/30 rounded-xl border border-secondary-container">/;
html = html.replace(trackerRegex, '<div class="relative h-48 w-full flex items-end justify-between pb-8 pt-4" id="trackerList"></div><div class="flex items-start gap-3 p-4 bg-secondary-container/30 rounded-xl border border-secondary-container">');

let historyRegex = /<div class="flex flex-col gap-0">[\s\S]*?<button class="mt-auto w-full py-2.5/;
html = html.replace(historyRegex, '<div class="flex flex-col gap-0" id="historyTable"></div><button class="mt-auto w-full py-2.5');

fs.writeFileSync('backend/public/student-dashboard.html', html);
console.log('HTML Patched successfully!');
