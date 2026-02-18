# 📅 Public API - Available Dates

API สาธารณะสำหรับใช้กับเว็บอื่นเพื่อดึงข้อมูลวันที่ว่างของบ้านพักตากอากาศ

## Base URL
```
http://localhost:3000/api/public
```

---

## 🔓 Endpoints (No Authentication Required)

### 1. Get Available Dates for All Houses
ดึงวันที่ว่างของบ้านทั้งหมด

**Request:**
```
GET /api/public/available-dates
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "บ้านแม่น้ำ",
    "capacity": 4,
    "zone": "North Zone",
    "description": "บ้านพักใกล้น้ำ",
    "availableDates": [
      "2026-02-19",
      "2026-02-20",
      "2026-02-21"
    ],
    "totalAvailable": 3
  },
  {
    "id": 2,
    "name": "Villa Sunset",
    "capacity": 6,
    "zone": "South Zone",
    "description": "พระอาทิตย์ตกสวยงาม",
    "availableDates": [
      "2026-02-18",
      "2026-02-22",
      "2026-02-23",
      "2026-02-24"
    ],
    "totalAvailable": 4
  }
]
```

---

### 2. Get Available Dates for Specific House
ดึงวันที่ว่างของบ้านที่ระบุเท่านั้น

**Request:**
```
GET /api/public/available-dates/{houseId}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| houseId | Number | Yes | ID ของบ้าน |

**Example:**
```
GET /api/public/available-dates/5
```

**Response (200 OK):**
```json
{
  "id": 5,
  "name": "Peaceful Villa",
  "capacity": 8,
  "zone": "Mountain Zone",
  "description": "บ้านหลวงสงบ",
  "availableDates": [
    "2026-02-18",
    "2026-02-19",
    "2026-02-20",
    "2026-02-25",
    "2026-02-26"
  ],
  "totalAvailable": 5,
  "allPrices": {
    "2026-02-18": { "price": 2500, "status": "available" },
    "2026-02-19": { "price": 2500, "status": "available" },
    "2026-02-20": { "price": 3000, "status": "available" },
    "2026-02-25": { "price": 2500, "status": "available" },
    "2026-02-26": { "price": 2500, "status": "available" }
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "house not found"
}
```

---

## 📋 Data Format

### Available Date
- **Type:** String (ISO 8601)
- **Format:** `YYYY-MM-DD`
- **Example:** `2026-02-18`

### Date Status
วันที่จะถูกนับว่า "available" เมื่อ:
- 还没มี `status` field (ค่าเริ่มต้น)
- `status` = `"available"`

วันที่ "booked" (ไม่่ว่าง) เมื่อ:
- `status` = `"booked"` หรือค่าอื่นๆ

---

## 🔌 Integration Examples

### JavaScript / React
```javascript
// Fetch available dates for all houses
async function getAllAvailableDates() {
  const response = await fetch('http://localhost:3000/api/public/available-dates');
  const data = await response.json();
  return data;
}

// Fetch available dates for specific house
async function getHouseAvailableDates(houseId) {
  const response = await fetch(
    `http://localhost:3000/api/public/available-dates/${houseId}`
  );
  const data = await response.json();
  return data;
}

// Usage
const allHouses = await getAllAvailableDates();
console.log(allHouses);

const house5 = await getHouseAvailableDates(5);
console.log(house5.availableDates);
```

### Python
```python
import requests

# Get all houses available dates
response = requests.get('http://localhost:3000/api/public/available-dates')
houses = response.json()
print(houses)

# Get specific house available dates
response = requests.get('http://localhost:3000/api/public/available-dates/5')
house_data = response.json()
print(f"Available dates: {house_data['availableDates']}")
```

### cURL
```bash
# Get all available dates
curl http://localhost:3000/api/public/available-dates

# Get available dates for house ID 5
curl http://localhost:3000/api/public/available-dates/5
```

---

## ⚠️ Important Notes

1. **No Authentication Required** - API นี้เป็น public และเปิดให้ใช้ได้จากเว็บอื่นๆ
2. **CORS Enabled** - สนับสนุน Cross-Origin Requests
3. **Date Format** - ใช้ ISO 8601 format `YYYY-MM-DD`
4. **Cache** - ค่อนข้างข้อมูลจะเปลี่ยนแปลงบ่อย แนะนำให้ cache ใน client-side
5. **Sorting** - วันที่จะถูก sort ตามลำดับเวลาโดยอัตโนมัติ

---

## 🛠️ Use Cases

- **Booking Calendar Widget** - ใช้ใน website อื่นเพื่อแสดง calendar วันที่ว่าง
- **Availability Checker** - ตรวจสอบวันที่ว่างจากเว็บอื่น
- **Dashboard** - แสดงสถานะการจองใน admin panel ของธุรกิจอื่น
- **Mobile App** - ดึงข้อมูลวันที่ว่างไปใช้ใน mobile application

---

## 📞 API Status

ทุก endpoint จะ return HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 404 | House not found |
| 500 | Server error |

---

**Last Updated:** 2026-02-18
