import React, { useState } from 'react'

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'ล็อกอินล้มเหลว')
      }

      const data = await response.json()
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('userRole', data.role)
      localStorage.setItem('username', data.username)
      onLoginSuccess && onLoginSuccess(data.role)
    } catch (err) {
      setError(err.message || 'ล็อกอินล้มเหลว')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-blue-200">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
          <p className="text-gray-500 mt-1">ปฏิทิน BaanPoolVilla</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="กรุณาใส่ชื่อผู้ใช้"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="กรุณาใส่รหัสผ่าน"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'กำลังล็อกอิน...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            ยังไม่มีบัญชี?{' '}
            <button 
              onClick={onGoToRegister} 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
