export default function Header({ onAdd, onRefresh, onSearch, onOpenWeekly, onLogout, onOpenAdmin, userRole, username, zoneFilter, onZoneFilterChange, totalHouses, filterStartDate, filterEndDate, onFilterStartDateChange, onFilterEndDateChange, onClearDateFilter, filteredCount, isDateFiltering }) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 bg-white rounded shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/></svg>
            </span>
            ปฏิทิน BaanPoolVilla
          </h1>
          {typeof totalHouses === 'number' && (
            <span className="text-sm text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-full">
              ทั้งหมด {totalHouses} บ้าน
            </span>
          )}
          <select
            value={zoneFilter || 'all'}
            onChange={e => onZoneFilterChange && onZoneFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-200"
          >
            <option value="all">เลือกพื้นที่</option>
            <option value="pattaya">พัทยา</option>
            <option value="sattahip">สัตหีบ</option>
            <option value="bangsaen">บางแสน</option>
            <option value="rayong">ระยอง</option>
          </select>
          <div className="relative">
            <input onChange={e => onSearch && onSearch(e.target.value)} placeholder="ค้นหาบ้าน..." className="pl-3 pr-10 py-2 rounded-md border w-64 text-sm" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ค้นหา</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Show user info */}
          <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-gray-100 rounded-lg">
            <span className="text-sm text-gray-600">{username}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${userRole === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {userRole === 'admin' ? 'Admin' : 'Agent'}
            </span>
          </div>
          
          {/* Admin only buttons */}
          {userRole === 'admin' && (
            <>
              <button onClick={onOpenWeekly} className="inline-flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-md text-sm hover:bg-indigo-50">📅 Weekly Price</button>
              <button onClick={onAdd} className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-100 px-4 py-2 rounded-md text-sm hover:bg-blue-50">เพิ่มบ้าน</button>
              <button onClick={onOpenAdmin} className="inline-flex items-center gap-2 bg-white text-purple-600 border border-purple-100 px-4 py-2 rounded-md text-sm hover:bg-purple-50">👥 จัดการผู้ใช้</button>
            </>
          )}
          
          <button onClick={onLogout} className="inline-flex items-center gap-2 bg-white text-red-600 border border-red-100 px-4 py-2 rounded-md text-sm hover:bg-red-50">ออกจากระบบ</button>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="text-sm font-medium text-gray-700">ค้นหาบ้านว่าง:</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">เช็คอิน</label>
          <input 
            type="date" 
            value={filterStartDate || ''}
            onChange={e => onFilterStartDateChange && onFilterStartDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
          />
        </div>
        <span className="text-gray-400">→</span>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">เช็คเอาท์</label>
          <input 
            type="date" 
            value={filterEndDate || ''}
            min={filterStartDate || undefined}
            onChange={e => onFilterEndDateChange && onFilterEndDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
          />
        </div>
        {isDateFiltering && (
          <>
            <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 text-sm font-medium">🏠 บ้านว่าง: {filteredCount} หลัง</span>
            </div>
            <button 
              onClick={onClearDateFilter}
              className="ml-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
            >
              ✕ ล้าง
            </button>
          </>
        )}
      </div>
    </div>
  )
}
