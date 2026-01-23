import React, { useState } from 'react'
import * as api from '../lib/api'
import { IconHouse, IconTrash, IconChevronLeft, IconChevronRight } from './icons'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function formatMonthYear(d) {
  return d.toLocaleString('th-TH', { month: 'long', year: 'numeric' })
}

function getMonthMatrix(d) {
  const start = startOfMonth(d)
  const firstWeekday = start.getDay()
  let day = new Date(start)
  day.setDate(day.getDate() - firstWeekday)
  const matrix = []
  for (let w = 0; w < 6; w++) {
    const row = []
    for (let i = 0; i < 7; i++) {
      row.push(new Date(day))
      day.setDate(day.getDate() + 1)
    }
    matrix.push(row)
  }
  return matrix
}

export default function HouseCard({ house, index, onChangeMonth, onDelete, onOpenWeekly, onOpenEdit, onUpdated, userRole }) {
  const cur = house.currentDate ? new Date(house.currentDate) : new Date()
  const matrix = getMonthMatrix(cur)
  const today = new Date()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [modalPrice, setModalPrice] = useState('')
  const [modalStatus, setModalStatus] = useState('available')
  
  // User view modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewDate, setViewDate] = useState(null)
  const [viewPrice, setViewPrice] = useState(null)
  const [viewStatus, setViewStatus] = useState('')
  

  function dayBgClass(dayIndex, inMonth) {
    if (!inMonth) return 'bg-gray-50 text-gray-400'
    // Sun=0 and Fri=5 green, Mon-Thu 1-4 light yellow, Sat=6 pink
    if (dayIndex === 0 || dayIndex === 5) return 'bg-green-50'
    if (dayIndex >= 1 && dayIndex <= 4) return 'bg-yellow-50'
    if (dayIndex === 6) return 'bg-pink-50'
    return 'bg-white'
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header with month and house name */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg">
              <IconHouse />
            </span>
            <div>
              <div className="text-xs opacity-90">บ้าน</div>
              <h2 className="font-bold text-lg">{house.name}</h2>
              <div className="text-xs opacity-90">👥 {house.capacity || 4} คน</div>
            </div>
          </div>
          <div className="flex gap-2">
            {userRole === 'admin' && onOpenEdit && (
              <button onClick={() => onOpenEdit(index)} className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-sm font-medium">
                 แก้ไข
              </button>
            )}
            {userRole === 'admin' && onOpenWeekly && (
              <button onClick={() => onOpenWeekly(index)} className="px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-sm font-medium">
                ตั้งค่าราคา
              </button>
            )}
            {userRole === 'admin' && onDelete && (
              <button onClick={() => onDelete()} className="p-2 hover:bg-red-500 rounded-lg transition">
                <IconTrash className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month and navigation */}
      <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
        <button onClick={() => onChangeMonth && onChangeMonth(-1)} className="p-2 hover:bg-gray-200 rounded-lg transition">
          <IconChevronLeft />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800">{formatMonthYear(cur)}</h3>
        </div>
        <button onClick={() => onChangeMonth && onChangeMonth(1)} className="p-2 hover:bg-gray-200 rounded-lg transition">
          <IconChevronRight />
        </button>
      </div>

      {/* Calendar body */}
      <div className="p-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['อา','จ','อ','พ','พฤ','ศ','ส'].map((d, idx) => (
            <div key={d} className="text-center font-bold text-xs py-1 rounded-lg text-gray-600 bg-gray-100">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid - Fixed size cells */}
        <div className="grid grid-cols-7 gap-1">
          {matrix.map((week, wi) => (
            week.map((day, di) => {
              const inMonth = day.getMonth() === cur.getMonth()
              // ใช้ local date แทน toISOString() เพื่อหลีกเลี่ยง timezone bug
              const iso = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`
              const priceObj = house.prices && house.prices[iso]
              
              // ถ้าไม่มีราคา ให้เป็นสีเทา ถ้ามีราคา ให้ใช้สีตามวัน
              let weekdayBg = !priceObj ? 'bg-gray-200 text-gray-600' : dayBgClass(day.getDay(), inMonth)
                // เพิ่มสีพื้นหลังสำหรับสถานะ closed/booked
                if (priceObj && priceObj.status === 'closed') weekdayBg = 'bg-gray-600 text-white';
                if (priceObj && priceObj.status === 'booked') weekdayBg = 'bg-red-600 text-white';
                
                // เพิ่มกรอบสีแดงสำหรับวันหยุดพิเศษ
                let holidayBorder = '';
                if (priceObj && priceObj.isHoliday) holidayBorder = 'border-red-500 border-2';
                
                // Fixed size cell with overflow hidden
                const cls = `h-12 w-full flex flex-col items-center justify-center text-xs border rounded-lg transition overflow-hidden ${weekdayBg} ${holidayBorder} ${isSameDay(day, today) ? 'ring-2 ring-indigo-400 font-bold' : ''} ${inMonth ? 'cursor-pointer hover:shadow-md' : ''}`
              
              const handleClick = (currentIso) => () => {
                if (!inMonth) return
                const p = (house.prices && house.prices[currentIso]) || { price: '', status: 'available' }
                
                if (userRole === 'admin') {
                  // Admin can edit
                  setSelectedDate(currentIso)
                  setModalPrice(p.price === null ? '' : String(p.price || ''))
                  setModalStatus(p.status || 'available')
                  setModalOpen(true)
                } else {
                  // User can only view
                  setViewDate(currentIso)
                  setViewPrice(p.price)
                  setViewStatus(p.status || 'available')
                  setViewModalOpen(true)
                }
            }
            
            // ถ้าไม่ใช่วันของเดือนนี้ให้แสดงเซลล์ว่าง
            if (!inMonth) {
              return (
                <div key={`${wi}-${di}`} className="h-12 w-full border rounded-lg bg-white"></div>
              )
            }
            
            return (
              <div key={`${wi}-${di}`} className={cls} onClick={handleClick(iso)}>
                  <div className="font-medium">{day.getDate()}</div>
                  <div className={`text-xs truncate max-w-full px-0.5 ${priceObj?.status === 'closed' ? 'text-gray-200' : priceObj?.status === 'booked' ? 'text-red-100' : 'text-gray-500'}`}>
                    {priceObj && priceObj.price ? `฿${Number(priceObj.price).toLocaleString()}` : ''}
                  </div>
                </div>
            )
          })
        ))}
        </div>
      </div>

      {/* Modal for editing price */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">แก้ไขราคา</h2>
            
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-gray-600">วันที่</p>
              <p className="text-xl font-bold text-indigo-700">{selectedDate}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">ราคา</label>
              <input 
                type="number" 
                value={modalPrice} 
                onChange={e => setModalPrice(e.target.value)} 
                className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                placeholder="0"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">สถานะ</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={()=>setModalStatus('available')} 
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${modalStatus==='available' ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-300'}`}
                >
                  ว่าง
                </button>
                <button 
                  type="button" 
                  onClick={()=>setModalStatus('closed')} 
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${modalStatus==='closed' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-gray-300 text-gray-600 hover:border-red-300'}`}
                >
                  ปิด
                </button>
                <button 
                  type="button" 
                  onClick={()=>setModalStatus('booked')} 
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition ${modalStatus==='booked' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-600 hover:border-green-300'}`}
                >
                  ติดจอง
                </button>
              </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition" 
                  onClick={() => setModalOpen(false)}>
                  ยกเลิก
                </button>
                <button 
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md" 
                  onClick={async () => {
                    try {
                      const payload = { date: selectedDate, price: modalPrice === '' ? null : Number(modalPrice), status: modalStatus }
                      const updated = await api.updateBooking(house.id, payload)
                      setModalOpen(false)
                      if (onUpdated) onUpdated(index, updated)
                    } catch (err) {
                      console.error('update booking failed', err)
                      alert('บันทึกล้มเหลว')
                    }
                  }}>
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

      {/* View-only modal for users */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">รายละเอียด</h2>
            
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-gray-600">🏠 บ้าน</p>
              <p className="text-xl font-bold text-indigo-700">{house.name}</p>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">📅 วันที่</p>
              <p className="text-lg font-bold text-gray-800">{viewDate}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">💰 ราคา</p>
                <p className="text-2xl font-bold text-green-700">
                  {viewPrice ? `฿${viewPrice.toLocaleString()}` : '-'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">👥 จำนวนผู้เข้าพัก</p>
                <p className="text-2xl font-bold text-blue-700">{house.capacity || 4} คน</p>
              </div>
            </div>

            <div className={`mb-6 p-4 rounded-lg border ${
              viewStatus === 'available' ? 'bg-blue-50 border-blue-200' : 
              viewStatus === 'closed' ? 'bg-red-50 border-red-200' : 
              'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm text-gray-600">📌 สถานะ</p>
              <p className={`text-xl font-bold ${
                viewStatus === 'available' ? 'text-blue-700' : 
                viewStatus === 'closed' ? 'text-red-700' : 
                'text-green-700'
              }`}>
                {viewStatus === 'available' ? 'ว่าง' : viewStatus === 'closed' ? 'ปิด' : 'ติดจอง'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button 
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md" 
                onClick={() => setViewModalOpen(false)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}
