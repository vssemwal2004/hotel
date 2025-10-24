import { Router } from 'express'
import path from 'path'
import { z } from 'zod'
import RoomType from '../models/RoomType.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { memoryUploadFields, uploadBufferToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'

const router = Router()
function normalizePhotos(arr) {
  return (arr || [])
    .map((p) => {
      if (!p) return null
      if (typeof p === 'string') {
        const base = path.basename(p, path.extname(p)) || 'legacy'
        return { publicId: `legacy/${base}`, url: p }
      }
      if (p.url && p.publicId) return p
      if (p.url && !p.publicId) return { ...p, publicId: `legacy/${Date.now()}` }
      return null
    })
    .filter(Boolean)
}

const upsertSchema = z.object({
  key: z.string().min(1), // Allow any room type key dynamically
  title: z.string().min(1),
  basePrice: z.number().min(0),
  prices: z.object({
    roomOnly: z.number().min(0).optional(),
    roomBreakfast: z.number().min(0).optional(),
    roomBreakfastDinner: z.number().min(0).optional()
  }).optional(),
  maxAdults: z.number().int().min(0).optional().default(2),
  maxChildren: z.number().int().min(0).optional().default(1),
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
    const out = types.map(t => ({
      ...t.toObject(),
      photos: normalizePhotos(t.photos),
      coverPhotos: normalizePhotos(t.coverPhotos)
    }))
    res.json({ types: out })
  } catch (e) { next(e) }
})

// Public get one by key
router.get('/key/:key', async (req, res, next) => {
  try {
    const type = await RoomType.findOne({ key: req.params.key })
    if (!type) return res.status(404).json({ message: 'Not found' })
    const out = {
      ...type.toObject(),
      photos: normalizePhotos(type.photos),
      coverPhotos: normalizePhotos(type.coverPhotos)
    }
    res.json({ type: out })
  } catch (e) { next(e) }
})

// Admin create or update by key (idempotent)
router.post('/', authRequired, adminRequired, memoryUploadFields(), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.parse(body)
    // Collect files from different fields
    const filesObj = req.files || {}
    const toUploadGallery = (filesObj.subPhotos || filesObj.photos || [])
    const toUploadCovers = (filesObj.covers || [])
    let doc = await RoomType.findOne({ key: parsed.key })
    if (!doc) {
      const payload = { ...parsed, photos: [], coverPhotos: [] }
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
    }
    // Upload to Cloudinary
    // Ensure any legacy string entries are migrated to objects
    doc.photos = normalizePhotos(doc.photos)
    doc.coverPhotos = normalizePhotos(doc.coverPhotos)

    const folderBase = `hotel/roomtypes/${doc.key}`
    for (const f of toUploadGallery) {
      const r = await uploadBufferToCloudinary(f.buffer, f.originalname, `${folderBase}/gallery`)
      doc.photos.push({ publicId: r.public_id, url: r.secure_url })
    }
    for (const f of toUploadCovers) {
      const r = await uploadBufferToCloudinary(f.buffer, f.originalname, `${folderBase}/covers`)
      doc.coverPhotos.push({ publicId: r.public_id, url: r.secure_url })
    }
    if (doc.coverPhotos.length > 2) doc.coverPhotos = doc.coverPhotos.slice(-2)
    await doc.save()
    res.status(201).json({ type: doc })
  } catch (e) { next(e) }
})

// Admin update by id
router.put('/:id', authRequired, adminRequired, memoryUploadFields(), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.partial().parse(body)
    const filesObj = req.files || {}
    const addGallery = (filesObj.subPhotos || filesObj.photos || [])
    const addCovers = (filesObj.covers || [])
    const doc = await RoomType.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    Object.assign(doc, parsed)
    // Normalize legacy entries before appending
    doc.photos = normalizePhotos(doc.photos)
    doc.coverPhotos = normalizePhotos(doc.coverPhotos)

    const folderBase = `hotel/roomtypes/${doc.key}`
    for (const f of addGallery) {
      const r = await uploadBufferToCloudinary(f.buffer, f.originalname, `${folderBase}/gallery`)
      doc.photos.push({ publicId: r.public_id, url: r.secure_url })
    }
    for (const f of addCovers) {
      const r = await uploadBufferToCloudinary(f.buffer, f.originalname, `${folderBase}/covers`)
      doc.coverPhotos.push({ publicId: r.public_id, url: r.secure_url })
    }
    if (doc.coverPhotos.length > 2) doc.coverPhotos = doc.coverPhotos.slice(-2)
    await doc.save()
    res.json({ type: doc })
  } catch (e) { next(e) }
})

// Delete a photo by publicId and type
router.delete('/:id/photo', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { publicId, type } = req.query
    if (!publicId || !type) return res.status(400).json({ message: 'publicId and type are required' })
    const doc = await RoomType.findById(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Not found' })
    await deleteFromCloudinary(publicId)
    if (type === 'cover') {
      doc.coverPhotos = (doc.coverPhotos || []).filter(p => p.publicId !== publicId)
    } else {
      doc.photos = (doc.photos || []).filter(p => p.publicId !== publicId)
    }
    await doc.save()
    res.json({ type: doc })
  } catch (e) { next(e) }
})

export default router
