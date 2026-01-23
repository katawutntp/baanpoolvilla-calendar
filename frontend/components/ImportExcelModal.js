import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { createHouseIfNotExists, getAllHouses } from '../lib/firebaseApi'

export default function ImportExcelModal({ onClose, onImportSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
      previewFile(selectedFile)
    }
  }

  const previewFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        // แสดง preview 5 แถวแรก
        setPreview(jsonData.slice(0, 6))
      } catch (err) {
        setError('ไม่สามารถอ่านไฟล์ได้: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const parseExcelData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          
          const bookings = []
          
          jsonData.forEach(row => {
            // อ่านข้อมูลจากแต่ละแถว - รองรับหลายชื่อคอลัมน์
            const houseName = row['เว็บไซต์'] || row['บ้าน'] || row['ชื่อบ้าน'] || row['houseName'] || ''
            const houseCode = row['ชื่อบ้าน'] || row['รหัส'] || row['โค้ด'] || row['houseCode'] || ''
            const codeId = row['รหัส'] || row['code'] || ''
            const monthYear = row['เดือน'] || row['เดือน/ปี'] || row['month'] || ''
            const days = row['วันที่'] || row['วัน'] || row['day'] || ''
            const status = row['สถานะ'] || row['status'] || 'ติดจอง'
            
            console.log('Parsing row:', { houseName, houseCode, codeId, monthYear, days, status })
            
            if (!houseName || !monthYear) return
            
            // แยกวันที่ (อาจเป็น "13", "14, 23, 31", etc.)
            const dayNumbers = String(days).match(/\d+/g)
            if (!dayNumbers || dayNumbers.length === 0) return
            
            // แปลงเดือนไทยเป็นตัวเลข
            const monthMap = {
              'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
              'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
              'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
            }
            
            let month = null
            let year = null
            
            // หาเดือนและปี
            for (const [thaiMonth, monthIndex] of Object.entries(monthMap)) {
              if (String(monthYear).includes(thaiMonth)) {
                month = monthIndex
                break
              }
            }
            
            const yearMatch = String(monthYear).match(/\d{4}/)
            if (yearMatch) {
              year = parseInt(yearMatch[0]) - 543 // แปลง พ.ศ. เป็น ค.ศ.
            }
            
            if (month === null || !year) {
              console.log('Skipping row - invalid month/year:', monthYear)
              return
            }
            
            // สร้าง booking สำหรับแต่ละวัน
            dayNumbers.forEach(day => {
              const dayNum = parseInt(day)
              if (dayNum >= 1 && dayNum <= 31) {
                bookings.push({
                  houseName: houseName.trim(),
                  houseCode: (houseCode || codeId || '').trim(),
                  date: new Date(year, month, dayNum).toISOString().split('T')[0],
                  status: status.trim(),
                  month: month + 1,
                  year: year
                })
              }
            })
          })
          
          console.log('Total bookings parsed:', bookings.length)
          resolve(bookings)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleImport = async () => {
    if (!file) {
      setError('กรุณาเลือกไฟล์')
      return
    }

    setLoading(true)
    setError('')

    try {
      const bookings = await parseExcelData(file)
      
      if (bookings.length === 0) {
        setError('ไม่พบข้อมูลการจองในไฟล์')
        setLoading(false)
        return
      }

      // หา unique house names จาก bookings
      const uniqueHouses = [...new Set(bookings.map(b => b.houseName))].filter(Boolean)
      
      // ดึงรายการบ้านที่มีอยู่แล้วจาก Firebase โดยตรง
      let existingHouses = []
      try {
        existingHouses = await getAllHouses()
      } catch (err) {
        console.log('Could not get existing houses:', err)
      }
      
      const existingHouseNames = Array.isArray(existingHouses) 
        ? existingHouses.map(h => (h.name || '').toLowerCase()) 
        : []
      
      // สร้างบ้านใหม่สำหรับบ้านที่ยังไม่มี - ใช้ Firebase โดยตรง
      let housesCreated = 0
      for (const houseName of uniqueHouses) {
        if (!existingHouseNames.includes(houseName.toLowerCase())) {
          try {
            const result = await createHouseIfNotExists(houseName, 10)
            if (!result.exists) {
              housesCreated++
              console.log('Created house via Firebase:', houseName)
            }
          } catch (err) {
            console.error('Failed to create house:', houseName, err)
          }
        }
      }

      // อัพเดท house.prices โดยตรงจาก client-side (แทนที่จะทำผ่าน API)
      const { importBookingsToHousePrices } = await import('../lib/firebaseApi')
      const result = await importBookingsToHousePrices(bookings)
      
      let message = `นำเข้าข้อมูลสำเร็จ ${bookings.length} รายการ`
      if (housesCreated > 0) {
        message += `\nสร้างบ้านใหม่ ${housesCreated} หลัง`
      }
      if (result.updated > 0) {
        message += `\nอัพเดทบ้าน ${result.updated} หลัง`
      }
      if (result.errors && result.errors.length > 0) {
        console.error('Import errors:', result.errors)
      }
      
      alert(message)
      onImportSuccess && onImportSuccess()
      onClose()
    } catch (err) {
      console.error('Import error:', err)
      setError(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูลจาก Excel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* คำแนะนำ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">รูปแบบไฟล์ Excel ที่รองรับ:</h3>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• คอลัมน์ "บ้าน" หรือ "บ้านไหว" = ชื่อบ้าน (เช่น Pool Villa City)</li>
              <li>• คอลัมน์ "รหัส" = รหัสบ้าน (เช่น CITY-743)</li>
              <li>• คอลัมน์ "เดือน" = เดือนและปี (เช่น มกราคม 2569)</li>
              <li>• คอลัมน์ "วันที่" = วันที่จอง (เช่น 13, 14, 23)</li>
              <li>• คอลัมน์ "สถานะ" = สถานะการจอง (เช่น ดีลล้วง)</li>
            </ul>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              เลือกไฟล์ Excel (.xlsx, .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">ตัวอย่างข้อมูล:</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-gray-50 font-semibold' : ''}>
                        {Array.isArray(row) && row.map((cell, j) => (
                          <td key={j} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูล'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
