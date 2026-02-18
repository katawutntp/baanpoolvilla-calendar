/**
 * API Route: GET all available dates (public, no auth required)
 * 
 * GET /api/public/available-dates
 * 
 * Returns: [{ apiCode, availableDates: ["DD/MM/YYYY", ...] }]
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

  try {
    const houses = await getAllHouses()

    // ส่งแค่ apiCode + วันว่าง (DD/MM/YYYY)
    const result = houses
      .filter(house => house.apiCode) // เฉพาะบ้านที่มี apiCode
      .map(house => {
        const availableDates = Object.entries(house.prices || {})
          .filter(([_, priceData]) => {
            return !priceData.status || priceData.status === 'available'
          })
          .map(([date]) => date)
          .sort()
          .map(formatDate)

        return {
          apiCode: house.apiCode,
          availableDates
        }
      })

    res.status(200).json(result)
  } catch (error) {
    console.error('Error fetching available dates:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch available dates' })
  }
}
