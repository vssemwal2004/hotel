import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Calendar, Users, Baby, Bed, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../hooks/useAuth'

export default function BookingBar() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [rooms, setRooms] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [loading, setLoading] = useState(false)

  // Set default dates (today and tomorrow)
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setCheckIn(formatDate(today))
    setCheckOut(formatDate(tomorrow))
  }, [])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleBookNow = () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates')
      return
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date')
      return
    }

    // Check if user is logged in
    if (!authLoading && !user) {
      // Store booking details in sessionStorage for after login
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        checkIn,
        checkOut,
        rooms,
        adults,
        children,
        checkInTime,
        checkOutTime
      }))
      router.push('/auth/login')
      return
    }

    setLoading(true)
    
    // Combine date and time for full datetime
    const checkInDateTime = `${checkIn}T${checkInTime}`
    const checkOutDateTime = `${checkOut}T${checkOutTime}`
    
    // Navigate to booking page with query params
    const query = new URLSearchParams({
      checkIn: checkInDateTime,
      checkOut: checkOutDateTime,
      rooms: rooms.toString(),
      adults: adults.toString(),
      children: children.toString()
    })

    router.push(`/booking?${query.toString()}`)
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Booking Form - Mobile: All fields inline, Desktop: Horizontal Layout */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-amber-200 overflow-hidden hover:shadow-amber-300/50 transition-all duration-500">
          <div className="flex flex-wrap md:grid md:grid-cols-2 lg:grid-cols-7 gap-2 md:gap-0 divide-y-0 md:divide-y-0 md:divide-x divide-amber-100 p-3 md:p-0">
            
            {/* Check-In Date & Time - Compact Mobile */}
            <div className="p-3 md:p-5 lg:col-span-1 hover:bg-amber-50 transition-colors group flex-1 min-w-[140px]">
              <label className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-700 mb-2 md:mb-3 uppercase tracking-wide">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                Check In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={formatDate(new Date())}
                className="w-full text-sm md:text-base font-semibold text-gray-800 border-none outline-none focus:ring-0 bg-transparent cursor-pointer"
              />
              <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500" />
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full text-[10px] md:text-xs text-gray-600 border-none outline-none focus:ring-0 bg-transparent"
                />
              </div>
            </div>

            {/* Check-Out Date & Time - Compact Mobile */}
            <div className="p-3 md:p-5 lg:col-span-1 hover:bg-amber-50 transition-colors group flex-1 min-w-[140px]">
              <label className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-700 mb-2 md:mb-3 uppercase tracking-wide">
                <Calendar className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                Check Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || formatDate(new Date())}
                className="w-full text-sm md:text-base font-semibold text-gray-800 border-none outline-none focus:ring-0 bg-transparent cursor-pointer"
              />
              <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-500" />
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full text-[10px] md:text-xs text-gray-600 border-none outline-none focus:ring-0 bg-transparent"
                />
              </div>
            </div>

            {/* Rooms - Compact Mobile */}
            <div className="p-3 md:p-5 lg:col-span-1 hover:bg-amber-50 transition-colors group flex-1 min-w-[100px]">
              <label className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-700 mb-2 md:mb-3 uppercase tracking-wide">
                <Bed className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                Rooms
              </label>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setRooms(Math.max(1, rooms - 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={rooms <= 1}
                >
                  -
                </button>
                <span className="flex-1 text-center text-base md:text-xl font-bold text-gray-800 min-w-[1.5rem] md:min-w-[2rem]">
                  {rooms}
                </span>
                <button
                  onClick={() => setRooms(Math.min(10, rooms + 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={rooms >= 10}
                >
                  +
                </button>
              </div>
            </div>

            {/* Adults - Compact Mobile */}
            <div className="p-3 md:p-5 lg:col-span-1 hover:bg-amber-50 transition-colors group flex-1 min-w-[100px]">
              <label className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-700 mb-2 md:mb-3 uppercase tracking-wide">
                <Users className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                Adults
              </label>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={adults <= 1}
                >
                  -
                </button>
                <span className="flex-1 text-center text-base md:text-xl font-bold text-gray-800 min-w-[1.5rem] md:min-w-[2rem]">
                  {adults}
                </span>
                <button
                  onClick={() => setAdults(Math.min(20, adults + 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={adults >= 20}
                >
                  +
                </button>
              </div>
            </div>

            {/* Children - Compact Mobile */}
            <div className="p-3 md:p-5 lg:col-span-1 hover:bg-amber-50 transition-colors group flex-1 min-w-[100px]">
              <label className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold text-amber-700 mb-2 md:mb-3 uppercase tracking-wide">
                <Baby className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                Children
              </label>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={children <= 0}
                >
                  -
                </button>
                <span className="flex-1 text-center text-base md:text-xl font-bold text-gray-800 min-w-[1.5rem] md:min-w-[2rem]">
                  {children}
                </span>
                <button
                  onClick={() => setChildren(Math.min(10, children + 1))}
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-amber-800 font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 text-sm md:text-base"
                  disabled={children >= 10}
                >
                  +
                </button>
              </div>
            </div>

            {/* Book Now Button - Full width on mobile, Spans 2 columns on large screens */}
            <div className="w-full md:p-0 lg:col-span-2 flex items-stretch bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:via-amber-700 hover:to-amber-600 transition-all duration-500 rounded-xl md:rounded-none">
              <button
                onClick={handleBookNow}
                disabled={loading}
                className="w-full h-full px-6 md:px-8 py-4 md:py-6 text-white font-bold text-base md:text-xl tracking-wider transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 relative overflow-hidden group"
              >
                {/* Animated background shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
                
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="relative z-10">Processing...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-6 h-6 relative z-10" />
                    <span className="relative z-10 uppercase">Book Now</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
