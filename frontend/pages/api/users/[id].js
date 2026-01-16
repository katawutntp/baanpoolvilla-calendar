import { getUserById, deleteUser, getAllUsers } from '@/lib/firebaseApi';
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
  const userId = id;

  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const allUsers = await getAllUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    await deleteUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
