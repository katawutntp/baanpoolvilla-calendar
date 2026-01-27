import { getAllHouses, createHouse, updateHousesOrder } from '@/lib/firebaseApi';
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

    const { name, capacity, zone } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'House name is required' });
    }

    try {
      const newHouse = await createHouse(name, capacity || 4, zone || '');
      res.status(201).json(newHouse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  else if (req.method === 'PUT') {
    // Update houses order - requires admin auth
    try {
      await runMiddleware(req, res, authRequired);
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Unauthorized' });
    }

    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }

    try {
      await updateHousesOrder(orderedIds);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
