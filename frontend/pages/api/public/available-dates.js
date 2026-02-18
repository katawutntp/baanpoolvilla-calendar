/**
 * API Route: GET all available dates (public, no auth required)
 * 
 * GET /api/public/available-dates
 * 
 * Returns all houses with available dates information
 */

import { getAllHouses } from '@/lib/firebaseApi'

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

    // Transform to available dates format
    const result = houses.map(house => {
      const availableDates = Object.entries(house.prices || {})
        .filter(([_, priceData]) => {
          // Include if no status or status is 'available'
          return !priceData.status || priceData.status === 'available'
        })
        .map(([date]) => date)
        .sort()

      return {
        id: house.id,
        name: house.name,
        capacity: house.capacity || 0,
        zone: house.zone || '',
        description: house.description || '',
        availableDates: availableDates,
        totalAvailable: availableDates.length
      }
    })

    res.status(200).json(result)
  } catch (error) {
    console.error('Error fetching available dates:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch available dates' })
  }
}
