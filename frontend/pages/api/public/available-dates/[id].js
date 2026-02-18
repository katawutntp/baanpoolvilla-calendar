/**
 * API Route: GET available dates for specific house by apiCode (public, no auth required)
 * 
 * GET /api/public/available-dates/[id]
 * 
 * id = apiCode ของบ้าน
 * Returns: { apiCode, availableDates: ["DD/MM/YYYY", ...] }
 * สร้างวันทั้งหมดจากวันนี้ไป 3 เดือน แล้วตัดวันที่ booked/closed ออก
 */

import { getAllHouses } from '@/lib/firebaseApi'

// แปลง YYYY-MM-DD -> DD/MM/YYYY
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// สร้าง YYYY-MM-DD string
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// สร้างวันทั้งหมดจาก start ถึง end
function generateAllDates(start, end) {
  const dates = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(toDateStr(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
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
    const houses = await getAllHouses()
    const house = houses.find(h => h.apiCode === id)

    if (!house) {
      return res.status(404).json({ error: 'House not found with this apiCode' })
    }

    // ช่วงวันที่: วันนี้ -> +3 เดือน
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

    // สร้างวันทั้งหมดในช่วง
    const allDates = generateAllDates(today, threeMonthsLater)
    const prices = house.prices || {}

    // กรองวันที่ถูก booked/closed/pending ออก -> ที่เหลือคือวันว่าง
    const availableDates = allDates
      .filter(date => {
        const priceData = prices[date]
        if (!priceData) return true
        if (!priceData.status || priceData.status === 'available') return true
        return false
      })
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
