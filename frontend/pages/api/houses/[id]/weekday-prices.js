import { applyWeekdayPrices } from '@/lib/firebaseApi';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = id;
  const { startDate, endDate, year, month, mapping } = req.body;
  
  if (!mapping || typeof mapping !== 'object') {
    return res.status(400).json({ error: 'mapping required' });
  }

  try {
    const updatedHouse = await applyWeekdayPrices(
      houseId, 
      startDate, 
      endDate, 
      year, 
      month, 
      mapping
    );
    res.json(updatedHouse);
  } catch (error) {
    if (error.message === 'House not found') {
      return res.status(404).json({ error: 'house not found' });
    }
    if (error.message === 'Provide startDate/endDate or year/month') {
      return res.status(400).json({ error: 'provide startDate/endDate or year/month' });
    }
    res.status(500).json({ error: error.message });
  }
}
