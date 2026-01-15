import { readDB, writeDB, setToken, deleteToken } from '../../../lib/db';
import { runMiddleware, authRequired } from '../../../lib/middleware';

export default async function handler(req, res) {
  const { id } = req.query;
  const houseId = Number(id);

  if (req.method === 'PUT') {
    // Update booking (price/status for a date)
    const { date, price, status } = req.body;
    if (!date) return res.status(400).json({ error: 'date required' });

    const db = readDB();
    const house = db.houses.find(h => h.id === houseId);
    if (!house) return res.status(404).json({ error: 'house not found' });

    house.prices[date] = { price: price !== undefined ? price : null, status: status || 'available' };
    writeDB(db);
    res.json(house);
  } 
  else if (req.method === 'DELETE') {
    const db = readDB();
    db.houses = db.houses.filter(h => h.id !== houseId);
    writeDB(db);
    res.json({ success: true });
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
