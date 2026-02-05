import React, { useState } from 'react'
import * as api from '../lib/api'

export default function AddHouseModal({ isOpen, onClose, onHouseAdded }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [zone, setZone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('กรุณากรอกชื่อบ้าน')
      return
    }
    const cap = parseInt(capacity)
    if (isNaN(cap) || cap < 1) {
      setError('จำนวนผู้เข้าพักต้องมากกว่า 0')
      return
    }

    setLoading(true)
    setError('')
    try {
      const newHouse = await api.addHouse(name, cap, zone, '', code)
      if (newHouse && newHouse.id) {
        onHouseAdded(newHouse)
        setName('')
        setCode('')
        setCapacity('4')
        setZone('')
        onClose()
      } else {
        setError('เพิ่มบ้านล้มเหลว: ' + (newHouse?.error || 'Unknown error'))
      }
    } catch (err) {
      setError('เพิ่มบ้านล้มเหลว: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">เพิ่มบ้านใหม่</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบ้าน *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="กรอกชื่อบ้าน"
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">รหัสบ้าน (ไม่แสดงในปฏิทิน)</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="เช่น CITY-743"
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าพัก (คน) *</label>
            <input
              type="number"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder="4"
              min="1"
              max="100"
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">โซนบ้าน</label>
            <select
              value={zone}
              onChange={e => setZone(e.target.value)}
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none"
            >
              <option value="">ไม่ระบุ</option>
              <option value="pattaya">พัทยา</option>
              <option value="sattahip">สัตหีบ</option>
              <option value="bangsaen">บางแสน</option>
              <option value="rayong">ระยอง</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              {loading ? 'กำลังเพิ่ม...' : 'เพิ่มบ้าน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
