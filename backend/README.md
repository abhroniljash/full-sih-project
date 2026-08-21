# Smart Attendance System — Backend

A REST API backend for the **Smart India Hackathon** attendance-tracking frontend
(`index.html`, `student-login.html`, `student-dashboard.html`, `teacher-login.html`,
`teacher-dashboard.html`). The original frontend faked its backend with
`localStorage`/`sessionStorage` (see `common.js` → `Store`); this project replaces
that mock with a real Node.js/Express API, JWT authentication, and persisted data.

No database server to install — data is stored in a local JSON file
(`src/data/db.json`), auto-created on first run. Swap `src/db/jsonDb.js` for
Postgres/MongoDB later without touching any controller.

## Quick start

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET etc. if you like
npm run seed               # optional: creates a demo teacher + student
npm run dev                 # starts on http://localhost:5000
```

Demo login (after `npm run seed`):
- Teacher: `demo.teacher@college.edu` / `password123`
- Student: roll `CSE5001` / `password123`

Health check: `GET http://localhost:5000/api/health`

## Project structure

```
backend/
  src/
    config/          env-driven configuration
    db/              jsonDb.js (file storage) + repository.js (CRUD helpers)
    middleware/       auth.js (JWT), errorHandler.js
    controllers/       auth, session, attendance, dashboard
    routes/             one file per resource, mounted under /api/*
    utils/               helpers.js (session-ID generator, async wrapper), seed.js
    app.js / server.js
```

## Authentication

JWT bearer tokens. Register/login returns `{ token, user }`; send
`Authorization: Bearer <token>` on every subsequent request.

| Method | Route                       | Auth    | Body                                              |
|--------|------------------------------|---------|----------------------------------------------------|
| POST   | `/api/auth/student/register` | –       | `rollNumber, name, password, department?, semester?` |
| POST   | `/api/auth/student/login`    | –       | `rollNumber, password`                              |
| POST   | `/api/auth/teacher/register` | –       | `email, name?, password, department?`               |
| POST   | `/api/auth/teacher/login`    | –       | `email, password`                                   |
| GET    | `/api/auth/me`               | Bearer  | –                                                    |

## Sessions (a "class" a teacher starts)

| Method | Route                          | Auth              | Notes                                    |
|--------|---------------------------------|-------------------|--------------------------------------------|
| POST   | `/api/sessions`                 | teacher           | `subject, className, room?, description?` → generates `SAS-XXXXXX` id |
| GET    | `/api/sessions?mine=true&status=active&subject=` | any (Bearer) | filters are optional |
| GET    | `/api/sessions/active`          | any (Bearer)      | latest active session (own, if teacher)   |
| GET    | `/api/sessions/:sessionId`      | any (Bearer)      | –                                          |
| PATCH  | `/api/sessions/:sessionId/end`  | teacher (owner)   | sets `status: "ended"`                    |

## Attendance

| Method | Route                                    | Auth            | Notes |
|--------|--------------------------------------------|-----------------|-------|
| POST   | `/api/attendance/mark`                     | student         | `{ sessionId }` — marks the logged-in student present |
| POST   | `/api/attendance/mark-manual`              | teacher (owner) | `{ sessionId, rollNumber, studentName }` — for the camera/manual-entry flow |
| GET    | `/api/attendance/session/:sessionId`       | Bearer          | list of who's present in a session |
| GET    | `/api/attendance/student/:rollNumber`      | Bearer          | a student's full history (self, or any teacher) |
| GET    | `/api/attendance/reports/class?subject=`   | teacher         | per-student attended/percentage for a subject (Class Report tab) |
| GET    | `/api/attendance/reports/date?subject=&date=` | teacher      | who attended a subject on a given date (Date Report tab) |

## Dashboards

| Method | Route                     | Auth    | Mirrors             |
|--------|----------------------------|---------|-----------------------|
| GET    | `/api/dashboard/student`   | student | `loadDashboard()` in `student-dashboard.js` — totals, 75% tracker, last-10 history |
| GET    | `/api/dashboard/teacher`   | teacher | `loadDashboard()` in `teacher-dashboard.js` — totals, recent sessions |

## Connecting the existing frontend

The current `common.js` `Store` object reads/writes `localStorage`/`sessionStorage`
directly. To wire the frontend to this API:

1. Replace `Store.setUser`/login logic in `student-login.js` / `teacher-login.js`
   with a `fetch('/api/auth/.../login', { method: 'POST', body: JSON.stringify(...) })`
   call, and store the returned `token` (e.g. in `sessionStorage`) instead of
   the raw form input.
2. Send `Authorization: Bearer <token>` on every dashboard fetch.
3. Replace `Store.createSession`, `Store.markAttendance`, `Store.getSessions()`,
   etc. with calls to the matching endpoints above — the response shapes
   (`sessionId`, `subject`, `className`, `teacher`, `status`, `rollNumber`,
   `studentName`, `timestamp`) were kept identical to the objects the frontend
   already builds, so the rendering code (`loadDashboard`, `refreshLiveList`,
   `loadClassReport`, etc.) needs minimal changes.
4. Set `CORS_ORIGIN` in `.env` to wherever the static HTML is served from.

## Notes

- Passwords are hashed with bcrypt; nothing is stored in plaintext.
- `src/data/db.json` is git-ignored — delete it any time to reset all data.
- Rate limiting is applied to the two login endpoints to slow brute-force attempts.
- This is a hackathon-grade backend: the JSON file store is fine for a demo/judging
  round but should be swapped for a real database before any production use.
