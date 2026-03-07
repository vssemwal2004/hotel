import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  Bed,
  CreditCard,
  Clock,
  Home,
  Users,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Eye,
  Hash,
  IndianRupee,
  DoorOpen,
  Building2,
  ArrowRight,
  Info
} from 'lucide-react'

// ─── Helper Functions ───────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Check if a booking overlaps with a given date
function doesBookingOverlapDate(booking, date) {
  const checkIn = new Date(booking.checkIn)
  checkIn.setHours(0, 0, 0, 0)
  const checkOut = new Date(booking.checkOut)
  checkOut.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return target >= checkIn && target < checkOut
}

// ─── Status Badge Component ─────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-green-100 text-green-700 border-green-300',
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    failed: 'bg-red-100 text-red-700 border-red-300',
    completed: 'bg-blue-100 text-blue-700 border-blue-300',
    cancelled: 'bg-gray-200 text-gray-600 border-gray-300'
  }
  const icons = {
    paid: <CheckCircle2 size={12} />,
    pending: <Clock size={12} />,
    failed: <XCircle size={12} />,
    completed: <CheckCircle2 size={12} />,
    cancelled: <XCircle size={12} />
  }
  const s = typeof status === 'string' && status.length ? status : 'pending'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[s] || styles.pending}`}>
      {icons[s] || icons.pending}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

// ─── Calendar Day Cell Component ────────────────────────────────────
function CalendarDayCell({ day, today, totalRooms, bookedCount, onClick, isCurrentMonth }) {
  if (!day) {
    return <div className="h-14 md:h-16 bg-gray-50 rounded" />
  }

  const isToday = isSameDay(day, today)
  const ratio = totalRooms > 0 ? bookedCount / totalRooms : 0
  const isFull = ratio >= 1
  const isPartial = ratio > 0 && ratio < 1

  let bgColor = 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
  let textColor = 'text-emerald-700'
  let dotColor = 'bg-emerald-400'

  if (isFull) {
    bgColor = 'bg-red-50 hover:bg-red-100 border-red-200'
    textColor = 'text-red-700'
    dotColor = 'bg-red-400'
  } else if (isPartial) {
    bgColor = 'bg-amber-50 hover:bg-amber-100 border-amber-200'
    textColor = 'text-amber-700'
    dotColor = 'bg-amber-400'
  }

  if (!isCurrentMonth) {
    bgColor = 'bg-gray-50 border-gray-100'
    textColor = 'text-gray-400'
  }

  return (
    <button
      onClick={() => onClick(day)}
      className={`relative h-14 md:h-16 rounded-lg border transition-all duration-200 ${bgColor} ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''} cursor-pointer group`}
    >
      <div className="flex flex-col items-center justify-center h-full px-1">
        <span className={`text-sm md:text-base font-bold ${isCurrentMonth ? textColor : 'text-gray-400'}`}>
          {day.getDate()}
        </span>
        {isCurrentMonth && totalRooms > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className={`text-[9px] md:text-[10px] font-bold ${textColor}`}>
              {bookedCount}/{totalRooms}
            </span>
          </div>
        )}
      </div>
      {isToday && (
        <div className="absolute top-0.5 right-0.5">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </div>
      )}
    </button>
  )
}

// ─── Room Type Calendar Component ───────────────────────────────────
function RoomTypeCalendar({ roomType, bookings, year, month, today, onDateClick }) {
  const [collapsed, setCollapsed] = useState(false)
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const totalRooms = roomType.count || roomType.roomNumbers?.length || 0

  const dayBookingMap = useMemo(() => {
    const map = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      let bookedRooms = 0
      const relevantBookings = bookings.filter(b =>
        b.status !== 'cancelled' &&
        doesBookingOverlapDate(b, date) &&
        b.items?.some(item => item.roomTypeKey === roomType.key)
      )
      relevantBookings.forEach(b => {
        b.items?.forEach(item => {
          if (item.roomTypeKey === roomType.key) {
            bookedRooms += item.quantity || 0
          }
        })
      })
      map[d] = { bookedCount: Math.min(bookedRooms, totalRooms), bookings: relevantBookings }
    }
    return map
  }, [bookings, year, month, roomType.key, totalRooms, daysInMonth])

  const stats = useMemo(() => {
    let fullyBooked = 0, partiallyBooked = 0, available = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const { bookedCount } = dayBookingMap[d]
      const ratio = totalRooms > 0 ? bookedCount / totalRooms : 0
      if (ratio >= 1) fullyBooked++
      else if (ratio > 0) partiallyBooked++
      else available++
    }
    return { fullyBooked, partiallyBooked, available }
  }, [dayBookingMap, totalRooms, daysInMonth])

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    return days
  }, [year, month, firstDay, daysInMonth])

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Building2 size={22} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base md:text-lg font-bold">{roomType.title}</h3>
            <p className="text-xs text-indigo-200">
              {totalRooms} room{totalRooms !== 1 ? 's' : ''} total
              {roomType.roomNumbers?.length > 0 && (
                <span className="ml-2">({roomType.roomNumbers.join(', ')})</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/30 rounded-lg text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-red-300" /> {stats.fullyBooked} Full
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/30 rounded-lg text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-amber-300" /> {stats.partiallyBooked} Partial
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/30 rounded-lg text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-300" /> {stats.available} Free
            </span>
          </div>
          {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </button>

      {!collapsed && (
        <div className="md:hidden flex items-center justify-center gap-2 p-2 bg-indigo-50 border-b border-indigo-100">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {stats.fullyBooked} Full
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {stats.partiallyBooked} Partial
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {stats.available} Free
          </span>
        </div>
      )}

      {!collapsed && (
        <div className="p-3 md:p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(name => (
              <div key={name} className="text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase py-1">{name}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <CalendarDayCell
                key={idx}
                day={day}
                today={today}
                totalRooms={totalRooms}
                bookedCount={day ? (dayBookingMap[day.getDate()]?.bookedCount || 0) : 0}
                isCurrentMonth={!!day}
                onClick={(d) => onDateClick(d, roomType)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300" />
              <span className="text-[10px] md:text-xs text-gray-600">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300" />
              <span className="text-[10px] md:text-xs text-gray-600">Partially Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
              <span className="text-[10px] md:text-xs text-gray-600">Fully Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-300" />
              <span className="text-[10px] md:text-xs text-gray-600">Today</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Date Details Popup (Level 1) ───────────────────────────────────
function DateDetailsModal({ date, roomType, bookings, allRoomTypes, onClose, onRoomClick }) {
  if (!date || !roomType) return null

  const totalRooms = roomType.count || roomType.roomNumbers?.length || 0
  const roomNumbers = roomType.roomNumbers || []

  const dayBookings = bookings.filter(b =>
    b.status !== 'cancelled' &&
    doesBookingOverlapDate(b, date) &&
    b.items?.some(item => item.roomTypeKey === roomType.key)
  )

  let totalBooked = 0
  dayBookings.forEach(b => {
    b.items?.forEach(item => {
      if (item.roomTypeKey === roomType.key) totalBooked += item.quantity || 0
    })
  })
  totalBooked = Math.min(totalBooked, totalRooms)
  const available = Math.max(0, totalRooms - totalBooked)

  const roomDetails = roomNumbers.map(rn => {
    const bookingsForRoom = dayBookings.filter(b =>
      b.items?.some(item => item.roomTypeKey === roomType.key && item.allottedRoomNumbers?.includes(rn))
    )
    return { roomNumber: rn, bookings: bookingsForRoom, isBooked: bookingsForRoom.length > 0 }
  })

  const unallottedBookings = dayBookings.filter(b =>
    b.items?.some(item =>
      item.roomTypeKey === roomType.key && (!item.allottedRoomNumbers || item.allottedRoomNumbers.length === 0)
    )
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-4 md:p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <CalendarDays size={22} />
                {date.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-indigo-200 text-sm mt-0.5 flex items-center gap-1">
                <Building2 size={14} /> {roomType.title}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={22} /></button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
          <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
            <p className="text-2xl font-black text-gray-900">{totalRooms}</p>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">Total Rooms</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200 shadow-sm">
            <p className="text-2xl font-black text-red-600">{totalBooked}</p>
            <p className="text-[10px] md:text-xs text-red-500 font-medium mt-0.5">Booked</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200 shadow-sm">
            <p className="text-2xl font-black text-emerald-600">{available}</p>
            <p className="text-[10px] md:text-xs text-emerald-500 font-medium mt-0.5">Available</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <DoorOpen size={16} className="text-indigo-600" />
            Room Details ({dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''})
          </h3>

          {roomDetails.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roomDetails.map(rd => (
                <button
                  key={rd.roomNumber}
                  onClick={() => rd.isBooked && onRoomClick(rd)}
                  className={`relative rounded-xl border-2 p-3 transition-all duration-200 text-left ${
                    rd.isBooked
                      ? 'bg-red-50 border-red-300 hover:border-red-400 hover:shadow-md cursor-pointer'
                      : 'bg-emerald-50 border-emerald-300 cursor-default'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-lg font-black ${rd.isBooked ? 'text-red-700' : 'text-emerald-700'}`}>{rd.roomNumber}</span>
                    {rd.isBooked ? (
                      <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center"><Bed size={13} className="text-red-600" /></div>
                    ) : (
                      <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center"><CheckCircle2 size={13} className="text-emerald-600" /></div>
                    )}
                  </div>
                  <p className={`text-[10px] font-semibold ${rd.isBooked ? 'text-red-500' : 'text-emerald-500'}`}>
                    {rd.isBooked ? 'Occupied' : 'Available'}
                  </p>
                  {rd.isBooked && (
                    <p className="text-[9px] text-red-400 mt-0.5 flex items-center gap-0.5"><Eye size={9} /> Tap for details</p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-400 py-3">
              <AlertCircle size={20} className="mx-auto mb-1" />
              No room numbers assigned to this room type
            </div>
          )}

          {unallottedBookings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <AlertCircle size={14} /> Bookings Without Room Allotment ({unallottedBookings.length})
              </h4>
              <div className="space-y-2">
                {unallottedBookings.map(booking => (
                  <button
                    key={booking._id}
                    onClick={() => onRoomClick({ roomNumber: 'N/A', bookings: [booking], isBooked: true })}
                    className="w-full flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all text-left"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{booking.user?.name || 'Guest'}</p>
                      <p className="text-[10px] text-gray-500">
                        {booking.items?.filter(i => i.roomTypeKey === roomType.key).map(i => `${i.quantity} room${i.quantity > 1 ? 's' : ''}`).join(', ')}
                      </p>
                    </div>
                    <Eye size={14} className="text-amber-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {dayBookings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" /> All Bookings for this Date
              </h4>
              <div className="space-y-2">
                {dayBookings.map(booking => {
                  const itemForType = booking.items?.find(i => i.roomTypeKey === roomType.key)
                  return (
                    <button
                      key={booking._id}
                      onClick={() => onRoomClick({ roomNumber: itemForType?.allottedRoomNumbers?.join(', ') || 'N/A', bookings: [booking], isBooked: true })}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all text-left"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{booking.user?.name || 'Guest'}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-500">{itemForType?.quantity || 0} room{(itemForType?.quantity || 0) > 1 ? 's' : ''}</span>
                          {itemForType?.allottedRoomNumbers?.length > 0 && (
                            <span className="text-[10px] text-indigo-500 font-semibold">[{itemForType.allottedRoomNumbers.join(', ')}]</span>
                          )}
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</span>
                          <StatusBadge status={booking.status} />
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 shrink-0" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {dayBookings.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">All rooms available!</p>
              <p className="text-xs text-gray-400 mt-1">No bookings on this date for {roomType.title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Customer Details Popup (Level 2) ───────────────────────────────
function CustomerDetailsModal({ roomData, roomType, onClose }) {
  if (!roomData) return null
  const { roomNumber, bookings } = roomData

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><DoorOpen size={20} /> Room {roomNumber}</h2>
              <p className="text-purple-200 text-xs mt-0.5">{roomType?.title} • Customer Details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {bookings.map((booking, idx) => (
            <div key={booking._id || idx} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{booking.user?.name || 'Guest'}</p>
                      <p className="text-[10px] text-gray-500 font-mono">ID: #{booking._id?.slice(-8)}</p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {booking.user?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><Mail size={13} className="text-blue-600" /></div>
                      <span className="text-gray-700 truncate">{booking.user.email}</span>
                    </div>
                  )}
                  {booking.user?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0"><Phone size={13} className="text-green-600" /></div>
                      <span className="text-gray-700">{booking.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Calendar size={12} /> Stay Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Check-In</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Check-Out</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(booking.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Nights</p>
                      <p className="text-sm font-semibold text-indigo-600">{booking.nights || 1}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Booked On</p>
                      <p className="text-sm font-semibold text-gray-600">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Bed size={12} /> Rooms Booked</h4>
                  {booking.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-500">{item.quantity} room{item.quantity > 1 ? 's' : ''}</span>
                          {item.allottedRoomNumbers?.length > 0 && (
                            <div className="flex gap-0.5">
                              {item.allottedRoomNumbers.map(rn => (
                                <span key={rn} className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-semibold">{rn}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">₹{(item.subtotal || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {booking.items?.some(item => item.guests?.length > 0) && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Users size={12} /> Guest Details</h4>
                    {booking.items.flatMap((item, itemIdx) =>
                      (item.guests || []).map((guest, gIdx) => (
                        <div key={`${itemIdx}-${gIdx}`} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${guest.type === 'child' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                              {guest.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{guest.name}</p>
                              {guest.email && <p className="text-[10px] text-gray-400">{guest.email}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${guest.type === 'child' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                              {guest.type === 'child' ? 'Child' : 'Adult'}
                            </span>
                            {guest.age !== undefined && <p className="text-[10px] text-gray-400 mt-0.5">Age: {guest.age}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><IndianRupee size={12} /> Payment Summary</h4>
                  <div className="space-y-1">
                    {booking.subtotal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">₹{booking.subtotal.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.gstAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">GST ({booking.gstPercentage}%)</span>
                        <span className="text-gray-900">₹{booking.gstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-1 border-t border-green-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────────────
export default function WorkerBookingCalendarHistory() {
  const router = useRouter()
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [bookings, setBookings] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')

  const [dateModal, setDateModal] = useState(null)
  const [customerModal, setCustomerModal] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingsRes, roomTypesRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/room-types')
      ])
      setBookings(bookingsRes.data.bookings || [])
      setRoomTypes(roomTypesRes.data.types || roomTypesRes.data.roomTypes || roomTypesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchData])

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }
  const goToToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings
    return bookings.filter(b => b.status === statusFilter)
  }, [bookings, statusFilter])

  const filteredRoomTypes = useMemo(() => {
    if (roomTypeFilter === 'all') return roomTypes
    return roomTypes.filter(rt => rt.key === roomTypeFilter)
  }, [roomTypes, roomTypeFilter])

  const monthStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    let totalBookingsThisMonth = 0
    let totalRevenueThisMonth = 0
    bookings.forEach(b => {
      if (b.status === 'cancelled') return
      const checkIn = new Date(b.checkIn)
      const checkOut = new Date(b.checkOut)
      const monthStart = new Date(currentYear, currentMonth, 1)
      const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      if (checkIn <= monthEnd && checkOut >= monthStart) {
        totalBookingsThisMonth++
        totalRevenueThisMonth += b.totalAmount || b.total || 0
      }
    })
    return { totalBookingsThisMonth, totalRevenueThisMonth, daysInMonth }
  }, [bookings, currentYear, currentMonth])

  const handleDateClick = (date, roomType) => setDateModal({ date, roomType })
  const handleRoomClick = (roomData) => {
    if (roomData.bookings.length > 0) setCustomerModal({ roomData, roomType: dateModal?.roomType })
  }

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading booking calendar...</p>
            <p className="text-gray-400 text-sm mt-1">Fetching rooms & bookings data</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={26} />
              Booking Calendar
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Visual overview of all bookings by room type • Click any date to see details
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-indigo-200"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Month Navigation & Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 md:p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={goToPrevMonth} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
            <ChevronLeft size={18} /> <span className="hidden md:inline">Prev</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg md:text-2xl font-black text-gray-900">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
            <button onClick={goToToday} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold mt-0.5 hover:underline">Go to Today</button>
          </div>
          <button onClick={goToNextMonth} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
            <span className="hidden md:inline">Next</span> <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-2 pt-3 border-t border-gray-100">
          <div className="relative flex-1">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white font-medium">
              <option value="all">All Room Types</option>
              {roomTypes.map(rt => (<option key={rt.key} value={rt.key}>{rt.title}</option>))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white font-medium">
              <option value="all">All Statuses</option>
              <option value="paid">Confirmed (Paid)</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
            <p className="text-xl md:text-2xl font-black text-indigo-600">{monthStats.totalBookingsThisMonth}</p>
            <p className="text-[10px] md:text-xs text-indigo-400 font-semibold">Bookings This Month</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-xl md:text-2xl font-black text-green-600">₹{monthStats.totalRevenueThisMonth.toLocaleString()}</p>
            <p className="text-[10px] md:text-xs text-green-400 font-semibold">Revenue This Month</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <p className="text-xl md:text-2xl font-black text-purple-600">{filteredRoomTypes.length}</p>
            <p className="text-[10px] md:text-xs text-purple-400 font-semibold">Room Types</p>
          </div>
        </div>
      </div>

      {/* Room Type Calendars */}
      {filteredRoomTypes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-semibold">No room types found</p>
          <p className="text-gray-400 text-sm mt-1">Please add room types from the admin panel</p>
        </div>
      ) : (
        filteredRoomTypes.map(rt => (
          <RoomTypeCalendar
            key={rt.key}
            roomType={rt}
            bookings={filteredBookings}
            year={currentYear}
            month={currentMonth}
            today={today}
            onDateClick={handleDateClick}
          />
        ))
      )}

      {/* Legend Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Info size={14} className="text-gray-400" />
          <span className="text-xs font-bold text-gray-500 uppercase">How to Use</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
          <p className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300 shrink-0" />
            Green = All rooms available on that date
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-amber-200 border border-amber-300 shrink-0" />
            Yellow = Some rooms booked (partially occupied)
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-red-200 border border-red-300 shrink-0" />
            Red = All rooms fully booked on that date
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Click on any colored date to see detailed booking info. Numbers show booked/total rooms.
        </p>
      </div>

      {/* Date Details Modal */}
      {dateModal && (
        <DateDetailsModal
          date={dateModal.date}
          roomType={dateModal.roomType}
          bookings={filteredBookings}
          allRoomTypes={roomTypes}
          onClose={() => setDateModal(null)}
          onRoomClick={handleRoomClick}
        />
      )}

      {/* Customer Details Modal */}
      {customerModal && (
        <CustomerDetailsModal
          roomData={customerModal.roomData}
          roomType={customerModal.roomType}
          onClose={() => setCustomerModal(null)}
        />
      )}
    </WorkerLayout>
  )
}
