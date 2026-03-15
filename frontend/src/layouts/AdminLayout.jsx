import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Bed, 
  Users, 
  Menu, 
  X, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Home,
  MessageSquare,
  Mail,
  Image,
  LogIn,
  LogOut as LogOutIcon,
  UserPlus,
  ClipboardList,
  PencilLine,
  DoorOpen,
  Hash,
  Calendar,
  CalendarCheck,
  List,
  Shield
} from 'lucide-react'

// Section header for grouping sidebar items
function SectionLabel({ label }) {
  return (
    <div className="px-4 pt-5 pb-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  )
}

export default function AdminLayout({ children }){
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})

  // Auto-expand active section
  useEffect(() => {
    const p = router.pathname
    if (p.startsWith('/admin/bookings') || p === '/admin/walk-in') {
      setExpandedMenus(prev => ({ ...prev, frontDesk: true }))
    }
  }, [router.pathname])

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (user.role !== 'admin') router.replace('/home')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))

  const isActive = (href) => router.pathname === href

  const isGroupActive = (paths) => paths.some(p => router.pathname === p || router.pathname.startsWith(p))

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  // Navigation structure with logical grouping
  const navigation = [
    // ── MAIN ──
    { type: 'section', label: 'Main' },
    { type: 'link', icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },

    // ── FRONT DESK ── (operational actions)
    { type: 'section', label: 'Front Desk' },
    { 
      type: 'group', 
      key: 'frontDesk',
      icon: CalendarCheck, 
      label: 'Front Desk',
      gradient: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/30',
      paths: ['/admin/walk-in', '/admin/bookings/bulk-booking', '/admin/bookings/check-in', '/admin/bookings/check-out', '/admin/bookings/allot-rooms', '/admin/bookings/edit-booking'],
      items: [
        { icon: UserPlus, label: 'New Booking', href: '/admin/walk-in' },
        { icon: ClipboardList, label: 'Bulk Booking', href: '/admin/bookings/bulk-booking' },
        { icon: LogIn, label: 'Check-In', href: '/admin/bookings/check-in' },
        { icon: LogOutIcon, label: 'Check-Out', href: '/admin/bookings/check-out' },
        { icon: Hash, label: 'Assign Rooms', href: '/admin/bookings/allot-rooms' },
        { icon: PencilLine, label: 'Edit Booking', href: '/admin/bookings/edit-booking' },
      ]
    },

    // ── BOOKINGS & ROOMS ──
    { type: 'section', label: 'Bookings & Rooms' },
    { type: 'link', icon: List, label: 'All Bookings', href: '/admin/bookings' },
    { type: 'link', icon: Calendar, label: 'Booking Calendar', href: '/admin/bookings/history' },
    { type: 'link', icon: DoorOpen, label: 'Room Availability', href: '/admin/bookings/available-rooms' },
    { type: 'link', icon: Bed, label: 'Room Types', href: '/admin/rooms' },

    // ── WEBSITE ──
    { type: 'section', label: 'Website' },
    { type: 'link', icon: Users, label: 'Users', href: '/admin/users' },
    { type: 'link', icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
    { type: 'link', icon: Image, label: 'Gallery', href: '/admin/gallery' },
    { type: 'link', icon: Mail, label: 'Messages', href: '/admin/messages' },
  ]

  const renderNavItem = (item, idx) => {
    if (item.type === 'section') {
      return <SectionLabel key={`section-${idx}`} label={item.label} />
    }

    if (item.type === 'group') {
      const isExpanded = expandedMenus[item.key]
      const isAnyActive = isGroupActive(item.paths)

      return (
        <div key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={`
              w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
              ${isAnyActive 
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg ${item.shadow}` 
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }
            `}
          >
            <item.icon size={19} className={isAnyActive ? 'text-white' : 'text-emerald-400'} />
            <span className="flex-1 font-medium text-sm text-left">{item.label}</span>
            {isExpanded 
              ? <ChevronDown size={16} className={isAnyActive ? 'text-white/70' : 'text-slate-500'} />
              : <ChevronRight size={16} className={isAnyActive ? 'text-white/70' : 'text-slate-500'} />
            }
          </button>
          {isExpanded && (
            <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
              {item.items.map(sub => {
                const active = isActive(sub.href)
                return (
                  <a
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${active 
                        ? 'bg-white/15 text-white font-semibold' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <sub.icon size={15} className={active ? 'text-amber-400' : 'text-slate-500'} />
                    <span>{sub.label}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    // Regular link
    const active = isActive(item.href)
    return (
      <a
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
          ${active 
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25' 
            : 'hover:bg-white/10 text-slate-300 hover:text-white'
          }
        `}
      >
        <item.icon size={19} className={active ? 'text-white' : 'text-slate-400'} />
        <span className="flex-1 font-medium text-sm">{item.label}</span>
        {active && <ChevronRight size={15} className="text-white/70" />}
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                HK
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">Hotel Krishna</h1>
                <p className="text-[10px] text-amber-400 flex items-center gap-1"><Shield size={9} /> Admin</p>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50
        bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        w-64 lg:w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo & User - Desktop */}
        <div className="hidden lg:flex flex-col p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg ring-2 ring-amber-500/30">
              HK
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent leading-tight">
                Hotel Krishna
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg border border-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-amber-400 flex items-center gap-1"><Shield size={9} /> Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2 space-y-0.5 overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(100vh - 230px)' }}>
          {navigation.map((item, idx) => renderNavItem(item, idx))}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm space-y-1">
          <a
            href="/home"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <Home size={17} className="text-blue-400" />
            <span className="font-medium">Back to Website</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all text-sm"
          >
            <LogOut size={17} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
