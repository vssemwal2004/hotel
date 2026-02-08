import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CalendarCheck, 
  UserCog, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  History,
  DoorOpen
} from 'lucide-react'

// WorkerLayout provides a professional responsive worker layout with sidebar
export default function WorkerLayout({ children }){
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (user.role !== 'worker' && user.role !== 'admin') router.replace('/home')
    }
  }, [user, loading, router])

  if (loading || !user || (user.role !== 'worker' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Worker Panel...</p>
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/worker', color: 'text-teal-500' },
    { icon: CalendarCheck, label: 'Room Allotment', href: '/worker/allot', color: 'text-emerald-500' },
    { icon: DoorOpen, label: 'Available Rooms', href: '/worker/rooms', color: 'text-amber-500' },
    { icon: History, label: 'Customers History', href: '/worker/history', color: 'text-blue-500' },
  ]

  const isActive = (href) => router.pathname === href

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-800 via-teal-900 to-teal-800 text-white shadow-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                HK
              </div>
              <div>
                <h1 className="font-bold text-sm">Hotel Krishna</h1>
                <p className="text-xs text-teal-400">Worker Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'W'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-teal-900 via-teal-800 to-teal-900 text-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <img 
                  src="/images/logo-icon/logo.webp" 
                  alt="Hotel Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent">
                  Hotel Krishna
                </h1>
                <p className="text-xs text-slate-400">Restaurant & Luxury Stays</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'W'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.name || 'Worker'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="inline-block px-2 py-0.5 bg-teal-500/30 text-teal-200 text-xs rounded-full font-medium">
                  {user?.role === 'admin' ? 'Admin' : 'Worker'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${active 
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/20' 
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    <item.icon 
                      size={20} 
                      className={`${active ? item.color : 'text-slate-400'} transition-colors`}
                    />
                    <span className={`font-medium ${active ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>
                    {active && (
                      <ChevronRight size={16} className="ml-auto text-teal-300" />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded-xl transition-all duration-200 group border border-red-500/30"
            >
              <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 min-h-screen pt-20 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
