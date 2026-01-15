const API_BASE = '/api'

export async function login(password){
  const res = await fetch(`${API_BASE}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password}) })
  return res.json()
}

export function getAuthHeader() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export async function getHouses(){
  const res = await fetch(`${API_BASE}/houses`)
  return res.json()
}
export async function addHouse(name, capacity = 4){
  const res = await fetch(`${API_BASE}/houses`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, capacity}) })
  return res.json()
}
export async function updateHouse(houseId, data){
  const res = await fetch(`${API_BASE}/houses/${houseId}`, { method:'PUT', headers:{'Content-Type':'application/json', ...getAuthHeader()}, body: JSON.stringify(data) })
  return res.json()
}
export async function applyWeekdayPrices(houseId, payload){
  const res = await fetch(`${API_BASE}/houses/${houseId}/weekday-prices`, { method:'POST', headers:{'Content-Type':'application/json', ...getAuthHeader()}, body: JSON.stringify(payload) })
  return res.json()
}
export async function applyHolidayPrices(houseId, payload){
  const res = await fetch(`${API_BASE}/houses/${houseId}/holiday-prices`, { method:'POST', headers:{'Content-Type':'application/json', ...getAuthHeader()}, body: JSON.stringify(payload) })
  return res.json()
}
export async function updateBooking(houseId, payload){
  const res = await fetch(`${API_BASE}/houses/${houseId}/booking`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  return res.json()
}
export async function deleteHouse(houseId){
  const res = await fetch(`${API_BASE}/houses/${houseId}`, { method:'DELETE' })
  return res.json()
}
