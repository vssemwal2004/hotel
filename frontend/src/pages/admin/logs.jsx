import React, { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Clock,
  RefreshCw,
  FileText,
  UserPlus,
  Ban,
  CreditCard,
  LogOut,
  PencilLine,
  Hash,
  Package,
  X
} from 'lucide-react'

const ACTION_LABELS = {
  booking_created: { label: 'Booking Created', color: 'bg-emerald-100 text-emerald-700', icon: FileText },
  booking_cancelled: { label: 'Booking Cancelled', color: 'bg-red-100 text-red-700', icon: Ban },
  booking_edited: { label: 'Booking Edited', color: 'bg-blue-100 text-blue-700', icon: PencilLine },
  booking_paid: { label: 'Payment Received', color: 'bg-green-100 text-green-700', icon: CreditCard },
  bulk_booking_created: { label: 'Bulk Booking', color: 'bg-purple-100 text-purple-700', icon: Package },
  walk_in_created: { label: 'Walk-in Booking', color: 'bg-amber-100 text-amber-700', icon: UserPlus },
  rooms_allotted: { label: 'Rooms Allotted', color: 'bg-indigo-100 text-indigo-700', icon: Hash },
  guest_checked_in: { label: 'Guest Check-In', color: 'bg-teal-100 text-teal-700', icon: UserPlus },
  guest_checked_out: { label: 'Guest Check-Out', color: 'bg-orange-100 text-orange-700', icon: LogOut },
  room_type_created: { label: 'Room Type Created', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  room_type_updated: { label: 'Room Type Updated', color: 'bg-sky-100 text-sky-700', icon: PencilLine },
  room_type_deleted: { label: 'Room Type Deleted', color: 'bg-rose-100 text-rose-700', icon: Ban },
  user_registered: { label: 'User Registered', color: 'bg-violet-100 text-violet-700', icon: UserPlus },
  user_login: { label: 'User Login', color: 'bg-gray-100 text-gray-700', icon: User },
  password_reset: { label: 'Password Reset', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-600', icon: Activity },
}

function formatDate(d) {
  if (!d) return '-'
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDateTime(d) {
  return `${formatDate(d)} ${formatTime(d)}`
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionFilter, setActionFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [stats, setStats] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 30 }
      if (actionFilter) params.action = actionFilter
      if (roleFilter) params.role = roleFilter
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      const { data } = await api.get('/activity-logs', { params })
      
      let filtered = data.logs || []
      if (search.trim()) {
        const q = search.toLowerCase()
        filtered = filtered.filter(l =>
          (l.details || '').toLowerCase().includes(q) ||
          (l.performedBy?.name || '').toLowerCase().includes(q) ||
          (l.target?.name || '').toLowerCase().includes(q)
        )
      }
      
      setLogs(filtered)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, roleFilter, fromDate, toDate, search])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/activity-logs/stats')
      setStats(data)
    } catch {}
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRefresh = () => { fetchLogs(); fetchStats() }

  const clearFilters = () => {
    setActionFilter('')
    setRoleFilter('')
    setSearch('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const hasFilters = actionFilter || roleFilter || search || fromDate || toDate

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg">
                <Activity size={24} />
              </div>
              Activity Log
            </h1>
            <p className="text-gray-500 mt-1 text-sm">Track all actions performed by workers and admins</p>
          </div>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm text-sm font-medium">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Today&apos;s Activity</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.todayLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Top Action</p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {stats.actionCounts ? (ACTION_LABELS[Object.keys(stats.actionCounts)[0]]?.label || Object.keys(stats.actionCounts)[0] || '-') : '-'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Action Types</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.actionCounts ? Object.keys(stats.actionCounts).length : 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Filters</span>
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                <X size={14} /> Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search details..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
              />
            </div>
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none bg-white"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="worker">Worker</option>
              <option value="user">User</option>
            </select>
            {/* Date From */}
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                placeholder="From date"
              />
            </div>
            {/* Date To */}
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                placeholder="To date"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Performed By</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={24} className="text-indigo-400 animate-spin" />
                      <span className="text-gray-500 text-sm">Loading activity logs...</span>
                    </div>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Activity size={40} className="text-gray-300" />
                      <p className="text-gray-500 font-medium">No activity logs found</p>
                      <p className="text-gray-400 text-xs">Actions will appear here as they happen</p>
                    </div>
                  </td></tr>
                ) : logs.map(log => {
                  const actionInfo = ACTION_LABELS[log.action] || ACTION_LABELS.other
                  const ActionIcon = actionInfo.icon
                  return (
                    <tr key={log._id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <div>
                            <p className="text-gray-900 font-medium text-xs">{formatDate(log.createdAt)}</p>
                            <p className="text-gray-400 text-xs">{formatTime(log.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${actionInfo.color}`}>
                          <ActionIcon size={12} />
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(log.performedBy?.name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{log.performedBy?.name || 'System'}</p>
                            <p className="text-gray-400 text-xs capitalize">{log.performedBy?.role || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <p className="text-gray-700 text-sm truncate">{log.details || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.target?.name ? (
                          <span className="text-gray-600 text-sm">{log.target.name}</span>
                        ) : log.target?.id ? (
                          <span className="text-gray-400 text-xs font-mono">{log.target.id.slice(-8)}</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-50">
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw size={24} className="text-indigo-400 animate-spin mx-auto" />
                <p className="text-gray-500 text-sm mt-3">Loading...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <Activity size={40} className="text-gray-300 mx-auto" />
                <p className="text-gray-500 font-medium mt-3">No activity logs found</p>
              </div>
            ) : logs.map(log => {
              const actionInfo = ACTION_LABELS[log.action] || ACTION_LABELS.other
              const ActionIcon = actionInfo.icon
              return (
                <div key={log._id} className="p-4 hover:bg-indigo-50/30 transition-colors" onClick={() => setSelectedLog(log)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${actionInfo.color}`}>
                      <ActionIcon size={12} />
                      {actionInfo.label}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-2 line-clamp-2">{log.details || '-'}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(log.performedBy?.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium">{log.performedBy?.name || 'System'}</span>
                    <span className="capitalize text-gray-400">({log.performedBy?.role || '-'})</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of <span className="font-semibold text-gray-700">{totalPages}</span>
                <span className="ml-2 text-gray-400">({total} total)</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
                <h3 className="font-bold text-lg">Activity Details</h3>
                <button onClick={() => setSelectedLog(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <DetailRow label="Action" value={
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${(ACTION_LABELS[selectedLog.action] || ACTION_LABELS.other).color}`}>
                    {(ACTION_LABELS[selectedLog.action] || ACTION_LABELS.other).label}
                  </span>
                } />
                <DetailRow label="Date & Time" value={formatDateTime(selectedLog.createdAt)} />
                <DetailRow label="Performed By" value={`${selectedLog.performedBy?.name || 'System'} (${selectedLog.performedBy?.role || '-'})`} />
                {selectedLog.target?.name && <DetailRow label="Target" value={selectedLog.target.name} />}
                {selectedLog.target?.id && <DetailRow label="Target ID" value={<span className="font-mono text-xs break-all">{selectedLog.target.id}</span>} />}
                {selectedLog.target?.type && <DetailRow label="Target Type" value={<span className="capitalize">{selectedLog.target.type}</span>} />}
                <DetailRow label="Details" value={selectedLog.details || '-'} />
                {selectedLog.ipAddress && <DetailRow label="IP Address" value={<span className="font-mono text-xs">{selectedLog.ipAddress}</span>} />}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Additional Data</p>
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto border border-gray-100 max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold sm:w-28 flex-shrink-0">{label}</p>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  )
}
