import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { authRequired, adminRequired, rolesRequired } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'
import User from '../models/User.js'
import { sendBookingConfirmationToUser, sendBookingNotificationToAdmin, sendCancellationToUser, sendCancellationToAdmin } from '../utils/email.js'
import { calculateGST } from '../utils/gst.js'

const router = Router()

const guestSchema = z.object({ 
  name: z.string().min(1), 
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  age: z.number().int().min(0), 
  type: z.enum(['adult','child']) 
})
const itemSchema = z.object({
  roomTypeKey: z.string().min(1), // Allow any room type key dynamically
  quantity: z.number().int().min(1),
  packageType: z.enum(['roomOnly', 'roomBreakfast', 'roomBreakfastDinner']).default('roomOnly'),
  extraBeds: z.number().int().min(0).optional().default(0),
  extraPersons: z.number().int().min(0).optional().default(0),
  guests: z.array(guestSchema).optional().default([]),
  allottedRoomNumbers: z.array(z.string()).optional().default([])
})

const createSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string().nullable().optional(),
  fullDay: z.boolean().optional().default(false),
  items: z.array(itemSchema).min(1)
})

function nightsBetween(start, end) {
  const ms = 24 * 60 * 60 * 1000
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.ceil((e - s) / ms))
}

// Helper function to check room number availability
async function getAvailableRoomNumbers(roomTypeKey, checkIn, checkOut, excludeBookingId = null) {
  const roomType = await RoomType.findOne({ key: roomTypeKey })
  if (!roomType || !roomType.roomNumbers || roomType.roomNumbers.length === 0) {
    return []
  }

  // Find all bookings that overlap with the requested date range
  const overlappingBookings = await Booking.find({
    _id: { $ne: excludeBookingId },
    status: { $in: ['paid', 'pending'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    'items.roomTypeKey': roomTypeKey
  })

  // Collect all allotted room numbers
  const allottedRoomNumbers = new Set()
  overlappingBookings.forEach(booking => {
    booking.items
      .filter(item => item.roomTypeKey === roomTypeKey)
      .forEach(item => {
        (item.allottedRoomNumbers || []).forEach(rn => allottedRoomNumbers.add(rn))
      })
  })

  // Return available room numbers
  return roomType.roomNumbers.filter(rn => !allottedRoomNumbers.has(rn))
}

// Create booking (requires auth)
router.post('/', authRequired, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body)
    const checkIn = new Date(data.checkIn)
    const fullDay = !!data.fullDay
    let nights = 1
    let checkOut = null
    if (!fullDay) {
      if (!data.checkOut) return res.status(400).json({ message: 'checkOut is required when fullDay is false' })
      checkOut = new Date(data.checkOut)
      if (!(checkOut > checkIn)) return res.status(400).json({ message: 'checkOut must be after checkIn' })
  nights = nightsBetween(checkIn, checkOut)
    }

    // Validate availability and capacity
    const types = await RoomType.find({ key: { $in: data.items.map(i=>i.roomTypeKey) } })
    const typeMap = Object.fromEntries(types.map(t => [t.key, t]))

    // Validate availability per item
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
    }

    // Aggregate capacity check across ALL items combined
    let totalAdults = 0, totalChildren = 0, totalAdultCap = 0, totalChildCap = 0
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      const guests = it.guests || []
      totalAdults += guests.filter(g => g.type === 'adult').length
      totalChildren += guests.filter(g => g.type === 'child').length
      totalAdultCap += (t.maxAdults ?? 2) * it.quantity
      totalChildCap += (t.maxChildren ?? 1) * it.quantity
    }
    if (totalAdults > totalAdultCap) {
      return res.status(400).json({ 
        message: `Cannot accommodate ${totalAdults} adults. Total adult capacity across all selected rooms is ${totalAdultCap}. Please add more rooms.`,
        details: { totalAdults, totalAdultCap, totalChildren, totalChildCap }
      })
    }
    if (totalChildren > totalChildCap) {
      return res.status(400).json({ 
        message: `Cannot accommodate ${totalChildren} children. Total children capacity across all selected rooms is ${totalChildCap}. Please add more rooms.`,
        details: { totalAdults, totalAdultCap, totalChildren, totalChildCap }
      })
    }

    // Build items with pricing
    const items = data.items.map(it => {
      const t = typeMap[it.roomTypeKey]
      const base = (t.prices && t.prices[it.packageType]) ? t.prices[it.packageType] : (t.basePrice || 0)
      const extras = (t.extraBedPerPerson || 0) * (it.extraBeds || 0) + (t.extraPersonPerNight || 0) * (it.extraPersons || 0)
      const subtotal = (base * it.quantity + extras) * nights
      return {
        roomTypeKey: t.key,
        title: t.title,
        basePrice: base,
        quantity: it.quantity,
        guests: it.guests || [],
        subtotal
      }
    })
    const subtotalAmount = items.reduce((s,a)=>s+a.subtotal,0)

    // Calculate GST dynamically using the first item's room type (or slab-based)
    const firstItemType = typeMap[data.items[0].roomTypeKey]
    const pricePerNight = (firstItemType.prices?.roomOnly ?? firstItemType.basePrice) || 0
    const gstEnabled = firstItemType.gstEnabled !== false
    const customGSTPercentage = (gstEnabled && firstItemType.gstPercentage !== null && firstItemType.gstPercentage !== undefined) 
      ? firstItemType.gstPercentage : null
    const gstResult = calculateGST(subtotalAmount, customGSTPercentage, pricePerNight)
    
    // If GST is disabled for the room type, set everything to 0
    const finalGSTPercentage = gstEnabled ? gstResult.gstPercentage : 0
    const finalGSTAmount = gstEnabled ? gstResult.gstAmount : 0
    const total = subtotalAmount + finalGSTAmount

    // Create booking (pending)
    const booking = await Booking.create({
      user: req.user._id,
      checkIn,
      checkOut: checkOut || undefined,
      fullDay,
      nights,
      items,
      subtotal: subtotalAmount,
      gstPercentage: finalGSTPercentage,
      gstAmount: finalGSTAmount,
      total,
      status: 'pending'
    })

    // Send booking emails (fire-and-forget)
    sendBookingConfirmationToUser(booking, req.user).catch(err =>
      console.error('Failed to send user booking email:', err)
    )
    sendBookingNotificationToAdmin(booking, req.user).catch(err =>
      console.error('Failed to send admin booking email:', err)
    )

    res.status(201).json({ booking })
  } catch (e) { next(e) }
})

// Mark paid and decrement availability
router.post('/:id/pay', authRequired, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Not found' })
    if (String(booking.user) !== String(req.user._id) && !['admin','worker'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (booking.status === 'paid') return res.json({ booking })

    // Check and decrement counts
    for (const it of booking.items) {
      const t = await RoomType.findOne({ key: it.roomTypeKey })
      if (!t || t.count < it.quantity) return res.status(409).json({ message: `${it.title} rooms full` })
    }
    for (const it of booking.items) {
      await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
    }
    booking.status = 'paid'
    await booking.save()
    res.json({ booking })
  } catch (e) { next(e) }
})

// Get user's own bookings
router.get('/my-bookings', authRequired, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ bookings })
  } catch (e) { next(e) }
})

// Admin/Worker list bookings
router.get('/', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const list = await Booking.find({}).populate('user','name email').sort({ createdAt: -1 })
    res.json({ bookings: list })
  } catch (e) { next(e) }
})

// Get available room numbers for a room type and date range
router.get('/available-rooms/:roomTypeKey', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const { roomTypeKey } = req.params
    const { checkIn, checkOut } = req.query
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'checkIn and checkOut dates are required' })
    }

    const availableRooms = await getAvailableRoomNumbers(
      roomTypeKey,
      new Date(checkIn),
      new Date(checkOut)
    )

    res.json({ 
      roomTypeKey,
      availableRoomNumbers: availableRooms,
      count: availableRooms.length
    })
  } catch (e) { next(e) }
})

// Allot room numbers to a booking (worker/admin only)
router.post('/:id/allot-rooms', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    
    const { allotments } = req.body // { roomTypeKey: string, roomNumbers: string[] }[]
    if (!Array.isArray(allotments)) {
      return res.status(400).json({ message: 'allotments must be an array' })
    }

    // Validate that all room numbers are available
    for (const allotment of allotments) {
      const availableRooms = await getAvailableRoomNumbers(
        allotment.roomTypeKey,
        booking.checkIn,
        booking.checkOut,
        booking._id
      )
      
      for (const rn of allotment.roomNumbers) {
        if (!availableRooms.includes(rn)) {
          return res.status(409).json({ 
            message: `Room ${rn} is not available for the booking period` 
          })
        }
      }
      
      // Find the item and update allotted room numbers
      const item = booking.items.find(it => it.roomTypeKey === allotment.roomTypeKey)
      if (!item) {
        return res.status(400).json({ 
          message: `Room type ${allotment.roomTypeKey} not found in booking` 
        })
      }
      
      if (allotment.roomNumbers.length > item.quantity) {
        return res.status(400).json({ 
          message: `Too many rooms allotted for ${item.title}. Booked: ${item.quantity}, Trying to allot: ${allotment.roomNumbers.length}` 
        })
      }
      
      item.allottedRoomNumbers = allotment.roomNumbers
    }

    booking.markModified('items')
    await booking.save()
    res.json({ booking })
  } catch (e) { next(e) }
})

// Update booking (extend checkout, add guests, etc.)
router.put('/:id', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    
    const { checkOut, items, additionalGuests, allotments } = req.body
    let recalculate = false

    // Update checkout date
    if (checkOut) {
      const newCheckOut = new Date(checkOut)
      if (newCheckOut <= booking.checkIn) {
        return res.status(400).json({ message: 'Check-out must be after check-in' })
      }
      
      // Validate that allotted rooms are still available for the extended period
      if (booking.checkOut && newCheckOut > booking.checkOut) {
        for (const item of booking.items) {
          if (item.allottedRoomNumbers && item.allottedRoomNumbers.length > 0) {
            const availableRooms = await getAvailableRoomNumbers(
              item.roomTypeKey,
              booking.checkOut,
              newCheckOut,
              booking._id
            )
            
            for (const rn of item.allottedRoomNumbers) {
              if (!availableRooms.includes(rn)) {
                return res.status(409).json({ 
                  message: `Room ${rn} is not available for the extended period` 
                })
              }
            }
          }
        }
      }
      
      booking.checkOut = newCheckOut
      booking.nights = nightsBetween(booking.checkIn, newCheckOut)
      recalculate = true
    }

    // Add more rooms
    if (items && Array.isArray(items)) {
      for (const newItem of items) {
        const roomType = await RoomType.findOne({ key: newItem.roomTypeKey })
        if (!roomType) {
          return res.status(400).json({ message: `Invalid room type ${newItem.roomTypeKey}` })
        }
        
        // Check availability
        if (roomType.count < newItem.quantity) {
          return res.status(409).json({ message: `${roomType.title} rooms not available` })
        }
        
        // Check if this room type is already in booking
        const existingItem = booking.items.find(it => it.roomTypeKey === newItem.roomTypeKey)
        if (existingItem) {
          existingItem.quantity += newItem.quantity
          if (newItem.guests) {
            existingItem.guests.push(...newItem.guests)
          }
        } else {
          const base = (roomType.prices && roomType.prices[newItem.packageType]) 
            ? roomType.prices[newItem.packageType] 
            : (roomType.basePrice || 0)
          const subtotal = base * newItem.quantity * booking.nights
          booking.items.push({
            roomTypeKey: roomType.key,
            title: roomType.title,
            basePrice: base,
            quantity: newItem.quantity,
            guests: newItem.guests || [],
            subtotal,
            allottedRoomNumbers: []
          })
        }
        
        // Decrease available count
        if (booking.status === 'paid') {
          await RoomType.updateOne({ key: newItem.roomTypeKey }, { $inc: { count: -newItem.quantity } })
        }
      }
      recalculate = true
    }

    // Add more guests to existing items
    if (additionalGuests && Array.isArray(additionalGuests)) {
      for (const guestUpdate of additionalGuests) {
        const item = booking.items.find(it => it.roomTypeKey === guestUpdate.roomTypeKey)
        if (item) {
          item.guests.push(...(guestUpdate.guests || []))
        }
      }
    }

    // Handle room allotments from edit-booking page
    if (allotments && Array.isArray(allotments)) {
      for (const allotment of allotments) {
        const item = booking.items.find(it => it.roomTypeKey === allotment.roomTypeKey)
        if (!item) continue
        
        const roomNumbers = allotment.roomNumbers || []
        if (roomNumbers.length > 0 && roomNumbers.length !== item.quantity) {
          return res.status(400).json({ 
            message: `Please select exactly ${item.quantity} room(s) for ${item.title}` 
          })
        }
        
        // Validate room availability
        if (roomNumbers.length > 0) {
          const availableRooms = await getAvailableRoomNumbers(
            allotment.roomTypeKey,
            booking.checkIn,
            booking.checkOut,
            booking._id
          )
          for (const rn of roomNumbers) {
            if (!availableRooms.includes(rn)) {
              return res.status(409).json({ message: `Room ${rn} is not available for the booking period` })
            }
          }
        }
        
        item.allottedRoomNumbers = roomNumbers
      }
    }

    // Recalculate totals if needed
    if (recalculate) {
      let newSubtotal = 0
      for (const item of booking.items) {
        item.subtotal = item.basePrice * item.quantity * booking.nights
        newSubtotal += item.subtotal
      }
      
      const firstItem = booking.items[0]
      const roomType = await RoomType.findOne({ key: firstItem.roomTypeKey })
      const pricePerNight = (roomType.prices?.roomOnly ?? roomType.basePrice) || 0
      const gstEnabled = roomType.gstEnabled !== false
      const customGST = (gstEnabled && roomType.gstPercentage !== null) ? roomType.gstPercentage : null
      const gstResult = calculateGST(newSubtotal, customGST, pricePerNight)
      
      booking.subtotal = newSubtotal
      booking.gstPercentage = gstEnabled ? gstResult.gstPercentage : 0
      booking.gstAmount = gstEnabled ? gstResult.gstAmount : 0
      booking.total = newSubtotal + (gstEnabled ? gstResult.gstAmount : 0)
    }

    booking.markModified('items')
    await booking.save()
    res.json({ booking })
  } catch (e) { next(e) }
})

// ─── Bulk Booking (Worker/Admin) ─────────────────────────────────
// Creates multiple bookings at once for walk-in / group bookings
// Each entry in the array is one guest with their own rooms
router.post('/bulk', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const { bookings: bulkEntries } = req.body
    if (!Array.isArray(bulkEntries) || bulkEntries.length === 0) {
      return res.status(400).json({ message: 'At least one booking entry is required' })
    }

    const results = []
    const errors = []

    for (let idx = 0; idx < bulkEntries.length; idx++) {
      const entry = bulkEntries[idx]
      try {
        // Validate guest/user info
        const guestName = String(entry.guestName || '').trim()
        let guestEmail = String(entry.guestEmail || '').trim().toLowerCase()
        const guestPhone = String(entry.guestPhone || '').trim()
        const guestIdProof = String(entry.idProof || '').trim()

        if (!guestName) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: Guest name is required` })
          continue
        }

        // Generate email if not provided
        if (!guestEmail || !guestEmail.includes('@')) {
          guestEmail = `guest${Date.now()}_${idx}@hotel.local`
        }

        // Find or create user
        let user = await User.findOne({ email: guestEmail })
        if (!user) {
          user = await User.create({
            name: guestName,
            email: guestEmail,
            phone: guestPhone || undefined,
            password: Math.random().toString(36).slice(2, 10)
          })
        }

        // Parse dates
        if (!entry.checkIn) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: Check-in date is required` })
          continue
        }
        const checkIn = new Date(entry.checkIn)
        let checkOut = null
        let nights = 1
        const fullDay = !!entry.fullDay

        if (entry.checkOut) {
          checkOut = new Date(entry.checkOut)
          if (!(checkOut > checkIn)) {
            errors.push({ index: idx, message: `Entry ${idx + 1}: Check-out must be after check-in` })
            continue
          }
          nights = nightsBetween(checkIn, checkOut)
        } else if (!fullDay) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: Check-out is required` })
          continue
        }

        // Validate items (rooms)
        if (!entry.items || !Array.isArray(entry.items) || entry.items.length === 0) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: At least one room selection is required` })
          continue
        }

        const roomTypeKeys = entry.items.map(i => i.roomTypeKey)
        const types = await RoomType.find({ key: { $in: roomTypeKeys } })
        const typeMap = Object.fromEntries(types.map(t => [t.key, t]))

        let itemError = false
        const effCheckOut = checkOut || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)
        for (const it of entry.items) {
          const t = typeMap[it.roomTypeKey]
          if (!t) {
            errors.push({ index: idx, message: `Entry ${idx + 1}: Invalid room type ${it.roomTypeKey}` })
            itemError = true
            break
          }
          // Use date-based availability when room numbers are configured
          if (t.roomNumbers && t.roomNumbers.length > 0) {
            const availableRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut)
            if (availableRooms.length < (it.quantity || 1)) {
              errors.push({ index: idx, message: `Entry ${idx + 1}: ${t.title} rooms full` })
              itemError = true
              break
            }
          } else if (t.count < (it.quantity || 1)) {
            errors.push({ index: idx, message: `Entry ${idx + 1}: ${t.title} rooms full` })
            itemError = true
            break
          }
        }
        if (itemError) continue

        // Build items with pricing
        const pkgType = entry.packageType || 'roomOnly'
        const items = entry.items.map(it => {
          const t = typeMap[it.roomTypeKey]
          const base = (t.prices && t.prices[pkgType]) ? t.prices[pkgType] : (t.basePrice || 0)
          const subtotal = base * (it.quantity || 1) * nights
          return {
            roomTypeKey: t.key,
            title: t.title,
            basePrice: base,
            quantity: it.quantity || 1,
            guests: [{
              name: guestName,
              email: guestEmail !== `guest${Date.now()}_${idx}@hotel.local` ? guestEmail : undefined,
              phone: guestPhone || undefined,
              age: entry.guestAge || 30,
              type: 'adult'
            }],
            subtotal,
            allottedRoomNumbers: it.allottedRoomNumbers || []
          }
        })

        const subtotalAmount = items.reduce((s, a) => s + a.subtotal, 0)

        // GST calculation
        const firstType = typeMap[entry.items[0].roomTypeKey]
        const pricePerNight = (firstType.prices?.roomOnly ?? firstType.basePrice) || 0
        const gstEnabled = firstType.gstEnabled !== false
        const customGST = (gstEnabled && firstType.gstPercentage !== null && firstType.gstPercentage !== undefined)
          ? firstType.gstPercentage : null
        const gstResult = calculateGST(subtotalAmount, customGST, pricePerNight)

        const finalGSTPercentage = gstEnabled ? gstResult.gstPercentage : 0
        const finalGSTAmount = gstEnabled ? gstResult.gstAmount : 0
        const total = subtotalAmount + finalGSTAmount

        let booking = await Booking.create({
          user: user._id,
          checkIn,
          checkOut: checkOut || undefined,
          fullDay,
          nights,
          items,
          subtotal: subtotalAmount,
          gstPercentage: finalGSTPercentage,
          gstAmount: finalGSTAmount,
          total,
          status: 'pending'
        })

        // Mark paid if requested
        const markPaid = !!entry.paid
        if (markPaid) {
          let canPay = true
          for (const it of booking.items) {
            const t = await RoomType.findOne({ key: it.roomTypeKey })
            if (!t) { canPay = false; break }
            // Use date-based availability when room numbers are configured
            if (t.roomNumbers && t.roomNumbers.length > 0) {
              const availRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut, booking._id)
              if (availRooms.length < it.quantity) { canPay = false; break }
            } else if (t.count < it.quantity) { canPay = false; break }
          }
          if (canPay) {
            for (const it of booking.items) {
              await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
            }
            booking.status = 'paid'
            booking.payment = { provider: 'offline', status: 'paid' }
            await booking.save()
          }
        }

        booking = await Booking.findById(booking._id).populate('user', 'name email phone')

        // Send confirmation emails for every bulk booking (fire-and-forget)
        sendBookingConfirmationToUser(booking, user).catch(err =>
          console.error(`Bulk booking ${idx + 1}: Failed to send user email:`, err)
        )
        sendBookingNotificationToAdmin(booking, user).catch(err =>
          console.error(`Bulk booking ${idx + 1}: Failed to send admin email:`, err)
        )
        results.push({ index: idx, success: true, booking })
      } catch (entryErr) {
        errors.push({ index: idx, message: `Entry ${idx + 1}: ${entryErr.message}` })
      }
    }

    res.status(201).json({
      totalRequested: bulkEntries.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors
    })
  } catch (e) { next(e) }
})

export default router

// Worker/Admin search bookings by user email/name or booking id
router.get('/search', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.query || '').toString().trim()
    if (!q) return res.status(400).json({ message: 'Query is required' })

    const or = []
    // Search by populated user fields
    or.push({}) // placeholder to keep structure consistent
    // If valid ObjectId, include direct id match
    const isObjectId = /^[a-f\d]{24}$/i.test(q)

    const match = {}
    if (isObjectId) match._id = q

    // Build aggregate to search by user fields
    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $match: {
        $or: [
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(q) }] : []),
          { 'user.email': { $regex: q, $options: 'i' } },
          { 'user.name': { $regex: q, $options: 'i' } }
        ]
      }},
      { $sort: { createdAt: -1 } },
      { $project: {
        _id: 1, checkIn: 1, checkOut: 1, fullDay: 1, nights: 1, items: 1, total: 1, status: 1, createdAt: 1,
        user: { _id: '$user._id', name: '$user.name', email: '$user.email', role: '$user.role' }
      }}
    ]

    const results = await Booking.aggregate(pipeline)
    res.json({ bookings: results })
  } catch (e) { next(e) }
})

// Manual booking allocation by worker/admin (walk-in/offline)
router.post('/manual', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    // Expect: { user: { name, email }, checkIn, checkOut?, fullDay?, items: [...], paid? }
    const payload = req.body || {}
    const userInfo = payload.user || {}
    const name = String(userInfo.name || '').trim()
    let email = String(userInfo.email || '').trim().toLowerCase()
    
    if (!name) return res.status(400).json({ message: 'User name is required' })
    
    // Generate email if not provided or invalid
    if (!email || !email.includes('@')) {
      email = `guest${Date.now()}@hotel.local`
    }

    // Find or create user
    let user = await (await import('../models/User.js')).default.findOne({ email })
    if (!user) {
      const User = (await import('../models/User.js')).default
      user = await User.create({ name, email, password: Math.random().toString(36).slice(2,10) })
    }

    // Validate booking payload using existing schema parts
    const data = createSchema.parse({
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      fullDay: payload.fullDay,
      items: payload.items
    })
    const checkIn = new Date(data.checkIn)
    const fullDay = !!data.fullDay
    let nights = 1
    let checkOut = null
    
    // If checkOut is provided, use it to calculate nights
    if (data.checkOut) {
      checkOut = new Date(data.checkOut)
      if (!(checkOut > checkIn)) return res.status(400).json({ message: 'checkOut must be after checkIn' })
      nights = nightsBetween(checkIn, checkOut)
    } else if (!fullDay) {
      // If fullDay is false and no checkOut, return error
      return res.status(400).json({ message: 'checkOut is required when fullDay is false' })
    }

    const types = await RoomType.find({ key: { $in: data.items.map(i=>i.roomTypeKey) } })
    const typeMap = Object.fromEntries(types.map(t => [t.key, t]))

    // Validate availability per item
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
    }

    // Aggregate capacity check across ALL items combined
    // Each item's guests represent that item's share of the booking party
    let totalAdults = 0, totalChildren = 0, totalAdultCap = 0, totalChildCap = 0
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      const guests = it.guests || []
      totalAdults += guests.filter(g => g.type === 'adult').length
      totalChildren += guests.filter(g => g.type === 'child').length
      totalAdultCap += (t.maxAdults ?? 2) * it.quantity
      totalChildCap += (t.maxChildren ?? 1) * it.quantity
    }
    if (totalAdults > totalAdultCap) {
      return res.status(400).json({ message: `Cannot accommodate ${totalAdults} adults. Total adult capacity across all selected rooms is ${totalAdultCap}. Please add more rooms.` })
    }
    if (totalChildren > totalChildCap) {
      return res.status(400).json({ message: `Cannot accommodate ${totalChildren} children. Total children capacity across all selected rooms is ${totalChildCap}. Please add more rooms.` })
    }

    const items = data.items.map(it => {
      const t = typeMap[it.roomTypeKey]
      const base = (t.prices && t.prices[it.packageType]) ? t.prices[it.packageType] : (t.basePrice || 0)
      const extras = (t.extraBedPerPerson || 0) * (it.extraBeds || 0) + (t.extraPersonPerNight || 0) * (it.extraPersons || 0)
      const subtotal = (base * it.quantity + extras) * nights
      return {
        roomTypeKey: t.key,
        title: t.title,
        basePrice: base,
        quantity: it.quantity,
        guests: it.guests || [],
        subtotal,
        allottedRoomNumbers: it.allottedRoomNumbers || []
      }
    })
    const manualSubtotal = items.reduce((s,a)=>s+a.subtotal,0)

    // Calculate GST dynamically
    const firstType = typeMap[data.items[0].roomTypeKey]
    const manualPricePerNight = (firstType.prices?.roomOnly ?? firstType.basePrice) || 0
    const manualGSTEnabled = firstType.gstEnabled !== false
    const manualCustomGST = (manualGSTEnabled && firstType.gstPercentage !== null && firstType.gstPercentage !== undefined) 
      ? firstType.gstPercentage : null
    const manualGSTResult = calculateGST(manualSubtotal, manualCustomGST, manualPricePerNight)
    
    const manualGSTPercentage = manualGSTEnabled ? manualGSTResult.gstPercentage : 0
    const manualGSTAmount = manualGSTEnabled ? manualGSTResult.gstAmount : 0
    const manualTotal = manualSubtotal + manualGSTAmount

    let booking = await Booking.create({
      user: user._id,
      checkIn,
      checkOut: checkOut || undefined,
      fullDay,
      nights,
      items,
      subtotal: manualSubtotal,
      gstPercentage: manualGSTPercentage,
      gstAmount: manualGSTAmount,
      total: manualTotal,
      status: 'pending'
    })

    const markPaid = !!payload.paid || payload.status === 'paid'
    if (markPaid) {
      // decrement counts then set status paid
      for (const it of booking.items) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (!t || t.count < it.quantity) return res.status(409).json({ message: `${it.title} rooms full` })
      }
      for (const it of booking.items) {
        await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
      }
      booking.status = 'paid'
      booking.payment = {
        provider: 'offline',
        status: 'paid'
      }
      await booking.save()
    }

    // Hydrate basic user fields for response
    booking = await Booking.findById(booking._id).populate('user', 'name email phone')

    // Send confirmation emails for all manual bookings (fire-and-forget)
    sendBookingConfirmationToUser(booking, user).catch(err => 
      console.error('Failed to send user confirmation email:', err)
    )
    sendBookingNotificationToAdmin(booking, user).catch(err => 
      console.error('Failed to send admin notification email:', err)
    )

    res.status(201).json({ booking })
  } catch (e) { next(e) }
})

// Checkout: free rooms and mark completed
router.post('/:id/checkout', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Not found' })
    if (booking.status !== 'paid') return res.status(400).json({ message: 'Only paid bookings can be checked out' })
    for (const it of booking.items) {
      await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
    }
    booking.status = 'completed'
    await booking.save()
    res.json({ booking })
  } catch (e) { next(e) }
})

// Cancel booking: mark as cancelled and send notifications
router.post('/:id/cancel', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone')
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    
    // Only allow cancelling pending or paid bookings
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed bookings' })
    }

    // If booking was paid, restore room availability
    if (booking.status === 'paid') {
      for (const it of booking.items) {
        await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
      }
    }

    // Mark as cancelled
    booking.status = 'cancelled'
    await booking.save()

    // Send cancellation notifications
    sendCancellationToUser(booking, booking.user).catch(err => 
      console.error('Failed to send cancellation email to user:', err)
    )
    sendCancellationToAdmin(booking, booking.user, req.user).catch(err => 
      console.error('Failed to send cancellation notification to admin:', err)
    )

    res.json({ 
      success: true,
      message: 'Booking cancelled successfully',
      booking 
    })
  } catch (e) { next(e) }
})
