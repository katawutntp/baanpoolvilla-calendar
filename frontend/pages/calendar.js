import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { getHouses } from '@/lib/api'

export default function CalendarPage() {
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHouses()
  }, [])

  const loadHouses = async () => {
    try {
      setLoading(true)
      const data = await getHouses()
      setHouses(data || [])
    } catch (error) {
      console.error('Error loading houses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">ปฏิทินบ้านพักผ่อน</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">ยังไม่มีบ้านในระบบ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {houses.map(house => (
              <div
                key={house.id}
                onClick={() => setSelectedHouse(house)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{house.name}</h3>
                <p className="text-gray-600 mb-4">ความจุ: {house.capacity} คน</p>
                <div className="text-sm text-indigo-600 font-semibold">ดูปฏิทิน →</div>
              </div>
            ))}
          </div>
        )}

        {selectedHouse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-auto p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedHouse.name}</h2>
              
              {selectedHouse.prices && Object.keys(selectedHouse.prices).length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 mb-3">ราคาตามวัน:</h3>
                  {Object.entries(selectedHouse.prices)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, data]) => (
                      <div key={date} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{date}</span>
                        <span className="text-indigo-600 font-bold">
                          {data.price ? `${data.price.toLocaleString()} บาท` : 'ติดต่อเจ้าของ'}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">ยังไม่มีข้อมูลราคา</p>
              )}

              <button
                onClick={() => setSelectedHouse(null)}
                className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
