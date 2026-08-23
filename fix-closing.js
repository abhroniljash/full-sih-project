const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

const strToFind = `<button class="btn btn-primary" id="btnSchedule" style="width:100%;background:#059669;border-color:#059669;border-radius:6px;padding:8px;font-weight:600;">Schedule Session</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;

const strToReplace = `<button class="btn btn-primary" id="btnSchedule" style="width:100%;background:#059669;border-color:#059669;border-radius:6px;padding:8px;font-weight:600;">Schedule Session</button>
                                </div>
                            </div>`;

if(html.includes(strToFind)) {
    html = html.replace(strToFind, strToReplace);
    fs.writeFileSync('backend/public/teacher-dashboard.html', html);
    console.log("Fixed!");
} else {
    console.log("Not found.");
}
