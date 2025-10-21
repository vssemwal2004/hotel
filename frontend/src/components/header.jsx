import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { User, X, Menu } from 'lucide-react'

export default function Header(){
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Home')
  const [scrolled, setScrolled] = useState(false)
  const [isTransparent, setIsTransparent] = useState(true)

  const navItems = [
    { name: 'Home', href: '/#home' },
    { name: 'Rooms', href: '/#rooms' },
    { name: 'Restaurant', href: '/#restaurant' },
    { name: 'Gallery', href: '/#gallery' },
    { name: 'Contact', href: '/#contact' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setScrolled(scrollY > 20)
      setIsTransparent(scrollY < 100)
    }

    // Set initial state
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (item) => {
    setActiveNav(item.name)
    setOpen(false)
    
    if (item.href.includes('#')) {
      const id = item.href.split('#')[1]
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
    } else {
      router.push(item.href)
    }
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

            {/* Right Section - Login & Mobile Menu */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Login Button - Desktop */}
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

              {/* Book Now Button - Desktop */}
              <button 
                onClick={() => handleNavClick({ name: 'Rooms', href: '/#rooms' })} 
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
                  <button 
                    onClick={() => { setOpen(false); router.push('/auth/login') }} 
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300"
                  >
                    <User size={20} />
                    <span>Login to Account</span>
                  </button>
                  <button 
                    onClick={() => handleNavClick({ name: 'Rooms', href: '/#rooms' })} 
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
      `}</style>
    </>
  )
}