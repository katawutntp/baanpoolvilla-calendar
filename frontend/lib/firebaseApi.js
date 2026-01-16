import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const HOUSES_COLLECTION = 'houses';

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
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const houseSnap = await getDoc(houseRef);
    
    if (houseSnap.exists()) {
      return { id: houseSnap.id, ...houseSnap.data() };
    } else {
      throw new Error('House not found');
    }
  } catch (error) {
    console.error('Error getting house:', error);
    throw error;
  }
}

export async function createHouse(name, capacity = 4) {
  try {
    const housesRef = collection(db, HOUSES_COLLECTION);
    const newHouse = {
      name,
      capacity,
      prices: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(housesRef, newHouse);
    return { id: docRef.id, name, capacity, prices: {} };
  } catch (error) {
    console.error('Error creating house:', error);
    throw error;
  }
}

export async function updateHouse(houseId, data) {
  try {
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(houseRef, updateData);
    
    // Get updated house data
    const updatedSnap = await getDoc(houseRef);
    return { id: houseId, ...updatedSnap.data() };
  } catch (error) {
    console.error('Error updating house:', error);
    throw error;
  }
}

export async function updateHouseBooking(houseId, date, price, status) {
  try {
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const houseSnap = await getDoc(houseRef);
    
    if (!houseSnap.exists()) {
      throw new Error('House not found');
    }
    
    const houseData = houseSnap.data();
    const prices = houseData.prices || {};
    
    prices[date] = {
      price: price !== undefined ? price : null,
      status: status || 'available'
    };
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { id: houseId, ...houseData, prices };
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

export async function deleteHouse(houseId) {
  try {
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    await deleteDoc(houseRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting house:', error);
    throw error;
  }
}

export async function applyWeekdayPrices(houseId, startDate, endDate, year, month, mapping) {
  try {
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const houseSnap = await getDoc(houseRef);
    
    if (!houseSnap.exists()) {
      throw new Error('House not found');
    }
    
    const houseData = houseSnap.data();
    const prices = houseData.prices || {};
    
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
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { id: houseId, ...houseData, prices };
  } catch (error) {
    console.error('Error applying weekday prices:', error);
    throw error;
  }
}

export async function applyHolidayPrices(houseId, dates, price) {
  try {
    const houseRef = doc(db, HOUSES_COLLECTION, houseId);
    const houseSnap = await getDoc(houseRef);
    
    if (!houseSnap.exists()) {
      throw new Error('House not found');
    }
    
    const houseData = houseSnap.data();
    const prices = houseData.prices || {};
    
    dates.forEach(dateStr => {
      const existing = prices[dateStr] || {};
      prices[dateStr] = { ...existing, price: Number(price), isHoliday: true };
    });
    
    await updateDoc(houseRef, {
      prices,
      updatedAt: serverTimestamp()
    });
    
    return { id: houseId, ...houseData, prices };
  } catch (error) {
    console.error('Error applying holiday prices:', error);
    throw error;
  }
}
