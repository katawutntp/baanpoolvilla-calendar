import { getAllUsers } from '@/lib/firebaseApi';
import { runMiddleware, adminRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, adminRequired);

  try {
    const users = await getAllUsers();
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
