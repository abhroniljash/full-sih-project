/**
 * Minimal file-backed JSON "database".
 *
 * The original frontend (common.js `Store` object) kept everything in
 * localStorage/sessionStorage as plain arrays: sessions, attendance, plus
 * one logged-in user per role. This module mirrors that shape server-side
 * (teachers, students, sessions, attendance) so the API is a drop-in
 * replacement for the client-side mock.
 *
 * It intentionally avoids native dependencies (e.g. better-sqlite3) so the
 * project installs anywhere with just `npm install`. Swap this module for a
 * real database (Postgres/Mongo) later without touching the controllers,
 * as long as the same method names are kept.
 */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const DEFAULT_DATA = {
  teachers: [],
  students: [],
  sessions: [],
  attendance: [],
  messages: [],
};

function ensureFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

function read() {
  ensureFile();
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch (err) {
    // Corrupt file safety net — never crash the API because of a bad write.
    console.error('[db] Failed to parse db.json, resetting to defaults:', err.message);
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
    return { ...DEFAULT_DATA };
  }
}

// Serialize writes so two near-simultaneous requests can't clobber each other.
let writeQueue = Promise.resolve();
function write(data) {
  writeQueue = writeQueue.then(
    () =>
      new Promise((resolve, reject) => {
        const tmpFile = `${DB_FILE}.tmp`;
        fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf8', (err) => {
          if (err) return reject(err);
          fs.rename(tmpFile, DB_FILE, (err2) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      })
  );
  return writeQueue;
}

module.exports = { read, write };
