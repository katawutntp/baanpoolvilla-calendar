import React, { useState } from 'react'

export default function PasswordPromptModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'รหัสผ่านไม่ถูกต้อง')
      }

      const data = await response.json()
      localStorage.setItem('adminToken', data.token)
      onSuccess && onSuccess()
      onClose && onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80">
        <h2 className="font-bold text-lg mb-4">ยืนยันรหัสผ่าน</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="กรุณาใส่รหัสผ่าน"
            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={loading}
            autoFocus
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
