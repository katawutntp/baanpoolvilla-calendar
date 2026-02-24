import React, { useState, useEffect } from 'react'
import * as api from '../lib/api'
import * as firebaseApi from '../lib/firebaseApi'

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
    { key: 'holiday1', label: 'วันหยุดพิเศษ 1', price: '', dates: [], dateStartInput: '', dateEndInput: '' },
    { key: 'holiday2', label: 'วันหยุดพิเศษ 2', price: '', dates: [], dateStartInput: '', dateEndInput: '' },
    { key: 'holiday3', label: 'วันหยุดพิเศษ 3', price: '', dates: [], dateStartInput: '', dateEndInput: '' }
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
                <div className="flex flex-col gap-2 mb-2">
                  <div>
                    <label className="block text-xs mb-1">ราคา</label>
                    <input type="number" value={h.price} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], price: e.target.value }; return copy })} placeholder="ราคา" className="w-full border p-2 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">วันที่</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <input type="date" value={h.dateStartInput} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], dateStartInput: e.target.value }; return copy })} className="border p-2 rounded-md flex-1" />
                        <span className="text-gray-400 text-xs">ถึง</span>
                        <input type="date" value={h.dateEndInput} min={h.dateStartInput || undefined} onChange={e => setHolidays(prev => { const copy = [...prev]; copy[hi] = { ...copy[hi], dateEndInput: e.target.value }; return copy })} className="border p-2 rounded-md flex-1" />
                      </div>
                      <button onClick={() => setHolidays(prev => { 
                        const copy = prev.map(p => ({ ...p, dates: [...p.dates] })); 
                        const item = copy[hi]; 
                        if (!item.dateStartInput) return prev;
                        
                        // ถ้าไม่ได้ใส่วันสิ้นสุด ให้ใช้วันเริ่มต้นเป็นวันเดียว
                        const endDate = item.dateEndInput || item.dateStartInput;
                        const start = new Date(item.dateStartInput);
                        const end = new Date(endDate);
                        
                        if (start > end) return prev;
                        
                        // เพิ่มทุกวันในช่วง
                        const current = new Date(start);
                        while (current <= end) {
                          const iso = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
                          if (!item.dates.includes(iso)) {
                            item.dates.push(iso);
                          }
                          current.setDate(current.getDate() + 1);
                        }
                        
                        item.dateStartInput = ''; 
                        item.dateEndInput = ''; 
                        return copy;
                      })} className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm font-medium">เพิ่ม</button>
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
