const fs = require('fs');

const file = 'backend/public/teacher-dashboard.html';
let html = fs.readFileSync(file, 'utf8');

// Find the Schedule Auto-Session block
const blockStartStr = '<!-- Schedule Auto-Session -->';
const blockStart = html.indexOf(blockStartStr);
if (blockStart === -1) {
    console.error("Could not find Schedule Auto-Session block");
    process.exit(1);
}

// It's a `<div class="card" ...>`. Let's find its end by looking for the next `<!--` or `</div>\n                          </div>\n                      </div>\n                  </div>\n  \n              </div>`
// Let's just use string replacement
const regex = /<!-- Schedule Auto-Session -->[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<script)/;
const match = html.match(regex);
if (!match) {
    // try a shorter lookahead
    const regex2 = /<!-- Schedule Auto-Session -->[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/;
    const match2 = html.match(regex2);
    if (!match2) {
      console.error("Could not extract schedule block");
      process.exit(1);
    }
    
    const scheduleCard = match2[0];
    html = html.replace(scheduleCard, ''); // remove it from settings

    // Now insert as a new section
    const newSection = `
        <div id="sec-schedule" class="main-section" style="display:none;">
            <div class="page-header">
                <div>
                    <h2>Schedule Classes</h2>
                    <p class="subtitle">Plan upcoming sessions in advance</p>
                </div>
            </div>
            ${scheduleCard}
        </div>
    `;

    // insert after sec-create
    html = html.replace(/<div id="sec-create" class="main-section" style="display:none;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '$&\n' + newSection);

    // add to nav
    const newNav = `<button class="nav-item" data-sec="schedule"><span class="icon"><i class="fa-regular fa-calendar-plus"></i></span> Schedule Session</button>`;
    html = html.replace('<button class="nav-item" data-sec="create">', newNav + '\n                <button class="nav-item" data-sec="create">');

    fs.writeFileSync(file, html);
    console.log("Moved schedule to its own section!");
}
