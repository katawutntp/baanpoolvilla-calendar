import React, { useState, useEffect } from 'react'

export default function CalendarView({ house, bookings = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }
  
  const isDateBooked = (day) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return bookings.some(booking => {
      if (booking.houseId !== house.id && booking.houseName !== house.name) return false
      const bookingDate = new Date(booking.date)
      const checkDate = new Date(dateStr)
      return bookingDate.toDateString() === checkDate.toDateString()
    })
  }
  
  const getBookingInfo = (day) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return bookings.find(booking => {
      if (booking.houseId !== house.id && booking.houseName !== house.name) return false
      const bookingDate = new Date(booking.date)
      const checkDate = new Date(dateStr)
      return bookingDate.toDateString() === checkDate.toDateString()
    })
  }
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    
    // Header
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center font-semibold text-gray-600 text-sm py-2">
            {day}
          </div>
        ))}
      </div>
    )
    
    // Days
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isBooked = isDateBooked(day)
      const bookingInfo = getBookingInfo(day)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      
      cells.push(
        <div
          key={day}
          className={`aspect-square border rounded-lg p-1 text-center relative group cursor-pointer transition-all
            ${isBooked ? 'bg-red-100 border-red-300 hover:bg-red-200' : 'bg-white hover:bg-gray-50'}
            ${isToday ? 'ring-2 ring-blue-400' : ''}
          `}
        >
          <div className={`text-sm font-medium ${isBooked ? 'text-red-700' : 'text-gray-700'}`}>
            {day}
          </div>
          {isBooked && (
            <>
              <div className="text-xs text-red-600 mt-1">จอง</div>
              {bookingInfo && (
                <div className="hidden group-hover:block absolute z-10 bg-gray-800 text-white text-xs rounded p-2 -top-2 left-full ml-2 whitespace-nowrap shadow-lg">
                  <div>รหัส: {bookingInfo.houseCode || '-'}</div>
                  <div>สถานะ: {bookingInfo.status || 'จอง'}</div>
                </div>
              )}
            </>
          )}
        </div>
      )
    }
    
    days.push(
      <div key="cells" className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    )
    
    return days
  }
  
  const changeMonth = (delta) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
  }
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {house.name || 'บ้าน'}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-lg font-semibold text-gray-700 min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div>
        {renderCalendar()}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-600">วันที่จอง</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span className="text-gray-600">วันว่าง</span>
        </div>
      </div>
    </div>
  )
}
