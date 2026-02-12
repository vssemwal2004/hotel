import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../layouts/AdminLayout'
import api from '../../../utils/api'
import { 
  LogOut as LogOutIcon,
  Search, 
  Filter, 
  Calendar,
  User,
  Bed,
  ChevronDown,
  RefreshCw,
  Eye,
  Check,
  Clock,
  IndianRupee
} from 'lucide-react'

export default function CheckOutPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('week') // week, month, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [searchQuery, dateFilter, customStartDate, customEndDate, bookings])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/bookings')
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // First filter: Only show completed bookings (checked out)
    filtered = filtered.filter(b => {
      if (!b.checkOut) return false
      const checkOutDate = new Date(b.checkOut)
      checkOutDate.setHours(0, 0, 0, 0)
      
      // Show bookings where check-out date has passed
      return checkOutDate < now
    })

    // Filter by check-out date range
    if (dateFilter !== 'all') {
      filtered = filtered.filter(b => {
        if (!b.checkOut) return false
        const checkOutDate = new Date(b.checkOut)
        checkOutDate.setHours(0, 0, 0, 0)

        if (dateFilter === 'today') {
          return checkOutDate.getTime() === now.getTime()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return checkOutDate >= weekAgo && checkOutDate < now
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return checkOutDate >= monthAgo && checkOutDate < now
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          return checkOutDate >= start && checkOutDate <= end
        }
        return true
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b._id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by check-out date (most recent first)
    filtered.sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut))

    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    const safeStatus = typeof status === 'string' && status.length ? status : 'pending'
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[safeStatus] || styles.pending}`}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading check-outs...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LogOutIcon className="text-orange-600" size={24} />
            Completed Check-Outs
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">Guests who have completed their stay</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-2.5 border-l-4 border-orange-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Completed Stays</p>
            <p className="text-xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border-l-4 border-green-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Confirmed</p>
            <p className="text-xl font-bold text-green-600">{filteredBookings.filter(b => b.status === 'paid').length}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border-l-4 border-amber-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Pending</p>
            <p className="text-xl font-bold text-amber-600">{filteredBookings.filter(b => b.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border-l-4 border-purple-500 shadow-sm">
            <p className="text-xs text-gray-600 mb-0.5">Total Rooms</p>
            <p className="text-xl font-bold text-purple-600">
              {filteredBookings.reduce((sum, b) => sum + (b.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0)}
            </p>
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
              placeholder="Search by name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="custom">Custom Range</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="End Date"
              />
            </>
          )}
        </div>
      </div>

      {/* Check-Outs Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-3">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <LogOutIcon size={20} />
            Completed Stays ({filteredBookings.length})
          </h2>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <LogOutIcon size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-base font-semibold mb-1">No completed check-outs</p>
            <p className="text-gray-500 text-sm">
              {searchQuery || dateFilter !== 'all' ? 'Try adjusting your filters' : 'No completed bookings yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50 border-b-2 border-orange-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Guest</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Check-Out</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Nights</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Rooms</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-mono font-semibold text-gray-900">#{booking._id.slice(-6)}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{booking.user?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-600">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          {booking.nights || 1}N
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          <Bed size={12} />
                          {booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-base font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => router.push('/admin/bookings')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden p-3 space-y-3">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="bg-gradient-to-br from-white to-orange-50 rounded-lg border-2 border-orange-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{booking.user?.name || 'Guest'}</p>
                        <p className="text-xs text-gray-600">#{booking._id.slice(-6)}</p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-white rounded-lg p-2 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-0.5">Check-Out</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-orange-200">
                      <p className="text-xs text-gray-600 mb-0.5">Amount</p>
                      <p className="text-sm font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/admin/bookings')}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
