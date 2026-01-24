import { useEffect, useState } from 'react'
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

  function handleHouseUpdated(updated) {
    setHouses(prev => prev.map(h => h.id === updated.id ? { ...updated, currentDate: h.currentDate } : h))
  }

  function changeMonth(index, diff) {
    setHouses(prev => {
      const copy = prev.map(h => ({ ...h }));
      const h = copy[index];
      const cur = h.currentDate instanceof Date ? new Date(h.currentDate) : new Date(h.currentDate);
      cur.setMonth(cur.getMonth() + diff);
      h.currentDate = cur;
      return copy;
    })
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
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {houses.filter(h => {
            const matchSearch = (h.name || '').toLowerCase().includes((search || '').toLowerCase())
            const matchZone = zoneFilter === 'all' || (h.zone || '') === zoneFilter
            return matchSearch && matchZone
          }).length === 0 && <div className="text-center text-gray-500 col-span-full">ยังไม่มีบ้าน — กด "เพิ่มบ้าน" เพื่อเริ่ม</div>}
          {houses.filter(h => {
            const matchSearch = (h.name || '').toLowerCase().includes((search || '').toLowerCase())
            const matchZone = zoneFilter === 'all' || (h.zone || '') === zoneFilter
            return matchSearch && matchZone
          }).map((h, i) => (
            <HouseCard
              key={h.id}
              index={i}
              house={h}
              onChangeMonth={(diff) => changeMonth(i, diff)}
              onDelete={userRole === 'admin' ? () => deleteHouse(i) : null}
              onOpenWeekly={userRole === 'admin' ? () => openWeekly(i) : null}
              onOpenEdit={userRole === 'admin' ? () => openEditHouse(i) : null}
              onUpdated={userRole === 'admin' ? async (idx, updatedHouse) => {
                setHouses(prev => {
                  const copy = prev.map(hh => ({ ...hh }));
                  const curDate = copy[idx]?.currentDate || new Date();
                  copy[idx] = { ...updatedHouse, currentDate: curDate };
                  return copy;
                })
              } : null}
              userRole={userRole}
            />
          ))}
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
