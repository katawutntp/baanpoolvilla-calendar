# 🌐 Public API - Integration Guide

บทนำการใช้งาน Public API ของปฏิทิน (Calendar Available Dates API) กับเว็บอื่น

---

## 📦 What's New

API สาธารณะใหม่ได้ถูกเพิ่มเข้าไป เพื่อให้เว็บอื่นสามารถดึงข้อมูลวันที่ว่างของบ้านพักได้

### Files Created:
- **`backend/server.js`** - เพิ่ม 2 endpoints ใหม่ใน PUBLIC API
- **`PUBLIC_API.md`** - เอกสาร API แบบ detailed
- **`frontend/lib/publicApi.js`** - JavaScript helper library
- **`frontend/components/AvailableDatesWidget.js`** - React component ตัวอย่าง
- **`AVAILABLE_DATES_WIDGET.html`** - HTML widget แบบ standalone

---

## 🚀 Quick Start

### Option 1: ใช้ JavaScript Fetch API

```javascript
// Get all available dates
const response = await fetch('http://localhost:3000/api/public/available-dates');
const houses = await response.json();

// Get specific house
const response = await fetch('http://localhost:3000/api/public/available-dates/5');
const house = await response.json();
```

### Option 2: ใช้ Next.js Helper Library

```javascript
import { getAllAvailableDates, getHouseAvailableDates } from '@/lib/publicApi';

// Get all houses
const houses = await getAllAvailableDates();

// Get single house
const house = await getHouseAvailableDates(5);

// Filter dates by range
import { filterDatesByRange } from '@/lib/publicApi';
const filtered = filterDatesByRange(house.availableDates, '2026-02-18', '2026-02-28');
```

### Option 3: ใช้ React Component

```javascript
import AvailableDatesWidget from '@/components/AvailableDatesWidget';

export default function Page() {
  return <AvailableDatesWidget apiBaseUrl="http://localhost:3000" />;
}
```

### Option 4: Standalone HTML Widget

```html
<!-- Copy ไฟล์ AVAILABLE_DATES_WIDGET.html และเปิดใน browser -->
<!-- แล้วเปลี่ยน API_BASE ให้ชี้ไปที่ server ของคุณ -->
```

---

## 📡 API Endpoints

### GET /api/public/available-dates
ดึงวันที่ว่างสำหรับ **ทุกบ้าน**

```bash
curl http://localhost:3000/api/public/available-dates
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "House A",
    "capacity": 4,
    "zone": "Zone 1",
    "description": "Description",
    "availableDates": ["2026-02-18", "2026-02-19"],
    "totalAvailable": 2
  }
]
```

---

### GET /api/public/available-dates/:id
ดึงวันที่ว่างสำหรับ **บ้านที่ระบุ**

```bash
curl http://localhost:3000/api/public/available-dates/1
```

**Response:**
```json
{
  "id": 1,
  "name": "House A",
  "capacity": 4,
  "zone": "Zone 1",
  "description": "Description",
  "availableDates": ["2026-02-18", "2026-02-19", "2026-02-20"],
  "totalAvailable": 3,
  "allPrices": {
    "2026-02-18": { "price": 2500, "status": "available" },
    "2026-02-19": { "price": 2500, "status": "available" }
  }
}
```

---

## 🛠️ Implementation Examples

### Example 1: React Component

```javascript
// pages/external-availability.js
import { useState, useEffect } from 'react'
import { getAllAvailableDates } from '@/lib/publicApi'

export default function AvailabilityPage() {
  const [houses, setHouses] = useState([])

  useEffect(() => {
    getAllAvailableDates().then(setHouses);
  }, [])

  return (
    <div>
      {houses.map(house => (
        <div key={house.id}>
          <h3>{house.name}</h3>
          <p>Available: {house.totalAvailable} dates</p>
          <ul>
            {house.availableDates.slice(0, 10).map(date => (
              <li key={date}>{date}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

### Example 2: Next.js API Route

```javascript
// pages/api/external-availability.js
import { getAllAvailableDates } from '@/lib/publicApi'

export default async function handler(req, res) {
  const houses = await getAllAvailableDates()
  res.json(houses)
}
```

### Example 3: HTML + JavaScript

```html
<div id="houses"></div>

<script>
  const API_BASE = 'http://localhost:3000/api/public';

  async function loadHouses() {
    const response = await fetch(`${API_BASE}/available-dates`);
    const houses = await response.json();
    
    const html = houses.map(h => `
      <div>
        <h3>${h.name}</h3>
        <p>Available: ${h.totalAvailable}</p>
      </div>
    `).join('');
    
    document.getElementById('houses').innerHTML = html;
  }

  loadHouses();
</script>
```

### Example 4: Python Integration

```python
import requests

API_BASE = 'http://localhost:3000/api/public'

# Get all houses
response = requests.get(f'{API_BASE}/available-dates')
houses = response.json()

# Get specific house
response = requests.get(f'{API_BASE}/available-dates/1')
house = response.json()

print(f"House: {house['name']}")
print(f"Available dates: {house['availableDates']}")
```

### Example 5: Calendar Integration (Booking System)

```javascript
import { getHouseAvailableDates, isDateAvailable } from '@/lib/publicApi'

export async function checkAvailability(houseId, selectedDate) {
  const house = await getHouseAvailableDates(houseId)
  return isDateAvailable(selectedDate, house)
}

export async function getPrice(houseId, selectedDate) {
  const house = await getHouseAvailableDates(houseId)
  return house.allPrices?.[selectedDate]?.price || null
}
```

---

## 🔄 Data Format

### Available Date
- Format: `YYYY-MM-DD` (ISO 8601)
- Example: `2026-02-18`

### Status
- `"available"` - วันว่าง สามารถจองได้
- `"booked"` - วันจองแล้ว ไม่สามารถจองได้
- No status / undefined - ถือว่าว่าง (default)

### Pricing
```json
{
  "2026-02-18": {
    "price": 2500,
    "status": "available",
    "isHoliday": false
  }
}
```

---

## 🔒 CORS & Security

✅ **CORS Enabled** - API เปิดให้เรียกจากโดเมนอื่น
✅ **No Authentication** - ไม่ต้อง authentication token
✅ **Read-Only** - ข้อมูลจะสามารถอ่านได้only (ป้องกันการแก้ไขข้อมูล)

---

## 🧪 Testing

### Using Postman
1. `GET http://localhost:3000/api/public/available-dates`
2. `GET http://localhost:3000/api/public/available-dates/1`

### Using cURL
```bash
# Get all
curl -X GET http://localhost:3000/api/public/available-dates

# Get specific house
curl -X GET http://localhost:3000/api/public/available-dates/1
```

### Using Browser
```
http://localhost:3000/api/public/available-dates
http://localhost:3000/api/public/available-dates/1
```

---

## 📊 Helper Functions (publicApi.js)

```javascript
// Get all houses
getAllAvailableDates()

// Get specific house
getHouseAvailableDates(houseId)

// Get multiple houses
getMultipleHousesAvailableDates([1, 2, 3])

// Filter by date range
filterDatesByRange(dates, '2026-02-18', '2026-02-28')

// Check if date available
isDateAvailable('2026-02-20', houseData)

// Get price for date
getPriceForDate('2026-02-20', houseData)

// Format dates for display
formatDatesForDisplay(dates, 'th-TH')

// Search houses
searchHouses('query')

// Get houses by zone
getHousesByZone('Zone 1')

// Get top available houses
getTopAvailableHouses(5)
```

---

## 🌍 Remote Server Setup

หากต้องการใช้ API จาก server ห่างไกล:

```javascript
// Change API base URL
const apiBaseUrl = 'https://yourdomain.com/api/public'

const houses = await getAllAvailableDates(apiBaseUrl)
const house = await getHouseAvailableDates(5, apiBaseUrl)
```

---

## 🐛 Troubleshooting

### CORS Error
**ปัญหา:** `Access to XMLHttpRequest blocked by CORS policy`

**วิธีแก้:**
- ตรวจสอบว่า API server มี CORS enabled
- ลอง URL เปลี่ยนจาก `localhost` เป็น `127.0.0.1` หรือ IP address

### 404 Error
**ปัญหา:** House not found

**วิธีแก้:**
- ตรวจสอบว่า house ID ถูกต้อง
- ลอง GET `/api/public/available-dates` เพื่อดูรายชื่อบ้านทั้งหมด

### Empty avabilableDates
**ปัญหา:** ข้อมูล availableDates เป็นอาร์เรย์ว่าง

**วิธีแก้:**
- ตรวจสอบว่า data (prices) ได้ถูก set ในระบบหลัก
- ลองเพิ่มราคาสำหรับบ้านผ่าน admin panel

---

## 📚 File References

| File | Purpose |
|------|---------|
| [backend/server.js](backend/server.js) | API endpoints implementation |
| [PUBLIC_API.md](PUBLIC_API.md) | API documentation |
| [frontend/lib/publicApi.js](frontend/lib/publicApi.js) | JavaScript helper library |
| [frontend/components/AvailableDatesWidget.js](frontend/components/AvailableDatesWidget.js) | React component |
| [AVAILABLE_DATES_WIDGET.html](AVAILABLE_DATES_WIDGET.html) | Standalone HTML widget |

---

## 🎯 Use Cases

- **Booking Platform**: ดึงวันที่ว่างไปใช้ในระบบจองของตัวเอง
- **Portal Website**: แสดงความพร้อมใจของบ้านพัก
- **Mobile App**: ใช้ API ดึงข้อมูลไปแสดงใน app
- **Partnership Integration**: Share availability กับ partner sites
- **Widget Embedding**: ฝังปฏิทินวันที่ว่างใน website อื่น

---

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ logs ใน backend console
2. ลอง GET request ผ่าน browser/Postman
3. ตรวจสอบ CORS configuration
4. ดูของเอกสาร [PUBLIC_API.md](PUBLIC_API.md)

---

**Last Updated:** 2026-02-18
**API Version:** 1.0
