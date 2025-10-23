import { Router } from 'express'
import { z } from 'zod'
import Room from '../models/Room.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import multer from 'multer'
import { uploadBufferToCloudinary } from '../utils/cloudinary.js'

const router = Router()

const upsertSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.string().min(1),
  type: z.string().min(1),
  capacity: z.object({ adults: z.number().int().min(1), children: z.number().int().min(0) }),
  basePrice: z.number().min(0),
  seasonalDiscount: z.number().min(0).max(100).optional().default(0),
  amenities: z.array(z.string()).optional().default([]),
  status: z.enum(['available', 'blocked', 'maintenance']).optional().default('available'),
  description: z.string().optional().default('')
})

// Public list rooms
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) where.status = status
    const rooms = await Room.find(where).sort({ roomNumber: 1 })
    res.json({ rooms })
  } catch (e) { next(e) }
})

// Public get one
router.get('/:id', async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Not found' })
    res.json({ room })
  } catch (e) { next(e) }
})

// Configure in-memory upload for serverless
const memUpload = multer({ storage: multer.memoryStorage(), limits: { files: 5, fileSize: 5 * 1024 * 1024 } })

// Admin create
router.post('/', authRequired, adminRequired, memUpload.array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.parse(body)
    const photos = []
    const folderBase = `hotel/rooms/${parsed.roomNumber || 'generic'}`
    for (const f of (req.files || [])) {
      const r = await uploadBufferToCloudinary(f.buffer, f.originalname, folderBase)
      photos.push(r.secure_url)
    }
    const room = await Room.create({ ...parsed, photos })
    res.status(201).json({ room })
  } catch (e) { next(e) }
})

// Admin update
router.put('/:id', authRequired, adminRequired, memUpload.array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.partial().parse(body)
    const addPhotos = []
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Not found' })
    Object.assign(room, parsed)
    // Upload new photos if provided
    if (req.files && req.files.length) {
      const folderBase = `hotel/rooms/${room.roomNumber || 'generic'}`
      for (const f of req.files) {
        const r = await uploadBufferToCloudinary(f.buffer, f.originalname, folderBase)
        addPhotos.push(r.secure_url)
      }
    }
    if (addPhotos.length) room.photos = [...(room.photos || []), ...addPhotos]
    await room.save()
    res.json({ room })
  } catch (e) { next(e) }
})

// Admin delete
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    await Room.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
