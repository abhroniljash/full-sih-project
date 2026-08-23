const fs = require('fs');

let js = fs.readFileSync('backend/src/controllers/dashboard.controller.js', 'utf8');

const filterLogic = `
  const timeframe = req.query.timeframe; // 'monthly' or 'semester'
  if (timeframe === 'monthly') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      relevantSessions = relevantSessions.filter(s => {
          if (!s.date) return false;
          const sDate = new Date(s.date);
          return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      });
  }
`;

// Insert after `relevantSessions = allSessions.filter((s) => subjectKeys.includes(s.subject));\n  }`
const target = `relevantSessions = allSessions.filter((s) => subjectKeys.includes(s.subject));\n  }`;

if (js.includes(target)) {
    js = js.replace(target, target + '\n' + filterLogic);
    fs.writeFileSync('backend/src/controllers/dashboard.controller.js', js);
    console.log("Patched dashboard.controller.js");
} else {
    console.log("Could not find target in dashboard.controller.js");
}
