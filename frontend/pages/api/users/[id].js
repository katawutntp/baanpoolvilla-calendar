import { readDB, writeDB, deleteToken } from '@/lib/db';
import { runMiddleware, adminRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req, res, adminRequired);
  } catch (err) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { id } = req.query;
  const userId = Number(id);

  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't allow deleting the last admin
  const user = db.users[userIndex];
  if (user.role === 'admin') {
    const adminCount = db.users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
  }

  // Remove user's tokens
  Object.keys(db.tokens).forEach(token => {
    if (db.tokens[token].userId === userId) {
      delete db.tokens[token];
    }
  });

  db.users.splice(userIndex, 1);
  writeDB(db);

  res.json({ success: true });
}
