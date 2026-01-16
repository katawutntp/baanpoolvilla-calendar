import { getUserByUsername, createToken } from '@/lib/firebaseApi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  try {
    const user = await getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const tokenString = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await createToken(tokenString, user.id, user.role);

    res.json({ token: tokenString, role: user.role, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
