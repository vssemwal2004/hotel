import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../layouts/AdminLayout'
import api from '../../../utils/api'
import { useToast } from '../../../components/ToastProvider'
import { 
  DoorOpen,
  Search, 
  Calendar,
  User,
  Bed,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Save
} from 'lucide-react'

export default function AllotRoomsPage() {
  const router = useRouter()
  const { id } = router.query
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [availableRooms, setAvailableRooms] = useState({}) // { roomTypeKey: [roomNumbers] }
  const [selectedRooms, setSelectedRooms] = useState({}) // { roomTypeKey: [selectedRoomNumbers] }
  const [saving, setSaving] = useState(false)
  const [fetchingRooms, setFetchingRooms] = useState(false)

  // Search state (when no id provided)
  const [allBookings, setAllBookings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchBooking()
    } else {
      fetchAllBookings()
    }
  }, [id])

  const fetchAllBookings = async () => {
    setSearchLoading(true)
    try {
      const { data } = await api.get('/bookings')
      setAllBookings((data.bookings || []).filter(b => b.status === 'paid'))
    } catch (e) { /* ignore */ }
    finally { setSearchLoading(false) }
  }

  const fetchBooking = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/bookings?_id=${id}`)
      const bookingData = data.bookings?.find(b => b._id === id)
      
      if (bookingData) {
        setBooking(bookingData)
        
        // Initialize selected rooms from already allotted rooms
        const initialSelected = {}
        bookingData.items?.forEach(item => {
          if (item.allottedRoomNumbers && item.allottedRoomNumbers.length > 0) {
            initialSelected[item.roomTypeKey] = item.allottedRoomNumbers
          } else {
            initialSelected[item.roomTypeKey] = []
          }
        })
        setSelectedRooms(initialSelected)
        
        // Fetch available rooms for each room type
        await fetchAvailableRooms(bookingData)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.show({ type: 'error', message: 'Failed to load booking details' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRooms = async (bookingData) => {
    setFetchingRooms(true)
    try {
      const availableRoomsData = {}
      
      for (const item of bookingData.items) {
        try {
          const { data } = await api.get(`/bookings/available-rooms/${item.roomTypeKey}`, {
            params: {
              checkIn: bookingData.checkIn,
              checkOut: bookingData.checkOut
            }
          })
          
          // Include currently allotted rooms as available for this booking
          const currentlyAllotted = item.allottedRoomNumbers || []
          const allAvailable = [...new Set([...data.availableRoomNumbers, ...currentlyAllotted])]
          availableRoomsData[item.roomTypeKey] = allAvailable.sort()
        } catch (error) {
          console.error(`Error fetching rooms for ${item.roomTypeKey}:`, error)
          availableRoomsData[item.roomTypeKey] = []
        }
      }
      
      setAvailableRooms(availableRoomsData)
    } catch (error) {
      console.error('Error fetching available rooms:', error)
    } finally {
      setFetchingRooms(false)
    }
  }

  const toggleRoomSelection = (roomTypeKey, roomNumber, maxQuantity) => {
    setSelectedRooms(prev => {
      const currentSelected = prev[roomTypeKey] || []
      
      if (currentSelected.includes(roomNumber)) {
        // Deselect
        return {
          ...prev,
          [roomTypeKey]: currentSelected.filter(rn => rn !== roomNumber)
        }
      } else {
        // Select (only if under quantity limit)
        if (currentSelected.length < maxQuantity) {
          return {
            ...prev,
            [roomTypeKey]: [...currentSelected, roomNumber]
          }
        } else {
          toast.show({ type: 'warning', message: `You can only select ${maxQuantity} room(s) for this room type` })
          return prev
        }
      }
    })
  }

  const saveAllotment = async () => {
    // Validate that all items have rooms selected
    const allotments = []
    let validated = true
    
    for (const item of booking.items) {
      const selected = selectedRooms[item.roomTypeKey] || []
      
      if (selected.length === 0) {
        // Allow saving without allotment (worker can allot later)
        continue
      }
      
      if (selected.length !== item.quantity) {
        toast.show({ type: 'warning', message: `Please select exactly ${item.quantity} room(s) for ${item.title}` })
        validated = false
        break
      }
      
      allotments.push({
        roomTypeKey: item.roomTypeKey,
        roomNumbers: selected
      })
    }
    
    if (!validated && allotments.length === 0) return
    
    setSaving(true)
    try {
      await api.post(`/bookings/${booking._id}/allot-rooms`, { allotments })
      toast.show({ type: 'success', message: 'Room allotment saved successfully!' })
      router.push('/admin/bookings/check-in')
    } catch (error) {
      console.error('Error saving allotment:', error)
      toast.show({ type: 'error', message: error.response?.data?.message || 'Failed to save room allotment' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // No ID provided — show booking selector
  if (!id) {
    const filtered = allBookings.filter(b => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const guest = b.guestDetails || b.user || {}
      return (guest.name || '').toLowerCase().includes(q) ||
             (guest.email || '').toLowerCase().includes(q) ||
             (guest.phone || '').includes(q) ||
             (b._id || '').toLowerCase().includes(q)
    })
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><DoorOpen size={24} className="text-indigo-600" /> Assign Rooms</h1>
            <p className="text-sm text-gray-500 mt-1">Select a paid booking to assign rooms</p>
          </div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by guest name, email, phone, or booking ID..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
          {searchLoading ? (
            <div className="text-center py-10"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle size={40} className="mx-auto mb-2" />
              <p>No paid bookings found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 20).map(b => {
                const guest = b.guestDetails || b.user || {}
                const hasRooms = b.items?.some(i => i.allottedRoomNumbers?.length > 0)
                return (
                  <button key={b._id}
                    onClick={() => router.push(`/admin/bookings/allot-rooms?id=${b._id}`)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${hasRooms ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {(guest.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{guest.name || 'Guest'}</p>
                      <p className="text-xs text-gray-500 truncate">{guest.email || guest.phone || b._id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${hasRooms ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {hasRooms ? 'ASSIGNED' : 'PENDING'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    )
  }

  if (!booking) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </AdminLayout>
    )
  }

  // Prevent allotment for non-paid bookings
  if (booking.status !== 'paid') {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-3" />
          <p className="text-xl font-bold text-gray-900 mb-2">Payment Required</p>
          <p className="text-gray-600 mb-4">
            Room allotment is only available for paid bookings.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current Status: <span className={`font-semibold ${booking.status === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DoorOpen size={32} />
            Allot Rooms
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Select specific room numbers for booking #{booking._id.slice(-6)}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
        >
          <X size={18} className="inline mr-1" />
          Cancel
        </button>
      </div>

      {/* Booking Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Guest Name</p>
            <p className="text-lg font-bold text-gray-900">{booking.user?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Check-In - Check-Out</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              <ArrowRight size={16} className="inline mx-1" />
              {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Nights</p>
            <p className="text-lg font-bold text-gray-900">{booking.nights || 1} Nights</p>
          </div>
        </div>
      </div>

      {/* Room Allotment Section */}
      {fetchingRooms ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading available rooms...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {booking.items?.map((item, idx) => {
            const available = availableRooms[item.roomTypeKey] || []
            const selected = selectedRooms[item.roomTypeKey] || []
            
            return (
              <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-purple-100 text-sm">
                        Quantity: {item.quantity} | Selected: {selected.length}/{item.quantity}
                      </p>
                    </div>
                    <Bed size={32} />
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {available.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle size={40} className="mx-auto text-red-400 mb-2" />
                      <p className="text-gray-600">No room numbers configured for this room type</p>
                      <p className="text-sm text-gray-500 mt-1">Please contact admin to add room numbers</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {available.map((roomNumber) => {
                        const isSelected = selected.includes(roomNumber)
                        return (
                          <button
                            key={roomNumber}
                            onClick={() => toggleRoomSelection(item.roomTypeKey, roomNumber, item.quantity)}
                            className={`
                              relative p-4 rounded-lg border-2 font-bold text-lg transition-all
                              ${isSelected 
                                ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400 hover:shadow-md'
                              }
                            `}
                          >
                            {roomNumber}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 bg-white rounded-full p-1">
                                <Check size={14} className="text-green-600" />
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveAllotment}
          disabled={saving || fetchingRooms}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Room Allotment
            </>
          )}
        </button>
      </div>
    </AdminLayout>
  )
}
