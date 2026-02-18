/**
 * API Route: GET available dates for specific house by apiCode (public, no auth required)
 * 
 * GET /api/public/available-dates/[id]
 * 
 * id = apiCode ของบ้าน
 * Returns: { apiCode, availableDates: ["DD/MM/YYYY", ...] }
 */

import { getAllHouses } from '@/lib/firebaseApi'

// แปลง YYYY-MM-DD -> DD/MM/YYYY
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'apiCode is required' })
  }

  try {
    // ค้นหาด้วย apiCode
    const houses = await getAllHouses()
    const house = houses.find(h => h.apiCode === id)

    if (!house) {
      return res.status(404).json({ error: 'House not found with this apiCode' })
    }

    // ส่งแค่ apiCode + วันว่าง (DD/MM/YYYY)
    const availableDates = Object.entries(house.prices || {})
      .filter(([_, priceData]) => {
        return !priceData.status || priceData.status === 'available'
      })
      .map(([date]) => date)
      .sort()
      .map(formatDate)

    res.status(200).json({
      apiCode: house.apiCode,
      availableDates
    })
  } catch (error) {
    console.error('Error fetching house available dates:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch house available dates' })
  }
}
