// --- Backend API configuration ---
// Since frontend and backend are hosted on the exact same domain now, we can just use relative paths.
var API_BASE = '/api';

// --- face-api.js model configuration ---
// Models are fetched from a public CDN at runtime (~6MB total, cached by the
// browser after first load). If you need this to work fully offline, download
// the same files from https://github.com/justadudewhohacks/face-api.js-models
// into a local /models folder and point this at it instead, e.g. './models'.
var FACE_MODEL_URL = './models';

// Euclidean-distance threshold for accepting a face match. Lower = stricter.
// face-api.js's own docs recommend ~0.6 as the default cutoff.
var FACE_MATCH_THRESHOLD = 0.55;
