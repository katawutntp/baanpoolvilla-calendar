import { readDB, writeDB } from '@/lib/db';
import { runMiddleware, adminRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, adminRequired);
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { id } = req.query;
  const userId = Number(id);
  const { role } = req.body;

  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.role = role;
  writeDB(db);

  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
}
