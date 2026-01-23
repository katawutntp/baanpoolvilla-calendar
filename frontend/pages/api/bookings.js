// API สำหรับจัดการข้อมูลการจอง (bookings) - อัพเดทตรงไปที่ house.prices
import { getAllBookings, addBookings, clearAllBookings, importBookingsToHousePrices } from '../../lib/firebaseApi'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // ดึงข้อมูลการจองทั้งหมดจาก Firebase
    try {
      const bookings = await getAllBookings()
      res.status(200).json(bookings || [])
    } catch (error) {
      console.error('Error getting bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' })
    }
  } else if (req.method === 'POST') {
    // นำเข้าข้อมูลการจองและอัพเดท house.prices โดยตรง
    try {
      const { bookings } = req.body
      
      if (!Array.isArray(bookings)) {
        return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })
      }

      // อัพเดท house.prices โดยตรง - นี่คือจุดสำคัญ!
      const result = await importBookingsToHousePrices(bookings)
      
      // เก็บ backup ใน bookings collection ด้วย (optional)
      await addBookings(bookings)
      
      res.status(200).json({ 
        success: true, 
        count: bookings.length,
        housesUpdated: result.updated,
        housesCreated: result.created,
        errors: result.errors
      })
    } catch (error) {
      console.error('Error saving bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message })
    }
  } else if (req.method === 'DELETE') {
    // ลบข้อมูลการจองทั้งหมดจาก Firebase
    try {
      await clearAllBookings()
      res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting bookings:', error)
      res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
