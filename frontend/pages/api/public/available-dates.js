/**
 * API Route: GET all available dates (public, no auth required)
 * 
 * GET /api/public/available-dates
 * 
 * Returns: [{ apiCode, availableDates: ["DD/MM/YYYY", ...] }]
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

  try {
    const houses = await getAllHouses()

    // ช่วงวันที่: วันนี้ -> +3 เดือน
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

    // สร้างวันทั้งหมดในช่วง
    const allDates = generateAllDates(today, threeMonthsLater)

    const result = houses
      .filter(house => house.apiCode)
      .map(house => {
        const prices = house.prices || {}

        // กรองวันที่ถูก booked/closed/pending ออก -> ที่เหลือคือวันว่าง
        const availableDates = allDates
          .filter(date => {
            const priceData = prices[date]
            // ไม่มีข้อมูล = ว่าง, หรือ status เป็น available = ว่าง
            if (!priceData) return true
            if (!priceData.status || priceData.status === 'available') return true
            return false
          })
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
