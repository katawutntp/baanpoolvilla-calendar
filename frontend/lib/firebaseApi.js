import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  increment
} from 'firebase/firestore';

const HOUSES_COLLECTION = 'houses';
const USERS_COLLECTION = 'users';
const COUNTERS_COLLECTION = 'counters';

// ===== Counter Helper =====

async function getNextId(counterName) {
  try {
    const counterRef = doc(db, COUNTERS_COLLECTION, counterName);
    const counterSnap = await getDoc(counterRef);
    
    if (!counterSnap.exists()) {
      // Create counter if not exists
      await setDoc(counterRef, { value: 1 });
      return 1;
    }
    
    const currentValue = counterSnap.data().value || 0;
    const nextValue = currentValue + 1;
    await updateDoc(counterRef, { value: nextValue });
    return nextValue;
  } catch (error) {
    console.error('Error getting next ID:', error);
    throw error;
  }
}

// ===== Houses =====

export async function getAllHouses() {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const q = query(housesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting houses:', error);
    throw error;
  }
}

export async function getHouseById(houseId) {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const q = query(housesRef, where('id', '==', Number(houseId)));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return { docId: doc.id, ...doc.data() };
    } else {
      throw new Error('House not found');
    }
  } catch (error) {
    console.error('Error getting house:', error);
    throw error;
  }
}

export async function createHouse(name, capacity = 4, zone = '') {
  try {
    const id = await getNextId('houses');
    const housesRef = collection(db, HOUSES_COLLECTION);
    const newHouse = {
      id,
      name,
      capacity,
      zone: zone || '',
      prices: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(housesRef, newHouse);
    return newHouse;
  } catch (error) {
    console.error('Error creating house:', error);
    throw error;
  }
}

export async function updateHouse(houseId, data) {
  try {
    const house = await getHouseById(houseId);
    const houseRef = doc(db, HOUSES_COLLECTION, house.docId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(houseRef, updateData);
    
    const updatedSnap = await getDoc(houseRef);
    return { ...updatedSnap.data() };
  } catch (error) {
    console.error('Error updating house:', error);
    throw error;
  }
}

export async function updateHouseBooking(houseId, date, price, status) {
  try {
    const house = await getHouseById(houseId);
    const houseRef = doc(db, HOUSES_COLLECTION, house.docId);
    const prices = house.prices || {};
    
    prices[date] = {
      price: price !== undefined ? price : null,
      status: status || 'available'
    };
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { ...house, prices };
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

export async function deleteHouse(houseId) {
  try {
    const house = await getHouseById(houseId);
    const houseRef = doc(db, HOUSES_COLLECTION, house.docId);
    await deleteDoc(houseRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting house:', error);
    throw error;
  }
}

export async function applyWeekdayPrices(houseId, startDate, endDate, year, month, mapping) {
  try {
    const house = await getHouseById(houseId);
    const houseRef = doc(db, HOUSES_COLLECTION, house.docId);
    const prices = house.prices || {};
    
    let start = startDate ? new Date(startDate) : null;
    let end = endDate ? new Date(endDate) : null;
    
    if (!start || !end) {
      if (year && month) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0);
      } else {
        throw new Error('Provide startDate/endDate or year/month');
      }
    }
    
    let cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      const priceVal = mapping[String(dayOfWeek)];
      if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        const existing = prices[iso] || {};
        prices[iso] = { ...existing, price: Number(priceVal) };
      }
      cur.setDate(cur.getDate() + 1);
    }
    
    await updateDoc(houseRef, {
      weekdayPrices: { ...mapping },
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { ...house, prices, weekdayPrices: { ...mapping } };
  } catch (error) {
    console.error('Error applying weekday prices:', error);
    throw error;
  }
}

export async function applyHolidayPrices(houseId, dates, price) {
  try {
    const house = await getHouseById(houseId);
    const houseRef = doc(db, HOUSES_COLLECTION, house.docId);
    const prices = house.prices || {};
    
    dates.forEach(dateStr => {
      const existing = prices[dateStr] || {};
      prices[dateStr] = { ...existing, price: Number(price), isHoliday: true };
    });
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { ...house, prices };
  } catch (error) {
    console.error('Error applying holiday prices:', error);
    throw error;
  }
}

// ===== Users =====

export async function getAllUsers() {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('id', '==', Number(userId)));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return { docId: doc.id, ...doc.data() };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

export async function getUserByUsername(username) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

export async function createUser(username, password, role = 'agent') {
  try {
    // Check if username already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const id = await getNextId('users');
    const usersRef = collection(db, USERS_COLLECTION);
    const newUser = {
      id,
      username,
      password, // ⚠️ หมายเหตุ: ในการใช้จริง ควร hash password
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(usersRef, newUser);
    return { id, username, role };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userId, data) {
  try {
    const user = await getUserById(userId);
    const userRef = doc(db, USERS_COLLECTION, user.docId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
    
    const updatedSnap = await getDoc(userRef);
    return { ...updatedSnap.data() };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId) {
  try {
    const user = await getUserById(userId);
    const userRef = doc(db, USERS_COLLECTION, user.docId);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function updateUserRole(userId, role) {
  try {
    const user = await getUserById(userId);
    const userRef = doc(db, USERS_COLLECTION, user.docId);
    await updateDoc(userRef, { role });
    
    const updatedSnap = await getDoc(userRef);
    return { ...updatedSnap.data() };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// ===== Tokens =====

export async function createToken(tokenString, userId, role) {
  try {
    const tokensRef = collection(db, 'tokens');
    const tokenData = {
      tokenString,
      userId,
      role,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    await addDoc(tokensRef, tokenData);
    return { ...tokenData };
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

export async function getTokenData(tokenString) {
  try {
    const tokensRef = collection(db, 'tokens');
    const q = query(tokensRef, where('tokenString', '==', tokenString));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      const tokenData = doc.data();
      
      // Check if token expired
      if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
        // Delete expired token
        await deleteDoc(doc.ref);
        throw new Error('Token expired');
      }
      
      return tokenData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

export async function deleteToken(tokenString) {
  try {
    const tokensRef = collection(db, 'tokens');
    const q = query(tokensRef, where('tokenString', '==', tokenString));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      await deleteDoc(snapshot.docs[0].ref);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
}

// ===== Bookings =====

const BOOKINGS_COLLECTION = 'bookings';

export async function getAllBookings() {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const snapshot = await getDocs(bookingsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
}

export async function addBookings(bookingsArray) {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const results = [];
    
    for (const booking of bookingsArray) {
      const newBooking = {
        ...booking,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(bookingsRef, newBooking);
      results.push({ id: docRef.id, ...newBooking });
    }
    
    return results;
  } catch (error) {
    console.error('Error adding bookings:', error);
    throw error;
  }
}

export async function clearAllBookings() {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const snapshot = await getDocs(bookingsRef);
    
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }
    
    return { success: true, deleted: snapshot.docs.length };
  } catch (error) {
    console.error('Error clearing bookings:', error);
    throw error;
  }
}

export async function createHouseIfNotExists(houseName, capacity = 10, zone = '') {
  try {
    // Check if house already exists
    const housesRef = collection(db, HOUSES_COLLECTION);
    const q = query(housesRef, where('name', '==', houseName));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length > 0) {
      // House exists, return it
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data(), exists: true };
    }
    
    // Create new house
    const id = await getNextId('houses');
    const newHouse = {
      id,
      name: houseName,
      capacity,
      zone: zone || '',
      prices: {},
      weekdayPrices: {},
      holidayPrices: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(housesRef, newHouse);
    return { id: docRef.id, ...newHouse, exists: false };
  } catch (error) {
    console.error('Error creating house if not exists:', error);
    throw error;
  }
}

// ===== Import Bookings to House Prices =====
// ฟังก์ชันนี้จะนำเข้าข้อมูลการจองจาก Excel และอัพเดท house.prices โดยตรง
export async function importBookingsToHousePrices(bookings) {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const results = { updated: 0, created: 0, errors: [] };
    
    // Group bookings by house name
    const bookingsByHouse = {};
    for (const booking of bookings) {
      const houseName = booking.houseName;
      if (!houseName) continue;
      
      if (!bookingsByHouse[houseName]) {
        bookingsByHouse[houseName] = [];
      }
      bookingsByHouse[houseName].push(booking);
    }
    
    // Process each house
    for (const [houseName, houseBookings] of Object.entries(bookingsByHouse)) {
      try {
        // Find or create house
        const q = query(housesRef, where('name', '==', houseName));
        const snapshot = await getDocs(q);
        
        let houseRef;
        let existingPrices = {};
        
        if (snapshot.docs.length > 0) {
          // House exists
          houseRef = snapshot.docs[0].ref;
          existingPrices = snapshot.docs[0].data().prices || {};
        } else {
          // Create new house
          const id = await getNextId('houses');
          const newHouse = {
            id,
            name: houseName,
            capacity: 10,
            prices: {},
            weekdayPrices: {},
            holidayPrices: {},
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          const docRef = await addDoc(housesRef, newHouse);
          houseRef = docRef;
          results.created++;
        }
        
        // Update prices with booking status
        const updatedPrices = { ...existingPrices };
        
        for (const booking of houseBookings) {
          const date = booking.date;
          if (!date) continue;
          
          // แปลงสถานะจากภาษาไทยเป็น status code
          let status = 'booked';
          const bookingStatus = (booking.status || '').toLowerCase();
          if (bookingStatus.includes('ว่าง') || bookingStatus === 'available') {
            status = 'available';
          } else if (bookingStatus.includes('ปิด') || bookingStatus === 'closed') {
            status = 'closed';
          } else if (bookingStatus.includes('จอง') || bookingStatus.includes('booked')) {
            status = 'booked';
          }
          
          // Merge with existing price data
          const existing = updatedPrices[date] || {};
          updatedPrices[date] = {
            ...existing,
            status: status
          };
        }
        
        // Save updated prices to house document
        await updateDoc(houseRef, {
          prices: updatedPrices,
          updatedAt: serverTimestamp()
        });
        
        results.updated++;
        console.log(`Updated house "${houseName}" with ${houseBookings.length} bookings`);
        
      } catch (houseError) {
        console.error(`Error processing house "${houseName}":`, houseError);
        results.errors.push({ houseName, error: houseError.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error importing bookings:', error);
    throw error;
  }
}
