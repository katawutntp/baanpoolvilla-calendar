import { createUser } from '@/lib/firebaseApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  try {
    const newUser = await createUser(username, password, role || 'agent');
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    if (error.message === 'Username already exists') {
      return res.status(400).json({ error: 'username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}
