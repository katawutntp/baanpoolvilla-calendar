import React, { useState, useEffect } from 'react'

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('http://localhost:3000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(userId, newRole) {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`http://localhost:3000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  async function deleteUser(userId) {
    if (!confirm('ต้องการลบผู้ใช้นี้ใช่หรือไม่?')) return
    
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete user')
      }
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">👥 จัดการผู้ใช้</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {loading && <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>}
        
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

        {!loading && !error && (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">ID</th>
                <th className="text-left py-2 px-3">ชื่อผู้ใช้</th>
                <th className="text-left py-2 px-3">Role</th>
                <th className="text-left py-2 px-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-3">{user.id}</td>
                  <td className="py-3 px-3 font-medium">{user.username}</td>
                  <td className="py-3 px-3">
                    <select 
                      value={user.role} 
                      onChange={e => changeRole(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-lg text-sm border ${
                        user.role === 'admin' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">📌 สิทธิ์การใช้งาน</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium text-red-600">Admin:</span> ดูปฏิทิน, เพิ่ม/ลบบ้าน, แก้ไขราคา, จัดการผู้ใช้</p>
            <p><span className="font-medium text-blue-600">Agent:</span> ดูปฏิทินได้อย่างเดียว</p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}
