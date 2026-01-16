import { deleteToken } from '@/lib/firebaseApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      await deleteToken(token);
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  }

  res.json({ success: true });
}
