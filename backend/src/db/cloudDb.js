const mongoose = require('mongoose');

const DEFAULT_DATA = {
  admins: [],
  teachers: [],
  students: [],
  sessions: [],
  attendance: [],
  messages: [],
  broadcast_notifications: [],
  teacher_activity: [],
  scheduled_sessions: [],
};

let memoryDb = { ...DEFAULT_DATA };
let isConnected = false;

// Create a schema for the entire DB JSON
// This allows us to keep the synchronous repository API while persisting to MongoDB
const DbSchema = new mongoose.Schema({
  data: { type: Object, default: DEFAULT_DATA }
}, { strict: false });

let DbModel;
let lastError = null;

async function init() {
  const uri = process.env.DATABASE_URL || process.env.MONGO_URI;
  if (!uri) {
    lastError = 'No DATABASE_URL or MONGO_URI found in env variables.';
    console.warn('[db] WARNING: ' + lastError);
    return;
  }

  try {
    // Connect without destructive syncs (no drop, no force: true)
    await mongoose.connect(uri);
    isConnected = true;
    lastError = null;
    DbModel = mongoose.model('Database', DbSchema);

    let doc = await DbModel.findOne();
    if (!doc) {
      console.log('[db] No existing data found in cloud, initializing defaults.');
      doc = await DbModel.create({ data: DEFAULT_DATA });
    } else {
      console.log('[db] Existing data loaded from Cloud Database successfully.');
    }

    // Load into memory for fast synchronous reads
    memoryDb = { ...DEFAULT_DATA, ...doc.data };
  } catch (err) {
    lastError = err.message || err.toString();
    console.error('[db] Cloud Database connection failed:', err);
    console.warn('[db] Falling back to in-memory storage.');
  }
}

function read() {
  return memoryDb;
}

function getLastError() {
  return lastError;
}

let writeQueue = Promise.resolve();

function write(data) {
  // 1. Update memory immediately so subsequent sync reads see the new data
  memoryDb = { ...data };

  // 2. Persist to MongoDB asynchronously
  if (!isConnected || !DbModel) return Promise.resolve();

  writeQueue = writeQueue.then(() => {
    // Using updateOne without dropping tables/collections ensures data is preserved
    return DbModel.updateOne({}, { data: memoryDb }, { upsert: true });
  }).catch(err => {
    console.error('[db] Cloud write failed:', err);
  });

  return writeQueue;
}

module.exports = {
  init,
  read,
  write,
  isCloudConnected: () => isConnected,
  getLastError
};
