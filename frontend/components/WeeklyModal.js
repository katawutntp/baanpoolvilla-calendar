import React, { useState, useEffect } from 'react'
import * as api from '../lib/api'

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
  
  // เมื่อเปลี่ยนบ้าน ให้โหลดราคาของบ้านนั้น
  useEffect(() => {
    if (selectedHouseId) {
      setWeekdayPrices(getHousePrices(selectedHouseId))
    }
  }, [selectedHouseId])
  
  const [holidays, setHolidays] = useState([
    { key: 'holiday1', label: 'วันหยุดพิเศษ 1', price: '', dates: [], dateInput: '' },
    { key: 'holiday2', label: 'วันหยุดพิเศษ 2', price: '', dates: [], dateInput: '' },
    { key: 'holiday3', label: 'วันหยุดพิเศษ 3', price: '', dates: [], dateInput: '' }
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
      
      // เรียก weekday-prices เฉพาะเมื่อมีการกรอกราคาวันธรรมดา
      if (hasWeekdayPrice) {
        const weekdayPayload = { startDate, endDate, mapping }
        updated = await api.applyWeekdayPrices(selectedHouseId, weekdayPayload)
      }
      
      // เรียก holiday-prices สำหรับวันหยุดพิเศษ
      for (const h of holidays){
        console.log('Holiday check:', h.dates, h.price)
        if (Array.isArray(h.dates) && h.dates.length > 0 && h.price !== ''){
          const holidayPayload = { dates: h.dates, price: Number(h.price) }
          console.log('Sending holiday payload:', holidayPayload)
          try {
            const result = await api.applyHolidayPrices(selectedHouseId, holidayPayload)
            console.log('Holiday response:', result)
            if (result.error === 'unauthorized') {
              alert('Session หมดอายุ กรุณา Logout แล้ว Login ใหม่')
              return
            }
            updated = result
          } catch (holidayErr) {
            console.error('Holiday API error:', holidayErr)
          }
        }
      }
      
      if (updated) {
        onSaved && onSaved(updated)
      }
      onClose && onClose()
    } catch (err){
      console.error(err)
      alert('การบันทึกล้มเหลว')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg">
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
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs mb-1">ราคา</label>
                    <input type="number" value={h.price} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], price: e.target.value }; return copy })} placeholder="ราคา" className="w-full border p-2 rounded-md" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs mb-1">วันที่</label>
                    <div className="flex gap-2">
                      <input type="date" value={h.dateInput} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], dateInput: e.target.value }; return copy })} className="border p-2 rounded-md flex-1" />
                      <button onClick={() => setHolidays(prev => { 
                        const copy = prev.map(p => ({ ...p, dates: [...p.dates] })); 
                        const item = copy[hi]; 
                        if (!item.dateInput) return prev; 
                        if (!item.dates.includes(item.dateInput)) {
                          item.dates = [...item.dates, item.dateInput];
                        }
                        item.dateInput = ''; 
                        return copy;
                      })} className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">เพิ่ม</button>
                    </div>
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
