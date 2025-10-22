import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, Users, Bed, CheckCircle, XCircle, 
  AlertCircle, Package, IndianRupee, ChevronDown, ChevronUp,
  MapPin, Mail, Phone, FileText
} from 'lucide-react'
import Header from '../components/Header'
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
    
    switch (activeTab) {
      case 'current':
        return bookings.filter(b => {
          const checkIn = new Date(b.checkIn)
          const checkOut = b.checkOut ? new Date(b.checkOut) : checkIn
          return (b.status === 'paid' || b.status === 'pending') && checkOut >= now
        })
      case 'past':
        return bookings.filter(b => {
          const checkOut = b.checkOut ? new Date(b.checkOut) : new Date(b.checkIn)
          return b.status === 'completed' || (checkOut < now && b.status !== 'cancelled')
        })
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled')
      default:
        return bookings
    }
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

  const tabs = [
    { id: 'all', label: 'All Bookings', count: bookings.length },
    { id: 'current', label: 'Current', count: filterBookings().length },
    { id: 'past', label: 'Past', count: bookings.filter(b => {
      const checkOut = b.checkOut ? new Date(b.checkOut) : new Date(b.checkIn)
      return b.status === 'completed' || (checkOut < new Date() && b.status !== 'cancelled')
    }).length },
    { id: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
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
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Your Bookings
            </h1>
            <p className="text-gray-600 text-lg">
              View and manage all your reservations
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex overflow-x-auto gap-2 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setExpandedBooking(null)
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-amber-50 shadow-md hover:shadow-lg'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Bookings List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading your bookings...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 rounded-full bg-amber-100 mb-6">
                <Calendar size={48} className="text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600 mb-8">
                {activeTab === 'all' 
                  ? "You haven't made any bookings yet" 
                  : `No ${activeTab} bookings found`}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
              >
                Book a Room
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
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
                      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${statusInfo.border}`}
                    >
                      {/* Booking Header */}
                      <div 
                        onClick={() => setExpandedBooking(isExpanded ? null : booking._id)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left Section */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  Booking #{booking._id.slice(-6).toUpperCase()}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Booked on {formatDate(booking.createdAt)}
                                </p>
                              </div>
                              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg} ${statusInfo.border} border`}>
                                <StatusIcon size={18} className={statusInfo.color} />
                                <span className={`font-semibold text-sm ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Booking Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Check-in */}
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-amber-100">
                                  <Calendar size={20} className="text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Check-in</p>
                                  <p className="font-semibold text-gray-900">{formatDate(booking.checkIn)}</p>
                                  <p className="text-xs text-gray-600">{formatTime(booking.checkIn)}</p>
                                </div>
                              </div>

                              {/* Check-out */}
                              {booking.checkOut && (
                                <div className="flex items-center gap-3">
                                  <div className="p-3 rounded-lg bg-blue-100">
                                    <Calendar size={20} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">Check-out</p>
                                    <p className="font-semibold text-gray-900">{formatDate(booking.checkOut)}</p>
                                    <p className="text-xs text-gray-600">{formatTime(booking.checkOut)}</p>
                                  </div>
                                </div>
                              )}

                              {/* Nights */}
                              <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-100">
                                  <Clock size={20} className="text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium">Duration</p>
                                  <p className="font-semibold text-gray-900">
                                    {booking.fullDay ? 'Full Day' : `${booking.nights} Night${booking.nights > 1 ? 's' : ''}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Total */}
                          <div className="lg:text-right">
                            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                            <div className="flex items-center justify-end gap-1 text-3xl font-bold text-amber-600">
                              <IndianRupee size={28} />
                              <span>{booking.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <span className="text-sm text-gray-600">
                                {isExpanded ? 'Hide' : 'View'} Details
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={20} className="text-amber-600" />
                              ) : (
                                <ChevronDown size={20} className="text-amber-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-amber-50/30">
                              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Bed className="text-amber-600" size={24} />
                                Room Details
                              </h4>
                              
                              <div className="space-y-4">
                                {booking.items.map((item, idx) => (
                                  <div 
                                    key={idx}
                                    className="bg-white rounded-xl p-5 shadow-md border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h5 className="text-lg font-bold text-gray-900">{item.title}</h5>
                                        <p className="text-sm text-gray-600">
                                          {item.quantity} Room{item.quantity > 1 ? 's' : ''}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-600">Room Total</p>
                                        <div className="flex items-center gap-1 text-xl font-bold text-amber-600">
                                          <IndianRupee size={18} />
                                          <span>{item.subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Guests */}
                                    {item.guests && item.guests.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                          <Users size={16} className="text-amber-600" />
                                          Guests ({item.guests.length})
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {item.guests.map((guest, gIdx) => (
                                            <div 
                                              key={gIdx}
                                              className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg"
                                            >
                                              <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                                                <span className="text-xs font-bold text-amber-700">
                                                  {guest.name.charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
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
                                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                  <button className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl">
                                    Complete Payment
                                  </button>
                                  <button className="px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all border-2 border-red-200">
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
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
