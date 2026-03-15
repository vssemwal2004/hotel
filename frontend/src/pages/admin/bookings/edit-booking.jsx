import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../../layouts/AdminLayout'
import api from '../../../utils/api'
import { useToast } from '../../../components/ToastProvider'
import { 
  Edit,
  Calendar,
  User,
  Bed,
  X,
  Save,
  AlertCircle,
  Plus,
  Minus,
  Users,
  Check,
  DoorOpen,
  Search
} from 'lucide-react'

export default function EditBookingPage() {
  const router = useRouter()
  const { id } = router.query
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Search state (when no id provided)
  const [allBookings, setAllBookings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)

  // Form state
  const [newCheckOut, setNewCheckOut] = useState('')
  const [additionalGuests, setAdditionalGuests] = useState({}) // { roomTypeKey: [guests] }
  const [newGuestName, setNewGuestName] = useState({}) // { roomTypeKey: string }
  const [newGuestAge, setNewGuestAge] = useState({}) // { roomTypeKey: number }
  const [newGuestType, setNewGuestType] = useState({}) // { roomTypeKey: 'adult' | 'child' }
  const [availableRooms, setAvailableRooms] = useState({}) // { roomTypeKey: [roomNumbers] }
  const [selectedRooms, setSelectedRooms] = useState({}) // { roomTypeKey: [selectedRoomNumbers] }
  const [fetchingRooms, setFetchingRooms] = useState(false)

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
      setAllBookings((data.bookings || []).filter(b => b.status === 'paid' || b.status === 'pending'))
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
        setNewCheckOut(bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : '')
        
        // Initialize additional guests state
        const initialGuests = {}
        const initialSelected = {}
        bookingData.items?.forEach(item => {
          initialGuests[item.roomTypeKey] = []
          initialSelected[item.roomTypeKey] = item.allottedRoomNumbers || []
        })
        setAdditionalGuests(initialGuests)
        setSelectedRooms(initialSelected)
        
        // Fetch available rooms
        await fetchAvailableRooms(bookingData)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.show({ type: 'error', message: 'Failed to load booking details' })
    } finally {
      setLoading(false)
    }
  }

  const addGuest = (roomTypeKey) => {
    const name = newGuestName[roomTypeKey]
    const age = newGuestAge[roomTypeKey]
    const type = newGuestType[roomTypeKey] || 'adult'
    
    if (!name || !age) {
      toast.show({ type: 'warning', message: 'Please enter guest name and age' })
      return
    }
    
    setAdditionalGuests(prev => ({
      ...prev,
      [roomTypeKey]: [...(prev[roomTypeKey] || []), { name, age: parseInt(age), type }]
    }))
    
    // Clear input
    setNewGuestName(prev => ({ ...prev, [roomTypeKey]: '' }))
    setNewGuestAge(prev => ({ ...prev, [roomTypeKey]: '' }))
    setNewGuestType(prev => ({ ...prev, [roomTypeKey]: 'adult' }))
  }

  const removeGuest = (roomTypeKey, index) => {
    setAdditionalGuests(prev => ({
      ...prev,
      [roomTypeKey]: prev[roomTypeKey].filter((_, i) => i !== index)
    }))
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
          
          // Include currently allotted rooms
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
        return {
          ...prev,
          [roomTypeKey]: currentSelected.filter(rn => rn !== roomNumber)
        }
      } else {
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

  const saveChanges = async () => {
    setSaving(true)
    try {
      const updates = {}
      
      // Check if checkout date changed
      if (newCheckOut && newCheckOut !== new Date(booking.checkOut).toISOString().split('T')[0]) {
        updates.checkOut = newCheckOut
      }
      
      // Check if there are additional guests
      const guestsToAdd = []
      Object.keys(additionalGuests).forEach(roomTypeKey => {
        if (additionalGuests[roomTypeKey].length > 0) {
          guestsToAdd.push({
            roomTypeKey,
            guests: additionalGuests[roomTypeKey]
          })
        }
      })
      
      if (guestsToAdd.length > 0) {
        updates.additionalGuests = guestsToAdd
      }
      
      // Check if room allotments changed
      const allotments = []
      for (const item of booking.items) {
        const selected = selectedRooms[item.roomTypeKey] || []
        const current = item.allottedRoomNumbers || []
        
        if (JSON.stringify(selected.sort()) !== JSON.stringify(current.sort())) {
          if (selected.length > 0 && selected.length !== item.quantity) {
            toast.show({ type: 'warning', message: `Please select exactly ${item.quantity} room(s) for ${item.title}` })
            return
          }
          allotments.push({
            roomTypeKey: item.roomTypeKey,
            roomNumbers: selected
          })
        }
      }
      
      if (allotments.length > 0) {
        updates.allotments = allotments
      }
      
      if (Object.keys(updates).length === 0) {
        toast.show({ type: 'info', message: 'No changes to save' })
        return
      }
      
      await api.put(`/bookings/${booking._id}`, updates)
      toast.show({ type: 'success', message: 'Booking updated successfully!' })
      router.back()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.show({ type: 'error', message: error.response?.data?.message || 'Failed to update booking' })
    } finally {
      setSaving(false)
    }
  }

  const calculateNewTotal = () => {
    if (!booking || !newCheckOut) return booking?.total || 0
    
    const oldCheckOut = new Date(booking.checkOut)
    const newCheckOutDate = new Date(newCheckOut)
    
    if (newCheckOutDate <= oldCheckOut) return booking.total
    
    const oldNights = booking.nights || 1
    const newNights = Math.ceil((newCheckOutDate - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))
    const additionalNights = newNights - oldNights
    
    if (additionalNights <= 0) return booking.total
    
    // Calculate additional cost
    const perNightCost = booking.subtotal / oldNights
    const additionalCost = perNightCost * additionalNights
    const additionalGST = (additionalCost * (booking.gstPercentage || 0)) / 100
    
    return booking.total + additionalCost + additionalGST
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Edit size={24} className="text-blue-600" /> Edit Booking</h1>
            <p className="text-sm text-gray-500 mt-1">Select a booking to edit</p>
          </div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by guest name, email, phone, or booking ID..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {searchLoading ? (
            <div className="text-center py-10"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle size={40} className="mx-auto mb-2" />
              <p>No active bookings found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 20).map(b => {
                const guest = b.guestDetails || b.user || {}
                return (
                  <button key={b._id}
                    onClick={() => router.push(`/admin/bookings/edit-booking?id=${b._id}`)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {(guest.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{guest.name || 'Guest'}</p>
                      <p className="text-xs text-gray-500 truncate">{guest.email || guest.phone || b._id}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {b.status.toUpperCase()}
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

  // Prevent editing cancelled bookings
  if (booking.status === 'cancelled') {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <X size={48} className="mx-auto text-red-500 mb-3" />
          <p className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</p>
          <p className="text-gray-600 mb-6">
            Cannot edit cancelled bookings.
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
            <Edit size={32} />
            Edit Booking
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Modify booking details for #{booking._id.slice(-6)}
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

      {/* Booking Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Guest Name</p>
            <p className="text-lg font-bold text-gray-900">{booking.user?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Check-In Date</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(booking.checkIn).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Nights</p>
            <p className="text-lg font-bold text-gray-900">{booking.nights || 1} Nights</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Extend Check-Out */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={24} />
              Extend Check-Out Date
            </h3>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Check-Out
                </label>
                <input
                  type="date"
                  value={booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : ''}
                  disabled
                  className="w-full border-2 border-gray-300 rounded-lg p-3 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Check-Out *
                </label>
                <input
                  type="date"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  min={booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : ''}
                  className="w-full border-2 border-purple-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {newCheckOut && newCheckOut !== new Date(booking.checkOut).toISOString().split('T')[0] && (
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Price Update:</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Total:</span>
                  <span className="font-bold text-gray-900">₹{booking.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">New Total (Estimated):</span>
                  <span className="font-bold text-green-600">₹{calculateNewTotal().toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Guests */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users size={24} />
              Add More Guests
            </h3>
          </div>
          <div className="p-4 md:p-6">
            {booking.items?.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h4 className="font-bold text-gray-900 mb-3">{item.title}</h4>
                
                {/* Current Guests */}
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Current Guests ({item.guests?.length || 0}):</p>
                  <div className="flex flex-wrap gap-2">
                    {(item.guests || []).map((guest, gIdx) => (
                      <span key={gIdx} className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {guest.name} ({guest.age}y, {guest.type})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Guests */}
                {(additionalGuests[item.roomTypeKey] || []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-green-700 mb-2">
                      New Guests to Add ({additionalGuests[item.roomTypeKey].length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {additionalGuests[item.roomTypeKey].map((guest, gIdx) => (
                        <span key={gIdx} className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {guest.name} ({guest.age}y, {guest.type})
                          <button
                            onClick={() => removeGuest(item.roomTypeKey, gIdx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Guest Form */}
                <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Guest Name"
                      value={newGuestName[item.roomTypeKey] || ''}
                      onChange={(e) => setNewGuestName(prev => ({ ...prev, [item.roomTypeKey]: e.target.value }))}
                      className="border-2 border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      min="0"
                      value={newGuestAge[item.roomTypeKey] || ''}
                      onChange={(e) => setNewGuestAge(prev => ({ ...prev, [item.roomTypeKey]: e.target.value }))}
                      className="border-2 border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <select
                      value={newGuestType[item.roomTypeKey] || 'adult'}
                      onChange={(e) => setNewGuestType(prev => ({ ...prev, [item.roomTypeKey]: e.target.value }))}
                      className="border-2 border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                    </select>
                    <button
                      onClick={() => addGuest(item.roomTypeKey)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room Number Selection */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DoorOpen size={24} />
              Select Room Numbers (Optional)
            </h3>
          </div>
          <div className="p-4 md:p-6">
            {fetchingRooms ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600">Loading available rooms...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {booking.items?.map((item, idx) => {
                  const available = availableRooms[item.roomTypeKey] || []
                  const selected = selectedRooms[item.roomTypeKey] || []
                  
                  return (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} | Selected: {selected.length}/{item.quantity}
                            </p>
                          </div>
                          <Bed size={24} className="text-purple-600" />
                        </div>
                      </div>

                      <div className="p-4">
                        {available.length === 0 ? (
                          <div className="text-center py-4">
                            <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No room numbers configured</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-gray-500 mb-2">- {available.length} rooms available</p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {available.map((roomNumber) => {
                                const isSelected = selected.includes(roomNumber)
                                return (
                                  <button
                                    key={roomNumber}
                                    onClick={() => toggleRoomSelection(item.roomTypeKey, roomNumber, item.quantity)}
                                    className={`relative p-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                                      isSelected
                                        ? 'bg-green-500 border-green-600 text-white shadow-md'
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400'
                                    }`}
                                  >
                                    {roomNumber}
                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                                        <Check size={10} className="text-green-600" />
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                            {selected.length > 0 && (
                              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs font-semibold text-green-700">Selected Rooms:</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {selected.map(rn => (
                                    <span key={rn} className="inline-block px-2 py-0.5 bg-green-500 text-white rounded text-xs font-bold">
                                      Room {rn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveChanges}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </AdminLayout>
  )
}
