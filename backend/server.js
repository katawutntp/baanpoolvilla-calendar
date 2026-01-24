const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DB_PATH = path.join(__dirname, 'db.json');
const app = express();
app.use(cors());
app.use(express.json());

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  // atomic write
  fs.writeFileSync(DB_PATH + '.tmp', JSON.stringify(data, null, 2));
  fs.renameSync(DB_PATH + '.tmp', DB_PATH);
}

// Get all houses
app.get('/api/houses', (req, res) => {
  const db = readDB();
  res.json(db.houses);
});

// Add a house
app.post('/api/houses', (req, res) => {
  const { name, capacity, zone } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const db = readDB();
  const house = { id: db.nextHouseId++, name, capacity: capacity || 4, zone: zone || '', prices: {} };
  db.houses.push(house);
  writeDB(db);
  res.status(201).json(house);
});

// Update house details (name, capacity)
app.put('/api/houses/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, capacity, zone } = req.body;

  const db = readDB();
  const house = db.houses.find(h => h.id === id);
  if (!house) return res.status(404).json({ error: 'house not found' });

  if (name !== undefined) house.name = name;
  if (capacity !== undefined) house.capacity = capacity;
  if (zone !== undefined) house.zone = zone;
  writeDB(db);
  res.json(house);
});

// Update booking for a house (set price/status for a date)
app.put('/api/houses/:id/booking', (req, res) => {
  const id = Number(req.params.id);
  const { date, price, status } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });

  const db = readDB();
  const house = db.houses.find(h => h.id === id);
  if (!house) return res.status(404).json({ error: 'house not found' });

  house.prices[date] = { price: price !== undefined ? price : null, status: status || 'available' };
  writeDB(db);
  res.json(house);
});

// Apply weekday pricing for a house over a date range or a month
// Payload: { startDate?: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', year?: number, month?: number (1-12), mapping: { '0': priceForSun, '1': priceForMon, ... } }
app.post('/api/houses/:id/weekday-prices', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const { startDate, endDate, year, month, mapping } = req.body;
  if (!mapping || typeof mapping !== 'object') return res.status(400).json({ error: 'mapping required' });

  const db = readDB();
  const house = db.houses.find(h => h.id === id);
  if (!house) return res.status(404).json({ error: 'house not found' });

  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;
  if (!start || !end) {
    if (year && month) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else {
      return res.status(400).json({ error: 'provide startDate/endDate or year/month' });
    }
  }

  // ensure house.prices exists
  house.prices = house.prices || {};

  // iterate dates inclusive
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0=Sun,1=Mon,...6=Sat
    if (Object.prototype.hasOwnProperty.call(mapping, String(day))) {
      const priceVal = mapping[String(day)];
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      // ข้ามวันที่เป็นวันหยุดพิเศษ
      if (house.prices[dateStr]?.isHoliday) continue;
      const prevStatus = house.prices[dateStr]?.status || 'available';
      house.prices[dateStr] = { price: priceVal !== null ? priceVal : null, status: prevStatus };
    }
  }

  writeDB(db);
  res.json(house);
});

// Apply special holiday prices (single date or date range)
// Payload: { startDate?: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', dates?: ['YYYY-MM-DD'], price: number }
app.post('/api/houses/:id/holiday-prices', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const { startDate, endDate, dates, price } = req.body;
  if (price === undefined || price === null) return res.status(400).json({ error: 'price required' });

  const db = readDB();
  const house = db.houses.find(h => h.id === id);
  if (!house) return res.status(404).json({ error: 'house not found' });

  house.prices = house.prices || {};

  if (Array.isArray(dates) && dates.length) {
    dates.forEach(dateStr => {
      const prevStatus = house.prices[dateStr]?.status || 'available';
      house.prices[dateStr] = { price, status: prevStatus, isHoliday: true };
    });
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const prevStatus = house.prices[dateStr]?.status || 'available';
      house.prices[dateStr] = { price, status: prevStatus, isHoliday: true };
    }
  } else {
    return res.status(400).json({ error: 'provide dates array or startDate/endDate' });
  }

  writeDB(db);
  res.json(house);
});

// Get single house
app.get('/api/houses/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const house = db.houses.find(h => h.id === id);
  if (!house) return res.status(404).json({ error: 'house not found' });
  res.json(house);
});

// Delete a house
app.delete('/api/houses/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const idx = db.houses.findIndex(h => h.id === id);
  if (idx === -1) return res.status(404).json({ error: 'house not found' });
  const deleted = db.houses.splice(idx, 1)[0];
  writeDB(db);
  res.json({ success: true, deleted });
});

// Token helper functions - store tokens in db.json instead of memory
function getTokenData(token) {
  const db = readDB();
  if (!db.tokens) return null;
  return db.tokens[token] || null;
}

function setToken(token, data) {
  const db = readDB();
  if (!db.tokens) db.tokens = {};
  db.tokens[token] = data;
  writeDB(db);
}

function deleteToken(token) {
  const db = readDB();
  if (db.tokens && db.tokens[token]) {
    delete db.tokens[token];
    writeDB(db);
  }
}

// Register endpoint
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  
  const db = readDB();
  
  // Check if username already exists
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'username already exists' });
  }
  
  // Default role is 'agent' if not specified
  const userRole = role === 'admin' ? 'admin' : 'agent';
  
  const user = { 
    id: db.nextUserId++, 
    username, 
    password, 
    role: userRole 
  };
  db.users.push(user);
  writeDB(db);
  
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  
  if (!user) return res.status(401).json({ error: 'invalid username or password' });
  
  // Generate simple token and store in db
  const token = 'token_' + Math.random().toString(36).substr(2, 20);
  setToken(token, { userId: user.id, role: user.role });
  
  res.json({ token, role: user.role, username: user.username });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  if (token) deleteToken(token);
  res.json({ success: true });
});

// Get current user info
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  
  const tokenData = getTokenData(token);
  if (!token || !tokenData) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  const db = readDB();
  const user = db.users.find(u => u.id === tokenData.userId);
  
  if (!user) return res.status(404).json({ error: 'user not found' });
  
  res.json({ id: user.id, username: user.username, role: user.role });
});

// Get all users (admin only)
app.get('/api/users', adminRequired, (req, res) => {
  const db = readDB();
  res.json(db.users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

// Update user role (admin only)
app.put('/api/users/:id/role', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;
  
  if (!role || !['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'valid role required (admin or agent)' });
  }
  
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  
  user.role = role;
  writeDB(db);
  
  res.json({ id: user.id, username: user.username, role: user.role });
});

// Delete user (admin only)
app.delete('/api/users/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'user not found' });
  
  // Prevent deleting last admin
  const user = db.users[idx];
  if (user.role === 'admin') {
    const adminCount = db.users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'cannot delete last admin' });
    }
  }
  
  db.users.splice(idx, 1);
  writeDB(db);
  
  res.json({ success: true });
});

// Auth middleware - requires any logged in user
function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  
  const tokenData = getTokenData(token);
  if (!token || !tokenData) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  req.tokenData = tokenData;
  next();
}

// Admin middleware - requires admin role
function adminRequired(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.split(' ')[1];
  
  const tokenData = getTokenData(token);
  if (!token || !tokenData) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  if (tokenData.role !== 'admin') {
    return res.status(403).json({ error: 'admin access required' });
  }
  
  req.tokenData = tokenData;
  next();
}

// Serve frontend static files from project root (so you can visit http://localhost:3000/)
const FRONTEND_PATH = path.join(__dirname, '..');
app.use(express.static(FRONTEND_PATH));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));