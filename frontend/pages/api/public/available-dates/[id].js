/**
 * API Route: GET available dates for specific house (public, no auth required)
 * 
 * GET /api/public/available-dates/[id]
 * 
 * Returns specific house with available dates and pricing information
 */

import { getHouseById } from '@/lib/firebaseApi'

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
    return res.status(400).json({ error: 'House ID is required' })
  }

  try {
    const house = await getHouseById(id)

    if (!house) {
      return res.status(404).json({ error: 'House not found' })
    }

    // Filter available dates
    const availableDates = Object.entries(house.prices || {})
      .filter(([_, priceData]) => {
        // Include if no status or status is 'available'
        return !priceData.status || priceData.status === 'available'
      })
      .map(([date]) => date)
      .sort()

    const result = {
      id: house.id,
      name: house.name,
      capacity: house.capacity || 0,
      zone: house.zone || '',
      description: house.description || '',
      availableDates: availableDates,
      totalAvailable: availableDates.length,
      allPrices: house.prices || {} // Include all pricing info
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('Error fetching house available dates:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch house available dates' })
  }
}
