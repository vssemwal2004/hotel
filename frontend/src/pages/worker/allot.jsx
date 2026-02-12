import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../../layouts/WorkerLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../../utils/api'
import { CalendarCheck, Users, Home, CheckCircle, XCircle, Mail, User, Phone, Plus, Trash2 } from 'lucide-react'
import { calculateGST, formatGSTLabel } from '../../utils/gst'

export default function WorkerAllot(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const authorized = useMemo(()=> user && (user.role==='worker' || user.role==='admin'), [user])

  // Main booking fields
  const [checkIn, setCheckIn] = useState('')
  const [fullDay, setFullDay] = useState(false)
  const [nights, setNights] = useState(1)
  const [checkOut, setCheckOut] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [roomTypeKey, setRoomTypeKey] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [markPaid, setMarkPaid] = useState(true)
  
  // Guest management - array of guest objects
  const [guests, setGuests] = useState([
    { name: '', email: '', phone: '', age: 21, type: 'adult' }
  ])

  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  useEffect(()=>{
    if (!authorized) return
    (async ()=>{
      try {
        const { data } = await api.get('/room-types')
        const types = data?.types || []
        setRoomTypes(types)
        if (!roomTypeKey && types[0]?.key) setRoomTypeKey(types[0].key)
      } catch (e) {
        console.error('Failed to fetch room types:', e)
      }
    })()
  }, [authorized])

  // Auto-calculate checkout date when fullDay is true
  useEffect(() => {
    if (fullDay && checkIn && nights > 0) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkInDate)
      checkOutDate.setDate(checkOutDate.getDate() + Number(nights))
      // Format to datetime-local format (YYYY-MM-DDTHH:MM)
      const formatted = checkOutDate.toISOString().slice(0, 16)
      setCheckOut(formatted)
    }
  }, [fullDay, checkIn, nights])

  // Add new guest
  const addGuest = () => {
    setGuests([...guests, { name: '', email: '', phone: '', age: 21, type: 'adult' }])
  }

  // Remove guest
  const removeGuest = (index) => {
    if (guests.length === 1) return // Keep at least one guest
    setGuests(guests.filter((_, i) => i !== index))
  }

  // Update guest field
  const updateGuest = (index, field, value) => {
    const updated = [...guests]
    updated[index] = { ...updated[index], [field]: value }
    setGuests(updated)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setResult(null)
    
    // Validate at least one guest has a name
    if (!guests.some(g => g.name.trim())) {
      setError('At least one guest must have a name')
      setSaving(false)
      return
    }

    try {
      // Get primary guest (first with name)
      const primaryGuest = guests.find(g => g.name.trim()) || guests[0]
      
      // Prepare guests array with proper age and type
      const guestList = guests
        .filter(g => g.name.trim()) // Only include guests with names
        .map(g => ({
          name: g.name.trim(),
          email: g.email.trim() || undefined,
          phone: g.phone.trim() || undefined,
          age: Number(g.age) || 21,
          type: g.type
        }))

      const payload = {
        user: { 
          name: primaryGuest.name.trim(), 
          email: primaryGuest.email.trim() || `guest${Date.now()}@hotel.com` 
        },
        checkIn,
        checkOut, // Always send checkOut (calculated or manual)
        fullDay,
        items: [ { 
          roomTypeKey, 
          quantity: Number(quantity), 
          guests: guestList 
        } ],
        paid: markPaid
      }

      const { data } = await api.post('/bookings/manual', payload)
      setResult(data.booking)
      
      // Reset form after successful submission
      setTimeout(() => {
        setGuests([{ name: '', email: '', phone: '', age: 21, type: 'adult' }])
        setCheckIn('')
        setCheckOut('')
        setNights(1)
        setFullDay(false)
        setQuantity(1)
        setResult(null)
      }, 3000)
    } catch (e) {
      console.error('Booking error:', e)
      setError(e?.response?.data?.message || 'Failed to allot room')
    } finally { 
      setSaving(false) 
    }
  }

  if (loading) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  if (!authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Room Allotment</h1>
        <p className="text-sm md:text-base text-gray-600">Create offline bookings and walk-in reservations</p>
      </div>

      {/* Success Message */}
      {result && (
        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 p-4 md:p-6 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="text-emerald-800 font-semibold text-base md:text-lg mb-2">Booking Created Successfully!</h3>
              <div className="text-sm md:text-base text-emerald-700 space-y-1">
                <p><strong>Booking ID:</strong> <span className="font-mono text-xs md:text-sm">{result._id}</span></p>
                <p><strong>Guest:</strong> {result.user?.name} ({result.user?.email})</p>
                <p><strong>Status:</strong> <span className="capitalize font-semibold">{result.status}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 md:p-6 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Error</h3>
              <p className="text-sm md:text-base text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-8">
        <form onSubmit={submit} className="space-y-6">
          
          {/* Guest Information Section */}
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users size={24} className="text-teal-600" />
                Guest Information
              </h2>
              <button
                type="button"
                onClick={addGuest}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all text-sm md:text-base w-full sm:w-auto justify-center"
              >
                <Plus size={18} />
                Add Guest
              </button>
            </div>

            {/* Guest Cards */}
            <div className="space-y-4">
              {guests.map((guest, index) => (
                <div key={index} className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                      Guest {index + 1} {index === 0 && <span className="text-teal-600 text-xs">(Primary)</span>}
                    </h3>
                    {guests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuest(index)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Name {index === 0 && '*'}
                      </label>
                      <input
                        required={index === 0}
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="Full name"
                        value={guest.name}
                        onChange={e => updateGuest(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="email@example.com"
                        value={guest.email}
                        onChange={e => updateGuest(index, 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Phone size={14} />
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        placeholder="+91 98765 43210"
                        value={guest.phone}
                        onChange={e => updateGuest(index, 'phone', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Age</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                          value={guest.age}
                          onChange={e => updateGuest(index, 'age', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Type</label>
                        <select
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                          value={guest.type}
                          onChange={e => updateGuest(index, 'type', e.target.value)}
                        >
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Details */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarCheck size={24} className="text-teal-600" />
              Booking Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Check-in Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border-2 border-gray-300 cursor-pointer hover:bg-gray-100 transition-all w-full md:w-auto">
                  <input
                    type="checkbox"
                    className="w-4 h-4 md:w-5 md:h-5 text-teal-600 rounded focus:ring-teal-500"
                    checked={fullDay}
                    onChange={e => setFullDay(e.target.checked)}
                  />
                  <span className="text-xs md:text-sm font-semibold text-gray-700">Auto-calculate Check-out</span>
                </label>
              </div>
              {fullDay ? (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Number of Nights *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    value={nights}
                    onChange={e => setNights(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Check-out Date & Time *</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              )}
            </div>
            {/* Show auto-calculated checkout when fullDay is true */}
            {fullDay && checkOut && (
              <div className="mt-3 text-sm bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                <span className="text-teal-700 font-semibold">Auto-calculated Check-out:</span>{' '}
                <span className="text-teal-900">{new Date(checkOut).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}</span>
              </div>
            )}
          </div>

          {/* Room Details */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Home size={24} className="text-teal-600" />
              Room Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
                <select
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  value={roomTypeKey}
                  onChange={e => setRoomTypeKey(e.target.value)}
                >
                  {roomTypes.length === 0 ? (
                    <option>Loading room types...</option>
                  ) : (
                    roomTypes.map(rt => (
                      <option key={rt.key} value={rt.key}>
                        {rt.title} - ₹{rt.basePrice || rt.prices?.roomOnly || 0} (Available: {rt.count})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Number of Rooms *</label>
                <input
                  required
                  type="number"
                  min={1}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Price & GST Breakdown */}
          {roomTypeKey && roomTypes.length > 0 && (() => {
            const selectedRT = roomTypes.find(rt => rt.key === roomTypeKey)
            if (!selectedRT) return null
            const pricePerNight = selectedRT.prices?.roomOnly || selectedRT.basePrice || 0
            const roomSubtotal = pricePerNight * (Number(quantity) || 1)
            const gstResult = calculateGST(roomSubtotal, selectedRT, pricePerNight)
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  💰 Price Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Room Charge ({Number(quantity) || 1} room × ₹{pricePerNight.toLocaleString()})</span>
                    <span className="font-medium text-gray-900">₹{roomSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{formatGSTLabel(gstResult.gstPercentage)}</span>
                    <span className="font-medium text-gray-900">₹{gstResult.gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-blue-300 pt-2 mt-2">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-green-600">₹{gstResult.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Payment Status */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border-2 border-teal-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 md:w-5 md:h-5 text-teal-600 rounded focus:ring-teal-500"
                checked={markPaid}
                onChange={e => setMarkPaid(e.target.checked)}
              />
              <div>
                <span className="text-xs md:text-sm font-semibold text-gray-900 block">Mark as Paid</span>
                <span className="text-xs text-gray-600">Room availability will be decremented immediately</span>
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/worker')}
              className="w-full md:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg md:rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || roomTypes.length === 0}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg md:rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Booking...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Allot Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </WorkerLayout>
  )
}
