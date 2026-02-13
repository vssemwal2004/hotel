import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, Users, Bed, CheckCircle, XCircle, 
  AlertCircle, Package, IndianRupee, ChevronDown, ChevronUp,
  MapPin, Mail, Phone, FileText, Filter
} from 'lucide-react'
import Header from '../components/header'
import Footer from '../components/Footer'
import useAuth from '../hooks/useAuth'
import api from '../utils/api'

export default function BookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, current, past, cancelled
  const [expandedBooking, setExpandedBooking] = useState(null)
  const [dateFilter, setDateFilter] = useState('all') // today, week, month, custom, all
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/bookings/my-bookings')
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Razorpay payment handler for pending bookings
  const payWithRazorpay = async (booking) => {
    try {
      // Create order on backend
      const { data } = await api.post('/payments/create-order', { bookingId: booking._id })
      const { orderId, key, amount, currency } = data

      // Load Razorpay script if not present
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          s.onerror = reject
          document.body.appendChild(s)
        })
      }

      const options = {
        key,
        amount,
        currency,
        name: 'Hotel Krishna',
        description: `Booking #${booking._id.slice(-6).toUpperCase()}`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: { color: '#f59e0b' },
        handler: async function (resp) {
          try {
            const ver = await api.post('/payments/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              bookingId: booking._id
            })
            // Refresh bookings
            await fetchBookings()
            alert('Payment successful! Your booking is confirmed.')
          } catch (e) {
            alert(e?.response?.data?.message || 'Payment verification failed')
          }
        }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to initiate payment')
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'paid':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bg: 'bg-green-50', 
          border: 'border-green-200',
          label: 'Confirmed' 
        }
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50', 
          border: 'border-blue-200',
          label: 'Completed' 
        }
      case 'cancelled':
        return { 
          icon: XCircle, 
          color: 'text-red-600', 
          bg: 'bg-red-50', 
          border: 'border-red-200',
          label: 'Cancelled' 
        }
      default:
        return { 
          icon: AlertCircle, 
          color: 'text-amber-600', 
          bg: 'bg-amber-50', 
          border: 'border-amber-200',
          label: 'Pending Payment' 
        }
    }
  }

  const filterBookings = () => {
    const now = new Date()
    let filtered = bookings
    
    // Filter by tab (booking status/timing)
    switch (activeTab) {
      case 'current':
        filtered = filtered.filter(b => {
          const checkIn = new Date(b.checkIn)
          const checkOut = b.checkOut ? new Date(b.checkOut) : checkIn
          return (b.status === 'paid' || b.status === 'pending') && checkOut >= now
        })
        break
      case 'past':
        filtered = filtered.filter(b => {
          const checkOut = b.checkOut ? new Date(b.checkOut) : new Date(b.checkIn)
          return b.status === 'completed' || (checkOut < now && b.status !== 'cancelled')
        })
        break
      case 'cancelled':
        filtered = filtered.filter(b => b.status === 'cancelled')
        break
      default:
        break
    }

    // Filter by date range (booking created date)
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
        } else if (dateFilter === 'custom') {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(customEndDate)
            end.setHours(23, 59, 59, 999)
            return bookingDate >= start && bookingDate <= end
          }
          return true
        }
        return true
      })
    }
    
    return filtered
  }

  const filteredBookings = filterBookings()

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currentCount = bookings.filter(b => {
    const now = new Date()
    const checkIn = new Date(b.checkIn)
    const checkOut = b.checkOut ? new Date(b.checkOut) : checkIn
    return (b.status === 'paid' || b.status === 'pending') && checkOut >= now
  }).length

  const pastCount = bookings.filter(b => {
    const checkOut = b.checkOut ? new Date(b.checkOut) : new Date(b.checkIn)
    return b.status === 'completed' || (checkOut < new Date() && b.status !== 'cancelled')
  }).length

  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'current', label: 'Current', count: currentCount },
    { id: 'past', label: 'Past', count: pastCount },
    { id: 'cancelled', label: 'Cancelled', count: cancelledCount }
  ]

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <Header />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Your Bookings
            </h1>
            <p className="text-gray-600 text-base">
              View and manage all your reservations
            </p>
          </motion.div>

          {/* Date Range Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 bg-white rounded-lg shadow-md p-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Filter size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {dateFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="End Date"
                  />
                </>
              )}
            </div>
          </motion.div>

          {/* Tabs - compact, no horizontal scroll on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setExpandedBooking(null)
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Bookings List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 text-lg font-semibold">No bookings found</p>
                <p className="text-gray-500 text-sm mt-1">You haven't made any reservations yet</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((booking, index) => {
                  const statusInfo = getStatusInfo(booking.status)
                  const StatusIcon = statusInfo.icon
                  const isExpanded = expandedBooking === booking._id

                  return (
                    <motion.div
                      key={booking._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${statusInfo.border}`}
                    >
                      {/* Booking Header */}
                      <div 
                        onClick={() => setExpandedBooking(isExpanded ? null : booking._id)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left Section */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                                  Booking #{booking._id.slice(-6).toUpperCase()}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Booked on {formatDate(booking.createdAt)}
                                </p>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.border} border`}>
                                <StatusIcon size={16} className={statusInfo.color} />
                                <span className={`font-semibold text-xs ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Check-in */}
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-100">
                                  <Calendar size={16} className="text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Check-in</p>
                                  <p className="font-semibold text-sm text-gray-900">{formatDate(booking.checkIn)}</p>
                                  <p className="text-xs text-gray-600">{formatTime(booking.checkIn)}</p>
                                </div>
                              </div>

                              {/* Check-out */}
                              {booking.checkOut && (
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-blue-100">
                                    <Calendar size={16} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">Check-out</p>
                                    <p className="font-semibold text-sm text-gray-900">{formatDate(booking.checkOut)}</p>
                                    <p className="text-xs text-gray-600">{formatTime(booking.checkOut)}</p>
                                  </div>
                                </div>
                              )}

                              {/* Nights */}
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-100">
                                  <Clock size={16} className="text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Duration</p>
                                  <p className="font-semibold text-sm text-gray-900">
                                    {booking.fullDay ? 'Full Day' : `${booking.nights} Night${booking.nights > 1 ? 's' : ''}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Total */}
                          <div className="lg:text-right">
                            <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                            <div className="flex items-center justify-end gap-0.5 text-2xl font-bold text-amber-600">
                              <IndianRupee size={22} />
                              <span>{booking.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                              <span className="text-xs text-gray-600">
                                {isExpanded ? 'Hide' : 'View'} Details
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-amber-600" />
                              ) : (
                                <ChevronDown size={16} className="text-amber-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-4 bg-gradient-to-br from-gray-50 to-amber-50/30">
                              <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Bed className="text-amber-600" size={20} />
                                Room Details
                              </h4>
                              
                              <div className="space-y-3">
                                {booking.items.map((item, idx) => (
                                  <div 
                                    key={idx}
                                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h5 className="text-base font-bold text-gray-900">{item.title}</h5>
                                        <p className="text-xs text-gray-600">
                                          {item.quantity} Room{item.quantity > 1 ? 's' : ''}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-600">Room Total</p>
                                        <div className="flex items-center gap-0.5 text-lg font-bold text-amber-600">
                                          <IndianRupee size={16} />
                                          <span>{item.subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Guests */}
                                    {item.guests && item.guests.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                          <Users size={14} className="text-amber-600" />
                                          Guests ({item.guests.length})
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {item.guests.map((guest, gIdx) => (
                                            <div 
                                              key={gIdx}
                                              className="flex items-center gap-2 px-2.5 py-2 bg-amber-50 rounded-lg"
                                            >
                                              <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center">
                                                <span className="text-xs font-bold text-amber-700">
                                                  {guest.name.charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <div>
                                                <p className="text-xs font-semibold text-gray-900">{guest.name}</p>
                                                <p className="text-xs text-gray-600">
                                                  {guest.type === 'adult' ? 'Adult' : 'Child'} • {guest.age} years
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Action Buttons */}
                              {booking.status === 'pending' && (
                                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                  <button onClick={() => payWithRazorpay(booking)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg text-sm">
                                    Pay with Razorpay
                                  </button>
                                  <button className="px-4 py-2.5 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all border-2 border-red-200 text-sm">
                                    Cancel Booking
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
