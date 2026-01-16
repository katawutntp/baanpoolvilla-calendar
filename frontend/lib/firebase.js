import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGsWhrJXverDRacyftfB2GBpJFwHRBogU",
  authDomain: "calendar-bfe40.firebaseapp.com",
  databaseURL: "https://calendar-bfe40-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "calendar-bfe40",
  storageBucket: "calendar-bfe40.firebasestorage.app",
  messagingSenderId: "594148825736",
  appId: "1:594148825736:web:763d742218e7fed51f5d3d",
  measurementId: "G-EKL3DHC404"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
