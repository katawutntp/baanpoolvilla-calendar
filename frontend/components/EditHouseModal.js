import React, { useState, useEffect } from 'react'
import * as api from '../lib/api'
import * as firebaseApi from '../lib/firebaseApi'
import { IconCopy } from './icons'

export default function EditHouseModal({ isOpen, onClose, house, onHouseUpdated }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [zone, setZone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (house) {
      setName(house.name || '')
      setCode(house.code || '')
      setCapacity(String(house.capacity || 4))
      setZone(house.zone || '')
      setDescription(house.description || '')
      setError('')
      setCopySuccess(false)
    }
  }, [house, isOpen])

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
      // บันทึกลง Firebase
      const updated = await firebaseApi.updateHouse(house.id, { name, code, capacity: cap, zone, description })
      
      // อัพเดท local API ด้วย (เพื่อ backward compatibility)
      await api.updateHouse(house.id, { name, code, capacity: cap, zone, description })
      
      if (updated) {
        onHouseUpdated({ ...house, ...updated })
        onClose()
      } else {
        setError('แก้ไขบ้านล้มเหลว')
      }
    } catch (err) {
      console.error('Error updating house:', err)
      setError('แก้ไขบ้านล้มเหลว: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  const handleCopyDescription = async () => {
    try {
      await navigator.clipboard.writeText(description || '')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen || !house) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">แก้ไขบ้าน</h2>
        
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
            </select>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">รายละเอียดบ้าน</label>
              <button
                type="button"
                onClick={handleCopyDescription}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                title="คัดลอกรายละเอียด"
              >
                <IconCopy className="w-4 h-4" />
                {copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="กรอกรายละเอียดบ้าน เช่น สิ่งอำนวยความสะดวก กฎการเข้าพัก ฯลฯ"
              rows="4"
              className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
            />
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
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
