/**
 * Example Component: AvailableDatesWidget
 * 
 * ตัวอย่าง React component ที่ใช้ Public API
 * สามารถนำไปใช้กับเว็บอื่นเพื่อแสดงวันที่ว่าง
 * 
 * Usage:
 * import AvailableDatesWidget from '@/components/AvailableDatesWidget'
 * 
 * <AvailableDatesWidget apiBaseUrl="http://localhost:3000" />
 */

import React, { useState, useEffect } from 'react'
import {
  getAllAvailableDates,
  getHouseAvailableDates,
  filterDatesByRange,
  isDateAvailable,
  getPriceForDate
} from '@/lib/publicApi'

export default function AvailableDatesWidget({ apiBaseUrl = '/api/public' }) {
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [houseDetails, setHouseDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  // Fetch all houses on component mount
  useEffect(() => {
    fetchAllHouses()
  }, [])

  // Fetch house details when selected house changes
  useEffect(() => {
    if (selectedHouse) {
      fetchHouseDetails(selectedHouse)
    }
  }, [selectedHouse])

  const fetchAllHouses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/available-dates`)
      if (!response.ok) throw new Error('Failed to fetch houses')
      const data = await response.json()
      setHouses(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching houses:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHouseDetails = async (houseId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/available-dates/${houseId}`)
      if (!response.ok) throw new Error('Failed to fetch house details')
      const data = await response.json()
      setHouseDetails(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching house details:', err)
    }
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getFilteredDates = () => {
    if (!houseDetails) return []
    return filterDatesByRange(houseDetails.availableDates, dateRange.start, dateRange.end)
  }

  if (loading) {
    return <div className="p-4 text-center">Loading available dates...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">🏠 Available Dates Checker</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* House Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Select a House</h2>
        <select
          value={selectedHouse || ''}
          onChange={(e) => setSelectedHouse(Number(e.target.value) || null)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">-- Choose a house --</option>
          {houses.map(house => (
            <option key={house.id} value={house.id}>
              {house.name} ({house.totalAvailable} dates available)
            </option>
          ))}
        </select>
      </div>

      {/* House Details */}
      {houseDetails && (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <h3 className="text-xl font-semibold mb-2">{houseDetails.name}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Capacity:</strong> {houseDetails.capacity} guests</div>
              <div><strong>Zone:</strong> {houseDetails.zone}</div>
              <div><strong>Available Dates:</strong> {houseDetails.totalAvailable}</div>
              <div><strong>Description:</strong> {houseDetails.description}</div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-3">Filter by Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Available Dates Display */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Available Dates ({getFilteredDates().length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {getFilteredDates().length > 0 ? (
                getFilteredDates().map(date => {
                  const price = getPriceForDate(date, houseDetails)
                  const dateObj = new Date(date + 'T00:00:00')
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNum = dateObj.getDate()

                  return (
                    <div
                      key={date}
                      className="p-3 bg-green-100 border border-green-300 rounded text-center cursor-pointer hover:bg-green-200 transition"
                      title={date}
                    >
                      <div className="text-xs font-semibold text-gray-600">{dayName}</div>
                      <div className="text-lg font-bold text-green-700">{dayNum}</div>
                      {price && (
                        <div className="text-xs text-green-600">฿{price.toLocaleString()}</div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No available dates in this range
                </div>
              )}
            </div>
          </div>

          {/* All Dates Table */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">All Pricing Information</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Day</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-center p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(houseDetails.allPrices || {})
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .slice(0, 20)
                    .map(([date, priceData]) => {
                      const dateObj = new Date(date + 'T00:00:00')
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                      const isAvailable = isDateAvailable(date, houseDetails)

                      return (
                        <tr key={date} className={isAvailable ? 'bg-green-50' : 'bg-red-50'}>
                          <td className="p-2 font-mono">{date}</td>
                          <td className="p-2">{dayName}</td>
                          <td className="p-2 text-right">
                            {priceData.price ? `฿${priceData.price.toLocaleString()}` : '--'}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded ${
                                isAvailable
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800'
                              }`}
                            >
                              {isAvailable ? '✓ Available' : '✕ Booked'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Summary */}
      {!selectedHouse && houses.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <p className="text-sm text-gray-600">
            📊 Total Houses: <strong>{houses.length}</strong> | 
            Total Available Slots: <strong>{houses.reduce((sum, h) => sum + h.totalAvailable, 0)}</strong>
          </p>
        </div>
      )}

      {/* API Demo Code */}
      <div className="mt-8 p-4 bg-gray-900 text-white rounded font-mono text-xs">
        <p className="mb-2 text-gray-300">💻 API Endpoint Examples:</p>
        <p>GET /api/public/available-dates</p>
        <p>GET /api/public/available-dates/{'{houseId}'}</p>
      </div>
    </div>
  )
}
