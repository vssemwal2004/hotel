import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  Eye, 
  Check, 
  X,
  Clock,
  IndianRupee,
  Bed,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { 
  CalendarCheck,
  Users,
  Utensils
} from 'lucide-react'

export default function AdminBookings(){
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [searchQuery, statusFilter, bookings])

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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b._id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    setFilteredBookings(filtered)
  }

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200'
    }
    const icons = {
      paid: Check,
      pending: Clock,
      failed: X
    }
    const safeStatus = typeof status === 'string' && status.length ? status : 'pending'
    const Icon = icons[safeStatus] || Clock
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${styles[safeStatus] || styles.pending}`}>
        <Icon size={14} />
        {safeStatus.slice(0,1).toUpperCase() + safeStatus.slice(1)}
      </span>
    )
  }

  const BookingDetailsModal = ({ booking, onClose }) => {
    if (!booking) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl shadow-lg z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">Booking Details</h3>
                <p className="text-blue-100 text-sm">ID: #{booking._id?.slice(-8) || 'N/A'} • {new Date(booking.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Status Banner */}
            {(() => {
              const payStatus = (typeof booking.paymentStatus === 'string' && booking.paymentStatus.length)
                ? booking.paymentStatus
                : 'pending'
              return (
                <div className={`rounded-xl p-4 border-2 ${
                  payStatus === 'paid'
                    ? 'bg-green-50 border-green-200'
                    : payStatus === 'pending'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {payStatus === 'paid' && <Check size={24} className="text-green-600" />}
                      {payStatus === 'pending' && <Clock size={24} className="text-amber-600" />}
                      {payStatus === 'failed' && <X size={24} className="text-red-600" />}
                      <div>
                        <p className="font-bold text-gray-900">Payment {payStatus.slice(0,1).toUpperCase() + payStatus.slice(1)}</p>
                        <p className="text-sm text-gray-600">
                          {payStatus === 'paid' && 'This booking has been confirmed and paid'}
                          {payStatus === 'pending' && 'Awaiting payment confirmation'}
                          {payStatus === 'failed' && 'Payment failed or was cancelled'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(payStatus)}
                  </div>
                </div>
              )
            })()}

            {/* Guest Info */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-5 border-2 border-blue-100">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900 text-lg">{booking.user?.name || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Email Address</p>
                  <p className="font-semibold text-gray-900">{booking.user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-100">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-purple-600" />
                Booking Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Check-in Date & Time</p>
                  <p className="font-semibold text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{new Date(booking.checkIn).toLocaleTimeString()}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Check-out Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {booking.fullDay ? 'Same Day (Full Day)' : new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  {!booking.fullDay && (
                    <p className="text-sm text-gray-600">{new Date(booking.checkOut).toLocaleTimeString()}</p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Total Nights</p>
                  <p className="font-semibold text-gray-900 text-2xl">{booking.nights || 1}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Booking Date</p>
                  <p className="font-semibold text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{new Date(booking.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div>
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bed size={20} className="text-amber-600" />
                Room Details ({booking.items?.length || 0} room type{booking.items?.length > 1 ? 's' : ''})
              </h4>
              <div className="space-y-3">
                {booking.items?.map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h5>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-xs bg-white px-3 py-1 rounded-full border-2 border-amber-300 font-semibold text-amber-700">
                            <Bed size={14} />
                            Quantity: {item.quantity}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-white px-3 py-1 rounded-full border-2 border-blue-300 font-semibold text-blue-700">
                            <Users size={14} />
                            {item.guests?.length || 0} Guests
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-white px-3 py-1 rounded-full border-2 border-green-300 font-semibold text-green-700">
                            <Utensils size={14} />
                            {item.packageType === 'roomOnly' && 'Room Only'}
                            {item.packageType === 'roomBreakfast' && 'Room + Breakfast'}
                            {item.packageType === 'roomBreakfastDinner' && 'Full Board'}
                          </span>
                        </div>
                        {item.guests && item.guests.length > 0 && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-amber-300">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Guest Details:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {item.guests.map((guest, gIdx) => (
                                <div key={gIdx} className="text-xs bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                  <p className="font-semibold text-gray-900">{guest.name}</p>
                                  <p className="text-gray-600">{guest.age}y • {guest.type}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-600 mb-1">Room Total</p>
                        <p className="text-2xl font-bold text-green-600">₹{(item.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-green-600" />
                Payment Summary
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <span className="text-gray-700 font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <span className="text-gray-700 font-medium">Taxes & Fees</span>
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <Check size={16} />
                    Included
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-3xl font-bold">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-md"
              >
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all hotel bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm md:text-base transition-colors shadow-lg"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 md:mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-xl p-3 lg:p-5 border-l-4 border-blue-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 lg:p-5 border-l-4 border-green-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-3xl font-bold text-green-600">{bookings.filter(b => b.paymentStatus === 'paid').length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 lg:p-5 border-l-4 border-amber-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-600">{bookings.filter(b => b.paymentStatus === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 lg:p-5 border-l-4 border-purple-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-purple-600">
            ₹{bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0).toLocaleString()}
          </p>
        </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by guest name, email or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <CalendarCheck size={24} />
            All Bookings ({filteredBookings.length})
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            {statusFilter !== 'all' ? `Showing ${statusFilter} bookings` : 'All booking records'}
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-xl font-semibold mb-2">No bookings found</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Bookings will appear here when customers make reservations'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nights</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rooms</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-mono font-semibold text-gray-900">#{booking._id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{booking.user?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-600">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.checkIn).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          <Calendar size={14} />
                          {booking.nights || 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          <Bed size={14} />
                          {booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xl font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4 space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-100 overflow-hidden shadow-md">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                          {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                        </div>
                        <div>
                          <p className="font-bold">{booking.user?.name || 'Guest'}</p>
                          <p className="text-xs text-blue-200">#{booking._id.slice(-8)}</p>
                        </div>
                      </div>
                      {getStatusBadge(booking.paymentStatus)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Check-in</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(booking.checkIn).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Nights</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.nights || 1}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">Rooms</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 mb-1">Amount</p>
                        <p className="text-lg font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-md"
                    >
                      <Eye size={18} />
                      View Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </AdminLayout>
  )
}
