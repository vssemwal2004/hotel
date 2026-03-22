import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../../utils/api'
import { CalendarCheck, Users, Home, CheckCircle, XCircle, Mail, User, Phone, AlertCircle, X, IndianRupee } from 'lucide-react'
import { calculateGST, formatGSTLabel } from '../../utils/gst'

export default function AdminWalkIn(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const authorized = useMemo(()=> user && (user.role==='worker' || user.role==='admin'), [user])

  // Main booking fields
  const [checkIn, setCheckIn] = useState('')
  const [fullDay, setFullDay] = useState(false)
  const [nights, setNights] = useState(1)
  const [checkOut, setCheckOut] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [markPaid, setMarkPaid] = useState(true)
  
  // Multiple room type entries - each entry has its own type, quantity, available/selected rooms
  const [roomEntries, setRoomEntries] = useState([
    { id: 1, roomTypeKey: '', quantity: 1, availableRoomNumbers: [], selectedRoomNumbers: [], fetchingRooms: false }
  ])
  
  // Main Guest (Guardian) Information
  const [mainGuest, setMainGuest] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    idType: 'aadhar', // aadhar, pan, voter, license, other
    idNumber: ''
  })

  // Additional Members Count
  const [additionalMembers, setAdditionalMembers] = useState({
    males: 0,
    females: 0,
    children: 0
  })

  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [bookingData, setBookingData] = useState(null)

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
        if (types[0]?.key) {
          setRoomEntries(prev => prev.map((entry, i) => i === 0 && !entry.roomTypeKey ? { ...entry, roomTypeKey: types[0].key } : entry))
        }
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

  // Fetch available room numbers for a specific entry
  const fetchAvailableForEntry = async (entryId, entryOverride = null) => {
    const entry = entryOverride || roomEntries.find(e => e.id === entryId)
    if (!entry?.roomTypeKey || !checkIn || !checkOut) {
      updateRoomEntry(entryId, { availableRoomNumbers: [], selectedRoomNumbers: [] })
      return
    }

    updateRoomEntry(entryId, { fetchingRooms: true })
    try {
      const { data } = await api.get(`/bookings/available-rooms/${entry.roomTypeKey}`, {
        params: { checkIn, checkOut }
      })
      const available = data.availableRoomNumbers || []
      updateRoomEntry(entryId, {
        availableRoomNumbers: available,
        selectedRoomNumbers: (entry.selectedRoomNumbers || []).filter(rn => available.includes(rn)).slice(0, Number(entry.quantity)),
        fetchingRooms: false
      })
    } catch (error) {
      console.error('Error fetching available rooms:', error)
      updateRoomEntry(entryId, { availableRoomNumbers: [], selectedRoomNumbers: [], fetchingRooms: false })
    }
  }

  // Refetch rooms for all entries when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      roomEntries.forEach(entry => {
        if (entry.roomTypeKey) fetchAvailableForEntry(entry.id)
      })
    }
  }, [checkIn, checkOut])

  // Room entry management
  const updateRoomEntry = (id, updates) => {
    setRoomEntries(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry))
  }

  const addRoomEntry = () => {
    const newId = Math.max(...roomEntries.map(e => e.id), 0) + 1
    setRoomEntries(prev => [...prev, { id: newId, roomTypeKey: roomTypes[0]?.key || '', quantity: 1, availableRoomNumbers: [], selectedRoomNumbers: [], fetchingRooms: false }])
  }

  const removeRoomEntry = (id) => {
    if (roomEntries.length <= 1) return
    setRoomEntries(prev => prev.filter(e => e.id !== id))
  }

  const handleEntryRoomTypeChange = (id, key) => {
    updateRoomEntry(id, { roomTypeKey: key, selectedRoomNumbers: [], availableRoomNumbers: [] })
    // Fetch available rooms using the newly selected key (avoid stale state)
    const existing = roomEntries.find(e => e.id === id)
    const qty = Number(existing?.quantity || 1)
    fetchAvailableForEntry(id, { id, roomTypeKey: key, quantity: qty, selectedRoomNumbers: [] })
  }

  const handleEntryQuantityChange = (id, qty) => {
    const entry = roomEntries.find(e => e.id === id)
    updateRoomEntry(id, {
      quantity: qty,
      selectedRoomNumbers: (entry?.selectedRoomNumbers || []).slice(0, Number(qty))
    })
  }

  // Handle room number selection for a specific entry
  const handleRoomNumberChange = (entryId, index, value) => {
    setRoomEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry
      const newSelected = [...entry.selectedRoomNumbers]
      newSelected[index] = value
      return { ...entry, selectedRoomNumbers: newSelected.filter(Boolean) }
    }))
  }

  // Remove a selected room number from a specific entry
  const removeRoomNumber = (entryId, roomNumber) => {
    setRoomEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry
      return { ...entry, selectedRoomNumbers: entry.selectedRoomNumbers.filter(rn => rn !== roomNumber) }
    }))
  }

  // Get all selected room numbers across all entries for a given room type (to prevent double-selection)
  const getOtherSelectedRooms = (entryId, roomTypeKey) => {
    return roomEntries
      .filter(e => e.id !== entryId && e.roomTypeKey === roomTypeKey)
      .flatMap(e => e.selectedRoomNumbers)
  }

  // Update main guest field
  const updateMainGuest = (field, value) => {
    setMainGuest(prev => ({ ...prev, [field]: value }))
  }

  // Update additional members count
  const updateAdditionalMembers = (field, value) => {
    const numValue = Math.max(0, Number(value) || 0)
    setAdditionalMembers(prev => ({ ...prev, [field]: numValue }))
  }

  // Calculate total guests
  const getTotalGuests = () => {
    return 1 + additionalMembers.males + additionalMembers.females + additionalMembers.children
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate main guest details
    if (!mainGuest.name.trim()) {
      setError('Main guest name is required')
      return
    }

    if (!mainGuest.idNumber.trim()) {
      setError('ID number is required')
      return
    }

    if (!mainGuest.phone.trim()) {
      setError('Phone number is required')
      return
    }

    // Validate room entries
    if (roomEntries.length === 0 || roomEntries.every(e => !e.roomTypeKey)) {
      setError('Please select at least one room type')
      return
    }

    // Build full guest list
    const guestList = [
      {
        name: mainGuest.name.trim(),
        email: mainGuest.email.trim() || undefined,
        phone: mainGuest.phone.trim(),
        age: Number(mainGuest.age) || 21,
        type: 'adult',
        idType: mainGuest.idType,
        idNumber: mainGuest.idNumber.trim()
      }
    ]
    for (let i = 0; i < additionalMembers.males; i++) {
      guestList.push({ name: `Male Guest ${i + 1}`, age: 21, type: 'adult' })
    }
    for (let i = 0; i < additionalMembers.females; i++) {
      guestList.push({ name: `Female Guest ${i + 1}`, age: 21, type: 'adult' })
    }
    for (let i = 0; i < additionalMembers.children; i++) {
      guestList.push({ name: `Child ${i + 1}`, age: 10, type: 'child' })
    }

    const totalAdults = guestList.filter(g => g.type === 'adult').length
    const totalChildren = guestList.filter(g => g.type === 'child').length

    // Capacity check: calculate total capacity across all selected room entries
    let totalAdultCapacity = 0
    let totalChildCapacity = 0
    const validEntries = []
    for (const entry of roomEntries) {
      if (!entry.roomTypeKey) continue
      const rt = roomTypes.find(r => r.key === entry.roomTypeKey)
      if (!rt) continue
      const qty = Number(entry.quantity) || 1
      totalAdultCapacity += (rt.maxAdults ?? 2) * qty
      totalChildCapacity += (rt.maxChildren ?? 1) * qty
      validEntries.push({ entry, rt, qty })
    }

    if (validEntries.length === 0) {
      setError('Please select at least one room type')
      return
    }

    // Validate total capacity across ALL room types combined
    if (totalAdults > totalAdultCapacity) {
      const totalRooms = validEntries.reduce((s, e) => s + e.qty, 0)
      setError(`Cannot accommodate ${totalAdults} adults in ${totalRooms} room(s). Total adult capacity is ${totalAdultCapacity}. Please add more rooms or reduce adult guests.`)
      return
    }
    if (totalChildren > totalChildCapacity) {
      const totalRooms = validEntries.reduce((s, e) => s + e.qty, 0)
      setError(`Cannot accommodate ${totalChildren} children in ${totalRooms} room(s). Total children capacity is ${totalChildCapacity}. Please add more rooms or reduce children.`)
      return
    }

    // Distribute guests across items proportionally so each item's guests fit its capacity
    const adultGuests = guestList.filter(g => g.type === 'adult')
    const childGuests = guestList.filter(g => g.type === 'child')
    let adultIdx = 0
    let childIdx = 0

    // Calculate totals across all entries
    let totalSubtotal = 0
    let totalGST = 0
    let totalAmount = 0
    const items = []
    const entryDetails = []

    for (const { entry, rt, qty } of validEntries) {
      const pricePerNight = rt.prices?.roomOnly || rt.basePrice || 0
      const entrySubtotal = pricePerNight * qty
      const gstResult = calculateGST(entrySubtotal, rt, pricePerNight)

      totalSubtotal += entrySubtotal
      totalGST += gstResult.gstAmount || 0
      totalAmount += gstResult.totalAmount || entrySubtotal

      // Assign guests to this item based on its capacity
      const itemAdultCap = (rt.maxAdults ?? 2) * qty
      const itemChildCap = (rt.maxChildren ?? 1) * qty
      const itemGuests = []
      // Take adults up to this item's capacity
      const adultsForItem = adultGuests.slice(adultIdx, adultIdx + itemAdultCap)
      adultIdx += adultsForItem.length
      itemGuests.push(...adultsForItem)
      // Take children up to this item's capacity
      const childrenForItem = childGuests.slice(childIdx, childIdx + itemChildCap)
      childIdx += childrenForItem.length
      itemGuests.push(...childrenForItem)

      items.push({
        roomTypeKey: entry.roomTypeKey,
        quantity: qty,
        guests: itemGuests,
        allottedRoomNumbers: entry.selectedRoomNumbers.length > 0 ? entry.selectedRoomNumbers : undefined
      })

      entryDetails.push({
        roomType: rt,
        quantity: qty,
        subtotal: entrySubtotal,
        gstAmount: gstResult.gstAmount || 0,
        gstPercentage: gstResult.gstPercentage || 0,
        total: gstResult.totalAmount || entrySubtotal,
        selectedRoomNumbers: entry.selectedRoomNumbers,
        adultCapacity: itemAdultCap,
        childCapacity: itemChildCap,
        adultsAssigned: adultsForItem.length,
        childrenAssigned: childrenForItem.length
      })
    }

    const bookingPayload = {
      user: {
        name: mainGuest.name.trim(),
        email: mainGuest.email.trim() || `guest${Date.now()}@hotel.com`,
        phone: mainGuest.phone.trim()
      },
      checkIn,
      checkOut,
      fullDay,
      items,
      paid: markPaid,
      guestIdInfo: {
        type: mainGuest.idType,
        number: mainGuest.idNumber.trim()
      },
      additionalMembersCount: {
        males: additionalMembers.males,
        females: additionalMembers.females,
        children: additionalMembers.children
      }
    }

    setBookingData({
      ...bookingPayload,
      entryDetails,
      paymentDetails: {
        subtotal: totalSubtotal,
        gstAmount: totalGST,
        gstPercentage: entryDetails[0]?.gstPercentage || 0,
        totalAmount
      },
      totalGuests: getTotalGuests()
    })

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  // Actual submission after confirmation
  const confirmSubmit = async () => {
    if (!bookingData) return
    
    setSaving(true)
    setShowConfirmModal(false)

    try {
      const { data } = await api.post('/bookings/manual', bookingData)
      setResult(data.booking)
      
      // Show toast notification
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
      
      // Reset form after successful submission
      setTimeout(() => {
        setMainGuest({
          name: '',
          email: '',
          phone: '',
          age: '',
          idType: 'aadhar',
          idNumber: ''
        })
        setAdditionalMembers({ males: 0, females: 0, children: 0 })
        setCheckIn('')
        setCheckOut('')
        setNights(1)
        setFullDay(false)
        setRoomEntries([{ id: 1, roomTypeKey: roomTypes[0]?.key || '', quantity: 1, availableRoomNumbers: [], selectedRoomNumbers: [], fetchingRooms: false }])
        setResult(null)
        setBookingData(null)
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
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!authorized) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
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
              <h3 className="text-emerald-800 font-semibold text-base md:text-lg mb-2">Room Allotment Successful!</h3>
              <div className="text-sm md:text-base text-emerald-700 space-y-1">
                <p><strong>Booking ID:</strong> <span className="font-mono text-xs md:text-sm">{result._id}</span></p>
                <p><strong>Main Guest:</strong> {result.user?.name}</p>
                <p><strong>Contact:</strong> {result.user?.phone || result.user?.email}</p>
                <p><strong>Total Guests:</strong> {result.items?.[0]?.guests?.length || 1}</p>
                <p><strong>Payment Status:</strong> <span className="capitalize font-semibold">{result.status}</span></p>
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
          
          {/* Main Guest (Guardian) Information Section */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 md:p-6 rounded-xl border-2 border-teal-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={24} className="text-teal-600" />
              Main Guest / Guardian Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Name */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  placeholder="Enter full name"
                  value={mainGuest.name}
                  onChange={e => updateMainGuest('name', e.target.value)}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Phone size={14} />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  placeholder="+91 98765 43210"
                  value={mainGuest.phone}
                  onChange={e => updateMainGuest('phone', e.target.value)}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Mail size={14} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  placeholder="email@example.com"
                  value={mainGuest.email}
                  onChange={e => updateMainGuest('email', e.target.value)}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                  placeholder="Age"
                  value={mainGuest.age}
                  onChange={e => updateMainGuest('age', e.target.value)}
                />
              </div>
            </div>

            {/* ID Proof Section */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                🆔 ID Proof (Mandatory)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ID Type */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    ID Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white"
                    value={mainGuest.idType}
                    onChange={e => updateMainGuest('idType', e.target.value)}
                  >
                    <option value="aadhar">Aadhar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="voter">Voter ID</option>
                    <option value="license">Driving License</option>
                    <option value="passport">Passport</option>
                    <option value="other">Other Government ID</option>
                  </select>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white uppercase"
                    placeholder="Enter ID number"
                    value={mainGuest.idNumber}
                    onChange={e => updateMainGuest('idNumber', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-2 flex items-start gap-1">
                <span className="font-semibold">Note:</span> ID proof is mandatory for check-in as per hotel policy
              </p>
            </div>
          </div>

          {/* Additional Members Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 md:p-6 rounded-xl border-2 border-purple-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Users size={24} className="text-purple-600" />
              Additional Members
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mb-4">
              If the main guest has accompanying members, specify the count below (excluding the main guest)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Males */}
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  👨 Number of Males
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0"
                  value={additionalMembers.males}
                  onChange={e => updateAdditionalMembers('males', e.target.value)}
                />
              </div>

              {/* Females */}
              <div className="bg-white rounded-lg p-4 border-2 border-pink-200">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  👩 Number of Females
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="0"
                  value={additionalMembers.females}
                  onChange={e => updateAdditionalMembers('females', e.target.value)}
                />
              </div>

              {/* Children */}
              <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  👶 Number of Children
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm md:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="0"
                  value={additionalMembers.children}
                  onChange={e => updateAdditionalMembers('children', e.target.value)}
                />
              </div>
            </div>

            {/* Total Guest Count Display */}
            {getTotalGuests() > 1 && (
              <div className="mt-4 bg-purple-100 border-2 border-purple-300 rounded-lg p-3 text-center">
                <span className="text-sm md:text-base font-bold text-purple-900">
                  Total Guests: {getTotalGuests()} 
                  <span className="text-purple-700 ml-2">
                    (1 Main Guest + {getTotalGuests() - 1} Additional Members)
                  </span>
                </span>
              </div>
            )}
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

          {/* Room Details - Multiple Room Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Home size={24} className="text-teal-600" />
                Room Details
              </h2>
              <button
                type="button"
                onClick={addRoomEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs md:text-sm font-semibold transition-colors shadow-sm"
              >
                <span className="text-lg leading-none">+</span> Add Room Type
              </button>
            </div>

            <div className="space-y-4">
              {roomEntries.map((entry, entryIdx) => {
                const otherSelected = getOtherSelectedRooms(entry.id, entry.roomTypeKey)
                const filteredAvailable = entry.availableRoomNumbers.filter(rn => !otherSelected.includes(rn))
                return (
                  <div key={entry.id} className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700">Room Entry #{entryIdx + 1}</span>
                      {roomEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomEntry(entry.id)}
                          className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <X size={14} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Room Type *</label>
                        <select
                          required
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white"
                          value={entry.roomTypeKey}
                          onChange={e => handleEntryRoomTypeChange(entry.id, e.target.value)}
                        >
                          <option value="">-- Select Room Type --</option>
                          {roomTypes.map(rt => (
                            <option key={rt.key} value={rt.key}>
                              {rt.title} - ₹{rt.basePrice || rt.prices?.roomOnly || 0} (Available: {rt.count})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Rooms *</label>
                        <input
                          required
                          type="number"
                          min={1}
                          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                          value={entry.quantity}
                          onChange={e => handleEntryQuantityChange(entry.id, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Room Number Selection for this entry */}
                    {entry.roomTypeKey && checkIn && checkOut && (
                      <div className="mt-3">
                        {entry.fetchingRooms ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs text-blue-700 font-semibold">Loading available rooms...</span>
                            </div>
                          </div>
                        ) : filteredAvailable.length > 0 ? (
                          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3">
                            <label className="block text-xs font-semibold text-gray-900 mb-2">
                              Select Room Number(s) (Optional)
                              <span className="text-gray-500 font-normal ml-1">- {filteredAvailable.length} available</span>
                            </label>
                            <div className="space-y-2">
                              {Array.from({ length: Number(entry.quantity) || 1 }).map((_, index) => (
                                <div key={index} className="relative">
                                  <select
                                    className="w-full border-2 border-purple-300 bg-white rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none font-semibold"
                                    value={entry.selectedRoomNumbers[index] || ''}
                                    onChange={(e) => handleRoomNumberChange(entry.id, index, e.target.value)}
                                  >
                                    <option value="">-- Select Room {index + 1} --</option>
                                    {filteredAvailable
                                      .filter(rn => !entry.selectedRoomNumbers.includes(rn) || rn === entry.selectedRoomNumbers[index])
                                      .map(roomNumber => (
                                        <option key={roomNumber} value={roomNumber}>
                                          Room {roomNumber}
                                        </option>
                                      ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {entry.selectedRoomNumbers.length > 0 && (
                              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2">
                                <p className="text-[10px] font-semibold text-green-800 mb-1">Selected:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {entry.selectedRoomNumbers.map(rn => (
                                    <span key={rn} className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-bold">
                                      Room {rn}
                                      <button type="button" onClick={() => removeRoomNumber(entry.id, rn)} className="hover:bg-green-700 rounded-full p-0.5">
                                        <X size={12} />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : entry.availableRoomNumbers.length === 0 && !entry.fetchingRooms ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <div className="flex items-start gap-1.5">
                              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800">No room numbers configured or all booked for these dates.</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Capacity Summary */}
          {roomEntries.some(e => e.roomTypeKey) && roomTypes.length > 0 && (() => {
            const totalAdults = 1 + additionalMembers.males + additionalMembers.females
            const totalChildren = additionalMembers.children
            const totalGuests = totalAdults + totalChildren
            let adultCap = 0, childCap = 0, totalRooms = 0
            for (const entry of roomEntries) {
              if (!entry.roomTypeKey) continue
              const rt = roomTypes.find(r => r.key === entry.roomTypeKey)
              if (!rt) continue
              const qty = Number(entry.quantity) || 1
              totalRooms += qty
              adultCap += (rt.maxAdults ?? 2) * qty
              childCap += (rt.maxChildren ?? 1) * qty
            }
            const adultOk = totalAdults <= adultCap
            const childOk = totalChildren <= childCap
            const allOk = adultOk && childOk
            return (
              <div className={`p-3 rounded-xl border-2 ${allOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${allOk ? 'text-green-800' : 'text-red-800'}`}>
                  {allOk ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  Capacity Check — {totalRooms} Room{totalRooms !== 1 ? 's' : ''} Selected
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`rounded-lg p-2 ${adultOk ? 'bg-green-100' : 'bg-red-100'}`}>
                    <span className="font-semibold">Adults:</span> {totalAdults} / {adultCap} capacity
                    {!adultOk && <span className="text-red-700 font-bold ml-1">⚠ Over!</span>}
                  </div>
                  <div className={`rounded-lg p-2 ${childOk ? 'bg-green-100' : 'bg-red-100'}`}>
                    <span className="font-semibold">Children:</span> {totalChildren} / {childCap} capacity
                    {!childOk && <span className="text-red-700 font-bold ml-1">⚠ Over!</span>}
                  </div>
                </div>
                {!allOk && (
                  <p className="text-xs text-red-700 font-semibold mt-2">
                    ⚠ Add more rooms or reduce guests to fit capacity.
                  </p>
                )}
              </div>
            )
          })()}

          {/* Price & GST Breakdown */}
          {roomEntries.some(e => e.roomTypeKey) && roomTypes.length > 0 && (() => {
            let totalSub = 0
            let totalGst = 0
            let totalAmt = 0
            const lines = []
            for (const entry of roomEntries) {
              if (!entry.roomTypeKey) continue
              const rt = roomTypes.find(r => r.key === entry.roomTypeKey)
              if (!rt) continue
              const ppn = rt.prices?.roomOnly || rt.basePrice || 0
              const sub = ppn * (Number(entry.quantity) || 1)
              const gst = calculateGST(sub, rt, ppn)
              totalSub += sub
              totalGst += gst.gstAmount || 0
              totalAmt += gst.totalAmount || sub
              lines.push({ title: rt.title, qty: Number(entry.quantity) || 1, ppn, sub, gstAmt: gst.gstAmount, gstPct: gst.gstPercentage, total: gst.totalAmount || sub })
            }
            if (lines.length === 0) return null
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  💰 Price Breakdown
                </h3>
                <div className="space-y-2">
                  {lines.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{l.title} ({l.qty} × ₹{l.ppn.toLocaleString()})</span>
                      <span className="font-medium text-gray-900">₹{l.sub.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-blue-200 pt-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">₹{totalSub.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST</span>
                    <span className="font-medium text-gray-900">₹{totalGst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-blue-300 pt-2 mt-1">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-green-600">₹{totalAmt.toLocaleString()}</span>
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
              onClick={() => router.push('/admin')}
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

      {/* Confirmation Modal */}
      {showConfirmModal && bookingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-t-2xl shadow-lg z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Confirm Room Allotment</h3>
                  <p className="text-teal-100 text-sm">Please review the booking details before confirming</p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Main Guest Information */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <User size={20} className="text-blue-600" />
                  Main Guest Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{mainGuest.name}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{mainGuest.phone}</p>
                  </div>
                  {mainGuest.email && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200 col-span-2">
                      <p className="text-gray-600 text-xs mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{mainGuest.email}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">ID Type</p>
                    <p className="font-semibold text-gray-900 uppercase">{mainGuest.idType}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-gray-600 text-xs mb-1">ID Number</p>
                    <p className="font-semibold text-gray-900 uppercase">{mainGuest.idNumber}</p>
                  </div>
                </div>
              </div>

              {/* Guests Summary */}
              {bookingData.totalGuests > 1 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Users size={20} className="text-purple-600" />
                    Additional Members
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {bookingData.additionalMembersCount?.males > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                        <p className="text-2xl font-bold text-blue-600">👨 {bookingData.additionalMembersCount.males}</p>
                        <p className="text-xs text-gray-600 mt-1">Males</p>
                      </div>
                    )}
                    {bookingData.additionalMembersCount?.females > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-pink-200 text-center">
                        <p className="text-2xl font-bold text-pink-600">👩 {bookingData.additionalMembersCount.females}</p>
                        <p className="text-xs text-gray-600 mt-1">Females</p>
                      </div>
                    )}
                    {bookingData.additionalMembersCount?.children > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-green-200 text-center">
                        <p className="text-2xl font-bold text-green-600">👶 {bookingData.additionalMembersCount.children}</p>
                        <p className="text-xs text-gray-600 mt-1">Children</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 bg-purple-100 rounded-lg p-2 text-center">
                    <span className="text-sm font-bold text-purple-900">
                      Total: {bookingData.totalGuests} Guest{bookingData.totalGuests > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <CalendarCheck size={20} className="text-amber-600" />
                  Booking Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="text-gray-600 text-xs mb-1">Check-in</p>
                    <p className="font-semibold text-gray-900">{new Date(checkIn).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="text-gray-600 text-xs mb-1">Check-out</p>
                    <p className="font-semibold text-gray-900">{new Date(checkOut).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Room Details ({bookingData.entryDetails?.length || 0} type{(bookingData.entryDetails?.length || 0) > 1 ? 's' : ''}):</p>
                <div className="space-y-2">
                  {(bookingData.entryDetails || []).map((ed, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{ed.roomType?.title}</p>
                          <p className="text-xs text-gray-600">Qty: {ed.quantity}{ed.selectedRoomNumbers?.length > 0 ? ` | Rooms: ${ed.selectedRoomNumbers.join(', ')}` : ''}</p>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">₹{ed.subtotal?.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Guests: {ed.adultsAssigned || 0} adult{(ed.adultsAssigned || 0) !== 1 ? 's' : ''}, {ed.childrenAssigned || 0} child{(ed.childrenAssigned || 0) !== 1 ? 'ren' : ''} 
                        <span className="text-gray-400 ml-1">(cap: {ed.adultCapacity || 0}A / {ed.childCapacity || 0}C)</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                  <IndianRupee size={20} className="text-green-600" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                    <span className="text-gray-700">Room Charges</span>
                    <span className="font-semibold text-gray-900">₹{(bookingData.paymentDetails?.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                    <span className="text-gray-700">{formatGSTLabel(bookingData.paymentDetails?.gstPercentage || 0)}</span>
                    <span className="font-semibold text-gray-900">₹{(bookingData.paymentDetails?.gstAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-bold">₹{(bookingData.paymentDetails?.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status Confirmation */}
              <div className={`rounded-xl p-5 border-2 ${markPaid ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle size={24} className={markPaid ? 'text-emerald-600' : 'text-amber-600'} />
                  <h4 className="font-bold text-gray-900 text-lg">Payment Status</h4>
                </div>
                <div className={`p-4 rounded-lg border-2 ${markPaid ? 'bg-emerald-100 border-emerald-300' : 'bg-amber-100 border-amber-300'}`}>
                  <p className={`text-center font-bold text-lg ${markPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {markPaid ? '✅ Payment Marked as PAID' : '⏳ Payment Status: PENDING'}
                  </p>
                  <p className={`text-center text-sm mt-2 ${markPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {markPaid 
                      ? 'Room availability will be decremented immediately' 
                      : 'Guest needs to complete payment. Room will be held temporarily'}
                  </p>
                </div>
              </div>

              {/* Confirmation Question */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    🤔 Are you sure you want to proceed?
                  </p>
                  <p className="text-sm text-gray-600">
                    Please verify all details are correct before confirming this room allotment
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t-2 border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                ❌ Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    ✅ Confirm & Allot Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && result && (
        <div className="fixed top-4 right-4 z-[60] animate-slide-down">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-2xl p-4 md:p-5 max-w-md border-2 border-emerald-400">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">🎉 Room Allotted Successfully!</h4>
                <p className="text-emerald-50 text-sm mb-2">
                  Booking ID: <span className="font-mono font-semibold">{result._id.slice(-8)}</span>
                </p>
                <p className="text-emerald-50 text-sm">
                  Guest: <span className="font-semibold">{result.user?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
