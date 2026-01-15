import { readDB } from '../../lib/db';
import { runMiddleware, adminRequired } from '../../lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, adminRequired);

  const db = readDB();
  const users = db.users.map(u => ({
    id: u.id,
    username: u.username,
    role: u.role
  }));

  res.json(users);
}
