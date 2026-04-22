import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { authRequired, adminRequired, rolesRequired } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'
import User from '../models/User.js'
import {
  sendBookingConfirmationToUser,
  sendBookingNotificationToAdmin,
  sendBookingUpdateToUser,
  sendBookingUpdateNotificationToAdmin,
  sendCancellationToUser,
  sendCancellationToAdmin,
  sendUndoCancellationToUser,
  sendUndoCancellationToAdmin
} from '../utils/email.js'
import { calculateGST } from '../utils/gst.js'
import { logActivity } from '../utils/activityLogger.js'

const router = Router()

const ALLOWED_PACKAGE_TYPES = new Set(['roomOnly', 'roomBreakfast', 'roomBreakfastDinner'])
function normalizePackageType(value) {
  const v = String(value || '').trim()
  return ALLOWED_PACKAGE_TYPES.has(v) ? v : 'roomOnly'
}

const guestSchema = z.object({ 
  name: z.string().min(1, 'Guest name is required'), 
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
  guests: z.array(guestSchema).min(1, 'At least one guest is required'),
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

function hasRoomNumbers(roomType) {
  return Array.isArray(roomType?.roomNumbers) && roomType.roomNumbers.length > 0
}

function normalizeCheckOut(checkIn, checkOut) {
  const ci = new Date(checkIn)
  if (!(ci instanceof Date) || Number.isNaN(ci.getTime())) return null
  if (checkOut) {
    const co = new Date(checkOut)
    if (co instanceof Date && !Number.isNaN(co.getTime()) && co > ci) return co
  }
  // fullDay bookings: treat as 1-night window for overlap checks
  return new Date(ci.getTime() + 24 * 60 * 60 * 1000)
}

function parseAmountPaid(input) {
  if (input === undefined || input === null || input === '') return null
  const n = Number(input)
  if (!Number.isFinite(n) || n < 0) return NaN
  return n
}

function buildGuestDetails(input = {}) {
  return {
    name: String(input.name || '').trim() || 'Guest',
    email: input.email ? String(input.email).trim().toLowerCase() : undefined,
    phone: input.phone ? String(input.phone).trim() : undefined
  }
}

async function resolveManualBookingUser({ name, email, phone }) {
  const User = (await import('../models/User.js')).default
  const normalizedName = String(name || '').trim() || 'Guest'
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPhone = phone ? String(phone).trim() : undefined

  let existingUser = await User.findOne({ email: normalizedEmail })

  if (existingUser && ['admin', 'worker'].includes(existingUser.role)) {
    existingUser = null
  }

  if (existingUser) {
    existingUser.name = normalizedName
    if (normalizedPhone) existingUser.phone = normalizedPhone
    await existingUser.save()
    return existingUser
  }

  return User.create({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: Math.random().toString(36).slice(2, 10)
  })
}

function getBookingGuestDetails(booking) {
  const guestDetails = booking?.guestDetails || {}
  const user = booking?.user || {}
  return buildGuestDetails({
    name: guestDetails.name || user.name,
    email: guestDetails.email || user.email,
    phone: guestDetails.phone || user.phone
  })
}

function applyGuestSnapshotToResponse(booking) {
  if (!booking) return booking
  const guestDetails = getBookingGuestDetails(booking)
  const userValue = booking.user
  const userDoc = userValue && typeof userValue.toObject === 'function'
    ? userValue.toObject()
    : (userValue && typeof userValue === 'object' ? { ...userValue } : {})

  booking.guestDetails = guestDetails
  booking.user = {
    ...userDoc,
    name: guestDetails.name,
    email: guestDetails.email,
    phone: guestDetails.phone
  }

  return booking
}

// Helper function to check room number availability
async function getAvailableRoomNumbers(roomTypeKey, checkIn, checkOut, excludeBookingId = null) {
  const roomType = await RoomType.findOne({ key: roomTypeKey })
  if (!roomType || !roomType.roomNumbers || roomType.roomNumbers.length === 0) {
    return []
  }

  const effCheckOut = normalizeCheckOut(checkIn, checkOut)
  if (!effCheckOut) return []

  // Find all bookings that overlap with the requested date range
  const overlappingBookings = await Booking.find({
    _id: { $ne: excludeBookingId },
    status: { $in: ['paid', 'pending'] },
    checkIn: { $lt: effCheckOut },
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

    // Validate that each item has at least 1 adult guest with name and phone
    for (const it of data.items) {
      const adults = (it.guests || []).filter(g => g.type === 'adult')
      if (adults.length === 0) {
        return res.status(400).json({ message: 'At least one adult guest is required per room. Please provide guest details (name and mobile number).' })
      }
      const firstAdult = adults[0]
      if (!firstAdult.name || firstAdult.name.trim() === '') {
        return res.status(400).json({ message: 'Guest name is required. Please provide your name to proceed with booking.' })
      }
      if (!firstAdult.phone || firstAdult.phone.trim() === '') {
        return res.status(400).json({ message: 'Mobile number is required. Please provide a contact number to proceed with booking.' })
      }
    }

    // Validate availability and capacity
    const types = await RoomType.find({ key: { $in: data.items.map(i=>i.roomTypeKey) } })
    const typeMap = Object.fromEntries(types.map(t => [t.key, t]))

    // Validate availability per item
    const effCheckOut = normalizeCheckOut(checkIn, checkOut)
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (hasRoomNumbers(t)) {
        const availableRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut)
        if (availableRooms.length < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      } else {
        if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      }
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
      const pkgType = normalizePackageType(it.packageType)
      const base = (t.prices && t.prices[pkgType]) ? t.prices[pkgType] : (t.basePrice || 0)
      const extras = (t.extraBedPerPerson || 0) * (it.extraBeds || 0) + (t.extraPersonPerNight || 0) * (it.extraPersons || 0)
      const subtotal = (base * it.quantity + extras) * nights
      return {
        roomTypeKey: t.key,
        title: t.title,
        packageType: pkgType,
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
      guestDetails: buildGuestDetails(req.user),
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

    logActivity({ action: 'booking_created', req, target: { type: 'booking', id: booking._id.toString(), name: req.user.name }, details: `Online booking created - ${items.map(i => `${i.quantity}x ${i.title}`).join(', ')} - ₹${total}`, metadata: { bookingId: booking._id, total, nights } })
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

    // Check availability; decrement counts only for count-based room types
    for (const it of booking.items) {
      const t = await RoomType.findOne({ key: it.roomTypeKey })
      if (!t) return res.status(409).json({ message: `${it.title} rooms full` })

      if (hasRoomNumbers(t)) {
        const effCheckOut = normalizeCheckOut(booking.checkIn, booking.checkOut)
        const availRooms = await getAvailableRoomNumbers(it.roomTypeKey, booking.checkIn, effCheckOut, booking._id)
        if ((availRooms || []).length < it.quantity) {
          return res.status(409).json({ message: `${it.title} rooms full` })
        }
      } else {
        if (!booking.inventoryCommitted && (t.count || 0) < it.quantity) {
          return res.status(409).json({ message: `${it.title} rooms full` })
        }
      }
    }

    let didCommitInventory = false
    for (const it of booking.items) {
      const t = await RoomType.findOne({ key: it.roomTypeKey })
      if (t && !hasRoomNumbers(t)) {
        await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
        didCommitInventory = true
      }
    }

    booking.status = 'paid'
    booking.amountPaid = Number(booking.total || 0)
    booking.payment = { ...(booking.payment || {}), provider: booking.payment?.provider || 'razorpay', status: 'paid' }
    booking.inventoryCommitted = booking.inventoryCommitted || didCommitInventory
    await booking.save()

    logActivity({ action: 'booking_paid', req, target: { type: 'booking', id: booking._id.toString() }, details: `Booking marked as paid - ₹${booking.total}`, metadata: { bookingId: booking._id, total: booking.total } })

    res.json({ booking })
  } catch (e) { next(e) }
})

// Mark unpaid (revert paid -> pending) and restore inventory if it was committed
router.post('/:id/unpay', authRequired, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Not found' })
    if (String(booking.user) !== String(req.user._id) && !['admin','worker'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    if (booking.status === 'pending') return res.json({ booking })
    if (booking.status === 'cancelled') {
      return res.status(409).json({ message: 'Cannot mark unpaid for cancelled booking' })
    }
    if (booking.status === 'completed') {
      return res.status(409).json({ message: 'Cannot mark unpaid after check-out' })
    }
    if (booking.checkedInAt) {
      return res.status(409).json({ message: 'Cannot mark unpaid after check-in' })
    }
    if (booking.status !== 'paid') {
      return res.status(409).json({ message: 'Only paid bookings can be marked unpaid' })
    }

    if (booking.inventoryCommitted) {
      for (const it of (booking.items || [])) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (t && !hasRoomNumbers(t)) {
          await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
        }
      }
      booking.inventoryCommitted = false
    }

    booking.status = 'pending'
    booking.amountPaid = 0
    booking.payment = { ...(booking.payment || {}), status: 'pending' }
    await booking.save()

    logActivity({ action: 'booking_marked_unpaid', req, target: { type: 'booking', id: booking._id.toString() }, details: 'Booking marked as unpaid', metadata: { bookingId: booking._id } })

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
    const list = await Booking.find({}).populate('user','name email phone').sort({ createdAt: -1 })
    list.forEach(applyGuestSnapshotToResponse)
    res.json({ bookings: list })
  } catch (e) { next(e) }
})

// Get available room numbers for a room type and date range
router.get('/available-rooms/:roomTypeKey', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const { roomTypeKey } = req.params
    const { checkIn, checkOut, excludeBookingId } = req.query
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'checkIn and checkOut dates are required' })
    }

    const availableRooms = await getAvailableRoomNumbers(
      roomTypeKey,
      new Date(checkIn),
      new Date(checkOut),
      excludeBookingId ? String(excludeBookingId) : null
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

    // Send update emails (fire-and-forget)
    const changedFields = ['room_allotments']
    const userForEmail = await User.findById(booking.user)
    if (userForEmail?.email) {
      sendBookingUpdateToUser(booking, userForEmail, { changedFields, actor: req.user }).catch(err =>
        console.error('Failed to send booking update email to user:', err)
      )
      sendBookingUpdateNotificationToAdmin(booking, userForEmail, { changedFields, actor: req.user }).catch(err =>
        console.error('Failed to send booking update email to admin:', err)
      )
    }

    const allottedSummary = allotments.map(a => `${a.roomTypeKey}: [${a.roomNumbers.join(', ')}]`).join('; ')
    logActivity({ action: 'rooms_allotted', req, target: { type: 'booking', id: booking._id.toString() }, details: `Rooms allotted - ${allottedSummary}`, metadata: { bookingId: booking._id, allotments } })

    res.json({ booking })
  } catch (e) { next(e) }
})

// Update booking (extend checkout, add guests, etc.)
router.put('/:id', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    const {
      checkIn,
      checkOut,
      items,
      replaceItems,
      additionalGuests,
      allotments,
      userInfo,
      pricing
    } = req.body || {}

    const changedFields = []
    let recalculate = false
    let bookingUser = await User.findById(booking.user)
    let guestDetails = getBookingGuestDetails({
      guestDetails: booking.guestDetails,
      user: bookingUser || {}
    })

    // Keep guest identity as a booking snapshot instead of rewriting shared User records.
    if (userInfo) {
      const prevName = guestDetails.name || ''
      const prevEmail = guestDetails.email || ''
      const prevPhone = guestDetails.phone || ''

      const nextName = userInfo.name !== undefined ? String(userInfo.name || '').trim() : prevName
      const nextEmail = userInfo.email !== undefined ? String(userInfo.email || '').trim().toLowerCase() : prevEmail
      const nextPhone = userInfo.phone !== undefined ? String(userInfo.phone || '').trim() : prevPhone

      if (userInfo.name !== undefined && !nextName) {
        return res.status(400).json({ message: 'Guest name is required' })
      }
      if (userInfo.email !== undefined && !nextEmail) {
        return res.status(400).json({ message: 'Guest email is required' })
      }

      if (nextName !== prevName) changedFields.push('guest_name')
      if (nextEmail !== prevEmail) changedFields.push('guest_email')
      if (nextPhone !== prevPhone) changedFields.push('guest_phone')
      guestDetails = buildGuestDetails({
        name: nextName,
        email: nextEmail,
        phone: nextPhone
      })
      booking.guestDetails = guestDetails
    }

    // Update check-in/check-out dates
    if (checkIn) {
      const newCheckIn = new Date(checkIn)
      if (Number.isNaN(newCheckIn.getTime())) {
        return res.status(400).json({ message: 'Invalid check-in date' })
      }
      booking.checkIn = newCheckIn
      recalculate = true
      changedFields.push('check_in')
    }

    if (checkOut) {
      const newCheckOut = new Date(checkOut)
      if (Number.isNaN(newCheckOut.getTime())) {
        return res.status(400).json({ message: 'Invalid check-out date' })
      }
      if (newCheckOut <= booking.checkIn) {
        return res.status(400).json({ message: 'Check-out must be after check-in' })
      }
      booking.checkOut = newCheckOut
      if (booking.fullDay) {
        booking.fullDay = false
        changedFields.push('full_day')
      }
      recalculate = true
      changedFields.push('check_out')
    }

    if (booking.checkOut) {
      booking.nights = nightsBetween(booking.checkIn, booking.checkOut)
    } else {
      booking.nights = 1
    }

    // Replace entire booking items (quantity/base price/guests fully editable)
    if (replaceItems && Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({ message: 'At least one room item is required' })
      }

      const roomTypeKeys = [...new Set(items.map(i => String(i.roomTypeKey || '').trim()).filter(Boolean))]
      const roomTypes = await RoomType.find({ key: { $in: roomTypeKeys } })
      const roomTypeMap = Object.fromEntries(roomTypes.map(rt => [rt.key, rt]))

      const oldQtyMap = {}
      booking.items.forEach(it => {
        oldQtyMap[it.roomTypeKey] = (oldQtyMap[it.roomTypeKey] || 0) + (it.quantity || 0)
      })

      const nextItems = []
      const newQtyMap = {}

      for (const rawItem of items) {
        const roomTypeKey = String(rawItem.roomTypeKey || '').trim()
        const qty = Number(rawItem.quantity || 0)
        if (!roomTypeKey) return res.status(400).json({ message: 'roomTypeKey is required for each item' })
        if (!Number.isInteger(qty) || qty < 1) return res.status(400).json({ message: `Invalid quantity for ${roomTypeKey}` })

        const roomType = roomTypeMap[roomTypeKey]
        if (!roomType) return res.status(400).json({ message: `Invalid room type ${roomTypeKey}` })

        const basePrice = Number(rawItem.basePrice)
        const effectiveBase = Number.isFinite(basePrice)
          ? Math.max(0, basePrice)
          : Number(roomType.prices?.roomOnly ?? roomType.basePrice ?? 0)

        const guests = Array.isArray(rawItem.guests)
          ? rawItem.guests.map(g => ({
              name: String(g?.name || '').trim() || 'Guest',
              email: g?.email ? String(g.email).trim() : undefined,
              phone: g?.phone ? String(g.phone).trim() : undefined,
              age: Math.max(0, Number(g?.age || 0)),
              type: g?.type === 'child' ? 'child' : 'adult'
            }))
          : []

        const subtotal = effectiveBase * qty * booking.nights
        const roomNumbers = Array.isArray(rawItem.allottedRoomNumbers)
          ? rawItem.allottedRoomNumbers.map(r => String(r).trim()).filter(Boolean)
          : []

        if (roomNumbers.length > 0 && roomNumbers.length !== qty) {
          return res.status(400).json({ message: `Please select exactly ${qty} room(s) for ${roomType.title}` })
        }

        nextItems.push({
          roomTypeKey,
          title: roomType.title,
          basePrice: effectiveBase,
          quantity: qty,
          guests,
          subtotal,
          allottedRoomNumbers: roomNumbers
        })

        newQtyMap[roomTypeKey] = (newQtyMap[roomTypeKey] || 0) + qty
      }

      // Keep room inventory in sync for committed bookings when quantities change
      if (booking.inventoryCommitted) {
        const touchedKeys = [...new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)])]
        for (const key of touchedKeys) {
          const oldQty = oldQtyMap[key] || 0
          const newQty = newQtyMap[key] || 0
          const delta = newQty - oldQty
          if (delta > 0) {
            const rt = roomTypeMap[key] || await RoomType.findOne({ key })
            if (rt && !hasRoomNumbers(rt)) {
              if ((rt.count || 0) < delta) {
                return res.status(409).json({ message: `${rt?.title || key} rooms not available` })
              }
              await RoomType.updateOne({ key }, { $inc: { count: -delta } })
            }
          } else if (delta < 0) {
            const rt = roomTypeMap[key] || await RoomType.findOne({ key })
            if (rt && !hasRoomNumbers(rt)) {
              await RoomType.updateOne({ key }, { $inc: { count: Math.abs(delta) } })
            }
          }
        }
      }

      booking.items = nextItems
      recalculate = true
      changedFields.push('items')
    }

    // Legacy behavior: append extra items
    if (!replaceItems && items && Array.isArray(items)) {
      for (const newItem of items) {
        const roomType = await RoomType.findOne({ key: newItem.roomTypeKey })
        if (!roomType) {
          return res.status(400).json({ message: `Invalid room type ${newItem.roomTypeKey}` })
        }

        if (!hasRoomNumbers(roomType) && roomType.count < newItem.quantity) {
          return res.status(409).json({ message: `${roomType.title} rooms not available` })
        }

        const existingItem = booking.items.find(it => it.roomTypeKey === newItem.roomTypeKey)
        if (existingItem) {
          existingItem.quantity += newItem.quantity
          if (newItem.guests) {
            existingItem.guests.push(...newItem.guests)
          }
        } else {
          const pkgType = normalizePackageType(newItem.packageType)
          const base = (roomType.prices && roomType.prices[pkgType])
            ? roomType.prices[pkgType]
            : (roomType.basePrice || 0)
          const subtotal = base * newItem.quantity * booking.nights
          booking.items.push({
            roomTypeKey: roomType.key,
            title: roomType.title,
            packageType: pkgType,
            basePrice: base,
            quantity: newItem.quantity,
            guests: newItem.guests || [],
            subtotal,
            allottedRoomNumbers: []
          })
        }

        if (booking.inventoryCommitted && !hasRoomNumbers(roomType)) {
          await RoomType.updateOne({ key: newItem.roomTypeKey }, { $inc: { count: -newItem.quantity } })
        }
      }
      recalculate = true
      changedFields.push('items')
    }

    // Add more guests to existing items
    if (additionalGuests && Array.isArray(additionalGuests)) {
      for (const guestUpdate of additionalGuests) {
        const item = booking.items.find(it => it.roomTypeKey === guestUpdate.roomTypeKey)
        if (item) {
          item.guests.push(...(guestUpdate.guests || []))
          changedFields.push(`guests_${guestUpdate.roomTypeKey}`)
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
      changedFields.push('room_allotments')
    }

    // Revalidate existing allotments when dates are changed
    if ((checkIn || checkOut) && booking.checkOut) {
      for (const item of booking.items) {
        const roomNumbers = item.allottedRoomNumbers || []
        if (roomNumbers.length === 0) continue
        const availableRooms = await getAvailableRoomNumbers(item.roomTypeKey, booking.checkIn, booking.checkOut, booking._id)
        for (const rn of roomNumbers) {
          if (!availableRooms.includes(rn)) {
            return res.status(409).json({ message: `Room ${rn} is not available for the updated dates` })
          }
        }
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
      const roomType = firstItem ? await RoomType.findOne({ key: firstItem.roomTypeKey }) : null
      const pricePerNight = ((roomType?.prices?.roomOnly ?? roomType?.basePrice) || 0)
      const gstEnabled = roomType ? roomType.gstEnabled !== false : true
      const customGST = (roomType && gstEnabled && roomType.gstPercentage !== null && roomType.gstPercentage !== undefined)
        ? roomType.gstPercentage
        : null
      const gstResult = calculateGST(newSubtotal, customGST, pricePerNight)

      booking.subtotal = newSubtotal
      booking.gstPercentage = gstEnabled ? gstResult.gstPercentage : 0
      booking.gstAmount = gstEnabled ? gstResult.gstAmount : 0
      const grossTotal = newSubtotal + (gstEnabled ? gstResult.gstAmount : 0)
      const negotiatedDiscount = Math.min(
        Math.max(0, Number(booking.negotiatedDiscount || 0)),
        grossTotal
      )
      booking.negotiatedDiscount = negotiatedDiscount
      booking.total = Math.max(0, grossTotal - negotiatedDiscount)
    }

    // Negotiated discount update (applied after tax)
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'negotiatedDiscount')) {
      const parsed = Number(req.body.negotiatedDiscount)
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Invalid negotiatedDiscount' })
      }

      const prev = Number(booking.negotiatedDiscount || 0)
      const grossTotal = Number(booking.subtotal || 0) + Number(booking.gstAmount || 0)
      const next = Math.min(Math.max(0, parsed), Math.max(0, grossTotal))
      booking.negotiatedDiscount = next
      booking.total = Math.max(0, grossTotal - next)

      if (Number(prev || 0) !== Number(next || 0)) changedFields.push('negotiated_discount')

      // Keep amountPaid within total after discount changes
      if (Number(booking.amountPaid || 0) > Number(booking.total || 0)) {
        booking.amountPaid = Math.max(0, Number(booking.total || 0))
        changedFields.push('amount_paid')
      }
    }

    // Manual pricing override (admin/worker can directly edit price fields)
    if (pricing && typeof pricing === 'object') {
      const nextSubtotal = Number(pricing.subtotal)
      const hasSubtotal = Number.isFinite(nextSubtotal) && nextSubtotal >= 0

      const nextGstPercentage = Number(pricing.gstPercentage)
      const hasGstPercentage = Number.isFinite(nextGstPercentage) && nextGstPercentage >= 0

      // If GST% is provided, compute GST Amount + Total automatically.
      // This avoids requiring admins to manually adjust totals when changing GST%.
      if (hasSubtotal) booking.subtotal = nextSubtotal

      if (hasGstPercentage) {
        const effectiveSubtotal = Number(booking.subtotal || 0)
        booking.gstPercentage = nextGstPercentage
        booking.gstAmount = Math.round((effectiveSubtotal * nextGstPercentage) / 100)
        const grossTotal = effectiveSubtotal + booking.gstAmount
        const negotiatedDiscount = Math.min(
          Math.max(0, Number(booking.negotiatedDiscount || 0)),
          grossTotal
        )
        booking.negotiatedDiscount = negotiatedDiscount
        booking.total = Math.max(0, grossTotal - negotiatedDiscount)
      } else {
        // Legacy manual override behavior (kept for compatibility)
        const nextGstAmount = Number(pricing.gstAmount)
        const nextTotal = Number(pricing.total)
        if (Number.isFinite(nextGstAmount) && nextGstAmount >= 0) booking.gstAmount = nextGstAmount
        if (Number.isFinite(nextTotal) && nextTotal >= 0) booking.total = nextTotal
      }
      changedFields.push('pricing')
    }

    // Advance/partial payment update
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'amountPaid')) {
      const parsed = parseAmountPaid(req.body.amountPaid)
      if (Number.isNaN(parsed)) return res.status(400).json({ message: 'Invalid amountPaid' })
      const nextPaid = parsed === null ? booking.amountPaid : parsed
      const prevPaid = Number(booking.amountPaid || 0)
      booking.amountPaid = Math.min(Math.max(0, nextPaid || 0), Number(booking.total || 0))
      changedFields.push('amount_paid')

      // If advance payment is received, reserve count-based inventory (once)
      if (!booking.inventoryCommitted && booking.amountPaid > 0) {
        for (const it of booking.items) {
          const rt = await RoomType.findOne({ key: it.roomTypeKey })
          if (rt && !hasRoomNumbers(rt)) {
            if ((rt.count || 0) < it.quantity) {
              return res.status(409).json({ message: `${rt.title} rooms full` })
            }
          }
        }
        for (const it of booking.items) {
          const rt = await RoomType.findOne({ key: it.roomTypeKey })
          if (rt && !hasRoomNumbers(rt)) {
            await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
          }
        }
        booking.inventoryCommitted = true
      }

      // If payment is removed entirely, unreserve inventory for count-based room types
      if (booking.inventoryCommitted && prevPaid > 0 && booking.amountPaid <= 0 && booking.status !== 'paid') {
        for (const it of booking.items) {
          const rt = await RoomType.findOne({ key: it.roomTypeKey })
          if (rt && !hasRoomNumbers(rt)) {
            await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
          }
        }
        booking.inventoryCommitted = false
      }

      if (booking.amountPaid >= Number(booking.total || 0)) {
        booking.status = 'paid'
        booking.payment = { ...(booking.payment || {}), provider: booking.payment?.provider || 'offline', status: 'paid' }
      } else {
        if (booking.status === 'paid') {
          booking.status = 'pending'
        }
      }
    }

    booking.markModified('items')
    await booking.save()

    const details = changedFields.length > 0
      ? `Booking updated (${[...new Set(changedFields)].join(', ')}) - ₹${booking.total}`
      : `Booking updated - ₹${booking.total}`

    logActivity({
      action: 'booking_edited',
      req,
      target: { type: 'booking', id: booking._id.toString(), name: guestDetails?.name || bookingUser?.name },
      details,
      metadata: {
        bookingId: booking._id,
        total: booking.total,
        changedFields: [...new Set(changedFields)]
      }
    })

    // Always send update emails after any successful edit (fire-and-forget)
    const baseUserForEmail = bookingUser || await User.findById(booking.user)
    const userForEmail = baseUserForEmail
      ? { ...(typeof baseUserForEmail.toObject === 'function' ? baseUserForEmail.toObject() : baseUserForEmail), ...guestDetails }
      : guestDetails
    const emailFields = changedFields.length > 0 ? [...new Set(changedFields)] : ['booking_updated']
    if (userForEmail?.email) {
      sendBookingUpdateToUser(booking, userForEmail, { changedFields: emailFields, actor: req.user }).catch(err =>
        console.error('Failed to send booking update email to user:', err)
      )
    }
    sendBookingUpdateNotificationToAdmin(booking, userForEmail || {}, { changedFields: emailFields, actor: req.user }).catch(err =>
      console.error('Failed to send booking update email to admin:', err)
    )

    applyGuestSnapshotToResponse(booking)
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
        const entryPkgType = normalizePackageType(entry.packageType)
        const items = entry.items.map(it => {
          const t = typeMap[it.roomTypeKey]
          const pkgType = normalizePackageType(it.packageType || entryPkgType)
          const base = (t.prices && t.prices[pkgType]) ? t.prices[pkgType] : (t.basePrice || 0)
          const subtotal = base * (it.quantity || 1) * nights
          return {
            roomTypeKey: t.key,
            title: t.title,
            packageType: pkgType,
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
        const grossTotal = subtotalAmount + finalGSTAmount

        const negotiatedDiscountRaw = entry.negotiatedDiscount
        const negotiatedDiscountParsed = negotiatedDiscountRaw === undefined || negotiatedDiscountRaw === null || negotiatedDiscountRaw === ''
          ? 0
          : Number(negotiatedDiscountRaw)
        if (!Number.isFinite(negotiatedDiscountParsed) || negotiatedDiscountParsed < 0) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: Invalid negotiatedDiscount` })
          continue
        }
        const negotiatedDiscount = Math.min(Math.max(0, negotiatedDiscountParsed), grossTotal)

        const total = Math.max(0, grossTotal - negotiatedDiscount)

        const advancePaidRaw = parseAmountPaid(entry.amountPaid ?? entry.advancePaid ?? entry.advanceAmount)
        if (Number.isNaN(advancePaidRaw)) {
          errors.push({ index: idx, message: `Entry ${idx + 1}: Invalid advance/amountPaid` })
          continue
        }

        let booking = await Booking.create({
          user: user._id,
          guestDetails: buildGuestDetails({ name: guestName, email: guestEmail, phone: guestPhone }),
          checkIn,
          checkOut: checkOut || undefined,
          fullDay,
          nights,
          items,
          subtotal: subtotalAmount,
          gstPercentage: finalGSTPercentage,
          gstAmount: finalGSTAmount,
          negotiatedDiscount,
          total,
          amountPaid: Math.min(Math.max(0, advancePaidRaw || 0), total),
          status: 'pending'
        })

        // Mark paid if requested
        const markPaid = !!entry.paid || (booking.amountPaid >= total)

        // Reserve count-based inventory if any payment was taken (advance or full)
        if (!booking.inventoryCommitted && booking.amountPaid > 0) {
          let canCommit = true
          for (const it of booking.items) {
            const t = await RoomType.findOne({ key: it.roomTypeKey })
            if (!t) { canCommit = false; break }
            if (!hasRoomNumbers(t) && (t.count || 0) < it.quantity) { canCommit = false; break }
          }
          if (canCommit) {
            for (const it of booking.items) {
              const t = await RoomType.findOne({ key: it.roomTypeKey })
              if (t && !hasRoomNumbers(t)) {
                await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
              }
            }
            booking.inventoryCommitted = true
            booking.payment = { ...(booking.payment || {}), provider: booking.payment?.provider || 'offline', status: booking.payment?.status || 'created' }
            await booking.save()
          }
        }

        if (markPaid) {
          let canPay = true
          for (const it of booking.items) {
            const t = await RoomType.findOne({ key: it.roomTypeKey })
            if (!t) { canPay = false; break }
            // Use date-based availability when room numbers are configured
            if (t.roomNumbers && t.roomNumbers.length > 0) {
              const availRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut, booking._id)
              if (availRooms.length < it.quantity) { canPay = false; break }
            } else if (!booking.inventoryCommitted && t.count < it.quantity) { canPay = false; break }
          }
          if (canPay) {
            for (const it of booking.items) {
              const t = await RoomType.findOne({ key: it.roomTypeKey })
              if (t && !hasRoomNumbers(t)) {
                if (!booking.inventoryCommitted) {
                  await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
                  booking.inventoryCommitted = true
                }
              }
            }
            booking.status = 'paid'
            booking.payment = { provider: 'offline', status: 'paid' }
            booking.amountPaid = total
            await booking.save()
          }
        }

        booking = await Booking.findById(booking._id).populate('user', 'name email phone')
        applyGuestSnapshotToResponse(booking)

        // Send confirmation emails for every bulk booking (fire-and-forget)
        sendBookingConfirmationToUser(booking, user).catch(err =>
          console.error(`Bulk booking ${idx + 1}: Failed to send user email:`, err)
        )
        sendBookingNotificationToAdmin(booking, user).catch(err =>
          console.error(`Bulk booking ${idx + 1}: Failed to send admin email:`, err)
        )
        results.push({ index: idx, success: true, booking })

        logActivity({ action: 'bulk_booking_created', req, target: { type: 'booking', id: booking._id.toString(), name: guestName }, details: `Bulk booking for ${guestName} - ${items.map(i => `${i.quantity}x ${i.title}`).join(', ')} - ₹${total}`, metadata: { bookingId: booking._id, guestName, guestEmail, total, negotiatedDiscount } })
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

    const isObjectId = /^[a-f\d]{24}$/i.test(q)

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $addFields: {
        displayGuestName: { $ifNull: ['$guestDetails.name', '$user.name'] },
        displayGuestEmail: { $ifNull: ['$guestDetails.email', '$user.email'] },
        displayGuestPhone: { $ifNull: ['$guestDetails.phone', '$user.phone'] }
      }},
      { $match: {
        $or: [
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(q) }] : []),
          { displayGuestEmail: { $regex: q, $options: 'i' } },
          { displayGuestName: { $regex: q, $options: 'i' } },
          { displayGuestPhone: { $regex: q, $options: 'i' } }
        ]
      }},
      { $sort: { createdAt: -1 } },
      { $project: {
        _id: 1, checkIn: 1, checkOut: 1, fullDay: 1, nights: 1, items: 1, total: 1, status: 1, createdAt: 1, guestDetails: 1,
        user: {
          _id: '$user._id',
          name: '$displayGuestName',
          email: '$displayGuestEmail',
          phone: '$displayGuestPhone',
          role: '$user.role'
        }
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

    const user = await resolveManualBookingUser({ name, email, phone: userInfo.phone })

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
    const effCheckOut = normalizeCheckOut(checkIn, checkOut)
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (hasRoomNumbers(t)) {
        const availableRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut)
        if (availableRooms.length < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      } else {
        if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      }
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
      const pkgType = normalizePackageType(it.packageType)
      const base = (t.prices && t.prices[pkgType]) ? t.prices[pkgType] : (t.basePrice || 0)
      const extras = (t.extraBedPerPerson || 0) * (it.extraBeds || 0) + (t.extraPersonPerNight || 0) * (it.extraPersons || 0)
      const subtotal = (base * it.quantity + extras) * nights
      return {
        roomTypeKey: t.key,
        title: t.title,
        packageType: pkgType,
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
    const grossTotal = manualSubtotal + manualGSTAmount

    const negotiatedDiscountRaw = payload.negotiatedDiscount
    const negotiatedDiscountParsed = negotiatedDiscountRaw === undefined || negotiatedDiscountRaw === null || negotiatedDiscountRaw === ''
      ? 0
      : Number(negotiatedDiscountRaw)
    if (!Number.isFinite(negotiatedDiscountParsed) || negotiatedDiscountParsed < 0) {
      return res.status(400).json({ message: 'Invalid negotiatedDiscount' })
    }
    const negotiatedDiscount = Math.min(Math.max(0, negotiatedDiscountParsed), grossTotal)

    const manualTotal = Math.max(0, grossTotal - negotiatedDiscount)

    const advancePaidRaw = parseAmountPaid(payload.amountPaid ?? payload.advancePaid ?? payload.advanceAmount)
    if (Number.isNaN(advancePaidRaw)) return res.status(400).json({ message: 'Invalid advance/amountPaid' })

    let booking = await Booking.create({
      user: user._id,
      guestDetails: buildGuestDetails({ name, email, phone: userInfo.phone }),
      checkIn,
      checkOut: checkOut || undefined,
      fullDay,
      nights,
      items,
      subtotal: manualSubtotal,
      gstPercentage: manualGSTPercentage,
      gstAmount: manualGSTAmount,
      negotiatedDiscount,
      total: manualTotal,
      amountPaid: Math.min(Math.max(0, advancePaidRaw || 0), manualTotal),
      status: 'pending'
    })

    const markPaid = !!payload.paid || payload.status === 'paid' || (booking.amountPaid >= manualTotal)

    // Reserve count-based inventory if any payment was taken (advance or full)
    if (!booking.inventoryCommitted && booking.amountPaid > 0) {
      for (const it of booking.items) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (!t) return res.status(409).json({ message: `${it.title} rooms full` })
        if (!hasRoomNumbers(t) && (t.count || 0) < it.quantity) {
          return res.status(409).json({ message: `${it.title} rooms full` })
        }
      }
      for (const it of booking.items) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (t && !hasRoomNumbers(t)) {
          await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
        }
      }
      booking.inventoryCommitted = true
      booking.payment = { ...(booking.payment || {}), provider: booking.payment?.provider || 'offline', status: booking.payment?.status || 'created' }
      await booking.save()
    }

    if (markPaid) {
      // validate availability then set status paid
      for (const it of booking.items) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (!t) return res.status(409).json({ message: `${it.title} rooms full` })
        if (hasRoomNumbers(t)) {
          const availRooms = await getAvailableRoomNumbers(it.roomTypeKey, checkIn, effCheckOut, booking._id)
          if (availRooms.length < it.quantity) return res.status(409).json({ message: `${it.title} rooms full` })
        } else if ((t.count || 0) < it.quantity && !booking.inventoryCommitted) {
          return res.status(409).json({ message: `${it.title} rooms full` })
        }
      }

      // if not already committed, commit now
      if (!booking.inventoryCommitted) {
        for (const it of booking.items) {
          const t = await RoomType.findOne({ key: it.roomTypeKey })
          if (t && !hasRoomNumbers(t)) {
            await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
          }
        }
        booking.inventoryCommitted = true
      }

      booking.status = 'paid'
      booking.payment = { provider: 'offline', status: 'paid' }
      booking.amountPaid = manualTotal
      await booking.save()
    }

    // Hydrate basic user fields for response
    booking = await Booking.findById(booking._id).populate('user', 'name email phone')
    applyGuestSnapshotToResponse(booking)

    // Send confirmation emails for all manual bookings (fire-and-forget)
    sendBookingConfirmationToUser(booking, user).catch(err => 
      console.error('Failed to send user confirmation email:', err)
    )
    sendBookingNotificationToAdmin(booking, user).catch(err => 
      console.error('Failed to send admin notification email:', err)
    )

    res.status(201).json({ booking })

    logActivity({ action: 'walk_in_created', req, target: { type: 'booking', id: booking._id.toString(), name }, details: `Walk-in booking for ${name} - ${items.map(i => `${i.quantity}x ${i.title}`).join(', ')} - ₹${manualTotal}`, metadata: { bookingId: booking._id, guestName: name, guestEmail: email, total: manualTotal, negotiatedDiscount } })
  } catch (e) { next(e) }
})

// Checkout: free rooms and mark completed
router.post('/:id/checkout', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Not found' })
    if (booking.status !== 'paid') return res.status(400).json({ message: 'Only paid bookings can be checked out' })
    if (!booking.checkedInAt) return res.status(400).json({ message: 'Guest must be checked in before checkout' })
    for (const it of booking.items) {
      const t = await RoomType.findOne({ key: it.roomTypeKey })
      if (t && !hasRoomNumbers(t)) {
        await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
      }
    }
    booking.status = 'completed'
    booking.inventoryCommitted = false
    await booking.save()

    logActivity({ action: 'guest_checked_out', req, target: { type: 'booking', id: booking._id.toString() }, details: `Guest checked out - ${booking.items.map(i => `${i.quantity}x ${i.title}`).join(', ')}`, metadata: { bookingId: booking._id } })

    res.json({ booking })
  } catch (e) { next(e) }
})

// Check-in: mark guest as checked-in (operational flag)
router.post('/:id/checkin', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Not found' })

    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Cannot check in a cancelled booking' })
    if (booking.status === 'completed') return res.status(400).json({ message: 'Cannot check in a completed booking' })
    if (!['paid', 'pending'].includes(booking.status)) {
      return res.status(400).json({ message: 'Only paid or pending bookings can be checked in' })
    }
    if (booking.checkedInAt) return res.status(400).json({ message: 'Guest is already checked in' })

    const now = new Date()
    const checkInDate = booking.checkIn ? new Date(booking.checkIn) : null
    const effCheckOut = normalizeCheckOut(booking.checkIn, booking.checkOut)

    if (!checkInDate || Number.isNaN(checkInDate.getTime())) {
      return res.status(400).json({ message: 'Invalid check-in date for this booking' })
    }

    // Only allow check-in during the stay window (date-time based)
    if (now < checkInDate) {
      return res.status(400).json({ message: 'Cannot check in before the check-in time' })
    }
    if (effCheckOut && now > effCheckOut) {
      return res.status(400).json({ message: 'Cannot check in after the stay has ended' })
    }

    booking.checkedInAt = now
    booking.checkedInBy = { userId: req.user._id, name: req.user?.name || '', role: req.user?.role || '' }
    await booking.save()

    logActivity({
      action: 'guest_checked_in',
      req,
      target: { type: 'booking', id: booking._id.toString() },
      details: `Guest checked in - ${booking.items.map(i => `${i.quantity}x ${i.title}`).join(', ')}`,
      metadata: { bookingId: booking._id }
    })

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

    // Restore room availability if inventory was committed (reserved)
    if (booking.inventoryCommitted) {
      for (const it of booking.items) {
        const t = await RoomType.findOne({ key: it.roomTypeKey })
        if (t && !hasRoomNumbers(t)) {
          await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
        }
      }
    }

    // Mark as cancelled (store metadata for undo)
    const prevStatus = booking.status
    booking.statusBeforeCancel = (prevStatus === 'paid' || prevStatus === 'pending') ? prevStatus : null
    booking.cancelledAt = new Date()
    booking.cancelledBy = {
      userId: req.user?._id || null,
      name: req.user?.name || '',
      role: req.user?.role || ''
    }
    booking.status = 'cancelled'
    booking.inventoryCommitted = false
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

    const guestName = booking.user?.name || 'Unknown'
    logActivity({ action: 'booking_cancelled', req, target: { type: 'booking', id: booking._id.toString(), name: guestName }, details: `Booking cancelled for ${guestName} - ₹${booking.total}`, metadata: { bookingId: booking._id, guestName, total: booking.total } })
  } catch (e) { next(e) }
})

// Undo cancellation: restore booking to its previous confirmed/pending state and notify
router.post('/:id/undo-cancel', authRequired, rolesRequired('admin','worker'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone')
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled bookings can be restored' })
    }

    const computedStatus = (Number(booking.amountPaid || 0) >= Number(booking.total || 0)) ? 'paid' : 'pending'
    let restoreStatus = booking.statusBeforeCancel || computedStatus
    if (restoreStatus !== 'paid' && restoreStatus !== 'pending') restoreStatus = computedStatus
    if (restoreStatus === 'paid' && computedStatus !== 'paid') restoreStatus = computedStatus

    // Re-commit inventory (count-based room types) if any advance payment exists.
    // This mirrors the reserve-on-payment behavior used elsewhere.
    if (!booking.inventoryCommitted && Number(booking.amountPaid || 0) > 0) {
      for (const it of booking.items) {
        const rt = await RoomType.findOne({ key: it.roomTypeKey })
        if (rt && !hasRoomNumbers(rt)) {
          if ((rt.count || 0) < it.quantity) {
            return res.status(409).json({ message: `${rt.title} rooms full — cannot restore booking` })
          }
        }
      }
      for (const it of booking.items) {
        const rt = await RoomType.findOne({ key: it.roomTypeKey })
        if (rt && !hasRoomNumbers(rt)) {
          await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
        }
      }
      booking.inventoryCommitted = true
    }

    booking.status = restoreStatus
    booking.statusBeforeCancel = null
    booking.cancelledAt = null
    booking.cancelledBy = { userId: null, name: '', role: '' }
    await booking.save()

    // Send restoration notifications
    sendUndoCancellationToUser(booking, booking.user, req.user).catch(err =>
      console.error('Failed to send undo-cancellation email to user:', err)
    )
    sendUndoCancellationToAdmin(booking, booking.user, req.user).catch(err =>
      console.error('Failed to send undo-cancellation notification to admin:', err)
    )

    res.json({
      success: true,
      message: 'Booking restored successfully',
      booking
    })

    const guestName = booking.user?.name || 'Unknown'
    logActivity({
      action: 'booking_cancel_undone',
      req,
      target: { type: 'booking', id: booking._id.toString(), name: guestName },
      details: `Booking restored for ${guestName} - ₹${booking.total}`,
      metadata: { bookingId: booking._id, guestName, total: booking.total, restoreStatus }
    })
  } catch (e) { next(e) }
})
