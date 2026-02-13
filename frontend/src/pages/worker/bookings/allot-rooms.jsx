import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WorkerLayout from '../../../layouts/WorkerLayout'
import api from '../../../utils/api'
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
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availableRooms, setAvailableRooms] = useState({}) // { roomTypeKey: [roomNumbers] }
  const [selectedRooms, setSelectedRooms] = useState({}) // { roomTypeKey: [selectedRoomNumbers] }
  const [saving, setSaving] = useState(false)
  const [fetchingRooms, setFetchingRooms] = useState(false)

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
      alert('Failed to load booking details')
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
          alert(`You can only select ${maxQuantity} room(s) for this room type`)
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
        alert(`Please select exactly ${item.quantity} room(s) for ${item.title}`)
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
      alert('Room allotment saved successfully!')
      router.push('/worker/bookings/check-in')
    } catch (error) {
      console.error('Error saving allotment:', error)
      alert(error.response?.data?.message || 'Failed to save room allotment')
    } finally {
      setSaving(false)
    }
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
    </WorkerLayout>
  )
}
