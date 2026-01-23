// API สำหรับจัดการข้อมูลการจอง (bookings)
import { getBookings, saveBookings } from '../../lib/db'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // ดึงข้อมูลการจองทั้งหมด
    try {
      const bookings = await getBookings()
      res.status(200).json(bookings || [])
    } catch (error) {
      console.error('Error getting bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' })
    }
  } else if (req.method === 'POST') {
    // เพิ่มข้อมูลการจองใหม่
    try {
      const { bookings } = req.body
      
      if (!Array.isArray(bookings)) {
        return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })
      }

      // อ่านข้อมูลเก่า
      const existingBookings = await getBookings() || []
      
      // เพิ่มข้อมูลใหม่
      const newBookings = bookings.map(b => ({
        id: Date.now() + Math.random(),
        ...b,
        createdAt: new Date().toISOString()
      }))
      
      // รวมข้อมูลเก่าและใหม่
      const allBookings = [...existingBookings, ...newBookings]
      
      // บันทึก
      await saveBookings(allBookings)
      
      res.status(200).json({ 
        success: true, 
        count: newBookings.length,
        bookings: allBookings 
      })
    } catch (error) {
      console.error('Error saving bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' })
    }
  } else if (req.method === 'DELETE') {
    // ลบข้อมูลการจองทั้งหมด
    try {
      await saveBookings([])
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
