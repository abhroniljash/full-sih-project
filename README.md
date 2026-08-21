# Smart Attendance System — Full Stack (with Face ID)

Two folders:

- **`backend/`** — Node.js/Express REST API (JWT auth, sessions, attendance, reports). See `backend/README.md` for full API reference.
- **`frontend/`** — Your original HTML/CSS/JS, now wired to call the backend instead of `localStorage`, plus browser-side face recognition.

## Run it

```bash
# 1. Start the backend
cd backend
npm install
cp .env.example .env
npm run seed        # optional demo accounts
npm run dev          # http://localhost:5000

# 2. Serve the frontend (any static server works)
cd ../frontend
npx serve .           # or VS Code "Live Server", or `python -m http.server`
```

Open the frontend URL it gives you (e.g. `http://localhost:3000` or `http://127.0.0.1:5500`)
and add that exact origin to `CORS_ORIGIN` in `backend/.env` if it isn't already
one of the defaults, then restart the backend.

## What changed in the frontend

- **`config.js`** (new) — `API_BASE` (backend URL), face-model URL, and match threshold. Edit this first if your backend runs somewhere other than `localhost:5000`.
- **`common.js`** — the old `Store` (localStorage) is gone. Replaced with:
  - `API` — a small `fetch` wrapper for calling the backend.
  - `Auth` — stores the JWT + user object in `sessionStorage` per role.
  - Toast/date/copy helpers are unchanged.
- **`face.js`** (new) — wraps `face-api.js`: loads its ML models, extracts a 128-number face "descriptor" from a video frame, and finds the closest match among known descriptors.
- **`student-login.js` / `teacher-login.js`** — now call the real login endpoint. If the account doesn't exist yet, it auto-registers using the same form (keeps the original one-form UX, no separate sign-up screen).
- **`student-dashboard.js`** — pulls stats/tracker/history from `/api/dashboard/student`, and adds a **Face ID Enrollment** card (new UI block in `student-dashboard.html`).
- **`teacher-dashboard.js`** — sessions, live attendance, and both reports now hit the real API. "Start Camera" runs real face recognition instead of the old random-simulation interval.

## How face recognition works (no database of images, ever)

1. **Enrollment** (student dashboard → "Enroll Face"): the browser turns on the
   webcam, `face-api.js` computes a 128-number descriptor from one frame, and
   only that array of numbers is sent to the backend (`PUT /api/students/face`).
   No photo or video is ever uploaded.
2. **Live session** (teacher dashboard → "Start Camera"): the browser fetches
   every enrolled student's descriptor once (`GET /api/students/face-descriptors`),
   then every ~1.5s it grabs the current video frame, computes its descriptor,
   and compares it locally against the known list (`faceapi.euclideanDistance`).
   A close-enough match (`FACE_MATCH_THRESHOLD` in `config.js`) triggers
   `POST /api/attendance/mark-manual` for that student.
3. All matching math runs **in the browser** — the backend only ever sees and
   stores small number arrays, not images.

### Notes / limitations to know about for a demo or judging round
- Models load from a public CDN by default (`config.js` → `FACE_MODEL_URL`); if you need it to work with no internet at all, download the same files from the face-api.js-models repo and point that URL at a local folder instead.
- Matching is 1-frame-at-a-time and single-face — it won't recognize multiple students in the same frame simultaneously. Good enough for one-at-a-time "walk up and get marked" style attendance; a production system would want multi-face detection.
- Lighting/angle affects accuracy like any face-recognition system — encourage students to enroll in good lighting, facing the camera directly.
