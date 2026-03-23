import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import { useToast } from '../../components/ToastProvider'
import * as XLSX from 'xlsx'
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  Eye, 
  Check, 
  CheckCircle,
  LogIn,
  X,
  Clock,
  IndianRupee,
  Bed,
  ChevronDown,
  RefreshCw,
  Download,
  XCircle,
  Pencil
} from 'lucide-react'
import { 
  CalendarCheck,
  Users,
  Utensils
} from 'lucide-react'

export default function AdminBookings(){
  const router = useRouter()
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all') // today, week, month, custom, all
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all') // all, upcoming, current, past
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [checkoutTarget, setCheckoutTarget] = useState(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkingInId, setCheckingInId] = useState(null)
  const [checkinTarget, setCheckinTarget] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  // Refresh after returning from edit-booking
  useEffect(() => {
    const refreshIfEdited = async () => {
      let updatedId = null
      try { updatedId = sessionStorage.getItem('booking_updated_id') } catch {}
      if (!updatedId) return
      const list = await fetchBookings()
      try {
        sessionStorage.removeItem('booking_updated_id')
        sessionStorage.removeItem('booking_updated_at')
      } catch {}
      if (selectedBooking?._id && selectedBooking._id === updatedId && Array.isArray(list)) {
        const fresh = list.find(b => b._id === updatedId)
        if (fresh) setSelectedBooking(fresh)
      }
    }
    refreshIfEdited()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [searchQuery, statusFilter, dateFilter, customStartDate, customEndDate, bookingTypeFilter, bookings])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/bookings')
      const list = data.bookings || []
      setBookings(list)
      return list
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/pay`)
      toast.show({ type: 'success', title: 'Marked Paid', message: 'Booking has been marked as paid.' })
      const list = await fetchBookings()
      if (selectedBooking?._id && selectedBooking._id === bookingId && Array.isArray(list)) {
        const fresh = list.find(b => b._id === bookingId)
        if (fresh) setSelectedBooking(fresh)
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to mark as paid' })
    }
  }

  const handleCancelBooking = async (bookingId) => {
    setCancelling(true)
    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      toast.show({ type: 'success', title: 'Cancelled', message: 'Booking has been cancelled successfully' })
      setCancelConfirmId(null)
      await fetchBookings()
    } catch (err) {
      toast.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to cancel booking' })
    } finally {
      setCancelling(false)
    }
  }

  const handleCheckoutBooking = async (bookingId) => {
    setCheckingOut(true)
    try {
      await api.post(`/bookings/${bookingId}/checkout`)
      toast.show({ type: 'success', title: 'Checked Out', message: 'Guest has been checked out successfully.' })
      setCheckoutTarget(null)
      const list = await fetchBookings()
      if (selectedBooking?._id && selectedBooking._id === bookingId && Array.isArray(list)) {
        const fresh = list.find(b => b._id === bookingId)
        if (fresh) setSelectedBooking(fresh)
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to check out guest' })
    } finally {
      setCheckingOut(false)
    }
  }

  const canCheckInNow = (booking) => {
    if (!booking) return false
    if (booking.status === 'cancelled' || booking.status === 'completed') return false
    if (booking.checkedInAt) return false
    if (!booking.checkIn) return false

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const ci = new Date(booking.checkIn)
    if (Number.isNaN(ci.getTime())) return false
    ci.setHours(0, 0, 0, 0)

    let co = booking.checkOut ? new Date(booking.checkOut) : null
    if (!co || Number.isNaN(co.getTime())) {
      co = new Date(ci.getTime() + 24 * 60 * 60 * 1000)
    }
    co.setHours(0, 0, 0, 0)

    return ci <= today && co >= today
  }

  const canCheckoutNow = (booking) => {
    if (!booking) return false
    if (booking.status !== 'paid') return false
    return !!booking.checkedInAt
  }

  const handleCheckInBooking = async (bookingId) => {
    setCheckingInId(bookingId)
    try {
      await api.post(`/bookings/${bookingId}/checkin`)
      toast.show({ type: 'success', title: 'Checked In', message: 'Guest has been checked in successfully.' })
      setCheckinTarget(null)
      const list = await fetchBookings()
      if (selectedBooking?._id && selectedBooking._id === bookingId && Array.isArray(list)) {
        const fresh = list.find(b => b._id === bookingId)
        if (fresh) setSelectedBooking(fresh)
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'Error', message: err?.response?.data?.message || 'Failed to check in guest' })
    } finally {
      setCheckingInId(null)
    }
  }

  const filterBookings = () => {
    let filtered = [...bookings]
    const now = new Date()

    // Filter by payment status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter)
    }

    // Filter by booking type (upcoming, current, past)
    if (bookingTypeFilter !== 'all') {
      filtered = filtered.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = b.checkOut ? new Date(b.checkOut) : checkIn
        
        if (bookingTypeFilter === 'upcoming') {
          return checkIn > now
        } else if (bookingTypeFilter === 'current') {
          return checkIn <= now && checkOut >= now
        } else if (bookingTypeFilter === 'past') {
          return checkOut < now
        }
        return true
      })
    }

    // Filter by date range
    if (dateFilter !== 'all') {
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.createdAt)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateFilter === 'today') {
          const bookingDay = new Date(bookingDate)
          bookingDay.setHours(0, 0, 0, 0)
          return bookingDay.getTime() === today.getTime()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return bookingDate >= weekAgo
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return bookingDate >= monthAgo
        } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
          const start = new Date(customStartDate)
          const end = new Date(customEndDate)
          end.setHours(23, 59, 59, 999)
          return bookingDate >= start && bookingDate <= end
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

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

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
    const icons = {
      paid: Check,
      pending: Clock,
      failed: X,
      completed: Check,
      cancelled: X
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

  const exportToExcel = () => {
    const rows = filteredBookings.map(b => ({
      'Guest Name':     b.user?.name || '',
      'Email':          b.user?.email || '',
      'Phone':          b.user?.phone || '',
      'Room Type':      (b.items || []).map(i => `${i.title} x${i.quantity}`).join(' | '),
      'Check-In':       new Date(b.checkIn).toLocaleDateString(),
      'Check-Out':      b.fullDay ? 'Same Day' : new Date(b.checkOut).toLocaleDateString(),
      'Status':         b.status || '',
      'Amount':         b.totalAmount || b.total || 0,
      'Payment Method': b.payment?.paymentId ? 'Online' : 'N/A',
      'Booking Date':   new Date(b.createdAt).toLocaleDateString(),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      {wch:20},{wch:28},{wch:14},{wch:30},{wch:14},
      {wch:14},{wch:12},{wch:12},{wch:16},{wch:14}
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
    const statusLabel = statusFilter !== 'all' ? `_${statusFilter}` : ''
    XLSX.writeFile(wb, `HotelKrishna_Bookings${statusLabel}.xlsx`)
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
              const payStatus = (typeof booking.status === 'string' && booking.status.length)
                ? booking.status
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
                    {booking.checkOut
                      ? new Date(booking.checkOut).toLocaleDateString()
                      : (booking.fullDay ? 'Same Day (Full Day)' : '—')}
                  </p>
                  {booking.checkOut && (
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
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <span className="text-gray-700 font-medium">Paid</span>
                  <span className="font-semibold text-gray-900">₹{(booking.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <span className="text-gray-700 font-medium">Remaining Due</span>
                  <span className="font-semibold text-gray-900">₹{Math.max(0, (booking.totalAmount || booking.total || 0) - (booking.amountPaid || 0)).toLocaleString()}</span>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5">View and manage all hotel bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
        <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-blue-500 shadow-sm">
          <p className="text-xs text-gray-600 mb-0.5">Total</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-green-500 shadow-sm">
          <p className="text-xs text-gray-600 mb-0.5">Paid</p>
          <p className="text-xl lg:text-2xl font-bold text-green-600">{filteredBookings.filter(b => b.status === 'paid').length}</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-amber-500 shadow-sm">
          <p className="text-xs text-gray-600 mb-0.5">Pending</p>
          <p className="text-xl lg:text-2xl font-bold text-amber-600">{filteredBookings.filter(b => b.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-purple-500 shadow-sm">
          <p className="text-xs text-gray-600 mb-0.5">Revenue</p>
          <p className="text-lg lg:text-xl font-bold text-purple-600">
            ₹{filteredBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2.5 lg:p-3 border-l-4 border-indigo-500 shadow-sm">
          <p className="text-xs text-gray-600 mb-0.5">Avg. Value</p>
          <p className="text-lg lg:text-xl font-bold text-indigo-600">
            ₹{filteredBookings.filter(b => b.status === 'paid').length > 0 
              ? Math.round(filteredBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0) / filteredBookings.filter(b => b.status === 'paid').length).toLocaleString()
              : '0'}
          </p>
        </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="relative">
            <Filter size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Booking Type Filter */}
          <div className="relative">
            <Clock size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={bookingTypeFilter}
              onChange={(e) => setBookingTypeFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="current">Current</option>
              <option value="past">Past</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <Calendar size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <>
              <div className="relative">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-3 flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <CalendarCheck size={20} />
              All Bookings ({filteredBookings.length})
            </h2>
            <p className="text-slate-300 text-xs mt-0.5">
              {statusFilter !== 'all' ? `Showing ${statusFilter} bookings` : 'All booking records'}
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Download size={14} /> Export Excel
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 text-base font-semibold mb-1">No bookings found</p>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Bookings will appear here when customers make reservations'}
            </p>
            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all' || bookingTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setDateFilter('all')
                  setBookingTypeFilter('all')
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
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
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Guest</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Check-in</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nights</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rooms</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredBookings.map((booking) => {
                    const totalAmount = (booking.totalAmount || booking.total || 0)
                    const amountPaid = (booking.amountPaid || 0)
                    const paymentDue = totalAmount > amountPaid
                    const showMarkPaid = booking.status === 'pending' && paymentDue
                    const showEdit = (booking.status === 'pending' || booking.status === 'paid')
                    const showCancel = (booking.status === 'pending' || booking.status === 'paid')
                    const showCheckIn = (booking.status === 'pending' || booking.status === 'paid')
                    const showCheckout = (booking.status === 'pending' || booking.status === 'paid')
                    const checkinEnabled = canCheckInNow(booking)
                    const checkoutEnabled = canCheckoutNow(booking)

                    return (
                      <tr key={booking._id} className={`${booking.checkedInAt ? 'bg-emerald-50/60' : ''} hover:bg-blue-50 transition-colors`}>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-xs font-mono font-semibold text-gray-900">#{booking._id.slice(-6)}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{booking.user?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-600">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium text-gray-900">{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                        <p className="text-xs text-gray-500">{new Date(booking.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          <Calendar size={12} />
                          {booking.nights || 1}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                          <Bed size={12} />
                          {booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="text-base font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                        {Math.max(0, (booking.totalAmount || booking.total || 0) - (booking.amountPaid || 0)) > 0 && (
                          <p className="text-xs font-bold text-amber-700">Due ₹{Math.max(0, (booking.totalAmount || booking.total || 0) - (booking.amountPaid || 0)).toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            title="View"
                          >
                            <Eye size={14} /> View
                          </button>

                          {showEdit && (
                            <button
                              onClick={() => router.push(`/admin/bookings/edit-booking?id=${booking._id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          )}

                          {showCancel && (
                            <button
                              onClick={() => setCancelConfirmId(booking._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              title="Cancel"
                            >
                              <XCircle size={14} /> Cancel
                            </button>
                          )}

                          {showCheckIn && (
                            <button
                              onClick={() => checkinEnabled ? setCheckinTarget(booking) : null}
                              disabled={!checkinEnabled || checkingInId === booking._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={checkinEnabled ? 'Check-In' : 'Check-In is available on/after check-in date'}
                            >
                              <LogIn size={14} /> {checkingInId === booking._id ? 'Checking…' : 'Check-In'}
                            </button>
                          )}

                          {showCheckout && (
                            <button
                              onClick={() => checkoutEnabled ? setCheckoutTarget(booking) : null}
                              disabled={!checkoutEnabled}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={checkoutEnabled ? 'Check-Out' : 'Check-Out is enabled only after Check-In (and payment is paid)'}
                            >
                              <CheckCircle size={14} /> Check-Out
                            </button>
                          )}

                          {showMarkPaid && (
                            <button
                              onClick={() => handleMarkPaid(booking._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              title="Mark Paid"
                            >
                              <CheckCircle size={14} /> Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-3 space-y-3">
              {filteredBookings.map((booking) => {
                const totalAmount = (booking.totalAmount || booking.total || 0)
                const amountPaid = (booking.amountPaid || 0)
                const paymentDue = totalAmount > amountPaid
                const showMarkPaid = booking.status === 'pending' && paymentDue
                const showEdit = (booking.status === 'pending' || booking.status === 'paid')
                const showCancel = (booking.status === 'pending' || booking.status === 'paid')
                const showCheckIn = (booking.status === 'pending' || booking.status === 'paid')
                const showCheckout = (booking.status === 'pending' || booking.status === 'paid')
                const checkinEnabled = canCheckInNow(booking)
                const checkoutEnabled = canCheckoutNow(booking)

                return (
                  <div key={booking._id} className={`bg-gradient-to-br from-white to-blue-50 rounded-lg border-2 ${booking.checkedInAt ? 'border-emerald-200 bg-emerald-50/30' : 'border-blue-100'} overflow-hidden shadow-sm`}>
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                          {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{booking.user?.name || 'Guest'}</p>
                          <p className="text-xs text-blue-200">#{booking._id.slice(-6)}</p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg p-2 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-0.5">Check-in</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-0.5">Nights</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.nights || 1}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-blue-200">
                        <p className="text-xs text-gray-600 mb-0.5">Rooms</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-green-200">
                        <p className="text-xs text-gray-600 mb-0.5">Amount</p>
                        <p className="text-base font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                        {Math.max(0, (booking.totalAmount || booking.total || 0) - (booking.amountPaid || 0)) > 0 && (
                          <p className="text-xs font-bold text-amber-700">Due ₹{Math.max(0, (booking.totalAmount || booking.total || 0) - (booking.amountPaid || 0)).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        <Eye size={16} /> View
                      </button>

                      {showEdit && (
                        <button
                          onClick={() => router.push(`/admin/bookings/edit-booking?id=${booking._id}`)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          <Pencil size={16} /> Edit
                        </button>
                      )}

                      {showCancel && (
                        <button
                          onClick={() => setCancelConfirmId(booking._id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          <XCircle size={16} /> Cancel
                        </button>
                      )}

                      {showCheckIn && (
                        <button
                          onClick={() => checkinEnabled ? setCheckinTarget(booking) : null}
                          disabled={!checkinEnabled || checkingInId === booking._id}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LogIn size={16} /> {checkingInId === booking._id ? 'Checking…' : 'Check-In'}
                        </button>
                      )}

                      {showCheckout && (
                        <button
                          onClick={() => checkoutEnabled ? setCheckoutTarget(booking) : null}
                          disabled={!checkoutEnabled}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} /> Check-Out
                        </button>
                      )}

                      {showMarkPaid && (
                        <button
                          onClick={() => handleMarkPaid(booking._id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          <CheckCircle size={16} /> Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
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

      {/* Check-In Confirmation Modal */}
      {checkinTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => checkingInId !== checkinTarget?._id && setCheckinTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <LogIn size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Check-In Guest</h3>
                  <p className="text-emerald-100 text-sm">Marks guest as arrived</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <p className="text-sm text-gray-600 mb-1">Are you sure you want to check in this booking?</p>
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-gray-500">Guest</span><span className="font-semibold text-gray-900 text-right">{checkinTarget.user?.name || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Email</span><span className="font-semibold text-gray-900 text-right break-all">{checkinTarget.user?.email || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Check-in</span><span className="font-semibold text-gray-900 text-right">{checkinTarget.checkIn ? new Date(checkinTarget.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Check-out</span><span className="font-semibold text-gray-900 text-right">{checkinTarget.checkOut ? new Date(checkinTarget.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (checkinTarget.fullDay ? 'Same Day' : '—')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Rooms</span><span className="font-semibold text-gray-900 text-right">{(checkinTarget.items || []).map(i => `${i.title} x${i.quantity}`).join(', ') || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900 text-right">₹{((checkinTarget.totalAmount || checkinTarget.total) || 0).toLocaleString()}</span></div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleCheckInBooking(checkinTarget._id)}
                  disabled={checkingInId === checkinTarget._id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  {checkingInId === checkinTarget._id ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking in...</>
                  ) : (
                    <><LogIn size={16} /> Yes, Check-In</>
                  )}
                </button>
                <button
                  onClick={() => setCheckinTarget(null)}
                  disabled={checkingInId === checkinTarget._id}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !cancelling && setCancelConfirmId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <XCircle size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cancel Booking</h3>
                  <p className="text-rose-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-1">Are you sure you want to cancel this booking?</p>
              <p className="text-xs text-gray-400 mb-4">Cancellation emails will be sent to the guest and admin. If the booking was paid, the room count will be restored.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCancelBooking(cancelConfirmId)}
                  disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  {cancelling ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Cancelling...</>
                  ) : (
                    <><XCircle size={16} /> Yes, Cancel Booking</>
                  )}
                </button>
                <button
                  onClick={() => setCancelConfirmId(null)}
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Confirmation Modal */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !checkingOut && setCheckoutTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Check-Out Guest</h3>
                  <p className="text-emerald-100 text-sm">Marks the stay as completed</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-1">Are you sure you want to check out this booking?</p>
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-gray-500">Guest</span><span className="font-semibold text-gray-900 text-right">{checkoutTarget.user?.name || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Email</span><span className="font-semibold text-gray-900 text-right break-all">{checkoutTarget.user?.email || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Check-in</span><span className="font-semibold text-gray-900 text-right">{checkoutTarget.checkIn ? new Date(checkoutTarget.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Check-out</span><span className="font-semibold text-gray-900 text-right">{checkoutTarget.checkOut ? new Date(checkoutTarget.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (checkoutTarget.fullDay ? 'Same Day' : '—')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Rooms</span><span className="font-semibold text-gray-900 text-right">{(checkoutTarget.items || []).map(i => `${i.title} x${i.quantity}`).join(', ') || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-900 text-right">₹{((checkoutTarget.totalAmount || checkoutTarget.total) || 0).toLocaleString()}</span></div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleCheckoutBooking(checkoutTarget._id)}
                  disabled={checkingOut}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  {checkingOut ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking out...</>
                  ) : (
                    <><CheckCircle size={16} /> Yes, Check-Out</>
                  )}
                </button>
                <button
                  onClick={() => setCheckoutTarget(null)}
                  disabled={checkingOut}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
