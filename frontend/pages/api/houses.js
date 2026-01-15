import { readDB, writeDB } from '@/lib/db';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const db = readDB();
    res.status(200).json(db.houses);
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

    const db = readDB();
    const newHouse = {
      id: db.nextHouseId++,
      name,
      capacity: capacity || 4,
      prices: {}
    };
    db.houses.push(newHouse);
    writeDB(db);

    res.status(201).json(newHouse);
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
