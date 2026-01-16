import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      // ถ้า login แล้ว ไปที่ admin
      router.push('/admin')
    } else {
      // ถ้าไม่ login ไปที่ calendar
      router.push('/calendar')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
}
