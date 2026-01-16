import { getAllHouses, createHouse } from '@/lib/firebaseApi';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const houses = await getAllHouses();
      res.status(200).json(houses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } 
  else if (req.method === 'POST') {
    // Add new house - requires auth
    try {
      await runMiddleware(req, res, authRequired);
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Unauthorized' });
    }

    const { name, capacity } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'House name is required' });
    }

    try {
      const newHouse = await createHouse(name, capacity || 4);
      res.status(201).json(newHouse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
