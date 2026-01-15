const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // If file doesn't exist, create default structure
    const defaultDB = {
      houses: [],
      nextHouseId: 1,
      users: [],
      nextUserId: 1,
      tokens: {}
    };
    writeDB(defaultDB);
    return defaultDB;
  }
}

export function writeDB(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
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
