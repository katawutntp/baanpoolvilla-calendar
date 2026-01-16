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
  where,
  serverTimestamp
} from 'firebase/firestore';

const HOUSES_COLLECTION = 'houses';
const USERS_COLLECTION = 'users';

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
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
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
    
    const usersRef = collection(db, USERS_COLLECTION);
    const newUser = {
      username,
      password, // ⚠️ หมายเหตุ: ในการใช้จริง ควร hash password
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(usersRef, newUser);
    return { id: docRef.id, username, role };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userId, data) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
    
    const updatedSnap = await getDoc(userRef);
    return { id: userId, ...updatedSnap.data() };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function updateUserRole(userId, role) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { role });
    
    const updatedSnap = await getDoc(userRef);
    return { id: userId, ...updatedSnap.data() };
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
    
    const docRef = await addDoc(tokensRef, tokenData);
    return { id: docRef.id, ...tokenData };
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
