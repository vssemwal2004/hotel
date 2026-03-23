import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
import { useToast } from '../../../components/ToastProvider'
import {
  XCircle,
  RefreshCw,
  Search,
  Undo2,
  Calendar,
  Bed,
  IndianRupee,
  AlertCircle
} from 'lucide-react'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function WorkerCancelledBookingsPage() {
  const toast = useToast()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('month') // day | week | month
  const [undoingId, setUndoingId] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/bookings')
      setBookings(data.bookings || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Auto-refresh on focus
  useEffect(() => {
    const onFocus = () => fetchBookings()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchBookings])

  const filtered = useMemo(() => {
    const cancelled = (bookings || []).filter(b => b.status === 'cancelled')

    const now = new Date()
    const from = new Date(now)
    if (timeFilter === 'day') from.setDate(now.getDate() - 1)
    if (timeFilter === 'week') from.setDate(now.getDate() - 7)
    if (timeFilter === 'month') from.setMonth(now.getMonth() - 1)

    const inRange = cancelled.filter(b => {
      const dt = b.cancelledAt || b.updatedAt || b.createdAt
      if (!dt) return true
      const d = new Date(dt)
      return d >= from
    })

    const q = searchQuery.trim().toLowerCase()
    if (!q) return inRange.sort((a, b) => new Date(b.cancelledAt || b.updatedAt || b.createdAt) - new Date(a.cancelledAt || a.updatedAt || a.createdAt))

    return inRange
      .filter(b => (
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b._id?.toLowerCase().includes(q) ||
        (b.items || []).some(it => it.title?.toLowerCase().includes(q))
      ))
      .sort((a, b) => new Date(b.cancelledAt || b.updatedAt || b.createdAt) - new Date(a.cancelledAt || a.updatedAt || a.createdAt))
  }, [bookings, searchQuery, timeFilter])

  const undoCancellation = async (bookingId) => {
    setUndoingId(bookingId)
    try {
      await api.post(`/bookings/${bookingId}/undo-cancel`)
      toast.show({ type: 'success', message: 'Cancellation undone. Emails sent to guest and admin.', duration: 5000 })
      await fetchBookings()
    } catch (e) {
      toast.show({ type: 'error', message: e?.response?.data?.message || 'Failed to undo cancellation' })
    } finally {
      setUndoingId(null)
    }
  }

  return (
    <WorkerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <XCircle className="text-red-600" size={26} /> Canceled Bookings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Only cancelled bookings — filter and search</p>
        </div>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'day', label: 'Last 24 Hours' },
            { key: 'week', label: 'Last 7 Days' },
            { key: 'month', label: 'Last Month' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                timeFilter === key
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, booking ID, room type…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <RefreshCw size={28} className="animate-spin text-red-500" />
            <p className="text-sm font-medium">Loading cancelled bookings…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
            <AlertCircle size={32} />
            <p className="font-semibold">{error}</p>
            <button onClick={fetchBookings} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <XCircle size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-gray-500">No canceled bookings found</p>
            <p className="text-sm">Try adjusting filters or search</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-3 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Stay</th>
                    <th className="px-3 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Rooms</th>
                    <th className="px-3 py-3 text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-3 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider">Cancelled On</th>
                    <th className="px-3 py-3 text-center text-[10px] font-black text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(b => {
                    const rooms = (b.items || []).map(it => `${it.title} x${it.quantity}`).join(', ')
                    const cancelledOn = b.cancelledAt || b.updatedAt || b.createdAt
                    return (
                      <tr key={b._id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{b.user?.name || '—'}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{b.user?.email || '—'}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Bed size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-700 truncate max-w-[260px]" title={rooms}>{rooms || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <p className="font-black text-gray-900">₹{(b.totalAmount || b.total || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-700">{fmtDate(cancelledOn)}</p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => undoCancellation(b._id)}
                              disabled={undoingId === b._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                              title="Undo cancellation"
                            >
                              <Undo2 size={14} />
                              {undoingId === b._id ? 'Undoing…' : 'Undo'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(b => {
                const rooms = (b.items || []).map(it => `${it.title} x${it.quantity}`).join(', ')
                const cancelledOn = b.cancelledAt || b.updatedAt || b.createdAt
                return (
                  <div key={b._id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{b.user?.name || '—'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{b.user?.email || '—'}</p>
                        <p className="text-[11px] text-gray-500 mt-1">Cancelled: {fmtDate(cancelledOn)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-gray-900">₹{(b.totalAmount || b.total || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-500">Paid ₹{(b.amountPaid || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                      <Bed size={14} className="text-gray-400" />
                      <span className="truncate">{rooms || '—'}</span>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={() => undoCancellation(b._id)}
                        disabled={undoingId === b._id}
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <Undo2 size={16} /> {undoingId === b._id ? 'Undoing…' : 'Undo Cancellation'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Small note for consistency */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-4 text-[11px] text-gray-500 flex items-center gap-1.5">
          <IndianRupee size={13} className="text-gray-400" />
          Undo restores the booking and triggers SMTP emails to guest and admin.
        </div>
      )}
    </WorkerLayout>
  )
}
