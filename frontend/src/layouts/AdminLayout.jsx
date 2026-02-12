import React, { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Bed, 
  Users, 
  CreditCard, 
  FileText, 
  Package, 
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
  History
} from 'lucide-react'

// AdminLayout provides a professional responsive admin layout with sidebar
export default function AdminLayout({ children }){
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bookingsExpanded, setBookingsExpanded] = useState(false)

  // Auto-expand bookings menu if on a bookings sub-page
  useEffect(() => {
    if (router.pathname.startsWith('/admin/bookings')) {
      setBookingsExpanded(true)
    }
  }, [router.pathname])

  // Authentication check
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

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', color: 'text-blue-500' },
    { 
      icon: CalendarCheck, 
      label: 'Bookings', 
      color: 'text-green-500',
      expandable: true,
      subItems: [
        { icon: LogIn, label: 'Check-In', href: '/admin/bookings/check-in', color: 'text-blue-400' },
        { icon: LogOutIcon, label: 'Check-Out', href: '/admin/bookings/check-out', color: 'text-orange-400' },
        { icon: History, label: 'History', href: '/admin/bookings/history', color: 'text-purple-400' },
      ]
    },
    { icon: Bed, label: 'Room Types', href: '/admin/rooms', color: 'text-purple-500' },
    { icon: Bed, label: 'Available Rooms', href: '/admin/available-rooms', color: 'text-emerald-500' },
    { icon: Users, label: 'Users', href: '/admin/users', color: 'text-pink-500' },
    { icon: MessageSquare, label: 'Testimonials', href: '/admin/testimonials', color: 'text-amber-500' },
    { icon: Image, label: 'Gallery', href: '/admin/gallery', color: 'text-cyan-500' },
    { icon: Mail, label: 'Messages', href: '/admin/messages', color: 'text-red-500' },
  ]

  const isActive = (href) => {
    if (!href) return false
    return router.pathname === href
  }

  const isBookingsActive = () => {
    return router.pathname.startsWith('/admin/bookings')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-xl">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                HK
              </div>
              <div>
                <h1 className="font-bold text-sm">Hotel Krishna</h1>
                <p className="text-xs text-amber-400">Admin Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
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

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl
        transition-transform duration-300 ease-in-out
        w-72 lg:w-80
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo Section - Desktop */}
        <div className="hidden lg:block p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-lg ring-4 ring-amber-500/20">
              HK
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Hotel Krishna
              </h1>
              <p className="text-xs text-slate-400">Restaurant & Luxury Stays</p>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-amber-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon

            if (item.expandable) {
              // Expandable menu (Bookings)
              const isExpanded = bookingsExpanded
              const isAnySubActive = isBookingsActive()
              
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setBookingsExpanded(!bookingsExpanded)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isAnySubActive 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30' 
                        : 'hover:bg-white/10 text-slate-300 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} className={isAnySubActive ? 'text-white' : item.color} />
                    <span className="flex-1 font-medium text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown size={18} className={isAnySubActive ? 'text-white/80' : 'text-slate-400'} />
                    ) : (
                      <ChevronRight size={18} className={isAnySubActive ? 'text-white/80' : 'text-slate-400'} />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {isExpanded && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const subActive = isActive(subItem.href)
                        return (
                          <a
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                              ${subActive 
                                ? 'bg-white/10 text-white border-l-2 border-amber-400' 
                                : 'hover:bg-white/5 text-slate-400 hover:text-white'
                              }
                            `}
                          >
                            <SubIcon size={16} className={subActive ? 'text-amber-400' : subItem.color} />
                            <span className="text-sm font-medium">{subItem.label}</span>
                            {subActive && <ChevronRight size={14} className="ml-auto text-amber-400" />}
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            
            // Regular menu item
            const active = isActive(item.href)
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30' 
                    : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className={active ? 'text-white' : item.color} />
                <span className="flex-1 font-medium">{item.label}</span>
                {active && <ChevronRight size={18} className="text-white/80" />}
              </a>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <a
            href="/home"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 mb-2"
          >
            <Home size={20} className="text-blue-400" />
            <span className="font-medium">Back to Website</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-80 pt-20 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
