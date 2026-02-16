import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
  Filter,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw
} from 'lucide-react'

const ROWS_PER_PAGE = 15

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
  const [selectedBooking, setSelectedBooking] = useState(null) // popup booking detail
  const [page, setPage] = useState(1)

  const authorized = useMemo(() => {
    if (!user) return false
    return user.role === 'worker' || user.role === 'admin'
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  // Fetch all bookings
  const fetchAllBookings = useCallback(async () => {
    if (!authorized) return
    try {
      const { data } = await api.get('/bookings')
      setAll(data.bookings || [])
    } catch (e) {
      console.warn('Failed to fetch all bookings', e?.response?.data || e?.message)
    }
  }, [authorized])

  // Load all bookings on mount for worker/admin
  useEffect(() => {
    fetchAllBookings()
  }, [fetchAllBookings])

  // Auto-refresh when page gains focus (e.g. after navigating back from allot-rooms)
  useEffect(() => {
    const onFocus = () => fetchAllBookings()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchAllBookings])

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
      await fetchAllBookings()
      if (selectedBooking?._id === id) setSelectedBooking(prev => ({ ...prev, status: 'paid' }))
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark as paid')
    }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone and notifications will be sent to the customer and admin.')) {
      return
    }
    try {
      await api.post(`/bookings/${id}/cancel`)
      await fetchAllBookings()
      if (selectedBooking?._id === id) setSelectedBooking(prev => ({ ...prev, status: 'cancelled' }))
      alert('Booking cancelled successfully. Emails have been sent to the customer and admin.')
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to cancel booking')
    }
  }

  const checkout = async (id) => {
    try {
      await api.post(`/bookings/${id}/checkout`)
      await fetchAllBookings()
      if (selectedBooking?._id === id) setSelectedBooking(prev => ({ ...prev, status: 'completed' }))
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

  const formatShortDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  // Status badge (compact)
  const getStatusBadge = (status, size = 'sm') => {
    const configs = {
      pending:   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pending' },
      paid:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
      completed: { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Completed' },
      cancelled: { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Cancelled' },
      confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmed' },
      failed:    { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Failed' }
    }
    const c = configs[status] || configs.pending
    const px = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
    return (
      <span className={`inline-flex items-center gap-1 ${px} rounded-full font-semibold ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
        {c.label}
      </span>
    )
  }

  // Filter bookings by status (exclude completed - moved to history page)
  const displayBookings = useMemo(() => {
    let list = results.length === 0 ? all : results
    list = list.filter(b => b.status !== 'completed')
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter)
    if (timeFilter !== 'all') {
      const now = new Date()
      const from = new Date(now)
      if (timeFilter === 'day') from.setDate(now.getDate() - 1)
      else if (timeFilter === 'week') from.setDate(now.getDate() - 7)
      else if (timeFilter === 'month') from.setMonth(now.getMonth() - 1)
      list = list.filter(b => {
        const created = b.createdAt ? new Date(b.createdAt) : null
        return created ? created >= from : true
      })
    }
    return list
  }, [results, all, statusFilter, timeFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(displayBookings.length / ROWS_PER_PAGE))
  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE
    return displayBookings.slice(start, start + ROWS_PER_PAGE)
  }, [displayBookings, page])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [statusFilter, timeFilter, results])

  // Stats calculation (exclude completed - shown in history)
  const stats = useMemo(() => {
    const activeBookings = all.filter(b => b.status !== 'completed')
    const total = activeBookings.length
    const pending = all.filter(b => b.status === 'pending').length
    const paid = all.filter(b => b.status === 'paid').length
    const completed = all.filter(b => b.status === 'completed').length
    const cancelled = all.filter(b => b.status === 'cancelled').length
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total || 0), 0)
    return { total, pending, paid, completed, cancelled, totalRevenue }
  }, [all])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setSelectedBooking(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading bookings...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Worker Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-500">Manage bookings & payments. <span className="text-teal-600 font-medium">History in "Customers History"</span></p>
        </div>
        <button
          onClick={fetchAllBookings}
          className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-xs md:text-sm transition-colors shadow-md"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4">
        {[
          { label: 'Active',  value: stats.total,  icon: Calendar,    color: 'blue',    border: 'border-blue-200' },
          { label: 'Pending', value: stats.pending, icon: Clock,       color: 'amber',   border: 'border-amber-200' },
          { label: 'Paid',    value: stats.paid,    icon: CheckCircle, color: 'emerald',  border: 'border-emerald-200' },
          { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'teal', border: 'border-teal-200' }
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-white rounded-lg shadow-sm border ${s.border} p-2.5 md:p-3 flex items-center gap-2.5`}>
              <div className={`p-1.5 bg-${s.color}-100 rounded-lg`}>
                <Icon size={16} className={`text-${s.color}-600`} />
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 leading-tight">{s.label}</p>
                <p className={`text-sm md:text-lg font-bold text-${s.color}-700 leading-tight`}>{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + Filters (compact) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <form onSubmit={doSearch} className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, name, or booking ID..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button type="submit" disabled={searching} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors">
            {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={14} />}
            <span className="hidden sm:inline">{searching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-1">Status:</span>
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'paid', label: 'Paid', count: stats.paid },
              { key: 'cancelled', label: 'Cancelled', count: stats.cancelled }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} <span className="opacity-75">({tab.count})</span>
              </button>
            ))}
          </div>
          {/* Time pills */}
          <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-1">Time:</span>
            {[{ key: 'all', label: 'All' }, { key: 'day', label: 'Today' }, { key: 'week', label: '7d' }, { key: 'month', label: '30d' }].map(t => (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  timeFilter === t.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg mb-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Bookings Table */}
      {displayBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
          <Home size={36} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-600 mb-1">No bookings found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rooms</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map(b => {
                  const roomSummary = (b.items || []).map(it => `${it.title} x${it.quantity}`).join(', ')
                  return (
                    <tr
                      key={b._id}
                      onClick={() => setSelectedBooking(b)}
                      className="hover:bg-teal-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium text-gray-900 text-sm truncate max-w-[160px]">{b.user?.name || '—'}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[160px]">{b.user?.email || '—'}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{formatShortDate(b.checkIn)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{formatShortDate(b.checkOut)}</td>
                      <td className="px-3 py-2.5">
                        <div className="max-w-[220px]">
                          <p className="text-xs text-gray-700 truncate" title={roomSummary}>{roomSummary || '—'}</p>
                          {(b.items || []).some(it => it.allottedRoomNumbers?.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(b.items || []).flatMap(it => (it.allottedRoomNumbers || []).map(rn => (
                                <span key={`${it.roomTypeKey}-${rn}`} className="inline-block px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-semibold">{rn}</span>
                              )))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-sm text-gray-900 whitespace-nowrap">₹{b.total?.toLocaleString() || 0}</td>
                      <td className="px-3 py-2.5 text-center">{getStatusBadge(b.status)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedBooking(b)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-teal-600 transition-colors" title="View Details">
                            <Eye size={15} />
                          </button>
                          {(b.status === 'pending' || b.status === 'paid') && (
                            <button onClick={() => router.push(`/worker/bookings/edit-booking?id=${b._id}`)} className="p-1.5 rounded-md hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors" title="Edit Booking">
                              <Edit size={15} />
                            </button>
                          )}
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => markPaid(b._id)} className="p-1.5 rounded-md hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 transition-colors" title="Mark Paid">
                                <CheckCircle size={15} />
                              </button>
                              <button onClick={() => cancelBooking(b._id)} className="p-1.5 rounded-md hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors" title="Cancel">
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          {b.status === 'paid' && (
                            <button onClick={() => checkout(b._id)} className="p-1.5 rounded-md hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 transition-colors" title="Checkout">
                              <CheckCircle size={15} />
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

          {/* Mobile Card List (compact) */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginatedBookings.map(b => (
              <div
                key={b._id}
                onClick={() => setSelectedBooking(b)}
                className="p-3 hover:bg-teal-50/50 cursor-pointer transition-colors active:bg-teal-100/50"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{b.user?.name || '—'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{b.user?.email || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(b.status)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{formatShortDate(b.checkIn)} → {formatShortDate(b.checkOut)}</span>
                  <span className="font-semibold text-sm text-gray-900">₹{b.total?.toLocaleString() || 0}</span>
                </div>
                {(b.items || []).some(it => it.allottedRoomNumbers?.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(b.items || []).flatMap(it => (it.allottedRoomNumbers || []).map(rn => (
                      <span key={`${it.roomTypeKey}-${rn}`} className="inline-block px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-semibold">🚪 {rn}</span>
                    )))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-gray-500 truncate max-w-[60%]">{(b.items || []).map(it => it.title).join(', ') || '—'}</p>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {(b.status === 'pending' || b.status === 'paid') && (
                      <button onClick={() => router.push(`/worker/bookings/edit-booking?id=${b._id}`)} className="p-1 rounded hover:bg-blue-100 text-blue-500" title="Edit"><Edit size={14} /></button>
                    )}
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => markPaid(b._id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-500" title="Mark Paid"><CheckCircle size={14} /></button>
                        <button onClick={() => cancelBooking(b._id)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Cancel"><XCircle size={14} /></button>
                      </>
                    )}
                    {b.status === 'paid' && (
                      <button onClick={() => checkout(b._id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-500" title="Checkout"><CheckCircle size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              <span>
                Showing {((page - 1) * ROWS_PER_PAGE) + 1}–{Math.min(page * ROWS_PER_PAGE, displayBookings.length)} of {displayBookings.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) pageNum = i + 1
                  else if (page <= 3) pageNum = i + 1
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = page - 2 + i
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                        page === pageNum ? 'bg-teal-600 text-white' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Popup/Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Booking Details</h3>
                {getStatusBadge(selectedBooking.status, 'md')}
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Booking ID */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Booking ID</span>
                <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">{selectedBooking._id}</span>
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Guest</p>
                <p className="font-medium text-gray-900 text-sm">{selectedBooking.user?.name || '—'}</p>
                <p className="text-xs text-gray-500">{selectedBooking.user?.email || '—'}</p>
                {selectedBooking.user?.phone && <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.user.phone}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Check-in</p>
                  <p className="font-semibold text-gray-900 text-xs">{formatDate(selectedBooking.checkIn)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Check-out</p>
                  <p className="font-semibold text-gray-900 text-xs">{formatDate(selectedBooking.checkOut)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100 text-center">
                  <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
                  <p className="font-semibold text-gray-900 text-xs">{selectedBooking.fullDay ? 'Full day' : `${selectedBooking.nights} night(s)`}</p>
                </div>
              </div>

              {/* Rooms */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Room Details</p>
                <div className="space-y-2">
                  {(selectedBooking.items || []).map((it, idx) => {
                    const adults = (it.guests || []).filter(g => g.type === 'adult').length
                    const children = (it.guests || []).filter(g => g.type === 'child').length
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-teal-50 rounded-lg border border-teal-100">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{it.title}</p>
                          <p className="text-[11px] text-gray-500">Qty: {it.quantity} &middot; {adults}A {children > 0 ? `${children}C` : ''}</p>
                          {it.allottedRoomNumbers?.length > 0 && (
                            <p className="text-[11px] text-teal-600 mt-0.5">Rooms: {it.allottedRoomNumbers.join(', ')}</p>
                          )}
                        </div>
                        <span className="font-bold text-sm text-teal-700">₹{it.subtotal?.toLocaleString() || 0}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-900 text-white rounded-lg px-4 py-3">
                <span className="font-medium text-sm">Total Amount</span>
                <span className="text-lg font-bold">₹{selectedBooking.total?.toLocaleString() || 0}</span>
              </div>

              {/* Created At */}
              {selectedBooking.createdAt && (
                <p className="text-[11px] text-gray-400 text-center">
                  Booked on {new Date(selectedBooking.createdAt).toLocaleString()}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => router.push(`/worker/bookings/edit-booking?id=${selectedBooking._id}`)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Edit size={15} /> Edit
                    </button>
                    <button
                      onClick={() => markPaid(selectedBooking._id)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <CheckCircle size={15} /> Mark Paid
                    </button>
                    <button
                      onClick={() => cancelBooking(selectedBooking._id)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      <XCircle size={15} /> Cancel
                    </button>
                  </>
                )}
                {selectedBooking.status === 'paid' && (
                  <>
                    <button
                      onClick={() => router.push(`/worker/bookings/edit-booking?id=${selectedBooking._id}`)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Edit size={15} /> Edit
                    </button>
                    <button
                      onClick={() => checkout(selectedBooking._id)}
                      className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <CheckCircle size={15} /> Complete Checkout
                    </button>
                  </>
                )}
                {selectedBooking.status === 'completed' && (
                  <div className="w-full text-center px-3 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center gap-1.5">
                    <CheckCircle size={15} /> Checked Out
                  </div>
                )}
                {selectedBooking.status === 'cancelled' && (
                  <div className="w-full text-center px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center justify-center gap-1.5">
                    <XCircle size={15} /> Cancelled
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkerLayout>
  )
}
