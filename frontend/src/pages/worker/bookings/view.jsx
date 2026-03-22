import React, { useState, useEffect, useMemo, useCallback } from 'react'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
import * as XLSX from 'xlsx'
import {
  Search, Download, RefreshCw, Calendar, ChevronLeft, ChevronRight,
  ChevronDown, X, Filter, User, Mail, Phone, Bed, IndianRupee,
  CheckCircle2, XCircle, Clock, AlertCircle, Eye, Building2,
  CalendarRange, SlidersHorizontal, FileSpreadsheet, Loader2
} from 'lucide-react'

// ─── helpers ─────────────────────────────────────────────────────────
const today   = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : ''
const toInput  = (d) => { const dt = new Date(d); const y = dt.getFullYear(); const m = String(dt.getMonth()+1).padStart(2,'0'); const day = String(dt.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }

function startOfWeek(d) {
  const dt = new Date(d); dt.setHours(0,0,0,0)
  const day = dt.getDay(); dt.setDate(dt.getDate() - day); return dt
}
function endOfWeek(d) {
  const dt = startOfWeek(d); dt.setDate(dt.getDate() + 6); dt.setHours(23,59,59,999); return dt
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

const STATUS_STYLES = {
  paid:      { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Paid'      },
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',  label: 'Pending'   },
  completed: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Completed' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Cancelled' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────
function DetailModal({ booking, onClose }) {
  if (!booking) return null
  const u = booking.user || {}
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-5 text-white flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Booking Details</h2>
            <p className="text-indigo-200 text-xs mt-0.5 font-mono">#{booking._id?.slice(-10).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Guest info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <User size={11} className="text-indigo-500" /> Guest Information
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-400 text-xs">Name</p><p className="font-semibold text-gray-800">{u.name || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">Email</p><p className="font-semibold text-gray-800 break-all">{u.email || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">Phone</p><p className="font-semibold text-gray-800">{u.phone || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">User ID</p><p className="font-mono text-xs text-gray-500">{u._id?.slice(-8)}</p></div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Calendar size={11} className="text-indigo-500" /> Stay Period
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-gray-400 text-xs">Check-In</p><p className="font-semibold">{fmtDate(booking.checkIn)}</p></div>
              <div><p className="text-gray-400 text-xs">Check-Out</p><p className="font-semibold">{fmtDate(booking.checkOut)}</p></div>
              <div><p className="text-gray-400 text-xs">Nights</p><p className="font-bold text-indigo-700 text-base">{booking.nights}</p></div>
            </div>
          </div>

          {/* Rooms */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Bed size={11} className="text-indigo-500" /> Room Items
            </p>
            <div className="space-y-2">
              {(booking.items || []).map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.title} × {item.quantity}</p>
                    {item.allottedRoomNumbers?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.allottedRoomNumbers.map(rn => (
                          <span key={rn} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">{rn}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-800">₹{item.subtotal?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">@ ₹{item.basePrice?.toLocaleString()}/night</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <IndianRupee size={11} className="text-green-600" /> Payment Summary
            </p>
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{booking.subtotal?.toLocaleString() || '—'}</span></div>
            {booking.gstAmount > 0 && <div className="flex justify-between"><span className="text-gray-400">GST ({booking.gstPercentage}%)</span><span className="font-semibold">₹{booking.gstAmount?.toLocaleString()}</span></div>}
            <div className="flex justify-between font-black text-base pt-1 border-t border-green-300">
              <span>Total</span><span className="text-green-700">₹{booking.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="font-semibold">₹{(booking.amountPaid || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Remaining Due</span><span className="font-semibold">₹{Math.max(0, (booking.total || 0) - (booking.amountPaid || 0)).toLocaleString()}</span></div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-400 text-xs">Status</span><StatusBadge status={booking.status} />
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-2">
            <span>Booked: {fmtDate(booking.createdAt)} {fmtTime(booking.createdAt)}</span>
            {booking.payment?.paymentId && <span className="font-mono">TxnID: {booking.payment.paymentId}</span>}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZES = [25, 50, 100, 200]

// ─── Main View Bookings Page ──────────────────────────────────────────
export default function ViewBookingsPage() {
  const [allBookings, setAllBookings]     = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [searchQuery, setSearchQuery]     = useState('')
  const [searching, setSearching]         = useState(false)

  // Date filter
  const [datePreset, setDatePreset]       = useState('all')  // all | today | week | month | custom
  const [customFrom, setCustomFrom]       = useState('')
  const [customTo, setCustomTo]           = useState('')

  // Status filter
  const [statusFilter, setStatusFilter]   = useState('all')

  // Table
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(50)
  const [sortField, setSortField]         = useState('createdAt')
  const [sortDir, setSortDir]             = useState('desc')

  // Detail modal
  const [selected, setSelected]           = useState(null)

  // ── Fetch ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/bookings')
      const list = res.data.bookings || []
      setAllBookings(list)
      return list
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load bookings')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Refresh after returning from edit-booking
  useEffect(() => {
    const refreshIfEdited = async () => {
      let updatedId = null
      try { updatedId = sessionStorage.getItem('booking_updated_id') } catch {}
      if (!updatedId) return
      const list = await fetchAll()
      try {
        sessionStorage.removeItem('booking_updated_id')
        sessionStorage.removeItem('booking_updated_at')
      } catch {}
      if (selected?._id && selected._id === updatedId && Array.isArray(list)) {
        const fresh = list.find(b => b._id === updatedId)
        if (fresh) setSelected(fresh)
      }
    }
    refreshIfEdited()
  }, [fetchAll, selected?._id])

  // ── Date range from preset ────────────────────────────────────────
  const { rangeFrom, rangeTo } = useMemo(() => {
    const t = today()
    if (datePreset === 'today')  return { rangeFrom: t, rangeTo: new Date(t.getTime() + 86399999) }
    if (datePreset === 'week')   return { rangeFrom: startOfWeek(t), rangeTo: endOfWeek(t) }
    if (datePreset === 'month')  return { rangeFrom: startOfMonth(t), rangeTo: endOfMonth(t) }
    if (datePreset === 'custom' && customFrom && customTo) {
      const f = new Date(customFrom); f.setHours(0,0,0,0)
      const to = new Date(customTo); to.setHours(23,59,59,999)
      return { rangeFrom: f, rangeTo: to }
    }
    return { rangeFrom: null, rangeTo: null }
  }, [datePreset, customFrom, customTo])

  // ── Filtered + sorted data ────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...allBookings]

    // date filter
    if (rangeFrom && rangeTo) {
      data = data.filter(b => {
        const d = new Date(b.createdAt)
        return d >= rangeFrom && d <= rangeTo
      })
    }

    // status filter
    if (statusFilter !== 'all') {
      data = data.filter(b => b.status === statusFilter)
    }

    // search (client-side by name/email/id)
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      data = data.filter(b =>
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b._id?.toLowerCase().includes(q) ||
        b.items?.some(item => item.title?.toLowerCase().includes(q))
      )
    }

    // sort
    data.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (sortField === 'user.name') { av = a.user?.name || ''; bv = b.user?.name || '' }
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1  : -1
      return 0
    })

    return data
  }, [allBookings, rangeFrom, rangeTo, statusFilter, searchQuery, sortField, sortDir])

  // ── Pagination ────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(1)
  }

  const resetFilters = () => {
    setDatePreset('all'); setCustomFrom(''); setCustomTo('')
    setStatusFilter('all'); setSearchQuery(''); setPage(1)
  }

  // ── Summary stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filtered.length
    const revenue = filtered.reduce((s, b) => s + (b.status !== 'cancelled' ? b.total : 0), 0)
    const paid = filtered.filter(b => b.status === 'paid' || b.status === 'completed').length
    const pending = filtered.filter(b => b.status === 'pending').length
    const cancelled = filtered.filter(b => b.status === 'cancelled').length
    return { total, revenue, paid, pending, cancelled }
  }, [filtered])

  // ── Excel Export ──────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = filtered.map(b => ({
      'Booking ID':    b._id,
      'Created Date':  fmtDate(b.createdAt),
      'Created Time':  fmtTime(b.createdAt),
      'Guest Name':    b.user?.name || '',
      'Guest Email':   b.user?.email || '',
      'Guest Phone':   b.user?.phone || '',
      'Check-In':      fmtDate(b.checkIn),
      'Check-Out':     fmtDate(b.checkOut),
      'Nights':        b.nights,
      'Rooms':         (b.items || []).map(i => `${i.title} x${i.quantity}`).join(' | '),
      'Room Numbers':  (b.items || []).map(i => (i.allottedRoomNumbers || []).join(',')).filter(Boolean).join(' | '),
      'Subtotal (₹)':  b.subtotal || '',
      'GST %':         b.gstPercentage || 0,
      'GST (₹)':       b.gstAmount || 0,
      'Total (₹)':     b.total,
      'Status':        b.status,
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    // Column widths
    ws['!cols'] = [
      {wch:26},{wch:14},{wch:10},{wch:20},{wch:28},{wch:14},
      {wch:14},{wch:14},{wch:8},{wch:30},{wch:18},
      {wch:14},{wch:8},{wch:10},{wch:12},{wch:12}
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

    // File name reflects active filter
    const label = datePreset === 'today' ? 'Today'
      : datePreset === 'week'   ? 'ThisWeek'
      : datePreset === 'month'  ? 'ThisMonth'
      : datePreset === 'custom' ? `${customFrom}_to_${customTo}`
      : 'All'
    const statusLabel = statusFilter !== 'all' ? `_${statusFilter}` : ''
    XLSX.writeFile(wb, `HotelKrishna_Bookings_${label}${statusLabel}.xlsx`)
  }

  // ── Column header helper ──────────────────────────────────────────
  const Th = ({ field, children, className = '' }) => (
    <th
      className={`px-3 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-indigo-600 transition-colors ${className}`}
      onClick={() => field && handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {field && sortField === field && (
          <span className="text-indigo-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  )

  return (
    <WorkerLayout>
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" size={26} /> View Bookings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">All bookings — filter, search & export to Excel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} /> Export Excel
            {filtered.length > 0 && <span className="bg-green-500 px-1.5 py-0.5 rounded-md text-[10px] font-black">{filtered.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total',     value: stats.total,                color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Revenue',   value: `₹${stats.revenue.toLocaleString()}`, color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
          { label: 'Paid',      value: stats.paid,                 color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'Pending',   value: stats.pending,              color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
          { label: 'Cancelled', value: stats.cancelled,            color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3 ${bg}`}>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 space-y-3">
        {/* Row 1: Date presets + Status + Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
          </div>

          {/* Date presets */}
          {[
            { key: 'all',   label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week',  label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'custom',label: 'Custom' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setDatePreset(key); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${datePreset === key
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
            >
              {key === 'today' && <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 align-middle" />}
              {label}
            </button>
          ))}

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="pl-3 pr-7 py-1.5 border border-gray-300 rounded-lg text-xs font-bold appearance-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={13} /> Reset
          </button>
        </div>

        {/* Custom date range */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarRange size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={e => { setCustomFrom(e.target.value); setPage(1) }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-xs text-gray-500 font-medium">To</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={e => { setCustomTo(e.target.value); setPage(1) }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Row 2: Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
            placeholder="Search by name, email, booking ID, room type…"
            className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-bold text-gray-700">
            {loading ? 'Loading…' : `${filtered.length.toLocaleString()} booking${filtered.length !== 1 ? 's' : ''}`}
            {(rangeFrom || searchQuery || statusFilter !== 'all') && (
              <span className="ml-2 text-xs font-normal text-indigo-500">(filtered)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Rows:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(+e.target.value); setPage(1) }}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading bookings…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
            <AlertCircle size={32} />
            <p className="font-semibold">{error}</p>
            <button onClick={fetchAll} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Search size={36} className="text-gray-300" />
            <p className="font-semibold text-gray-500">No bookings found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
            <button onClick={resetFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold transition-colors">Clear Filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <Th className="pl-4 w-8">#</Th>
                  <Th field="user.name">Guest</Th>
                  <Th field="checkIn">Check-In</Th>
                  <Th field="checkOut">Check-Out</Th>
                  <Th field="nights">Nights</Th>
                  <Th>Rooms</Th>
                  <Th field="total">Amount</Th>
                  <Th field="status">Status</Th>
                  <Th field="createdAt">Booked On</Th>
                  <Th className="pr-4">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((b, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1
                  const u = b.user || {}
                  return (
                    <tr
                      key={b._id}
                      className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelected(b)}
                    >
                      {/* # */}
                      <td className="pl-4 py-3 text-xs text-gray-400 font-mono w-8">{rowNum}</td>

                      {/* Guest */}
                      <td className="px-3 py-3 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[130px]">{u.name || '—'}</p>
                            <p className="text-gray-400 text-[11px] truncate max-w-[130px]">{u.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Check-In */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-gray-800 font-medium">{fmtDate(b.checkIn)}</span>
                      </td>

                      {/* Check-Out */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-gray-500">{fmtDate(b.checkOut)}</span>
                      </td>

                      {/* Nights */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black">{b.nights}</span>
                      </td>

                      {/* Rooms */}
                      <td className="px-3 py-3 min-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {(b.items || []).map((item, i) => (
                            <div key={i} className="flex flex-col">
                              <span className="text-xs text-gray-700 font-medium">{item.title} <span className="text-gray-400">×{item.quantity}</span></span>
                              {item.allottedRoomNumbers?.length > 0 && (
                                <div className="flex gap-0.5 flex-wrap mt-0.5">
                                  {item.allottedRoomNumbers.map(rn => (
                                    <span key={rn} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">{rn}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="font-black text-gray-900">₹{b.total?.toLocaleString()}</p>
                        {b.gstAmount > 0 && <p className="text-[10px] text-gray-400">incl. GST ₹{b.gstAmount?.toLocaleString()}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Booked On */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-gray-700 text-xs font-medium">{fmtDate(b.createdAt)}</p>
                        <p className="text-gray-400 text-[10px]">{fmtTime(b.createdAt)}</p>
                      </td>

                      {/* Action */}
                      <td className="px-3 pr-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(b) }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pb-4">
          <p className="text-xs text-gray-500">
            Showing <span className="font-bold text-gray-700">{(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)}</span> of <span className="font-bold text-gray-700">{filtered.length.toLocaleString()}</span> bookings
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs font-bold transition-colors"
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            ><ChevronLeft size={16} /></button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pg
              if (totalPages <= 7) pg = i + 1
              else if (page <= 4) pg = i + 1
              else if (page >= totalPages - 3) pg = totalPages - 6 + i
              else pg = page - 3 + i
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors
                    ${page === pg
                      ? 'bg-indigo-600 text-white shadow'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                >{pg}</button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            ><ChevronRight size={16} /></button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs font-bold transition-colors"
            >»</button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} />}
    </WorkerLayout>
  )
}
