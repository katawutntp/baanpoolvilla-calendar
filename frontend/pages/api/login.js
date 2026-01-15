import { readDB, writeDB, setToken } from '../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  setToken(token, { userId: user.id, role: user.role });

  res.json({ token, role: user.role, username: user.username });
}
