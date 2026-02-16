import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
import { 
  Key,
  Search, 
  Filter, 
  Calendar,
  Bed,
  ChevronDown,
  RefreshCw,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function AvailableRoomsPage() {
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all') // all, available, booked
  const [dateRange, setDateRange] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [roomTypesRes, bookingsRes] = await Promise.all([
        api.get('/room-types'),
        api.get('/bookings')
      ])
      setRoomTypes(roomTypesRes.data.roomTypes || [])
      setBookings(bookingsRes.data.bookings || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBookedRooms = (roomTypeKey) => {
    const checkIn = new Date(dateRange.checkIn)
    const checkOut = new Date(dateRange.checkOut)
    
    const bookedRoomNumbers = new Set()
    
    bookings.forEach(booking => {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') return
      
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
      
      // Check if booking overlaps with date range
      if (bookingCheckIn < checkOut && bookingCheckOut > checkIn) {
        booking.items?.forEach(item => {
          if (item.roomTypeKey === roomTypeKey && item.allottedRoomNumbers) {
            item.allottedRoomNumbers.forEach(rn => bookedRoomNumbers.add(rn))
          }
        })
      }
    })
    
    return Array.from(bookedRoomNumbers)
  }

  const getRoomStatus = (roomTypeKey, roomNumber) => {
    const bookedRooms = getBookedRooms(roomTypeKey)
    return bookedRooms.includes(roomNumber) ? 'booked' : 'available'
  }

  const filteredRoomTypes = roomTypes.filter(rt => {
    if (roomTypeFilter !== 'all' && rt.key !== roomTypeFilter) return false
    if (!rt.roomNumbers || rt.roomNumbers.length === 0) return false
    return true
  })

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading room availability...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="text-blue-600" size={24} />
            Room Availability
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">View available and booked rooms by room number</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Room Type Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map(rt => (
                <option key={rt.key} value={rt.key}>{rt.title}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Availability Filter */}
          <div className="relative">
            <Bed size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Rooms</option>
              <option value="available">Available Only</option>
              <option value="booked">Booked Only</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Check-In Date */}
          <div className="relative">
            <Calendar size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateRange.checkIn}
              onChange={(e) => setDateRange(prev => ({ ...prev, checkIn: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Check-Out Date */}
          <div className="relative">
            <Calendar size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateRange.checkOut}
              onChange={(e) => setDateRange(prev => ({ ...prev, checkOut: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredRoomTypes.map(rt => {
            const bookedRooms = getBookedRooms(rt.key)
            const totalRooms = rt.roomNumbers?.length || 0
            const availableRooms = totalRooms - bookedRooms.length
            
            return (
              <div key={rt.key} className="bg-white rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                <p className="text-xs text-gray-600 mb-0.5 truncate">{rt.title}</p>
                <p className="text-lg font-bold text-gray-900">
                  {availableRooms}/{totalRooms}
                </p>
                <p className="text-xs text-green-600 font-semibold">Available</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Room Cards */}
      <div className="space-y-4">
        {filteredRoomTypes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-semibold mb-1">No room types with room numbers</p>
            <p className="text-gray-500 text-sm">Please add room numbers to room types in admin panel</p>
          </div>
        ) : (
          filteredRoomTypes.map(roomType => {
            const bookedRooms = getBookedRooms(roomType.key)
            const roomNumbers = roomType.roomNumbers || []
            
            const filteredRoomNumbers = roomNumbers.filter(rn => {
              const status = getRoomStatus(roomType.key, rn)
              if (availabilityFilter === 'available' && status === 'booked') return false
              if (availabilityFilter === 'booked' && status === 'available') return false
              return true
            })

            if (filteredRoomNumbers.length === 0) return null

            return (
              <div key={roomType.key} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{roomType.title}</h3>
                      <p className="text-blue-100 text-sm">
                        Total: {roomNumbers.length} | Available: {roomNumbers.length - bookedRooms.length} | Booked: {bookedRooms.length}
                      </p>
                    </div>
                    <Bed size={32} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {filteredRoomNumbers.map(roomNumber => {
                      const status = getRoomStatus(roomType.key, roomNumber)
                      const isAvailable = status === 'available'
                      
                      return (
                        <div
                          key={roomNumber}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            isAvailable
                              ? 'bg-green-50 border-green-300 hover:border-green-400'
                              : 'bg-red-50 border-red-300 hover:border-red-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-gray-900">{roomNumber}</span>
                            {isAvailable ? (
                              <Check size={20} className="text-green-600" />
                            ) : (
                              <X size={20} className="text-red-600" />
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${
                            isAvailable ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <AlertCircle size={18} />
          Legend
        </h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Available - Room is free for selected dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Booked - Room is occupied for selected dates</span>
          </div>
        </div>
      </div>
    </WorkerLayout>
  )
}
