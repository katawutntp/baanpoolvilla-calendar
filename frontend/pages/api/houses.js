import { readDB } from '../../lib/db';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const db = readDB();
    res.status(200).json(db.houses);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
