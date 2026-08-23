const fs = require('fs');
let html = fs.readFileSync('backend/public/teacher-dashboard.html', 'utf8');

const replacement = `
                                  <div class="camera-box" id="cameraBox" style="position: relative; overflow: hidden;">
                                      <div class="camera-placeholder" id="camPlaceholder">
                                          <div class="cam-icon"><i class="fa-solid fa-video"></i></div>
                                          <p>Camera Feed</p>
                                          <p class="sub" id="camSubText">Live face-recognition attendance will run here</p>
                                          <button class="btn btn-primary" style="margin-top:16px;" id="startCamBtn">Start Camera</button>
                                      </div>
                                      <video id="camVideo" autoplay playsinline style="display:none; width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                                      
                                      <div id="liveLivenessOverlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:20px; z-index:10;">
                                          <div id="liveLivenessPrompt" style="background:#fff; color:#3525cd; padding:10px 20px; border-radius:30px; font-weight:bold; font-size:18px; margin-bottom:10px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                                              Please smile!
                                          </div>
                                          <div style="width:80%; height:8px; background:rgba(255,255,255,0.3); border-radius:4px; overflow:hidden;">
                                              <div id="liveLivenessBar" style="width:100%; height:100%; background:#22c55e;"></div>
                                          </div>
                                      </div>
                                  </div>
`;

html = html.replace(/<div class="camera-box" id="cameraBox">[\s\S]*?<video id="camVideo" autoplay playsinline style="display:none;"><\/video>\s*<\/div>/, replacement.trim());
fs.writeFileSync('backend/public/teacher-dashboard.html', html);
console.log('Injected liveness UI to teacher-dashboard.html');
