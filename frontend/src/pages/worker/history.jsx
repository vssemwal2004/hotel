import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../../layouts/WorkerLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../../utils/api'
import { 
  Search, 
  CheckCircle, 
  Calendar,
  Home,
  Users,
  Download,
  Filter,
  CalendarDays,
  X
} from 'lucide-react'

export default function CustomerHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [fetching, setFetching] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState('all') // all | today | week | month | custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(false)

  const authorized = useMemo(() => {
    if (!user) return false
    return user.role === 'worker' || user.role === 'admin'
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  // Load completed bookings
  useEffect(() => {
    if (!authorized) return
    (async () => {
      try {
        setFetching(true)
        const { data } = await api.get('/bookings')
        // Only get completed bookings
        const completed = (data.bookings || []).filter(b => b.status === 'completed')
        setBookings(completed)
      } catch (e) {
        console.warn('Failed to fetch bookings', e?.response?.data || e?.message)
      } finally {
        setFetching(false)
      }
    })()
  }, [authorized])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { 
    day: '2-digit',
    month: 'short', 
    year: 'numeric'
  }) : '—'

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { 
    day: '2-digit',
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '—'

  // Filter bookings by date and search
  const filteredBookings = useMemo(() => {
    let list = [...bookings]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(b => 
        b._id?.toLowerCase().includes(q) ||
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q)
      )
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let fromDate = null
      let toDate = new Date(now.setHours(23, 59, 59, 999))

      if (dateFilter === 'today') {
        fromDate = new Date()
        fromDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'week') {
        fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - 7)
        fromDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'month') {
        fromDate = new Date()
        fromDate.setMonth(fromDate.getMonth() - 1)
        fromDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        fromDate = new Date(customStartDate)
        fromDate.setHours(0, 0, 0, 0)
        toDate = new Date(customEndDate)
        toDate.setHours(23, 59, 59, 999)
      }

      if (fromDate) {
        list = list.filter(b => {
          const bookingDate = b.updatedAt ? new Date(b.updatedAt) : (b.createdAt ? new Date(b.createdAt) : null)
          return bookingDate && bookingDate >= fromDate && bookingDate <= toDate
        })
      }
    }

    // Sort by date (newest first)
    list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))

    return list
  }, [bookings, searchQuery, dateFilter, customStartDate, customEndDate])

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredBookings.length
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.total || 0), 0)
    const totalRooms = filteredBookings.reduce((sum, b) => 
      sum + (b.items || []).reduce((s, it) => s + (it.quantity || 0), 0), 0
    )
    const totalGuests = filteredBookings.reduce((sum, b) => 
      sum + (b.items || []).reduce((s, it) => s + (it.guests?.length || 0), 0), 0
    )
    return { total, totalRevenue, totalRooms, totalGuests }
  }, [filteredBookings])

  // Download Excel
  const downloadExcel = () => {
    if (filteredBookings.length === 0) {
      alert('No data to export')
      return
    }

    // Prepare CSV data
    const headers = [
      'Booking ID',
      'Guest Name',
      'Guest Email',
      'Check-in Date',
      'Check-out Date',
      'Rooms',
      'Room Types',
      'Adults',
      'Children',
      'Total Amount',
      'Checkout Date'
    ]

    const rows = filteredBookings.map(b => {
      const roomTypes = (b.items || []).map(it => it.title).join(', ')
      const totalRooms = (b.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
      const adults = (b.items || []).reduce((s, it) => 
        s + (it.guests || []).filter(g => g.type === 'adult').length, 0)
      const children = (b.items || []).reduce((s, it) => 
        s + (it.guests || []).filter(g => g.type === 'child').length, 0)
      
      return [
        b._id,
        b.user?.name || '',
        b.user?.email || '',
        formatDate(b.checkIn),
        formatDate(b.checkOut),
        totalRooms,
        roomTypes,
        adults,
        children,
        b.total || 0,
        formatDateTime(b.updatedAt || b.createdAt)
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    const dateStr = dateFilter === 'custom' 
      ? `${customStartDate}_to_${customEndDate}`
      : dateFilter === 'all' ? 'all_time' : dateFilter
    link.setAttribute('download', `customer_history_${dateStr}_${new Date().toISOString().split('T')[0]}.csv`)
    
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      setDateFilter('custom')
      setShowCustomDate(false)
    } else {
      alert('Please select both start and end dates')
    }
  }

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading history...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Customers History</h1>
        <p className="text-gray-600">View checkout history and past guest records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
              <CheckCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total Checkouts</p>
              <p className="text-xl md:text-2xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-teal-200 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-teal-100 rounded-xl">
              <Home size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total Rooms</p>
              <p className="text-xl md:text-2xl font-bold text-teal-700">{stats.totalRooms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-purple-100 rounded-xl">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total Guests</p>
              <p className="text-xl md:text-2xl font-bold text-purple-700">{stats.totalGuests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-200 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-emerald-100 rounded-xl">
              <span className="text-emerald-600 font-bold text-lg">₹</span>
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm">Total Revenue</p>
              <p className="text-lg md:text-xl font-bold text-emerald-700">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-6 mb-6">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by guest name, email, or booking ID..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <button 
            onClick={downloadExcel}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            <span className="hidden md:inline">Download Excel</span>
            <span className="md:hidden">Export</span>
          </button>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filter by Date:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: '1 Week' },
              { key: 'month', label: '1 Month' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => {
                  setDateFilter(t.key)
                  setShowCustomDate(false)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  dateFilter === t.key 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomDate(!showCustomDate)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                dateFilter === 'custom' 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CalendarDays size={16} />
              Custom Date
            </button>
          </div>

          {/* Custom Date Picker */}
          {showCustomDate && (
            <div className="mt-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  onClick={handleCustomDateSubmit}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowCustomDate(false)
                    setCustomStartDate('')
                    setCustomEndDate('')
                    if (dateFilter === 'custom') setDateFilter('all')
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {dateFilter === 'custom' && customStartDate && customEndDate && (
                <p className="mt-2 text-sm text-teal-600 font-medium">
                  Showing: {formatDate(customStartDate)} - {formatDate(customEndDate)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredBookings.length}</span> checkout records
        {dateFilter !== 'all' && (
          <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium">
            {dateFilter === 'custom' ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}` : dateFilter}
          </span>
        )}
      </div>

      {/* Bookings Table */}
      {fetching ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout history...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No checkout records found</h3>
          <p className="text-gray-500">Try adjusting your search or date filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Booking ID</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Guest Details</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Stay Period</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Rooms</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Guests</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Checkout Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b, index) => {
                  const totalRooms = (b.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
                  const roomTypes = (b.items || []).map(it => it.title).join(', ')
                  const adults = (b.items || []).reduce((s, it) => 
                    s + (it.guests || []).filter(g => g.type === 'adult').length, 0)
                  const children = (b.items || []).reduce((s, it) => 
                    s + (it.guests || []).filter(g => g.type === 'child').length, 0)
                  
                  return (
                    <tr key={b._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {b._id.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{b.user?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{b.user?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{formatDate(b.checkIn)}</p>
                          <p className="text-gray-500">to {formatDate(b.checkOut)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{totalRooms} Room(s)</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]" title={roomTypes}>{roomTypes}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {adults}A
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {children}C
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-emerald-600">₹{(b.total || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {formatDateTime(b.updatedAt || b.createdAt)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filteredBookings.map((b) => {
              const totalRooms = (b.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
              const roomTypes = (b.items || []).map(it => it.title).join(', ')
              const adults = (b.items || []).reduce((s, it) => 
                s + (it.guests || []).filter(g => g.type === 'adult').length, 0)
              const children = (b.items || []).reduce((s, it) => 
                s + (it.guests || []).filter(g => g.type === 'child').length, 0)
              
              return (
                <div key={b._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{b.user?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{b.user?.email || 'N/A'}</p>
                    </div>
                    <span className="font-bold text-emerald-600">₹{(b.total || 0).toLocaleString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Check-in</p>
                      <p className="font-medium">{formatDate(b.checkIn)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500 text-xs">Check-out</p>
                      <p className="font-medium">{formatDate(b.checkOut)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                        {totalRooms} Rooms
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {adults}A {children}C
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(b.updatedAt || b.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </WorkerLayout>
  )
}
