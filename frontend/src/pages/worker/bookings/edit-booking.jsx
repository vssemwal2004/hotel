import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
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
  Users
} from 'lucide-react'

export default function EditBookingPage() {
  const router = useRouter()
  const { id } = router.query
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [newCheckOut, setNewCheckOut] = useState('')
  const [additionalGuests, setAdditionalGuests] = useState({}) // { roomTypeKey: [guests] }
  const [newGuestName, setNewGuestName] = useState({}) // { roomTypeKey: string }
  const [newGuestAge, setNewGuestAge] = useState({}) // { roomTypeKey: number }
  const [newGuestType, setNewGuestType] = useState({}) // { roomTypeKey: 'adult' | 'child' }

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

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
        bookingData.items?.forEach(item => {
          initialGuests[item.roomTypeKey] = []
        })
        setAdditionalGuests(initialGuests)
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      alert('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const addGuest = (roomTypeKey) => {
    const name = newGuestName[roomTypeKey]
    const age = newGuestAge[roomTypeKey]
    const type = newGuestType[roomTypeKey] || 'adult'
    
    if (!name || !age) {
      alert('Please enter guest name and age')
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
      
      if (Object.keys(updates).length === 0) {
        alert('No changes to save')
        return
      }
      
      await api.put(`/bookings/${booking._id}`, updates)
      alert('Booking updated successfully!')
      router.back()
    } catch (error) {
      console.error('Error updating booking:', error)
      alert(error.response?.data?.message || 'Failed to update booking')
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
      <WorkerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  if (!booking) {
    return (
      <WorkerLayout>
        <div className="text-center py-20">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
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
    </WorkerLayout>
  )
}
