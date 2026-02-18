/**
 * Public API Client for Calendar Available Dates
 * 
 * ใช้สำหรับดึงข้อมูลวันที่ว่าง ไม่ต้อง authentication
 * 
 * Note: สำหรับเว็บอื่นที่ต้องการ cross-domain access
 * ให้ใช้ URL เต็ม เช่น https://yourdomain.com/api/public/available-dates
 * 
 * Usage:
 * import { getAllAvailableDates, getHouseAvailableDates } from '@/lib/publicApi'
 * 
 * const dates = await getAllAvailableDates()
 * const houseData = await getHouseAvailableDates(5)
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_BASE: Override base URL (optional)
 *   Format: http://domain.com/api/public (without trailing slash)
 */

// ใช้ relative path /api สำหรับ production (Vercel)
// หรือ environment variable สำหรับการ override
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/public'

/**
 * Get available dates for all houses
 * @param {string} baseUrl - Optional custom base URL (default: /api/public)
 * @returns {Promise<Array>} Array of houses with available dates
 * 
 * @example
 * const houses = await getAllAvailableDates()
 * houses.forEach(house => {
 *   console.log(`${house.name}: ${house.availableDates.length} dates available`)
 * })
 */
export async function getAllAvailableDates(baseUrl = PUBLIC_API_BASE) {
  try {
    const res = await fetch(`${baseUrl}/available-dates`)
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    console.error('Error fetching all available dates:', error)
    return []
  }
}

/**
 * Get available dates for a specific house
 * @param {number} houseId - The house ID
 * @param {string} baseUrl - Optional custom base URL (default: /api/public)
 * @returns {Promise<Object>} House object with available dates and pricing info
 * 
 * @example
 * const house = await getHouseAvailableDates(5)
 * console.log(`${house.name} has ${house.totalAvailable} available dates`)
 * console.log('Available dates:', house.availableDates)
 * console.log('Prices:', house.allPrices)
 */
export async function getHouseAvailableDates(houseId, baseUrl = PUBLIC_API_BASE) {
  try {
    const res = await fetch(`${baseUrl}/available-dates/${houseId}`)
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('House not found')
      }
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  } catch (error) {
    console.error(`Error fetching available dates for house ${houseId}:`, error)
    return null
  }
}

/**
 * Get available dates for multiple houses
 * @param {Array<number>} houseIds - Array of house IDs
 * @param {string} baseUrl - Optional custom base URL
 * @returns {Promise<Array>} Array of house objects with available dates
 * 
 * @example
 * const houses = await getMultipleHousesAvailableDates([1, 2, 5])
 */
export async function getMultipleHousesAvailableDates(houseIds, baseUrl = PUBLIC_API_BASE) {
  try {
    const promises = houseIds.map(id => getHouseAvailableDates(id, baseUrl))
    const results = await Promise.all(promises)
    return results.filter(h => h !== null)
  } catch (error) {
    console.error('Error fetching multiple houses:', error)
    return []
  }
}

/**
 * Filter available dates by date range
 * @param {Array<string>} dates - Array of dates in YYYY-MM-DD format
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array<string>} Filtered dates within range
 * 
 * @example
 * const dates = ['2026-02-18', '2026-02-20', '2026-03-05']
 * const filtered = filterDatesByRange(dates, '2026-02-19', '2026-02-28')
 * console.log(filtered) // ['2026-02-20']
 */
export function filterDatesByRange(dates, startDate, endDate) {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return dates.filter(dateStr => {
    const date = new Date(dateStr).getTime()
    return date >= start && date <= end
  })
}

/**
 * Check if a specific date is available
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @param {Object} houseData - House data object from getHouseAvailableDates
 * @returns {boolean} True if date is available
 * 
 * @example
 * const house = await getHouseAvailableDates(5)
 * const isAvailable = isDateAvailable('2026-02-20', house)
 */
export function isDateAvailable(date, houseData) {
  if (!houseData || !Array.isArray(houseData.availableDates)) {
    return false
  }
  return houseData.availableDates.includes(date)
}

/**
 * Get price for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {Object} houseData - House data object from getHouseAvailableDates
 * @returns {number|null} Price or null if not found
 * 
 * @example
 * const house = await getHouseAvailableDates(5)
 * const price = getPriceForDate('2026-02-20', house)
 */
export function getPriceForDate(date, houseData) {
  if (!houseData || !houseData.allPrices || !houseData.allPrices[date]) {
    return null
  }
  return houseData.allPrices[date].price
}

/**
 * Format available dates for display
 * @param {Array<string>} dates - Array of dates (YYYY-MM-DD)
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {Array<string>} Formatted dates
 * 
 * @example
 * const dates = ['2026-02-18', '2026-02-20']
 * const formatted = formatDatesForDisplay(dates, 'th-TH')
 * console.log(formatted) // ['18 กุมภาพันธ์ 2569', '20 กุมภาพันธ์ 2569']
 */
export function formatDatesForDisplay(dates, locale = 'en-US') {
  return dates.map(dateStr => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(locale, { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })
}

/**
 * Get house by ID from all available houses
 * @param {number} houseId - House ID to find
 * @returns {Promise<Object|null>} House object or null if not found
 * 
 * @example
 * const house = await findHouseById(5)
 */
export async function findHouseById(houseId) {
  const houses = await getAllAvailableDates()
  return houses.find(h => h.id === houseId) || null
}

/**
 * Get houses by zone
 * @param {string} zone - Zone name to filter
 * @returns {Promise<Array>} Array of houses in that zone
 * 
 * @example
 * const northZoneHouses = await getHousesByZone('North Zone')
 */
export async function getHousesByZone(zone) {
  const houses = await getAllAvailableDates()
  return houses.filter(h => h.zone === zone)
}

/**
 * Get most available houses (sorted by number of available dates)
 * @param {number} limit - Number of results (default: 5)
 * @returns {Promise<Array>} Top available houses
 * 
 * @example
 * const topHouses = await getTopAvailableHouses(3)
 */
export async function getTopAvailableHouses(limit = 5) {
  const houses = await getAllAvailableDates()
  return houses
    .sort((a, b) => b.totalAvailable - a.totalAvailable)
    .slice(0, limit)
}

/**
 * Search houses by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching houses
 * 
 * @example
 * const results = await searchHouses('mountain')
 */
export async function searchHouses(query) {
  const houses = await getAllAvailableDates()
  const q = query.toLowerCase()
  return houses.filter(h => 
    h.name.toLowerCase().includes(q) || 
    h.description.toLowerCase().includes(q)
  )
}

export default {
  getAllAvailableDates,
  getHouseAvailableDates,
  getMultipleHousesAvailableDates,
  filterDatesByRange,
  isDateAvailable,
  getPriceForDate,
  formatDatesForDisplay,
  findHouseById,
  getHousesByZone,
  getTopAvailableHouses,
  searchHouses
}
