import { readDB, writeDB } from '@/lib/db';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = Number(id);
  const { startDate, endDate, year, month, mapping } = req.body;
  
  if (!mapping || typeof mapping !== 'object') {
    return res.status(400).json({ error: 'mapping required' });
  }

  const db = readDB();
  const house = db.houses.find(h => h.id === houseId);
  if (!house) return res.status(404).json({ error: 'house not found' });

  let start = startDate ? new Date(startDate) : null;
  let end = endDate ? new Date(endDate) : null;
  
  if (!start || !end) {
    if (year && month) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else {
      return res.status(400).json({ error: 'provide startDate/endDate or year/month' });
    }
  }

  house.prices = house.prices || {};

  let cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    const price = mapping[String(dayOfWeek)];
    if (price !== undefined && price !== null && price !== '') {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const existing = house.prices[iso] || {};
      house.prices[iso] = { ...existing, price: Number(price) };
    }
    cur.setDate(cur.getDate() + 1);
  }

  writeDB(db);
  res.json(house);
}
