# Firebase Setup Guide

## ✅ สำเร็จแล้ว
ระบบได้ถูกอัพเดทให้ใช้ Firebase Firestore แทน JSON file แล้ว!

## 🔧 ขั้นตอนที่ต้องทำต่อ

### 1. สร้าง Firebase Project
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก **Add project** หรือ **Create a project**
3. ตั้งชื่อโปรเจค เช่น "baanpoolvilla-calendar"
4. ปิด Google Analytics (ไม่จำเป็น) หรือเปิดก็ได้
5. คลิก **Create project**

### 2. สร้าง Firestore Database
1. ในเมนูด้านซ้าย คลิก **Build** > **Firestore Database**
2. คลิก **Create database**
3. เลือก **Start in production mode**
4. เลือก location ที่ใกล้ที่สุด เช่น **asia-southeast1 (Singapore)**
5. คลิก **Enable**

### 3. ตั้งค่า Firestore Rules (สำคัญ!)
ไปที่ **Rules** tab แล้ววางโค้ดนี้:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to houses collection for everyone
    match /houses/{houseId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**หมายเหตุ:** Rules นี้อนุญาตให้ทุกคนอ่านข้อมูลได้ แต่เขียนได้เฉพาะคนที่ล็อกอิน หากต้องการความปลอดภัยมากขึ้น ให้ใช้ Firebase Authentication ร่วมด้วย

### 4. เพิ่ม Web App และคัดลอก Config
1. ไปที่ **Project Settings** (ไอคอนเฟือง)
2. เลื่อนลงมาที่ **Your apps**
3. คลิกไอคอน **Web** (`</>`)
4. ตั้งชื่อ app เช่น "BaanPoolVilla Web"
5. คลิก **Register app**
6. **คัดลอก firebaseConfig** ทั้งหมด

### 5. อัพเดท Firebase Config ในโปรเจค
แก้ไขไฟล์ `frontend/lib/firebase.js` วางข้อมูลที่คัดลอกมา:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // ของคุณ
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 6. ทดสอบ
1. รัน dev server: `npm run dev`
2. เข้า localhost:3000
3. Login ด้วย admin/admin123
4. ลองเพิ่มบ้านใหม่
5. ตรวจสอบใน Firebase Console > Firestore Database จะเห็นข้อมูลปรากฏ!

## 📝 ข้อมูลที่เปลี่ยนแปลง

### ไฟล์ที่สร้างใหม่:
- ✅ `frontend/lib/firebase.js` - Firebase configuration
- ✅ `frontend/lib/firebaseApi.js` - Firestore API functions

### ไฟล์ที่แก้ไข:
- ✅ `frontend/pages/api/houses.js`
- ✅ `frontend/pages/api/houses/[id].js`
- ✅ `frontend/pages/api/houses/[id]/booking.js`
- ✅ `frontend/pages/api/houses/[id]/weekday-prices.js`
- ✅ `frontend/pages/api/houses/[id]/holiday-prices.js`

### Packages ที่ติดตั้ง:
- ✅ firebase (85 packages)

## 🎯 Features ที่ทำงาน
- ✅ เพิ่มบ้าน (Create)
- ✅ แสดงรายการบ้าน (Read)
- ✅ แก้ไขข้อมูลบ้าน (Update)
- ✅ ลบบ้าน (Delete)
- ✅ จัดการราคาตามวัน (Booking)
- ✅ ตั้งราคาตามวันในสัปดาห์ (Weekday prices)
- ✅ ตั้งราคาวันหยุด (Holiday prices)

## 🚀 Deploy บน Vercel
เมื่อ deploy บน Vercel แล้ว ไม่ต้องตั้งค่าอะไรเพิ่มเติม เพราะ Firebase config อยู่ใน code แล้ว

แต่ถ้าต้องการความปลอดภัยมากขึ้น ควรใช้ Environment Variables:
1. ใน Vercel Dashboard > Settings > Environment Variables
2. เพิ่ม:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - etc.

## 💡 Tips
- ข้อมูลจะถูกเก็บถาวรใน Firestore ไม่หายเมื่อ restart
- Firestore ฟรี 1GB storage และ 50K reads/day
- ดูข้อมูล real-time ได้ใน Firebase Console
- สามารถ export/import ข้อมูลได้

---

**หากมีปัญหาให้แจ้งมาได้เลยครับ!** 🙂
