import { applyHolidayPrices } from '@/lib/firebaseApi';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = id;
  const { dates, price } = req.body;
  
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({ error: 'dates array required' });
  }
  if (price === undefined || price === null || price === '') {
    return res.status(400).json({ error: 'price required' });
  }

  try {
    const updatedHouse = await applyHolidayPrices(houseId, dates, price);
    res.json(updatedHouse);
  } catch (error) {
    if (error.message === 'House not found') {
      return res.status(404).json({ error: 'house not found' });
    }
    res.status(500).json({ error: error.message });
  }
}
