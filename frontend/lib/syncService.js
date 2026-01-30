import { db } from './firebase';
import { createHouseIfNotExists } from './firebaseApi';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const HOUSES_COLLECTION = 'houses';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/katawutntp/ICS/master/booking_result.json';

/**
 * ดึงข้อมูลการจองจาก GitHub (ที่ scraper อัปเดต)
 */
export async function fetchBookingsFromGitHub() {
  try {
    const response = await fetch(GITHUB_RAW_URL + '?t=' + Date.now()); // cache bust
    if (!response.ok) {
      throw new Error('Failed to fetch from GitHub');
    }
    const data = await response.json();
    console.log(`Fetched ${data.length} bookings from GitHub`);
    return data;
  } catch (error) {
    console.error('Error fetching from GitHub:', error);
    return [];
  }
}

/**
 * แปลงข้อมูลจาก scraper format เป็น booking format
 * Input: { "ชื่อบ้าน", "รหัส", "เดือน", "วันที่", "สถานะ" }
 * Output: { houseName, houseCode, date, status }
 */
function parseScraperBooking(row) {
  const houseName = row['ชื่อบ้าน'] || row['บ้าน'] || '';
  const houseCode = row['รหัส'] || row['code'] || '';
  const monthYear = row['เดือน'] || '';
  const day = row['วันที่'];
  const rawStatus = row['สถานะ'] || '';
  
  // แปลงเดือนไทยเป็นตัวเลข
  const monthMap = {
    'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
    'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
    'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
  };
  
  let month = null;
  let year = null;
  
  // หาเดือน
  for (const [thaiMonth, monthIndex] of Object.entries(monthMap)) {
    if (String(monthYear).includes(thaiMonth)) {
      month = monthIndex;
      break;
    }
  }
  
  // หาปี (พ.ศ. -> ค.ศ.)
  const yearMatch = String(monthYear).match(/\d{4}/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]) - 543;
  }
  
  if (month === null || !year || !day) {
    return null;
  }
  
  // สร้าง date string
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // แปลงสถานะ
  let status = 'booked';
  if (rawStatus.includes('รอโอน') || rawStatus.includes('pending')) {
    status = 'pending';
  } else if (rawStatus.includes('ติดจอง') || rawStatus.includes('booked')) {
    status = 'booked';
  }
  
  return {
    houseName: houseName.trim(),
    houseCode: houseCode.trim(),
    date: dateStr,
    status
  };
}

/**
 * Sync ข้อมูลจาก GitHub กับ Firestore
 * - ข้อมูลใหม่จาก scraper จะอัปเดตเฉพาะวันที่ที่ไม่ได้ถูก admin แก้ไขเอง (manual)
 * - วันที่มี flag `manual: true` จะไม่ถูก overwrite
 */
export async function syncBookingsFromGitHub() {
  try {
    // 1. ดึงข้อมูลจาก GitHub
    const scraperData = await fetchBookingsFromGitHub();
    if (!scraperData || scraperData.length === 0) {
      console.log('No data from GitHub');
      return { success: false, message: 'No data from GitHub' };
    }
    
    // 2. แปลงข้อมูล
    const parsedBookings = scraperData
      .map(parseScraperBooking)
      .filter(b => b !== null);
    
    console.log(`Parsed ${parsedBookings.length} valid bookings`);
    
    // 3. Group by house code (fallback to name)
    const bookingsByHouse = {};
    for (const booking of parsedBookings) {
      const key = booking.houseCode ? `code:${booking.houseCode}` : `name:${booking.houseName}`;
      if (!bookingsByHouse[key]) {
        bookingsByHouse[key] = [];
      }
      bookingsByHouse[key].push(booking);
    }
    
    // 4. อัปเดตแต่ละบ้านใน Firestore
    const housesRef = collection(db, HOUSES_COLLECTION);
    let updatedCount = 0;
    let skippedManual = 0;
    let createdCount = 0;
    
    for (const [houseKey, bookings] of Object.entries(bookingsByHouse)) {
      try {
        const sample = bookings[0] || {};
        const bookingCode = (sample.houseCode || '').trim();
        const bookingName = (sample.houseName || '').trim();
        let snapshot = null;
        if (bookingCode) {
          const byCode = query(housesRef, where('code', '==', bookingCode));
          snapshot = await getDocs(byCode);
        }
        if (!snapshot || snapshot.docs.length === 0) {
          const byName = query(housesRef, where('name', '==', bookingName));
          snapshot = await getDocs(byName);
        }
        
        let houseDoc = null;
        let houseRef = null;
        let houseData = null;

        if (snapshot.docs.length === 0) {
          const createName = bookingName || bookingCode || 'Unnamed';
          try {
            const created = await createHouseIfNotExists(createName, 10, '', bookingCode);
            houseRef = doc(db, HOUSES_COLLECTION, created.id);
            houseData = created;
            createdCount++;
            console.log(`Created house: ${createName} (${bookingCode || '-'})`);
          } catch (createErr) {
            console.error(`Failed to create house: ${houseKey}`, createErr);
            continue;
          }
        } else {
          houseDoc = snapshot.docs[0];
          houseRef = doc(db, HOUSES_COLLECTION, houseDoc.id);
          houseData = houseDoc.data();
        }

        if (bookingCode && !houseData.code) {
          await updateDoc(houseRef, { code: bookingCode, updatedAt: serverTimestamp() });
        }
        const existingPrices = houseData.prices || {};
        
        // 5. Merge bookings - ไม่ overwrite วันที่มี manual: true
        const updatedPrices = { ...existingPrices };
        
        for (const booking of bookings) {
          const dateKey = booking.date;
          const existing = updatedPrices[dateKey] || {};
          
          // ถ้าวันนี้ถูก admin ตั้งเอง (manual) ให้ข้ามไป
          if (existing.manual === true) {
            skippedManual++;
            continue;
          }
          
          // อัปเดตสถานะจาก scraper
          updatedPrices[dateKey] = {
            ...existing,
            status: booking.status,
            source: 'scraper', // ระบุว่ามาจาก scraper
            lastSyncAt: new Date().toISOString()
          };
        }
        
        // 6. บันทึกกลับ Firestore
        await updateDoc(houseRef, {
          prices: updatedPrices,
          lastSyncAt: serverTimestamp()
        });
        
        updatedCount++;
        console.log(`Updated house: ${houseKey} with ${bookings.length} bookings`);
        
      } catch (houseError) {
        console.error(`Error updating house ${houseKey}:`, houseError);
      }
    }
    
    return {
      success: true,
      message: `Synced ${updatedCount} houses, created ${createdCount} houses, skipped ${skippedManual} manual entries`,
      updatedCount,
      createdCount,
      skippedManual
    };
    
  } catch (error) {
    console.error('Error syncing from GitHub:', error);
    return { success: false, message: error.message };
  }
}

/**
 * ตั้งค่า manual flag สำหรับวันที่ที่ admin แก้ไขเอง
 * เมื่อ admin กดจอง/ปิดวัน จะไม่ถูก scraper overwrite
 */
export async function setManualBooking(houseId, date, price, status) {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const q = query(housesRef, where('id', '==', Number(houseId)));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length === 0) {
      throw new Error('House not found');
    }
    
    const houseDoc = snapshot.docs[0];
    const houseRef = doc(db, HOUSES_COLLECTION, houseDoc.id);
    const houseData = houseDoc.data();
    const prices = houseData.prices || {};
    
    // ตั้งค่าพร้อม manual flag
    prices[date] = {
      price: price !== undefined ? price : (prices[date]?.price || null),
      status: status || 'available',
      manual: true, // ระบุว่า admin ตั้งเอง
      manualAt: new Date().toISOString()
    };
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { ...houseData, prices };
    
  } catch (error) {
    console.error('Error setting manual booking:', error);
    throw error;
  }
}

/**
 * ลบ manual flag (ให้ scraper สามารถ overwrite ได้)
 */
export async function clearManualFlag(houseId, date) {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const q = query(housesRef, where('id', '==', Number(houseId)));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length === 0) {
      throw new Error('House not found');
    }
    
    const houseDoc = snapshot.docs[0];
    const houseRef = doc(db, HOUSES_COLLECTION, houseDoc.id);
    const houseData = houseDoc.data();
    const prices = houseData.prices || {};
    
    if (prices[date]) {
      delete prices[date].manual;
      delete prices[date].manualAt;
    }
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { ...houseData, prices };
    
  } catch (error) {
    console.error('Error clearing manual flag:', error);
    throw error;
  }
}
