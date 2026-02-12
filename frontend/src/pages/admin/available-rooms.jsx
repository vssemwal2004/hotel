import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import { 
  Bed, 
  Filter, 
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ChevronDown,
  Eye,
  RefreshCw
} from 'lucide-react'

export default function AvailableRooms() {
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState([])
  const [bookings, setBookings] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, available, booked, partial
  const [dateFilter, setDateFilter] = useState('today') // today, tomorrow, week, custom
  const [customDate, setCustomDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [searchQuery, statusFilter, dateFilter, customDate, roomTypes, bookings])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [roomTypesRes, bookingsRes] = await Promise.all([
        api.get('/room-types'),
        api.get('/bookings')
      ])
      setRoomTypes(roomTypesRes.data.types || [])
      setBookings(bookingsRes.data.bookings || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    let filtered = [...roomTypes]
    
    // Get the target date based on filter
    let targetDate = new Date()
    targetDate.setHours(0, 0, 0, 0)
    
    if (dateFilter === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1)
    } else if (dateFilter === 'week') {
      // For week, we'll check the range
    } else if (dateFilter === 'custom' && customDate) {
      targetDate = new Date(customDate)
      targetDate.setHours(0, 0, 0, 0)
    }

    // Calculate booked rooms for each room type
    filtered = filtered.map(room => {
      let bookedCount = 0
      
      if (dateFilter === 'week') {
        // Check bookings for the next 7 days
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        bookedCount = bookings.filter(b => {
          const checkIn = new Date(b.checkIn)
          const checkOut = new Date(b.checkOut || b.checkIn)
          return b.status === 'paid' && checkIn <= weekEnd && checkOut >= targetDate
        }).reduce((sum, b) => {
          const roomItem = b.items?.find(item => item.roomTypeId === room._id || item.title === room.title)
          return sum + (roomItem?.quantity || 0)
        }, 0)
      } else {
        // Check bookings for specific date
        bookedCount = bookings.filter(b => {
          const checkIn = new Date(b.checkIn)
          checkIn.setHours(0, 0, 0, 0)
          const checkOut = new Date(b.checkOut || b.checkIn)
          checkOut.setHours(23, 59, 59, 999)
          
          return b.status === 'paid' && checkIn <= targetDate && checkOut >= targetDate
        }).reduce((sum, b) => {
          const roomItem = b.items?.find(item => item.roomTypeId === room._id || item.title === room.title)
          return sum + (roomItem?.quantity || 0)
        }, 0)
      }

      const availableCount = (room.count || 0) - bookedCount
      const status = bookedCount === 0 ? 'available' : 
                     availableCount === 0 ? 'booked' : 'partial'

      return {
        ...room,
        bookedCount,
        availableCount,
        status
      }
    })

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRooms(filtered)
  }

  const getStatusBadge = (status, availableCount, totalCount) => {
    if (status === 'available') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          <CheckCircle size={12} />
          All Available ({totalCount})
        </span>
      )
    } else if (status === 'booked') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <XCircle size={12} />
          Fully Booked
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <Clock size={12} />
          {availableCount} Available
        </span>
      )
    }
  }

  const getDateDisplay = () => {
    if (dateFilter === 'today') return 'Today'
    if (dateFilter === 'tomorrow') return 'Tomorrow'
    if (dateFilter === 'week') return 'Next 7 Days'
    if (dateFilter === 'custom' && customDate) {
      return new Date(customDate).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    }
    return 'Select Date'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rooms...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const availableRoomsCount = filteredRooms.reduce((sum, r) => sum + r.availableCount, 0)
  const bookedRoomsCount = filteredRooms.reduce((sum, r) => sum + r.bookedCount, 0)
  const totalRoomsCount = filteredRooms.reduce((sum, r) => sum + (r.count || 0), 0)

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Available Rooms</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">View and manage room availability</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-blue-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Total Rooms</p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900">{totalRoomsCount}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-green-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Available</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">{availableRoomsCount}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-red-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Booked</p>
            <p className="text-xl lg:text-2xl font-bold text-red-600">{bookedRoomsCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Rooms</option>
              <option value="available">Fully Available</option>
              <option value="partial">Partially Available</option>
              <option value="booked">Fully Booked</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Next 7 Days</option>
              <option value="custom">Custom Date</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Custom Date */}
          {dateFilter === 'custom' && (
            <div className="relative">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Showing availability for: <span className="font-semibold text-gray-900">{getDateDisplay()}</span>
          </p>
        </div>
      </div>

      {/* Room Cards */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-3">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Bed size={20} />
            Room Availability ({filteredRooms.length} room types)
          </h2>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Bed size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-base font-semibold mb-1">No rooms found</p>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No room types available'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <div 
                key={room._id} 
                className={`rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  room.status === 'available' ? 'border-green-200 bg-green-50' :
                  room.status === 'booked' ? 'border-red-200 bg-red-50' :
                  'border-amber-200 bg-amber-50'
                }`}
              >
                {/* Image */}
                {room.image && (
                  <div className="h-32 bg-gray-200 overflow-hidden">
                    <img 
                      src={room.image} 
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-base text-gray-900">{room.title}</h3>
                    {getStatusBadge(room.status, room.availableCount, room.count)}
                  </div>

                  {room.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{room.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-0.5">Total</p>
                      <p className="text-lg font-bold text-gray-900">{room.count || 0}</p>
                    </div>
                    <div className={`rounded-lg p-2 border ${
                      room.availableCount > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'
                    }`}>
                      <p className="text-xs text-gray-600 mb-0.5">Available</p>
                      <p className={`text-lg font-bold ${
                        room.availableCount > 0 ? 'text-green-700' : 'text-gray-500'
                      }`}>{room.availableCount}</p>
                    </div>
                    <div className={`rounded-lg p-2 border ${
                      room.bookedCount > 0 ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'
                    }`}>
                      <p className="text-xs text-gray-600 mb-0.5">Booked</p>
                      <p className={`text-lg font-bold ${
                        room.bookedCount > 0 ? 'text-red-700' : 'text-gray-500'
                      }`}>{room.bookedCount}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>Max: {room.maxGuests || 'N/A'}</span>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ₹{room.basePrice?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
