import { readDB, writeDB } from '@/lib/db';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = Number(id);
  const { dates, price } = req.body;
  
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'dates array required' });
  }
  if (price === undefined || price === null || price === '') {
    return res.status(400).json({ error: 'price required' });
  }

  const db = readDB();
  const house = db.houses.find(h => h.id === houseId);
  if (!house) return res.status(404).json({ error: 'house not found' });

  house.prices = house.prices || {};

  for (const dateStr of dates) {
    const existing = house.prices[dateStr] || {};
    house.prices[dateStr] = { ...existing, price: Number(price), isHoliday: true };
  }

  writeDB(db);
  res.json(house);
}
