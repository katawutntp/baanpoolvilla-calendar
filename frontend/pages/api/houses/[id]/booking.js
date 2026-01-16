import { updateHouseBooking } from '@/lib/firebaseApi';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, authRequired);

  const { id } = req.query;
  const houseId = id;
  const { date, price, status } = req.body;
  
  if (!date) return res.status(400).json({ error: 'date required' });

  try {
    const updatedHouse = await updateHouseBooking(houseId, date, price, status);
    res.json(updatedHouse);
  } catch (error) {
    if (error.message === 'House not found') {
      return res.status(404).json({ error: 'house not found' });
    }
    res.status(500).json({ error: error.message });
  }
}
