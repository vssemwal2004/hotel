import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { authRequired, adminRequired, rolesRequired } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'
import { sendBookingConfirmationToUser, sendBookingNotificationToAdmin } from '../utils/email.js'
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
  guests: z.array(guestSchema).optional().default([])
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
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      // Capacity check based on guests array
      const guests = it.guests || []
      const adultCount = guests.filter(g => g.type === 'adult').length
      const childCount = guests.filter(g => g.type === 'child').length
      const maxA = (t.maxAdults ?? 0) * it.quantity
      const maxC = (t.maxChildren ?? 0) * it.quantity
      if ((adultCount > maxA) || (childCount > maxC)) {
        const needRoomsByAdults = (t.maxAdults || 1) > 0 ? Math.ceil(adultCount / (t.maxAdults || 1)) : adultCount
        const needRoomsByChildren = (t.maxChildren || 1) > 0 ? Math.ceil(childCount / (t.maxChildren || 1)) : childCount
        const requiredRooms = Math.max(needRoomsByAdults, needRoomsByChildren)
        const msg = `Selected ${t.title} rooms cannot accommodate all guests. Please add more rooms.`
        return res.status(400).json({ 
          message: msg,
          details: {
            roomTypeKey: t.key,
            title: t.title,
            adults: adultCount,
            children: childCount,
            maxAdultsPerRoom: t.maxAdults || 0,
            maxChildrenPerRoom: t.maxChildren || 0,
            selectedRooms: it.quantity,
            requiredRooms
          }
        })
      }
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
    if (!fullDay) {
      if (!data.checkOut) return res.status(400).json({ message: 'checkOut is required when fullDay is false' })
      checkOut = new Date(data.checkOut)
      if (!(checkOut > checkIn)) return res.status(400).json({ message: 'checkOut must be after checkIn' })
      nights = nightsBetween(checkIn, checkOut)
    }

    const types = await RoomType.find({ key: { $in: data.items.map(i=>i.roomTypeKey) } })
    const typeMap = Object.fromEntries(types.map(t => [t.key, t]))
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
      const guests = it.guests || []
      const adultCount = guests.filter(g => g.type === 'adult').length
      const childCount = guests.filter(g => g.type === 'child').length
      const maxA = (t.maxAdults ?? 0) * it.quantity
      const maxC = (t.maxChildren ?? 0) * it.quantity
      if ((adultCount > maxA) || (childCount > maxC)) {
        return res.status(400).json({ message: `Selected ${t.title} rooms cannot accommodate all guests. Please add more rooms.` })
      }
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
        subtotal
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

      // Send confirmation emails for paid manual bookings
      sendBookingConfirmationToUser(booking, user).catch(err => 
        console.error('Failed to send user confirmation email:', err)
      )
      sendBookingNotificationToAdmin(booking, user).catch(err => 
        console.error('Failed to send admin notification email:', err)
      )
    }

    // Hydrate basic user fields for response
    booking = await Booking.findById(booking._id).populate('user','name email')
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
