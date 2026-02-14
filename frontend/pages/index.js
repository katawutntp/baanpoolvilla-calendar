import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import HouseCard from '../components/HouseCard'
import * as api from '../lib/api'

export default function Home() {
  const router = useRouter()
  const { house: houseQuery } = router.query
  
  const [houses, setHouses] = useState([])
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => { 
    load() 
  }, [])
  
  async function load() {
    setLoading(true)
    try {
      const data = await api.getHouses()
      if (Array.isArray(data)) {
        setHouses(data.map(h => ({ ...h, name: h.name || 'Unnamed', currentDate: new Date() })))
      } else {
        setHouses([])
      }
    } catch (err) {
      console.error('Failed to load houses:', err)
      setHouses([])
    } finally {
      setLoading(false)
    }
  }

  function changeMonthById(houseId, diff) {
    setHouses(prev => prev.map(h => {
      if (h.id !== houseId) return h;
      const cur = h.currentDate instanceof Date ? new Date(h.currentDate) : new Date(h.currentDate);
      cur.setMonth(cur.getMonth() + diff);
      return { ...h, currentDate: cur };
    }));
  }

  // ฟังก์ชันตรวจสอบว่าบ้านว่างในช่วงวันที่เลือก
  function isHouseAvailableInRange(house, startDate, endDate) {
    if (!startDate || !endDate) return true
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) return true
    
    const current = new Date(start)
    while (current <= end) {
      const iso = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`
      const priceObj = house.prices && house.prices[iso]
      if (priceObj && (priceObj.status === 'booked' || priceObj.status === 'closed')) {
        return false
      }
      current.setDate(current.getDate() + 1)
    }
    return true
  }

  const isDateFiltering = filterStartDate && filterEndDate;
  
  const zoneOrder = ['bangsaen', 'pattaya', 'sattahip', 'rayong'];
  const filteredHouses = houses
    .filter(h => {
      // กรองจาก query parameter house (ใช้ชื่อหรือ code)
      if (houseQuery) {
        const queryLower = houseQuery.toLowerCase().trim()
        const matchName = (h.name || '').toLowerCase().includes(queryLower)
        const matchCode = (h.code || '').toLowerCase() === queryLower
        if (!matchName && !matchCode) return false
      }
      const matchSearch = (h.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
                        (h.code || '').toLowerCase().includes((search || '').toLowerCase())
      const matchZone = zoneFilter === 'all' || (h.zone || '') === zoneFilter
      const matchDateRange = isHouseAvailableInRange(h, filterStartDate, filterEndDate)
      return matchSearch && matchZone && matchDateRange
    })
  // ใช้ลำดับจาก API (sortOrder) ที่ admin ตั้งไว้ ไม่ต้อง sort ใหม่

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      {/* Header สำหรับ Agent */}
      <header className="bg-[#f36734] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h1 className="text-xl font-bold text-white">ปฏิทิน BaanPoolVilla</h1>
              <p className="text-sm text-orange-100">ดูราคาและสถานะห้องพัก</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
            >
              <option value="all">เลือกพื้นที่</option>
              <option value="pattaya">พัทยา</option>
              <option value="sattahip">สัตหีบ</option>
              <option value="bangsaen">บางแสน</option>
              <option value="rayong">ระยอง</option>
            </select>
            <input
              type="text"
              placeholder="ค้นหาบ้าน..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={load}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="text-sm font-medium text-gray-700">ค้นหาบ้านว่าง:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">เช็คอิน</label>
            <input 
              type="date" 
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
            />
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">เช็คเอาท์</label>
            <input 
              type="date" 
              value={filterEndDate}
              min={filterStartDate || undefined}
              onChange={e => setFilterEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
            />
          </div>
          {isDateFiltering && (
            <>
              <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm font-medium">🏠 บ้านว่าง: {filteredHouses.length} หลัง</span>
              </div>
              <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="ml-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
              >
                ✕ ล้าง
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && filteredHouses.length === 0 && (
            <div className="text-center text-gray-500 col-span-full py-12">
              <p className="text-lg">ยังไม่มีบ้านในระบบ</p>
            </div>
          )}
          {filteredHouses.map((h) => (
            <HouseCard
              key={h.id}
              house={h}
              onChangeMonth={(diff) => changeMonthById(h.id, diff)}
              onDelete={null}
              onOpenWeekly={null}
              onOpenEdit={null}
              onUpdated={null}
              userRole="agent"
            />
          ))}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-label="กำลังโหลดปฏิทิน" />
            <p className="text-gray-700 font-medium">กำลังโหลดปฏิทิน...</p>
          </div>
        </div>
      )}
    </div>
  )
}
