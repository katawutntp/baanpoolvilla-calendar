export default function Header({ onAdd, onRefresh, onSearch, onOpenWeekly, onLogout, onOpenAdmin, userRole, username }) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 bg-white rounded shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/></svg>
          </span>
          ปฏิทิน BaanPoolVilla
        </h1>
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
  )
}
