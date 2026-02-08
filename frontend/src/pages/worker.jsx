import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../layouts/WorkerLayout'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../utils/api'
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign, 
  Users, 
  Calendar,
  Home,
  Filter
} from 'lucide-react'

export default function WorkerPage(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [all, setAll] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all') // all | day | week | month

  const authorized = useMemo(() => {
    if (!user) return false
    return user.role === 'worker' || user.role === 'admin'
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  // Load all bookings on mount for worker/admin
  useEffect(() => {
    if (!authorized) return
    (async () => {
      try {
        const { data } = await api.get('/bookings')
        setAll(data.bookings || [])
      } catch (e) {
        console.warn('Failed to fetch all bookings', e?.response?.data || e?.message)
      }
    })()
  }, [authorized])

  const doSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) {
      setResults([])
      return
    }
    setError('')
    setSearching(true)
    try {
      const { data } = await api.get('/bookings/search', { params: { q: query.trim() } })
      setResults(data.bookings || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const markPaid = async (id) => {
    try {
      await api.post(`/bookings/${id}/pay`)
      setResults(prev => prev.map(b => b._id === id ? { ...b, status: 'paid' } : b))
      setAll(prev => prev.map(b => b._id === id ? { ...b, status: 'paid' } : b))
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark as paid')
    }
  }

  const checkout = async (id) => {
    try {
      await api.post(`/bookings/${id}/checkout`)
      setResults(prev => prev.map(b => b._id === id ? { ...b, status: 'completed' } : b))
      setAll(prev => prev.map(b => b._id === id ? { ...b, status: 'completed' } : b))
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to checkout')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '—'

  // Card/UI styles per status to make the whole tab clearly distinct
  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return {
          card: 'bg-amber-50 border-amber-200 text-black',
          header: 'from-amber-50 to-amber-100',
          amountText: 'text-amber-800',
          actionBtn: 'bg-amber-600 hover:bg-amber-700 text-black', // dark yellow
          actionGradient: '',
          checkedLabel: 'bg-amber-100 text-amber-800 border-amber-300'
        }
      case 'paid':
        return {
          card: 'bg-emerald-50 border-emerald-200',
          header: 'from-emerald-50 to-green-50',
          amountText: 'text-emerald-700',
          actionBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white', // dark green
          actionGradient: '',
          checkedLabel: 'bg-emerald-100 text-emerald-700 border-emerald-300'
        }
      case 'completed':
        return {
          card: 'bg-blue-50 border-blue-200',
          header: 'from-blue-50 to-indigo-50',
          amountText: 'text-blue-700',
          actionBtn: 'bg-blue-700 hover:bg-blue-800 text-white', // not used here
          actionGradient: '',
          checkedLabel: 'bg-blue-600 text-white border-blue-700'
        }
      default:
        return {
          card: 'bg-white border-gray-100',
          header: 'from-teal-50 to-emerald-50',
          amountText: 'text-teal-700',
          actionBtn: 'bg-teal-600 hover:bg-teal-700 text-white',
          actionGradient: '',
          checkedLabel: 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }
  }

  // Status badge styling
  const getStatusBadge = (status) => {
    const configs = {
      pending: { 
        bg: 'bg-amber-100', 
        text: 'text-amber-700', 
        border: 'border-amber-300',
        icon: Clock,
        label: 'Pending' 
      },
      paid: { 
        bg: 'bg-emerald-100', 
        text: 'text-emerald-700', 
        border: 'border-emerald-300',
        icon: CheckCircle,
        label: 'Paid' 
      },
      completed: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        border: 'border-blue-300',
        icon: CheckCircle,
        label: 'Completed' 
      },
      cancelled: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        border: 'border-red-300',
        icon: XCircle,
        label: 'Cancelled' 
      }
    }
    const config = configs[status] || configs.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={16} />
        {config.label}
      </span>
    )
  }

  // Filter bookings by status (exclude completed - moved to history page)
  const displayBookings = useMemo(() => {
    let list = results.length === 0 ? all : results
    // Exclude completed bookings - they are shown in Customers History page
    list = list.filter(b => b.status !== 'completed')
    
    // status filter
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter)

    // time filter (based on createdAt)
    if (timeFilter !== 'all') {
      const now = new Date()
      const from = new Date(now)
      if (timeFilter === 'day') {
        from.setDate(now.getDate() - 1)
      } else if (timeFilter === 'week') {
        from.setDate(now.getDate() - 7)
      } else if (timeFilter === 'month') {
        from.setMonth(now.getMonth() - 1)
      }
      list = list.filter(b => {
        const created = b.createdAt ? new Date(b.createdAt) : null
        return created ? created >= from : true
      })
    }
    return list
  }, [results, all, statusFilter, timeFilter])

  // Stats calculation (exclude completed - shown in history)
  const stats = useMemo(() => {
    const activeBookings = all.filter(b => b.status !== 'completed')
    const total = activeBookings.length
    const pending = all.filter(b => b.status === 'pending').length
    const paid = all.filter(b => b.status === 'paid').length
    const completed = all.filter(b => b.status === 'completed').length
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total || 0), 0)
    return { total, pending, paid, completed, totalRevenue }
  }, [all])

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Worker Dashboard</h1>
        <p className="text-gray-600">Manage active bookings, track payments, and handle guest check-ins. <span className="text-teal-600 font-medium">Checkout history is in "Customers History"</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-100 p-3 md:p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:gap-3 mb-2">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
              <Calendar size={18} className="md:hidden text-blue-600" />
              <Calendar size={24} className="hidden md:block text-blue-600" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-xs md:text-sm">Active</p>
              <p className="text-xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-amber-200 p-3 md:p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:gap-3 mb-2">
            <div className="p-2 md:p-3 bg-amber-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
              <Clock size={18} className="md:hidden text-amber-600" />
              <Clock size={24} className="hidden md:block text-amber-600" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-xs md:text-sm">Pending</p>
              <p className="text-xl md:text-3xl font-bold text-amber-700">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-emerald-200 p-3 md:p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:gap-3 mb-2">
            <div className="p-2 md:p-3 bg-emerald-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
              <CheckCircle size={18} className="md:hidden text-emerald-600" />
              <CheckCircle size={24} className="hidden md:block text-emerald-600" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-xs md:text-sm">Paid</p>
              <p className="text-xl md:text-3xl font-bold text-emerald-700">{stats.paid}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-teal-200 p-3 md:p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:gap-3 mb-2">
            <div className="p-2 md:p-3 bg-teal-100 rounded-lg md:rounded-xl mb-2 md:mb-0">
              <DollarSign size={18} className="md:hidden text-teal-600" />
              <DollarSign size={24} className="hidden md:block text-teal-600" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-xs md:text-sm">Revenue</p>
              <p className="text-lg md:text-2xl font-bold text-teal-700">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-6 mb-6">
        <form onSubmit={doSearch} className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by guest email, name, or booking ID..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={searching} 
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Search
              </>
            )}
          </button>
        </form>

        {/* Status Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-xs md:text-sm font-semibold text-gray-700">Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[{
              key: 'all',
              label: 'All Active',
              count: stats.total,
              color: 'gray',
              bg: 'bg-gray-100',
              border: 'border-gray-300',
              text: 'text-gray-700',
              icon: Search
            },{
              key: 'pending',
              label: 'Pending',
              count: stats.pending,
              color: 'amber',
              bg: 'bg-amber-100',
              border: 'border-amber-300',
              text: 'text-amber-700',
              icon: Clock
            },{
              key: 'paid',
              label: 'Paid',
              count: stats.paid,
              color: 'emerald',
              bg: 'bg-emerald-100',
              border: 'border-emerald-300',
              text: 'text-emerald-700',
              icon: CheckCircle
            }].map((tab) => {
              const Icon = tab.icon
              const active = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 md:px-4 py-2 rounded-xl border-2 text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    active
                      ? `${tab.bg} ${tab.text} ${tab.border} shadow-sm`
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${active ? 'bg-white/70' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 mt-1">
            <Filter size={16} className="text-gray-500" />
            <span className="text-xs md:text-sm font-semibold text-gray-700">Time:</span>
            <div className="flex flex-wrap gap-2">
              {[{ key: 'all', label: 'All' }, { key: 'day', label: 'Today' }, { key: 'week', label: 'This 7 days' }, { key: 'month', label: 'This 30 days' }].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTimeFilter(t.key)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                    timeFilter === t.key ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Bookings List */}
      {displayBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <Home size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {displayBookings.map(b => {
            const ui = getStatusStyles(b.status)
            return (
            <div key={b._id} className={`border-2 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${ui.card}`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${ui.header} p-4 md:p-6 border-b-2 border-gray-100`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-md">
                      <Users size={24} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Booking ID</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">{b._id}</p>
                      {b.createdAt && (
                        <p className="text-xs text-gray-500 mt-1">Created: {new Date(b.createdAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {getStatusBadge(b.status)}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className={`text-2xl font-bold ${ui.amountText}`}>₹{b.total?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 md:p-6">
                {/* Guest Info */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Guest Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p className="text-gray-900"><span className="font-semibold">Name:</span> {b.user?.name}</p>
                    <p className="text-gray-700"><span className="font-semibold">Email:</span> {b.user?.email}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <Calendar size={20} className="text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Check-in</p>
                      <p className="font-semibold text-gray-900 text-sm">{formatDate(b.checkIn)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <Calendar size={20} className="text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Check-out</p>
                      <p className="font-semibold text-gray-900 text-sm">{formatDate(b.checkOut)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <Home size={20} className="text-amber-600" />
                    <div>
                      <p className="text-xs text-gray-600">Duration</p>
                      <p className="font-semibold text-gray-900 text-sm">{b.fullDay ? 'Full day' : `${b.nights} night(s)`}</p>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Room Details</p>
                  <div className="grid gap-3">
                    {(b.items || []).map((it, idx) => {
                      const adults = (it.guests || []).filter(g => g.type === 'adult').length
                      const children = (it.guests || []).filter(g => g.type === 'child').length
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border-2 border-teal-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              <Home size={20} className="text-teal-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{it.title}</p>
                              <p className="text-sm text-gray-600">Quantity: {it.quantity}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg">
                              <Users size={16} className="text-gray-600" />
                              <span className="font-medium text-gray-700">{adults} Adults, {children} Children</span>
                            </div>
                            <div className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-semibold">
                              ₹{it.subtotal?.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t-2 border-gray-100">
                  {b.status === 'pending' && (
                    <button 
                      onClick={() => markPaid(b._id)} 
                      className={`px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2 ${ui.actionBtn}`}
                    >
                      <CheckCircle size={20} />
                      Mark as Paid
                    </button>
                  )}
                  {b.status === 'paid' && (
                    <button 
                      onClick={() => checkout(b._id)} 
                      className={`px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2 ${ui.actionBtn}`}
                    >
                      <CheckCircle size={20} />
                      Complete Checkout
                    </button>
                  )}
                  {b.status === 'completed' && (
                    <div className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 border-2 ${ui.checkedLabel}`}>
                      <CheckCircle size={20} />
                      Checked Out
                    </div>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </WorkerLayout>
  )
}
