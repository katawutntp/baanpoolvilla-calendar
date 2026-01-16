import { getUserById, updateUserRole } from '@/lib/firebaseApi';
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
  const userId = id;
  const { role } = req.body;

  if (!['admin', 'agent'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await updateUserRole(userId, role);
    res.json({ success: true, user: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
