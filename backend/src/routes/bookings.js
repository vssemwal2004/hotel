import { Router } from 'express'
import { z } from 'zod'
import { authRequired, adminRequired } from '../middleware/auth.js'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'

const router = Router()

const guestSchema = z.object({ name: z.string().min(1), age: z.number().int().min(0), type: z.enum(['adult','child']) })
const itemSchema = z.object({
  roomTypeKey: z.enum(['deluxe-valley-view','hillside-suite','family-luxury-suite']),
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

    // Validate availability
    const types = await RoomType.find({ key: { $in: data.items.map(i=>i.roomTypeKey) } })
    const typeMap = Object.fromEntries(types.map(t => [t.key, t]))
    for (const it of data.items) {
      const t = typeMap[it.roomTypeKey]
      if (!t) return res.status(400).json({ message: `Invalid room type ${it.roomTypeKey}` })
      if (t.count < it.quantity) return res.status(409).json({ message: `${t.title} rooms full` })
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
    const total = items.reduce((s,a)=>s+a.subtotal,0)

    // Create booking (pending)
    const booking = await Booking.create({
      user: req.user._id,
      checkIn,
      checkOut: checkOut || undefined,
      fullDay,
      nights,
      items,
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
    if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
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

// Admin list bookings
router.get('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const list = await Booking.find({}).populate('user','name email').sort({ createdAt: -1 })
    res.json({ bookings: list })
  } catch (e) { next(e) }
})

export default router
