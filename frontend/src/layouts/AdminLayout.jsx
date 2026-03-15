import React, { useEffect, useState, useRef } from 'react'
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
  Shield,
  Activity
} from 'lucide-react'

const COLLAPSED_W = 72
const EXPANDED_W = 260

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const hoverTimer = useRef(null)

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  const expanded = hovered

  const handleMouseEnter = () => {
    clearTimeout(hoverTimer.current)
    setHovered(true)
  }
  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 200)
  }

  const toggleMenu = (key) => setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))
  const isActive = (href) => router.pathname === href
  const isGroupActive = (paths) => paths.some(p => router.pathname === p || router.pathname.startsWith(p))

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const navigation = [
    { type: 'section', label: 'Main' },
    { type: 'link', icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { type: 'section', label: 'Front Desk' },
    {
      type: 'group',
      key: 'frontDesk',
      icon: CalendarCheck,
      label: 'Front Desk',
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
    { type: 'section', label: 'Bookings & Rooms' },
    { type: 'link', icon: List, label: 'All Bookings', href: '/admin/bookings' },
    { type: 'link', icon: Calendar, label: 'Booking Calendar', href: '/admin/bookings/history' },
    { type: 'link', icon: DoorOpen, label: 'Room Availability', href: '/admin/bookings/available-rooms' },
    { type: 'link', icon: Bed, label: 'Room Types', href: '/admin/rooms' },
    { type: 'section', label: 'Website' },
    { type: 'link', icon: Users, label: 'Users', href: '/admin/users' },
    { type: 'link', icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials' },
    { type: 'link', icon: Image, label: 'Gallery', href: '/admin/gallery' },
    { type: 'link', icon: Mail, label: 'Messages', href: '/admin/messages' },
    { type: 'section', label: 'System' },
    { type: 'link', icon: Activity, label: 'Activity Log', href: '/admin/logs' },
  ]

  // ── Tooltip wrapper for collapsed state ──
  const Tooltip = ({ label, children }) => (
    <div className="relative group/tip">
      {children}
      {!expanded && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  )

  const renderNavItem = (item, idx) => {
    if (item.type === 'section') {
      if (!expanded) {
        return <div key={`sep-${idx}`} className="mx-3 my-2 border-t border-white/[0.06]" />
      }
      return (
        <div key={`section-${idx}`} className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">{item.label}</p>
        </div>
      )
    }

    if (item.type === 'group') {
      const isExpanded = expandedMenus[item.key]
      const isAnyActive = isGroupActive(item.paths)

      if (!expanded) {
        return (
          <Tooltip key={item.key} label={item.label}>
            <div
              className={`flex items-center justify-center w-11 h-11 mx-auto rounded-xl cursor-pointer transition-all duration-200
                ${isAnyActive
                  ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-indigo-300/70 hover:bg-white/[0.08] hover:text-white'
                }`}
            >
              <item.icon size={20} />
            </div>
          </Tooltip>
        )
      }

      return (
        <div key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${isAnyActive
                ? 'bg-gradient-to-r from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/25'
                : 'hover:bg-white/[0.08] text-indigo-200/80 hover:text-white'
              }`}
          >
            <item.icon size={19} className={isAnyActive ? 'text-white' : 'text-violet-400'} />
            <span className="flex-1 font-medium text-sm text-left">{item.label}</span>
            <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${isAnyActive ? 'text-white/60' : 'text-indigo-400/50'}`} />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-4 pl-3 border-l-2 border-violet-500/20 space-y-0.5">
              {item.items.map(sub => {
                const active = isActive(sub.href)
                return (
                  <a key={sub.href} href={sub.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${active
                        ? 'bg-white/[0.12] text-white font-semibold'
                        : 'text-indigo-300/60 hover:text-white hover:bg-white/[0.06]'
                      }`}
                  >
                    <sub.icon size={15} className={active ? 'text-violet-300' : 'text-indigo-400/40'} />
                    <span>{sub.label}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const active = isActive(item.href)

    if (!expanded) {
      return (
        <Tooltip key={item.href} label={item.label}>
          <a href={item.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all duration-200
              ${active
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-indigo-300/70 hover:bg-white/[0.08] hover:text-white'
              }`}
          >
            <item.icon size={20} />
          </a>
        </Tooltip>
      )
    }

    return (
      <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
          ${active
            ? 'bg-gradient-to-r from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/25'
            : 'hover:bg-white/[0.08] text-indigo-200/80 hover:text-white'
          }`}
      >
        <item.icon size={19} className={active ? 'text-white' : 'text-indigo-400/60'} />
        <span className="flex-1 font-medium text-sm">{item.label}</span>
        {active && <ChevronRight size={15} className="text-white/50" />}
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100">

      {/* ── Mobile Header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg">
                HK
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">Hotel Krishna</h1>
                <p className="text-[10px] text-violet-300 flex items-center gap-1"><Shield size={9} /> Admin</p>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Desktop Sidebar (hover-to-expand) ── */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col bg-gradient-to-b from-indigo-950 via-[#0f1629] to-slate-950 text-white shadow-2xl shadow-indigo-950/50"
        style={{
          width: expanded ? EXPANDED_W : COLLAPSED_W,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Logo */}
        <div className="shrink-0 border-b border-white/[0.06] p-3 flex items-center justify-center" style={{ minHeight: 68 }}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300`}>
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/30 ring-2 ring-violet-400/20">
              HK
            </div>
            {expanded && (
              <div className="min-w-0">
                <h1 className="font-bold text-base bg-gradient-to-r from-violet-200 to-indigo-100 bg-clip-text text-transparent leading-tight whitespace-nowrap">
                  Hotel Krishna
                </h1>
                <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider whitespace-nowrap">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* User card (expanded only) */}
        {expanded && (
          <div className="shrink-0 px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-violet-500/20">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-violet-300/60 flex items-center gap-1"><Shield size={9} /> Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation – scrollable */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-2 ${expanded ? 'px-3' : 'px-2'} space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
          {navigation.map((item, idx) => renderNavItem(item, idx))}
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-white/[0.06] p-2 space-y-1">
          {expanded ? (
            <>
              <a href="/home" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/[0.08] transition-all duration-200 text-sm">
                <Home size={18} className="text-indigo-400/50" />
                <span className="font-medium">Back to Website</span>
              </a>
              <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400/80 hover:text-white hover:bg-rose-500/15 transition-all duration-200 text-sm">
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Tooltip label="Back to Website">
                <a href="/home" className="flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-indigo-300/60 hover:bg-white/[0.08] hover:text-white transition-all duration-200">
                  <Home size={20} />
                </a>
              </Tooltip>
              <Tooltip label="Logout">
                <button onClick={handleLogout} className="flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-rose-400/70 hover:bg-rose-500/15 hover:text-rose-300 transition-all duration-200">
                  <LogOut size={20} />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar (full width drawer) ── */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full z-50 w-72 bg-gradient-to-b from-indigo-950 via-[#0f1629] to-slate-950 text-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Mobile logo */}
        <div className="shrink-0 p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg">
              HK
            </div>
            <div>
              <h1 className="font-bold text-base bg-gradient-to-r from-violet-200 to-indigo-100 bg-clip-text text-transparent">Hotel Krishna</h1>
              <p className="text-[10px] text-indigo-400/60 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-violet-300/60 flex items-center gap-1"><Shield size={9} /> Administrator</p>
            </div>
          </div>
        </div>
        {/* Mobile nav – always expanded labels */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {(() => {
            // Render with expanded=true for mobile
            return navigation.map((item, idx) => {
              if (item.type === 'section') {
                return (
                  <div key={`section-${idx}`} className="px-4 pt-4 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">{item.label}</p>
                  </div>
                )
              }
              if (item.type === 'group') {
                const isExp = expandedMenus[item.key]
                const isAnyAct = isGroupActive(item.paths)
                return (
                  <div key={item.key}>
                    <button onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${isAnyAct ? 'bg-gradient-to-r from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/25' : 'hover:bg-white/[0.08] text-indigo-200/80 hover:text-white'}`}
                    >
                      <item.icon size={19} className={isAnyAct ? 'text-white' : 'text-violet-400'} />
                      <span className="flex-1 font-medium text-sm text-left">{item.label}</span>
                      <ChevronDown size={15} className={`transition-transform duration-200 ${isExp ? 'rotate-0' : '-rotate-90'} ${isAnyAct ? 'text-white/60' : 'text-indigo-400/50'}`} />
                    </button>
                    {isExp && (
                      <div className="mt-1 ml-4 pl-3 border-l-2 border-violet-500/20 space-y-0.5">
                        {item.items.map(sub => {
                          const act = isActive(sub.href)
                          return (
                            <a key={sub.href} href={sub.href} onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200
                                ${act ? 'bg-white/[0.12] text-white font-semibold' : 'text-indigo-300/60 hover:text-white hover:bg-white/[0.06]'}`}>
                              <sub.icon size={15} className={act ? 'text-violet-300' : 'text-indigo-400/40'} />
                              <span>{sub.label}</span>
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              const act = isActive(item.href)
              return (
                <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${act ? 'bg-gradient-to-r from-violet-500/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/25' : 'hover:bg-white/[0.08] text-indigo-200/80 hover:text-white'}`}>
                  <item.icon size={19} className={act ? 'text-white' : 'text-indigo-400/60'} />
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  {act && <ChevronRight size={15} className="text-white/50" />}
                </a>
              )
            })
          })()}
        </nav>
        <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-1">
          <a href="/home" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/[0.08] transition-all text-sm">
            <Home size={18} className="text-indigo-400/50" /> <span className="font-medium">Back to Website</span>
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400/80 hover:text-white hover:bg-rose-500/15 transition-all text-sm">
            <LogOut size={18} /> <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="pt-16 lg:pt-0 transition-all duration-300 lg:ml-[72px]">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
