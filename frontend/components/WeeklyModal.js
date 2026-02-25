import React, { useState, useEffect } from 'react'
import * as api from '../lib/api'
import * as firebaseApi from '../lib/firebaseApi'

// Mini calendar component สำหรับเลือกวันที่แบบช่วง
function MiniRangeCalendar({ onAddDates }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
  
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function toIso(day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function handleDayClick(day) {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      // เริ่มเลือกใหม่
      setRangeStart(day)
      setRangeEnd(null)
    } else {
      // เลือกวันสิ้นสุด
      if (day < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(day)
      } else {
        setRangeEnd(day)
      }
    }
  }

  function isInRange(day) {
    if (!rangeStart) return false
    if (!rangeEnd) return day === rangeStart
    return day >= rangeStart && day <= rangeEnd
  }

  function handleAdd() {
    if (!rangeStart) return
    const end = rangeEnd || rangeStart
    const dates = []
    for (let d = rangeStart; d <= end; d++) {
      dates.push(toIso(d))
    }
    onAddDates(dates)
    setRangeStart(null)
    setRangeEnd(null)
  }

  function handleClear() {
    setRangeStart(null)
    setRangeEnd(null)
  }

  return (
    <div className="border rounded-lg p-2 bg-white">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500">&lt;</button>
        <span className="text-sm font-medium">{thaiMonths[month]} {year + 543}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded text-gray-500">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-gray-500 mb-1">
        {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="h-7" />
          const inRange = isInRange(day)
          const isStart = day === rangeStart
          const isEnd = day === rangeEnd
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`h-7 text-xs rounded transition
                ${inRange ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 text-gray-700'}
                ${isStart || isEnd ? 'ring-2 ring-indigo-600 font-bold' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 mt-2">
        <button type="button" onClick={handleClear} className="flex-1 px-2 py-1.5 text-xs border rounded-md hover:bg-gray-50">ล้าง</button>
        <button type="button" onClick={handleAdd} disabled={!rangeStart} className="flex-1 px-2 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40">เพิ่ม {rangeStart ? `(${(rangeEnd || rangeStart) - rangeStart + 1} วัน)` : ''}</button>
      </div>
    </div>
  )
}

export default function WeeklyModal({ houses = [], defaultHouseId, onClose, onSaved }){
  const [selectedHouseId, setSelectedHouseId] = useState(defaultHouseId || houses?.[0]?.id || null)
  
  // โหลดราคาจาก house.weekdayPrices ของบ้านที่เลือก
  const getHousePrices = (houseId) => {
    const house = houses.find(h => h.id === houseId)
    if (house && house.weekdayPrices) {
      return {
        '0': house.weekdayPrices['0'] !== undefined ? String(house.weekdayPrices['0']) : '',
        '1': house.weekdayPrices['1'] !== undefined ? String(house.weekdayPrices['1']) : '',
        '2': house.weekdayPrices['2'] !== undefined ? String(house.weekdayPrices['2']) : '',
        '3': house.weekdayPrices['3'] !== undefined ? String(house.weekdayPrices['3']) : '',
        '4': house.weekdayPrices['4'] !== undefined ? String(house.weekdayPrices['4']) : '',
        '5': house.weekdayPrices['5'] !== undefined ? String(house.weekdayPrices['5']) : '',
        '6': house.weekdayPrices['6'] !== undefined ? String(house.weekdayPrices['6']) : ''
      }
    }
    return { '0':'', '1':'', '2':'', '3':'', '4':'', '5':'', '6':'' }
  }
  
  const [weekdayPrices, setWeekdayPrices] = useState(() => getHousePrices(defaultHouseId || houses?.[0]?.id))
  
  // Sync selectedHouseId when defaultHouseId or houses change
  useEffect(() => {
    if (defaultHouseId) {
      setSelectedHouseId(defaultHouseId)
    } else if (!selectedHouseId && houses && houses.length > 0) {
      setSelectedHouseId(houses[0].id)
    }
  }, [defaultHouseId, houses])

  // เมื่อเปลี่ยนบ้านหรือเมื่อข้อมูล houses ถูกอัพเดท ให้โหลดราคาของบ้านนั้น
  useEffect(() => {
    if (selectedHouseId) {
      setWeekdayPrices(getHousePrices(selectedHouseId))
    }
  }, [selectedHouseId, houses])
  
  const [holidays, setHolidays] = useState([
    { key: 'holiday1', label: 'วันหยุดพิเศษ 1', price: '', dates: [] },
    { key: 'holiday2', label: 'วันหยุดพิเศษ 2', price: '', dates: [] },
    { key: 'holiday3', label: 'วันหยุดพิเศษ 3', price: '', dates: [] }
  ])

  async function handleSave(){
    if (!selectedHouseId) return alert('เลือกบ้านก่อน')
    try {
      const today = new Date()
      const startDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      const endDate = `${today.getFullYear()}-12-31`
      const mapping = {}
      let hasWeekdayPrice = false
      for (let i=0;i<7;i++){
        const v = weekdayPrices[String(i)]
        if (v !== '') {
          mapping[String(i)] = Number(v)
          hasWeekdayPrice = true
        }
      }
      
      let updated = null
      
      // เรียก weekday-prices — ใช้ Firebase โดยตรง + fallback API
      if (hasWeekdayPrice) {
        try {
          updated = await firebaseApi.applyWeekdayPrices(selectedHouseId, startDate, endDate, null, null, mapping)
        } catch (fbErr) {
          console.error('Firebase weekday-prices failed, trying API:', fbErr)
          const weekdayPayload = { startDate, endDate, mapping }
          const apiResult = await api.applyWeekdayPrices(selectedHouseId, weekdayPayload)
          if (apiResult && !apiResult.error) {
            updated = apiResult
          } else {
            console.error('API weekday-prices also failed:', apiResult)
            alert('บันทึกราคารายสัปดาห์ล้มเหลว: ' + (apiResult?.error || 'Unknown error'))
            return
          }
        }
      }
      
      // เรียก holiday-prices สำหรับวันหยุดพิเศษ
      for (const h of holidays){
        console.log('Holiday check:', h.dates, h.price)
        if (Array.isArray(h.dates) && h.dates.length > 0 && h.price !== ''){
          const holidayPayload = { dates: h.dates, price: Number(h.price) }
          console.log('Sending holiday payload:', holidayPayload)
          try {
            const result = await firebaseApi.applyHolidayPrices(selectedHouseId, holidayPayload.dates, holidayPayload.price)
            console.log('Holiday response:', result)
            updated = result
          } catch (holidayErr) {
            console.error('Firebase holiday failed, trying API:', holidayErr)
            try {
              const apiResult = await api.applyHolidayPrices(selectedHouseId, holidayPayload)
              if (apiResult && !apiResult.error) {
                updated = apiResult
              } else if (apiResult?.error === 'unauthorized') {
                alert('Session หมดอายุ กรุณา Logout แล้ว Login ใหม่')
                return
              }
            } catch (apiErr) {
              console.error('Holiday API also failed:', apiErr)
            }
          }
        }
      }
      
      if (updated) {
        onSaved && onSaved(updated)
      }
      onClose && onClose()
    } catch (err){
      console.error(err)
      alert('การบันทึกล้มเหลว: ' + (err.message || err))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg my-auto max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="font-bold text-lg mb-4 text-center">ตั้งราคาตามวันในสัปดาห์ (map ถึง 31 ธ.ค.)</div>
        <div className="mb-4">
          <label className="block text-sm mb-1 font-medium">เลือกบ้าน</label>
          <select value={selectedHouseId || ''} onChange={e => setSelectedHouseId(Number(e.target.value))} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-indigo-200">
            {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-center font-semibold">
            {['อา','จ','อ','พ'].map((label, idx) => (
              <div key={idx}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[0,1,2,3].map(idx => (
              <input
                key={idx}
                type="number"
                value={weekdayPrices[String(idx)]}
                onChange={e => setWeekdayPrices(prev => ({ ...prev, [String(idx)]: e.target.value }))}
                className="border p-2 rounded-md text-center text-base w-24 focus:ring-2 focus:ring-indigo-200"
                placeholder="-"
                style={{ minWidth: '70px', maxWidth: '120px' }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-center font-semibold">
            {['พฤ','ศ','ส'].map((label, idx) => (
              <div key={idx}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[4,5,6].map(idx => (
              <input
                key={idx}
                type="number"
                value={weekdayPrices[String(idx)]}
                onChange={e => setWeekdayPrices(prev => ({ ...prev, [String(idx)]: e.target.value }))}
                className="border p-2 rounded-md text-center text-base w-24 focus:ring-2 focus:ring-indigo-200"
                placeholder="-"
                style={{ minWidth: '70px', maxWidth: '120px' }}
              />
            ))}
          </div>
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="font-semibold mb-2">วันหยุดพิเศษ (เพิ่มวันที่และราคา)</div>
          <div className="grid grid-cols-1 gap-3">
            {holidays.map((h, hi) => (
              <div key={h.key} className="bg-gray-50 rounded-lg p-3">
                <div className="flex flex-col gap-2 mb-2">
                  <div>
                    <label className="block text-xs mb-1 font-medium">ราคา</label>
                    <input type="number" value={h.price} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], price: e.target.value }; return copy })} placeholder="ราคา" className="w-full border p-2 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 font-medium">เลือกวันที่ (กดเลือกช่วงแล้วกดเพิ่ม)</label>
                    <MiniRangeCalendar onAddDates={(dates) => setHolidays(prev => {
                      const copy = prev.map(p => ({ ...p, dates: [...p.dates] }));
                      const item = copy[hi];
                      dates.forEach(iso => {
                        if (!item.dates.includes(iso)) item.dates.push(iso);
                      });
                      item.dates.sort();
                      return copy;
                    })} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {h.dates.map((d, di) => (
                    <div key={di} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-2">
                      <span>{d}</span>
                      <button onClick={() => setHolidays(prev => { 
                        const copy = prev.map(p => ({ ...p, dates: [...p.dates] })); 
                        copy[hi].dates = copy[hi].dates.filter((_,i) => i !== di); 
                        return copy;
                      })} className="text-red-500">x</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 border rounded-md" onClick={onClose}>ยกเลิก</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md" onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </div>
  )
}
