import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../../layouts/WorkerLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../../utils/api'
import { 
  DoorOpen, 
  BedDouble, 
  Users, 
  IndianRupee, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wifi,
  Wind,
  Tv,
  Coffee,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react'

export default function AvailableRoomsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [expandedCard, setExpandedCard] = useState(null)

  const authorized = useMemo(() => {
    if (!user) return false
    return user.role === 'worker' || user.role === 'admin'
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  const fetchStats = async () => {
    if (!authorized) return
    try {
      setFetching(true)
      setError('')
      const res = await api.get('/room-types/availability/stats')
      setData(res.data)
    } catch (e) {
      console.warn('Failed to fetch room stats', e?.response?.data || e?.message)
      setError('Failed to load room availability data')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchStats() }, [authorized])

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
      </WorkerLayout>
    )
  }

  const summary = data?.summary || {}
  const stats = data?.stats || []
  const occupancyRate = summary.totalRooms > 0 
    ? Math.round((summary.totalBooked / summary.totalRooms) * 100) 
    : 0

  const getOccupancyColor = (pct) => {
    if (pct >= 90) return 'text-red-600 bg-red-50 border-red-200'
    if (pct >= 70) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (pct >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getBarColor = (pct) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 70) return 'bg-orange-500'
    if (pct >= 40) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStatusBadge = (room) => {
    if (room.available === 0) return { label: 'Fully Booked', cls: 'bg-red-100 text-red-700 border-red-200' }
    if (room.booked === 0) return { label: 'All Available', cls: 'bg-green-100 text-green-700 border-green-200' }
    return { label: 'Partially Available', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
  }

  return (
    <WorkerLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <DoorOpen className="w-7 h-7 text-amber-600" />
              Available Rooms
            </h1>
            <p className="text-gray-500 text-sm mt-1">Real-time room availability overview</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <SummaryCard
              icon={<BedDouble className="w-6 h-6 text-indigo-600" />}
              label="Total Rooms"
              value={summary.totalRooms}
              bg="bg-indigo-50"
              border="border-indigo-100"
            />
            <SummaryCard
              icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
              label="Available"
              value={summary.totalAvailable}
              bg="bg-green-50"
              border="border-green-100"
            />
            <SummaryCard
              icon={<XCircle className="w-6 h-6 text-red-600" />}
              label="Booked"
              value={summary.totalBooked}
              bg="bg-red-50"
              border="border-red-100"
            />
            <div className={`rounded-xl border p-4 ${getOccupancyColor(occupancyRate)}`}>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-6 h-6" />
                <span className="text-xs font-medium uppercase tracking-wide opacity-75">Occupancy</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold">{occupancyRate}%</p>
              <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${getBarColor(occupancyRate)}`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {fetching && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-64" />
            ))}
          </div>
        )}

        {/* Room Cards */}
        {!fetching && stats.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BedDouble className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <p className="text-lg">No room types found</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {stats.map((room) => {
            const pct = room.totalRooms > 0 ? Math.round((room.booked / room.totalRooms) * 100) : 0
            const badge = getStatusBadge(room)
            const isExpanded = expandedCard === room.key

            return (
              <div
                key={room.key}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Room Image */}
                {room.coverPhoto && (
                  <div className="relative h-40 sm:h-44 overflow-hidden">
                    <img
                      src={room.coverPhoto}
                      alt={room.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <h3 className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-lg">
                      {room.title}
                    </h3>
                  </div>
                )}

                {!room.coverPhoto && (
                  <div className="px-4 pt-4 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-800">{room.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                )}

                {/* Room Stats */}
                <div className="p-4">
                  {/* Availability Numbers */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Total</p>
                      <p className="text-xl font-bold text-gray-800">{room.totalRooms}</p>
                    </div>
                    <div className="text-center p-2.5 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600 font-medium mb-0.5">Available</p>
                      <p className="text-xl font-bold text-green-700">{room.available}</p>
                    </div>
                    <div className="text-center p-2.5 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-500 font-medium mb-0.5">Booked</p>
                      <p className="text-xl font-bold text-red-600">{room.booked}</p>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>Occupancy</span>
                      <span className="font-semibold text-gray-700">{pct}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-gray-600">
                      <IndianRupee className="w-4 h-4" />
                      <span className="font-bold text-lg text-gray-800">
                        {room.pricePerNight?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400">/night</span>
                    </div>
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : room.key)}
                      className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
                    >
                      Details
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 animate-fadeIn">
                      {/* Capacity */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-500" />
                          <span>{room.maxAdults} Adults</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          <span>{room.maxChildren} Children</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {room.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Amenities */}
                      {room.amenities?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1.5">Amenities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {room.amenities.slice(0, 8).map((a, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                {getAmenityIcon(a)}
                                {a}
                              </span>
                            ))}
                            {room.amenities.length > 8 && (
                              <span className="text-xs text-gray-400 px-2 py-1">
                                +{room.amenities.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Visual Room Grid */}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1.5">Room Slots</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: room.totalRooms }, (_, i) => (
                            <div
                              key={i}
                              title={i < room.available ? 'Available' : 'Booked'}
                              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                                i < room.available 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-100 text-red-600 border border-red-200'
                              }`}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Available
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Booked
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </WorkerLayout>
  )
}

function SummaryCard({ icon, label, value, bg, border }) {
  return (
    <div className={`rounded-xl border ${border} ${bg} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value ?? '—'}</p>
    </div>
  )
}

function getAmenityIcon(name) {
  const n = name.toLowerCase()
  if (n.includes('wifi') || n.includes('internet')) return <Wifi className="w-3 h-3" />
  if (n.includes('ac') || n.includes('air')) return <Wind className="w-3 h-3" />
  if (n.includes('tv') || n.includes('television')) return <Tv className="w-3 h-3" />
  if (n.includes('tea') || n.includes('coffee') || n.includes('breakfast')) return <Coffee className="w-3 h-3" />
  return null
}
