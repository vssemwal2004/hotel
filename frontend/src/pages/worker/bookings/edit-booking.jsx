import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WorkerLayout from '../../../layouts/WorkerLayout'
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
  DoorOpen
} from 'lucide-react'

export default function EditBookingPage() {
  const router = useRouter()
  const { id } = router.query
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [newCheckOut, setNewCheckOut] = useState('')
  const [newCheckIn, setNewCheckIn] = useState('')
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' })
  const [editableItems, setEditableItems] = useState([])
  const [pricing, setPricing] = useState({ subtotal: 0, gstPercentage: 0, gstAmount: 0, total: 0 })
  const [additionalGuests, setAdditionalGuests] = useState({}) // { roomTypeKey: [guests] }
  const [newGuestName, setNewGuestName] = useState({}) // { roomTypeKey: string }
  const [newGuestAge, setNewGuestAge] = useState({}) // { roomTypeKey: number }
  const [newGuestType, setNewGuestType] = useState({}) // { roomTypeKey: 'adult' | 'child' }
  const [availableRooms, setAvailableRooms] = useState({}) // { roomTypeKey: [roomNumbers] }
  const [selectedRooms, setSelectedRooms] = useState({}) // { roomTypeKey: [selectedRoomNumbers] }
  const [fetchingRooms, setFetchingRooms] = useState(false)

  const getPricingNights = () => {
    if (newCheckIn && newCheckOut) {
      const inD = new Date(newCheckIn)
      const outD = new Date(newCheckOut)
      if (!Number.isNaN(inD.getTime()) && !Number.isNaN(outD.getTime()) && outD > inD) {
        const ms = 24 * 60 * 60 * 1000
        return Math.max(1, Math.ceil((outD - inD) / ms))
      }
    }
    return Math.max(1, Number(booking?.nights || 1))
  }

  const calcSubtotalFromItems = (items, nights) => {
    const n = Math.max(1, Number(nights || 1))
    return (items || []).reduce((sum, it) => {
      const qty = Math.max(0, Number(it?.quantity || 0))
      const price = Math.max(0, Number(it?.basePrice || 0))
      return sum + (qty * price * n)
    }, 0)
  }

  const calcPricing = (subtotal, gstPercentage) => {
    const s = Math.max(0, Number(subtotal || 0))
    const p = Math.max(0, Number(gstPercentage || 0))
    const gstAmount = Math.round((s * p) / 100)
    return { subtotal: s, gstPercentage: p, gstAmount, total: s + gstAmount }
  }

  useEffect(() => {
    if (id) {
      fetchBooking()
    }
  }, [id])

  useEffect(() => {
    if (!booking) return
    const nights = getPricingNights()
    const subtotal = calcSubtotalFromItems(editableItems, nights)
    setPricing(prev => {
      const next = calcPricing(subtotal, prev.gstPercentage)
      if (
        Number(prev.subtotal || 0) === Number(next.subtotal || 0) &&
        Number(prev.gstAmount || 0) === Number(next.gstAmount || 0) &&
        Number(prev.total || 0) === Number(next.total || 0)
      ) {
        return prev
      }
      return { ...prev, ...next }
    })
  }, [booking, editableItems, newCheckIn, newCheckOut])

  const fetchBooking = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/bookings?_id=${id}`)
      const bookingData = data.bookings?.find(b => b._id === id)
      
      if (bookingData) {
        setBooking(bookingData)
        setNewCheckIn(bookingData.checkIn ? new Date(bookingData.checkIn).toISOString().split('T')[0] : '')
        setNewCheckOut(bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : '')
        setGuestInfo({
          name: bookingData.user?.name || '',
          email: bookingData.user?.email || '',
          phone: bookingData.user?.phone || ''
        })
        setEditableItems((bookingData.items || []).map(it => ({
          roomTypeKey: it.roomTypeKey,
          title: it.title,
          quantity: Number(it.quantity || 1),
          basePrice: Number(it.basePrice || 0),
          guests: (it.guests || []).map(g => ({
            name: g.name || '',
            email: g.email || '',
            phone: g.phone || '',
            age: Number(g.age || 0),
            type: g.type === 'child' ? 'child' : 'adult'
          })),
          allottedRoomNumbers: it.allottedRoomNumbers || []
        })))
        setPricing({
          subtotal: Number(bookingData.subtotal || 0),
          gstPercentage: Number(bookingData.gstPercentage || 0),
          gstAmount: Number(bookingData.gstAmount || 0),
          total: Number(bookingData.total || 0)
        })
        
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

  const updateItemField = (index, field, value) => {
    setEditableItems(prev => prev.map((it, i) => (
      i === index
        ? {
            ...it,
            [field]: field === 'quantity' || field === 'basePrice'
              ? Math.max(0, Number(value || 0))
              : value
          }
        : it
    )))
  }

  const updateGuestField = (itemIndex, guestIndex, field, value) => {
    setEditableItems(prev => prev.map((it, i) => {
      if (i !== itemIndex) return it
      const nextGuests = (it.guests || []).map((g, gi) => (
        gi === guestIndex
          ? {
              ...g,
              [field]: field === 'age' ? Math.max(0, Number(value || 0)) : value
            }
          : g
      ))
      return { ...it, guests: nextGuests }
    }))
  }

  const addGuestRow = (itemIndex) => {
    setEditableItems(prev => prev.map((it, i) => (
      i === itemIndex
        ? { ...it, guests: [...(it.guests || []), { name: '', email: '', phone: '', age: 18, type: 'adult' }] }
        : it
    )))
  }

  const removeGuestRow = (itemIndex, guestIndex) => {
    setEditableItems(prev => prev.map((it, i) => (
      i === itemIndex
        ? { ...it, guests: (it.guests || []).filter((_, gi) => gi !== guestIndex) }
        : it
    )))
  }

  const saveChanges = async () => {
    setSaving(true)
    try {
      const updates = {}
      const currentCheckIn = booking.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : ''
      const currentCheckOut = booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : ''
      
      // Guest user info changes
      if (
        guestInfo.name !== (booking.user?.name || '') ||
        guestInfo.email !== (booking.user?.email || '') ||
        guestInfo.phone !== (booking.user?.phone || '')
      ) {
        updates.userInfo = {
          name: guestInfo.name,
          email: guestInfo.email,
          phone: guestInfo.phone
        }
      }

      // Date changes
      if (newCheckIn && newCheckIn !== currentCheckIn) {
        updates.checkIn = newCheckIn
      }
      if (newCheckOut && newCheckOut !== currentCheckOut) {
        updates.checkOut = newCheckOut
      }

      // Full item edits (quantity / base price / guests)
      const originalItems = (booking.items || []).map(it => ({
        roomTypeKey: it.roomTypeKey,
        quantity: Number(it.quantity || 1),
        basePrice: Number(it.basePrice || 0),
        guests: (it.guests || []).map(g => ({
          name: g.name || '',
          email: g.email || '',
          phone: g.phone || '',
          age: Number(g.age || 0),
          type: g.type === 'child' ? 'child' : 'adult'
        }))
      }))

      const normalizedEditedItems = (editableItems || []).map(it => ({
        roomTypeKey: it.roomTypeKey,
        quantity: Math.max(1, Number(it.quantity || 1)),
        basePrice: Math.max(0, Number(it.basePrice || 0)),
        guests: (it.guests || []).map(g => ({
          name: g.name || 'Guest',
          email: g.email || undefined,
          phone: g.phone || undefined,
          age: Math.max(0, Number(g.age || 0)),
          type: g.type === 'child' ? 'child' : 'adult'
        })),
        allottedRoomNumbers: selectedRooms[it.roomTypeKey] || []
      }))

      if (JSON.stringify(normalizedEditedItems.map(({ allottedRoomNumbers, ...rest }) => rest)) !== JSON.stringify(originalItems)) {
        updates.replaceItems = true
        updates.items = normalizedEditedItems
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
      for (const item of (editableItems.length > 0 ? editableItems : booking.items)) {
        const selected = selectedRooms[item.roomTypeKey] || []
        const current = booking.items.find(x => x.roomTypeKey === item.roomTypeKey)?.allottedRoomNumbers || []
        
        if (JSON.stringify(selected.sort()) !== JSON.stringify(current.sort())) {
          if (selected.length > 0 && selected.length !== Number(item.quantity || 1)) {
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

      // Manual pricing changes
      if (Number(pricing.gstPercentage || 0) !== Number(booking.gstPercentage || 0)) {
        updates.pricing = {
          gstPercentage: Math.max(0, Number(pricing.gstPercentage || 0))
        }
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

  // Prevent editing cancelled bookings
  if (booking.status === 'cancelled') {
    return (
      <WorkerLayout>
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
            <input
              type="text"
              value={guestInfo.name}
              onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border-2 border-blue-300 rounded-lg p-2.5"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Guest Email</p>
            <input
              type="email"
              value={guestInfo.email}
              onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border-2 border-blue-300 rounded-lg p-2.5"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Guest Phone</p>
            <input
              type="text"
              value={guestInfo.phone}
              onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border-2 border-blue-300 rounded-lg p-2.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Check-In Date</p>
            <input
              type="date"
              value={newCheckIn}
              onChange={(e) => setNewCheckIn(e.target.value)}
              className="w-full border-2 border-blue-300 rounded-lg p-2.5"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Check-Out Date</p>
            <input
              type="date"
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
              min={newCheckIn || undefined}
              className="w-full border-2 border-blue-300 rounded-lg p-2.5"
            />
          </div>
        </div>
      </div>

      {/* Editable Room Items & Guests */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bed size={24} />
            Edit Rooms, Quantity, Price, Guests
          </h3>
        </div>
        <div className="p-4 md:p-6 space-y-5">
          {editableItems.map((item, itemIndex) => (
            <div key={`${item.roomTypeKey}-${itemIndex}`} className="border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Room Type</p>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemField(itemIndex, 'quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Price Per Night</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.basePrice}
                    onChange={(e) => updateItemField(itemIndex, 'basePrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Guests</p>
                  <button
                    type="button"
                    onClick={() => addGuestRow(itemIndex)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded"
                  >
                    <Plus size={14} /> Add Guest
                  </button>
                </div>

                {(item.guests || []).map((guest, guestIndex) => (
                  <div key={guestIndex} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <input
                      type="text"
                      placeholder="Name"
                      value={guest.name}
                      onChange={(e) => updateGuestField(itemIndex, guestIndex, 'name', e.target.value)}
                      className="border border-gray-300 rounded p-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={guest.phone || ''}
                      onChange={(e) => updateGuestField(itemIndex, guestIndex, 'phone', e.target.value)}
                      className="border border-gray-300 rounded p-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Age"
                      value={guest.age}
                      onChange={(e) => updateGuestField(itemIndex, guestIndex, 'age', e.target.value)}
                      className="border border-gray-300 rounded p-2 text-sm"
                    />
                    <select
                      value={guest.type}
                      onChange={(e) => updateGuestField(itemIndex, guestIndex, 'type', e.target.value)}
                      className="border border-gray-300 rounded p-2 text-sm"
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeGuestRow(itemIndex, guestIndex)}
                      className="inline-flex items-center justify-center gap-1 px-2 py-2 text-xs bg-red-100 text-red-700 rounded"
                    >
                      <Minus size={14} /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Pricing */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
          <h3 className="text-xl font-bold">Edit Pricing</h3>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subtotal</label>
            <input type="number" min="0" step="1" value={pricing.subtotal} readOnly className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GST %</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricing.gstPercentage}
              onChange={(e) => {
                const nextPct = Number(e.target.value || 0)
                const nights = getPricingNights()
                const subtotal = calcSubtotalFromItems(editableItems, nights)
                setPricing(prev => ({ ...prev, ...calcPricing(subtotal, nextPct) }))
              }}
              className="w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">GST Amount</label>
            <input type="number" min="0" step="1" value={pricing.gstAmount} readOnly className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Total</label>
            <input type="number" min="0" step="1" value={pricing.total} readOnly className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100" />
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
                {(editableItems.length > 0 ? editableItems : booking.items)?.map((item, idx) => {
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
    </WorkerLayout>
  )
}
