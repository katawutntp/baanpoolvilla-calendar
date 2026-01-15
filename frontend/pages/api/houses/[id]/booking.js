import { readDB, writeDB } from '../../../lib/db';
import { runMiddleware, authRequired } from '../../../lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = Number(id);
  const { date, price, status } = req.body;
  
  if (!date) return res.status(400).json({ error: 'date required' });

  const db = readDB();
  const house = db.houses.find(h => h.id === houseId);
  if (!house) return res.status(404).json({ error: 'house not found' });

  house.prices[date] = { 
    price: price !== undefined ? price : null, 
    status: status || 'available' 
  };
  writeDB(db);
  res.json(house);
}
