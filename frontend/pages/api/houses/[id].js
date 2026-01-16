import { getHouseById, updateHouse, deleteHouse } from '@/lib/firebaseApi';
import { runMiddleware, authRequired } from '@/lib/middleware';

export default async function handler(req, res) {
  const { id } = req.query;
  const houseId = id;

  if (req.method === 'PUT') {
    try {
      const { date, price, status, name, capacity } = req.body;
      const updateData = {};

      // Update house name/capacity
      if (name !== undefined) {
        updateData.name = name;
      }
      if (capacity !== undefined) {
        updateData.capacity = capacity;
      }

      // Update booking (price/status for a date)
      if (date) {
        const house = await getHouseById(houseId);
        const prices = house.prices || {};
        prices[date] = { 
          price: price !== undefined ? price : null, 
          status: status || 'available' 
        };
        updateData.prices = prices;
      }

      const updatedHouse = await updateHouse(houseId, updateData);
      res.json(updatedHouse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      await runMiddleware(req, res, authRequired);
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Unauthorized' });
    }

    try {
      await deleteHouse(houseId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
