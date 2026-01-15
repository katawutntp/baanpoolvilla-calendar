import { readDB, writeDB } from '../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const db = readDB();
  
  // Check if username exists
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'username already exists' });
  }

  const newUser = {
    id: db.nextUserId++,
    username,
    password,
    role: role || 'agent'
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
}
