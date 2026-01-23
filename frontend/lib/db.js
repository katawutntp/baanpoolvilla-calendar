// Database helper for Vercel deployment
// Uses in-memory storage with initial data from JSON file

const fs = require('fs');
const path = require('path');

// Read initial data from JSON file (read-only in production)
let memoryDB = null;

function getInitialDB() {
  if (memoryDB) return memoryDB;
  
  try {
    const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    memoryDB = JSON.parse(raw);
  } catch (err) {
    memoryDB = {
      houses: [],
      nextHouseId: 1,
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' }
      ],
      nextUserId: 2,
      tokens: {},
      bookings: []
    };
  }
  return memoryDB;
}

export function readDB() {
  return getInitialDB();
}

export function writeDB(data) {
  // In Vercel serverless, we can only write to memory
  // Data persists for the life of the function instance
  memoryDB = data;
  
  // Try to write to file (only works in development)
  try {
    const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    // Ignore write errors in production (read-only filesystem)
    console.log('Write to file skipped (read-only filesystem)');
  }
}

export function getTokenData(token) {
  const db = readDB();
  return db.tokens[token] || null;
}

export function setToken(token, data) {
  const db = readDB();
  db.tokens[token] = data;
  writeDB(db);
}

export function deleteToken(token) {
  const db = readDB();
  delete db.tokens[token];
  writeDB(db);
}

export function getBookings() {
  const db = readDB();
  return db.bookings || [];
}

export function saveBookings(bookings) {
  const db = readDB();
  db.bookings = bookings;
  writeDB(db);
}
