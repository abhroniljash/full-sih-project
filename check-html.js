const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');
const $ = cheerio.load(html);
console.log('sec-schedule parent id/class:', $('#sec-schedule').parent().attr('id') || $('#sec-schedule').parent().attr('class'));
