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

    // คำนวณช่วงวันที่: วันนี้ -> +3 เดือน
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const endStr = `${threeMonthsLater.getFullYear()}-${String(threeMonthsLater.getMonth() + 1).padStart(2, '0')}-${String(threeMonthsLater.getDate()).padStart(2, '0')}`

    // ส่งแค่ apiCode + วันว่าง (DD/MM/YYYY) จากวันนี้ไป 3 เดือน
    const result = houses
      .filter(house => house.apiCode) // เฉพาะบ้านที่มี apiCode
      .map(house => {
        const availableDates = Object.entries(house.prices || {})
          .filter(([date, priceData]) => {
            const isAvailable = !priceData.status || priceData.status === 'available'
            const inRange = date >= todayStr && date <= endStr
            return isAvailable && inRange
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
