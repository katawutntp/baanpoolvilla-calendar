import { readDB, writeDB } from '@/lib/db';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  const { id } = req.query;
  const houseId = Number(id);

  if (req.method === 'PUT') {
    const db = readDB();
    const house = db.houses.find(h => h.id === houseId);
    if (!house) return res.status(404).json({ error: 'house not found' });

    const { date, price, status, name, capacity } = req.body;

    // Update house name/capacity
    if (name !== undefined) {
      house.name = name;
    }
    if (capacity !== undefined) {
      house.capacity = capacity;
    }

    // Update booking (price/status for a date)
    if (date) {
      house.prices[date] = { price: price !== undefined ? price : null, status: status || 'available' };
    }

    writeDB(db);
    res.json(house);
  } 
  else if (req.method === 'DELETE') {
    try {
      await runMiddleware(req, res, authRequired);
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Unauthorized' });
    }

    const db = readDB();
    db.houses = db.houses.filter(h => h.id !== houseId);
    writeDB(db);
    res.json({ success: true });
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
