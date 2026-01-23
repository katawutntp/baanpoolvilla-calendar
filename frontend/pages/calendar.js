import { useEffect, useState } from 'react'
import Head from 'next/head'
import * as api from '../lib/api'
import CalendarView from '../components/CalendarView'
import ImportExcelModal from '../components/ImportExcelModal'

export default function CalendarPage() {
  const [houses, setHouses] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [housesData, bookingsData] = await Promise.all([
        api.getHouses(),
        fetch('/api/bookings').then(r => r.json())
      ])
      
      setHouses(Array.isArray(housesData) ? housesData : [])
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])
    } catch (err) {
      console.error('Failed to load data:', err)
      setHouses([])
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  async function handleClearBookings() {
    if (!confirm('คุณต้องการลบข้อมูลการจองทั้งหมดใช่หรือไม่?')) return

    try {
      await fetch('/api/bookings', { method: 'DELETE' })
      setBookings([])
      alert('ลบข้อมูลสำเร็จ')
    } catch (err) {
      alert('ไม่สามารถลบข้อมูลได้')
    }
  }

  return (
    <>
      <Head>
        <title>ปฏิทินการจองบ้าน</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📅</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">ปฏิทินการจองบ้าน</h1>
                  <p className="text-sm text-gray-500">
                    {bookings.length} การจอง | {houses.length} บ้าน
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  นำเข้า Excel
                </button>
                <button
                  onClick={handleClearBookings}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ล้างข้อมูล
                </button>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  รีเฟรช
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : houses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="mt-4 text-gray-600">ยังไม่มีข้อมูลบ้าน</p>
              <p className="text-sm text-gray-400 mt-2">กรุณาเพิ่มบ้านในระบบก่อนนำเข้าข้อมูลการจอง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {houses.map((house) => (
                <CalendarView
                  key={house.id}
                  house={house}
                  bookings={bookings}
                />
              ))}
            </div>
          )}
        </main>

        {/* Import Modal */}
        {showImportModal && (
          <ImportExcelModal
            onClose={() => setShowImportModal(false)}
            onImportSuccess={loadData}
          />
        )}
      </div>
    </>
  )
}
