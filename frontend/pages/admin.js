import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Header from '../components/Header'
import HouseCard from '../components/HouseCard'
import WeeklyModal from '../components/WeeklyModal'
import LoginPage from '../components/LoginPage'
import RegisterPage from '../components/RegisterPage'
import AdminPanel from '../components/AdminPanel'
import AddHouseModal from '../components/AddHouseModal'
import EditHouseModal from '../components/EditHouseModal'
import ImportExcelModal from '../components/ImportExcelModal'
import * as api from '../lib/api'
import { syncBookingsFromGitHub } from '../lib/syncService'

export default function AdminPage() {
  const router = useRouter()
  const [houses, setHouses] = useState([])
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('all')
  const [weeklyOpen, setWeeklyOpen] = useState(false)
  const [selectedHouseIdForWeekly, setSelectedHouseIdForWeekly] = useState(null)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [addHouseModalOpen, setAddHouseModalOpen] = useState(false)
  const [editHouseModalOpen, setEditHouseModalOpen] = useState(false)
  const [editingHouse, setEditingHouse] = useState(null)
  const [importExcelOpen, setImportExcelOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  
  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  
  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [username, setUsername] = useState('')
  const [authPage, setAuthPage] = useState('login')

  useEffect(() => { 
    const token = localStorage.getItem('adminToken')
    const role = localStorage.getItem('userRole')
    const storedUsername = localStorage.getItem('username')
    if (token && role) {
      setIsLoggedIn(true)
      setUserRole(role)
      setUsername(storedUsername || '')
    }
    load()
    
    // Auto-sync ทุก 30 นาที (ถ้าหน้าเปิดอยู่)
    const syncInterval = setInterval(() => {
      handleAutoSync()
    }, 30 * 60 * 1000) // 30 นาที
    
    return () => clearInterval(syncInterval)
  }, [])
  
  async function load() {
    try {
      const data = await api.getHouses()
      if (Array.isArray(data)) {
        setHouses(data.map(h => ({ ...h, name: h.name || 'Unnamed', currentDate: new Date() })))
      } else {
        setHouses([])
      }
    } catch (err) {
      console.error('Failed to load houses:', err)
      setHouses([])
    }
  }
  
  // Sync ข้อมูลจาก GitHub (scraper)
  async function handleSync() {
    if (syncing) return
    setSyncing(true)
    try {
      const result = await syncBookingsFromGitHub()
      if (result.success) {
        alert(`✅ Sync สำเร็จ!\n${result.message}`)
        setLastSyncTime(new Date())
        await load() // reload houses
      } else {
        alert(`❌ Sync ล้มเหลว: ${result.message}`)
      }
    } catch (err) {
      console.error('Sync failed:', err)
      alert('❌ Sync ล้มเหลว')
    } finally {
      setSyncing(false)
    }
  }
  
  // Auto-sync (ไม่แสดง alert)
  async function handleAutoSync() {
    if (syncing) return
    try {
      const result = await syncBookingsFromGitHub()
      if (result.success) {
        console.log('Auto-sync completed:', result.message)
        setLastSyncTime(new Date())
        await load()
      }
    } catch (err) {
      console.error('Auto-sync failed:', err)
    }
  }

  function handleExportCalendar() {
    if (!houses || houses.length === 0) {
      alert('ไม่มีข้อมูลบ้านให้ export')
      return
    }

    const rows = []
    houses.forEach(h => {
      const prices = h.prices || {}
      Object.entries(prices).forEach(([date, info]) => {
        rows.push({
          houseName: h.name || '',
          houseCode: h.code || '',
          zone: h.zone || '',
          date,
          price: info?.price ?? '',
          status: info?.status || '',
          manual: info?.manual ? 'manual' : '',
          source: info?.source || ''
        })
      })
    })

    if (rows.length === 0) {
      alert('ไม่มีข้อมูลปฏิทินให้ export')
      return
    }

    rows.sort((a, b) => {
      const nameCompare = a.houseName.localeCompare(b.houseName, 'th')
      if (nameCompare !== 0) return nameCompare
      return String(a.date).localeCompare(String(b.date))
    })

    const headers = ['ชื่อบ้าน', 'รหัส', 'โซน', 'วันที่', 'ราคา', 'สถานะ', 'manual', 'source']
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.houseName,
        r.houseCode,
        r.zone,
        r.date,
        r.price,
        r.status,
        r.manual,
        r.source
      ].map(escapeCsv).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `calendar_export_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function handleLoginSuccess(role) {
    setIsLoggedIn(true)
    setUserRole(role)
    setUsername(localStorage.getItem('username') || '')
  }

  function handleLogout() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    setUserRole(null)
    setUsername('')
  }

  async function addHouse() {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถเพิ่มบ้านได้')
      return
    }
    setAddHouseModalOpen(true)
  }

  function handleHouseAdded(newHouse) {
    if (!newHouse || !newHouse.id) return
    setHouses(prev => [...prev, { ...newHouse, name: newHouse.name || 'Unnamed', currentDate: new Date() }])
  }

  function openEditHouse(index) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขบ้านได้')
      return
    }
    setEditingHouse(houses[index])
    setEditHouseModalOpen(true)
  }

  function openEditHouseById(houseId) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขบ้านได้')
      return
    }
    const house = houses.find(h => h.id === houseId)
    if (house) {
      setEditingHouse(house)
      setEditHouseModalOpen(true)
    }
  }

  function handleHouseUpdated(updated) {
    setHouses(prev => prev.map(h => h.id === updated.id ? { ...updated, currentDate: h.currentDate } : h))
  }

  function changeMonthById(houseId, diff) {
    setHouses(prev => prev.map(h => {
      if (h.id !== houseId) return h;
      const cur = h.currentDate instanceof Date ? new Date(h.currentDate) : new Date(h.currentDate);
      cur.setMonth(cur.getMonth() + diff);
      return { ...h, currentDate: cur };
    }));
  }

  async function deleteHouse(index) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถลบบ้านได้')
      return
    }
    const house = houses[index];
    if (!house) return;
    if (!confirm(`ลบบ้าน "${house.name}" ใช่หรือไม่?`)) return;
    try {
      await api.deleteHouse(house.id);
      setHouses(prev => prev.filter((_,i) => i !== index));
    } catch (err) {
      console.error('delete failed', err);
      alert('ลบบ้านล้มเหลว');
    }
  }

  async function deleteHouseById(houseId) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถลบบ้านได้')
      return
    }
    const house = houses.find(h => h.id === houseId);
    if (!house) return;
    if (!confirm(`ลบบ้าน "${house.name}" ใช่หรือไม่?`)) return;
    try {
      await api.deleteHouse(houseId);
      setHouses(prev => prev.filter(h => h.id !== houseId));
    } catch (err) {
      console.error('delete failed', err);
      alert('ลบบ้านล้มเหลว');
    }
  }

  function openWeekly(index) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขราคาได้')
      return
    }
    const house = houses[index]
    if (house) {
      setSelectedHouseIdForWeekly(house.id)
    }
    setWeeklyOpen(true)
  }

  function openWeeklyById(houseId) {
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขราคาได้')
      return
    }
    setSelectedHouseIdForWeekly(houseId)
    setWeeklyOpen(true)
  }

  function openWeeklyGlobal(){
    if (userRole !== 'admin') {
      alert('เฉพาะ Admin เท่านั้นที่สามารถแก้ไขราคาได้')
      return
    }
    setSelectedHouseIdForWeekly(null)
    setWeeklyOpen(true)
  }

  // Show login/register if not logged in
  if (!isLoggedIn) {
    if (authPage === 'register') {
      return <RegisterPage 
        onRegisterSuccess={() => setAuthPage('login')} 
        onGoToLogin={() => setAuthPage('login')} 
      />
    }
    return <LoginPage 
      onLoginSuccess={handleLoginSuccess} 
      onGoToRegister={() => setAuthPage('register')} 
    />
  }

  const zoneOrder = ['bangsaen', 'pattaya', 'sattahip', 'rayong'];
  
  // ตรวจสอบว่ามีการค้นหา/กรองหรือไม่
  const isFiltering = search.trim() !== '' || zoneFilter !== 'all';
  
  const filteredHouses = houses
    .filter(h => {
      const matchSearch = (h.name || '').toLowerCase().includes((search || '').toLowerCase())
      const matchZone = zoneFilter === 'all' || (h.zone || '') === zoneFilter
      return matchSearch && matchZone
    })
  // ไม่ sort อีกแล้ว ใช้ลำดับจาก API โดยตรง (sortOrder)

  // Drag and Drop handlers (เฉพาะ admin และไม่ได้กรอง)
  const canDrag = userRole === 'admin' && !isFiltering;
  
  function handleDragStart(e, index) {
    if (!canDrag) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }
  
  function handleDragOver(e, index) {
    e.preventDefault();
    if (!canDrag || draggedIndex === null) return;
    setDragOverIndex(index);
  }
  
  function handleDragLeave() {
    setDragOverIndex(null);
  }
  
  async function handleDrop(e, dropIndex) {
    e.preventDefault();
    if (!canDrag || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    
    // Reorder houses locally
    const newHouses = [...houses];
    const [draggedHouse] = newHouses.splice(draggedIndex, 1);
    newHouses.splice(dropIndex, 0, draggedHouse);
    setHouses(newHouses);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Save new order to API
    try {
      const orderedIds = newHouses.map(h => h.id);
      await api.updateHousesOrder(orderedIds);
    } catch (err) {
      console.error('Failed to save order:', err);
      // Reload on error
      load();
    }
  }
  
  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back to public link */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            ← กลับไปหน้าปฏิทิน (Agent View)
          </Link>
          <div className="flex items-center gap-3">
            {lastSyncTime && (
              <span className="text-sm text-gray-500">
                Last sync: {lastSyncTime.toLocaleTimeString('th-TH')}
              </span>
            )}
            {userRole === 'admin' && (
              <>
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                    syncing 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {syncing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลัง Sync...
                    </>
                  ) : (
                    <>🔄 Sync จาก Scraper</>
                  )}
                </button>
                <button
                  onClick={handleExportCalendar}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  📤 Export ปฏิทินรวม
                </button>
                <button 
                  onClick={() => setImportExcelOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  📊 นำเข้า Excel
                </button>
              </>
            )}
          </div>
        </div>
        
        <Header 
          onAdd={addHouse} 
          onRefresh={load} 
          onSearch={setSearch} 
          onOpenWeekly={openWeeklyGlobal}
          onLogout={handleLogout}
          onOpenAdmin={() => setAdminPanelOpen(true)}
          userRole={userRole}
          username={username}
          zoneFilter={zoneFilter}
          onZoneFilterChange={setZoneFilter}
          totalHouses={houses.length}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {filteredHouses.length === 0 && <div className="text-center text-gray-500 col-span-full">ยังไม่มีบ้าน — กด "เพิ่มบ้าน" เพื่อเริ่ม</div>}
          {filteredHouses.map((h, i) => {
            // หา index จริงใน houses array
            const realIndex = houses.findIndex(hh => hh.id === h.id);
            return (
              <div
                key={h.id}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, realIndex)}
                onDragOver={(e) => handleDragOver(e, realIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, realIndex)}
                onDragEnd={handleDragEnd}
                className={`${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${
                  dragOverIndex === realIndex ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                } ${draggedIndex === realIndex ? 'opacity-50' : ''} transition-all`}
              >
                <HouseCard
                  index={realIndex}
                  house={h}
                  onChangeMonth={(diff) => changeMonthById(h.id, diff)}
                  onDelete={userRole === 'admin' ? () => deleteHouseById(h.id) : null}
                  onOpenWeekly={userRole === 'admin' ? () => openWeeklyById(h.id) : null}
                  onOpenEdit={userRole === 'admin' ? () => openEditHouseById(h.id) : null}
                  onUpdated={userRole === 'admin' ? async (idx, updatedHouse) => {
                    setHouses(prev => {
                      return prev.map(hh => {
                        if (hh.id !== h.id) return hh;
                        const curDate = hh.currentDate || new Date();
                        return { ...updatedHouse, currentDate: curDate };
                      });
                    })
                  } : null}
                  userRole={userRole}
                />
              </div>
            );
          })}
        </div>
        {weeklyOpen && <WeeklyModal houses={houses} defaultHouseId={selectedHouseIdForWeekly} onClose={() => setWeeklyOpen(false)} onSaved={(updated)=>{
          setHouses(prev => prev.map(h => h.id === updated.id ? { ...updated, currentDate: (prev.find(p=>p.id===updated.id)?.currentDate || new Date()) } : h))
        }} />}
        {adminPanelOpen && <AdminPanel onClose={() => setAdminPanelOpen(false)} />}
        <AddHouseModal 
          isOpen={addHouseModalOpen} 
          onClose={() => setAddHouseModalOpen(false)} 
          onHouseAdded={handleHouseAdded}
        />
        <EditHouseModal 
          isOpen={editHouseModalOpen} 
          onClose={() => setEditHouseModalOpen(false)} 
          house={editingHouse}
          onHouseUpdated={handleHouseUpdated}
        />
        {importExcelOpen && (
          <ImportExcelModal 
            onClose={() => setImportExcelOpen(false)} 
            onImportSuccess={() => {
              load()
              setImportExcelOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
