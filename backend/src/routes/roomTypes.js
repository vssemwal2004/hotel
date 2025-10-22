import { Router } from 'express'
import { z } from 'zod'
import RoomType from '../models/RoomType.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { roomTypePhotosUpload } from '../utils/files.js'

const router = Router()

const upsertSchema = z.object({
  key: z.enum(['deluxe-valley-view','hillside-suite','family-luxury-suite']),
  title: z.string().min(1),
  basePrice: z.number().min(0),
  prices: z.object({
    roomOnly: z.number().min(0).optional(),
    roomBreakfast: z.number().min(0).optional(),
    roomBreakfastDinner: z.number().min(0).optional()
  }).optional(),
  extraBedPerPerson: z.number().min(0).optional().default(0),
  extraPersonPerNight: z.number().min(0).optional().default(0),
  status: z.enum(['available','blocked','maintenance']).optional().default('available'),
  amenities: z.array(z.string()).optional().default([]),
  count: z.number().int().min(0),
  description: z.string().optional().default('')
})

// Public list
router.get('/', async (req, res, next) => {
  try {
    const types = await RoomType.find({}).sort({ title: 1 })
    res.json({ types })
  } catch (e) { next(e) }
})

// Public get one by key
router.get('/key/:key', async (req, res, next) => {
  try {
    const type = await RoomType.findOne({ key: req.params.key })
    if (!type) return res.status(404).json({ message: 'Not found' })
    res.json({ type })
  } catch (e) { next(e) }
})

// Admin create or update by key (idempotent)
router.post('/', authRequired, adminRequired, roomTypePhotosUpload().array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.parse(body)
    const photos = (req.files || []).map(f => `/uploads/roomtypes/${f.filename}`)
    let doc = await RoomType.findOne({ key: parsed.key })
    if (!doc) {
      const payload = { ...parsed, photos }
      // defaults for prices
      payload.prices = {
        roomOnly: parsed.prices?.roomOnly ?? parsed.basePrice,
        roomBreakfast: parsed.prices?.roomBreakfast ?? parsed.basePrice,
        roomBreakfastDinner: parsed.prices?.roomBreakfastDinner ?? parsed.basePrice
      }
      doc = await RoomType.create(payload)
    } else {
      Object.assign(doc, parsed)
      if (parsed.prices) {
        doc.prices = {
          roomOnly: parsed.prices.roomOnly ?? doc.prices?.roomOnly ?? doc.basePrice,
          roomBreakfast: parsed.prices.roomBreakfast ?? doc.prices?.roomBreakfast ?? doc.basePrice,
          roomBreakfastDinner: parsed.prices.roomBreakfastDinner ?? doc.prices?.roomBreakfastDinner ?? doc.basePrice
        }
      } else if (!doc.prices) {
        doc.prices = { roomOnly: doc.basePrice, roomBreakfast: doc.basePrice, roomBreakfastDinner: doc.basePrice }
      }
      if (photos.length) doc.photos = [...(doc.photos || []), ...photos]
      await doc.save()
    }
    res.status(201).json({ type: doc })
  } catch (e) { next(e) }
})

// Admin update by id
router.put('/:id', authRequired, adminRequired, roomTypePhotosUpload().array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.partial().parse(body)
    const addPhotos = (req.files || []).map(f => `/uploads/roomtypes/${f.filename}`)
    const doc = await RoomType.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    Object.assign(doc, parsed)
    if (addPhotos.length) doc.photos = [...(doc.photos || []), ...addPhotos]
    await doc.save()
    res.json({ type: doc })
  } catch (e) { next(e) }
})

export default router
