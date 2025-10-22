import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { User, X, Menu, LogOut, ChevronDown, Mail, Home as HomeIcon, BookOpen } from 'lucide-react'
import useAuth from '../hooks/useAuth'

export default function Header(){
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Home')
  const [scrolled, setScrolled] = useState(false)
  const [isTransparent, setIsTransparent] = useState(true)
  const { user, logout, loading } = useAuth()
  const [showBooking, setShowBooking] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [fullDay, setFullDay] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const navItems = [
    { name: 'Home', href: '/#home' },
    { name: 'Rooms', href: '/#rooms' },
    { name: 'Restaurant', href: '/#restaurant' },
    { name: 'Gallery', href: '/#gallery' },
    { name: 'Contact', href: '/#contact' },
  ]

  // Check if we're on the home/landing page
  const isHomePage = router.pathname === '/' || router.pathname === '/home'

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setScrolled(scrollY > 20)
      // Only allow transparent header on home page when at top
      setIsTransparent(isHomePage && scrollY < 100)
    }

    // Set initial state
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Book Now and nav click: if booking, require auth
  const handleNavClick = (item, requireAuth = false) => {
    setActiveNav(item.name)
    setOpen(false)
    if (requireAuth && !user && !loading) {
      router.push('/auth/login')
      return
    }
    if (item.href.includes('#')) {
      const id = item.href.split('#')[1]
      
      // If we're on home page, scroll to section
      if (isHomePage) {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }
      } else {
        // If we're on another page, navigate to home page with hash
        router.push(item.href).then(() => {
          // After navigation, scroll to the section
          setTimeout(() => {
            const element = document.getElementById(id)
            if (element) {
              element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              })
            }
          }, 100)
        })
      }
    } else {
      router.push(item.href)
    }
  }

  const openBookNow = () => {
    // Navigate to home page booking section
    if (isHomePage) {
      // If already on home page, scroll to booking section
      const bookingElement = document.getElementById('booking')
      if (bookingElement) {
        bookingElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    } else {
      // If on another page, navigate to home page and then scroll to booking
      router.push('/#booking').then(() => {
        setTimeout(() => {
          const bookingElement = document.getElementById('booking')
          if (bookingElement) {
            bookingElement.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            })
          }
        }, 100)
      })
    }
  }

  const startBooking = (e) => {
    e?.preventDefault()
    if (!checkIn) return alert('Please select check-in')
    if (!fullDay && !checkOut) return alert('Please select check-out')
    const params = new URLSearchParams()
    params.set('checkIn', checkIn)
    if (!fullDay) params.set('checkOut', checkOut)
    if (fullDay) params.set('fullDay', '1')
    setShowBooking(false)
    router.push(`/booking?${params.toString()}`)
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
    setActiveNav('Home')
  }

  return (
    <>
      {/* Main Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isTransparent 
          ? 'bg-transparent' 
          : 'bg-white/95 backdrop-blur-md shadow-xl'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Logo - Left Side */}
            <button 
              onClick={handleLogoClick}
              className="flex-shrink-0 flex items-center"
            >
              <img 
                src="/images//logo-icon/logo.webp" 
                alt="Hotel Krishna Logo" 
                className="h-12 w-auto object-contain transition-all duration-300 hover:opacity-90"
              />
            </button>

            {/* Center Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={`relative text-base font-medium transition-all duration-300 group ${
                    activeNav === item.name 
                      ? (isTransparent ? 'text-amber-300' : 'text-amber-600') 
                      : (isTransparent ? 'text-white/90 hover:text-amber-200' : 'text-gray-700 hover:text-amber-600')
                  }`}
                >
                  {item.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${
                    activeNav === item.name 
                      ? (isTransparent ? 'bg-amber-300 w-full' : 'bg-amber-600 w-full')
                      : (isTransparent ? 'bg-amber-200 w-0 group-hover:w-full' : 'bg-amber-500 w-0 group-hover:w-full')
                  }`} />
                </button>
              ))}
            </nav>

            {/* Right Section - Login/Profile & Mobile Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Show Profile Dropdown if logged in, Login if not */}
              {!loading && user ? (
                <>
                  {/* Profile Dropdown for Desktop */}
                  <div className="hidden lg:block relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                        isTransparent
                          ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isTransparent ? 'bg-amber-300/20' : 'bg-amber-500'
                      }`}>
                        <span className="text-sm font-bold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown size={18} className={`transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[60] animate-dropdownFade">
                        {/* User Info Section */}
                        <div className="px-5 py-5 bg-gradient-to-br from-amber-50 via-amber-50/80 to-orange-50 border-b border-amber-200">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                              <span className="text-white text-xl font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-gray-900 truncate mb-1">
                                {user?.name || 'User'}
                              </p>
                              <p className="text-xs text-gray-600 truncate flex items-center gap-1.5">
                                <Mail size={13} className="flex-shrink-0" />
                                <span>{user?.email || 'email@example.com'}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="py-2">
                          <button
                            onClick={() => { router.push('/'); setShowProfileDropdown(false); }}
                            className="w-full px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors flex items-center gap-3 group"
                          >
                            <HomeIcon size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:translate-x-1 transition-transform">Home</span>
                          </button>
                          <button
                            onClick={() => { router.push('/bookings'); setShowProfileDropdown(false); }}
                            className="w-full px-5 py-3 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors flex items-center gap-3 group"
                          >
                            <BookOpen size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
                            <span className="group-hover:translate-x-1 transition-transform">Your Bookings</span>
                          </button>
                        </div>

                        {/* Logout Section */}
                        <div className="border-t border-gray-200 py-2">
                          <button
                            onClick={async () => { 
                              await logout(); 
                              setShowProfileDropdown(false); 
                              router.push('/'); 
                            }}
                            className="w-full px-5 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 group"
                          >
                            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="group-hover:translate-x-1 transition-transform">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => router.push('/auth/login')} 
                  className={`hidden lg:flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                    isTransparent
                      ? 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  <User size={18} />
                  <span>Login</span>
                </button>
              )}
              {/* Book Now Button - Desktop, require auth */}
              <button 
                onClick={openBookNow} 
                className={`hidden lg:flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                  isTransparent
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gradient-to-r from-amber-500 to-amber-700 text-white hover:from-amber-600 hover:to-amber-800'
                }`}
              >
                <span>Book Now</span>
              </button>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setOpen(!open)}
                className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${
                  isTransparent
                    ? 'text-white hover:text-amber-200 hover:bg-white/10'
                    : 'text-gray-700 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                {open ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-60" />
      </header>

      {/* Mobile Menu Overlay */}
      {open && (
        <>
          <div 
            onClick={() => setOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
          />
          
          <div className="lg:hidden fixed inset-x-0 top-0 bg-white/95 backdrop-blur-md z-50 animate-slideDown shadow-2xl border-b border-gray-200">
            <div className="container mx-auto px-4 sm:px-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between h-16">
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center"
                >
                  <img 
                    src="/images/hotel-hero.jpg" 
                    alt="Hotel Krishna Logo" 
                    className="h-10 w-auto object-contain"
                  />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-gray-700 hover:text-amber-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="py-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      className={`w-full text-left px-4 py-3.5 text-base font-medium rounded-lg transition-all duration-300 ${
                        activeNav === item.name 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>

                {/* Mobile Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  {!loading && user ? (
                    <>
                      <button
                        onClick={async () => { setOpen(false); await logout(); router.push('/'); }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white text-base font-semibold rounded-lg hover:bg-red-700 transition-all duration-300"
                      >
                        <LogOut size={20} />
                        <span>Logout</span>
                      </button>
                      <button
                        onClick={() => { setOpen(false); router.push('/bookings') }}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-base font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg"
                      >
                        <BookOpen size={20} />
                        <span>Your Bookings</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setOpen(false); router.push('/auth/login') }} 
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300"
                    >
                      <User size={20} />
                      <span>Login to Account</span>
                    </button>
                  )}
                  <button 
                    onClick={openBookNow} 
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-base font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg"
                  >
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-dropdownFade {
          animation: dropdownFade 0.2s ease-out;
        }
      `}</style>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowBooking(false)} />
          <form onSubmit={startBooking} className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Select Dates</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Check-in</label>
                <input type="datetime-local" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
              </div>
              {!fullDay && (
                <div>
                  <label className="block text-sm font-medium">Check-out</label>
                  <input type="datetime-local" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={fullDay} onChange={e=>setFullDay(e.target.checked)} /> Full day booking
              </label>
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={()=>setShowBooking(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-md">Continue</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}