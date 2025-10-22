import { Router } from 'express'
import { z } from 'zod'
import Room from '../models/Room.js'
import { authRequired, adminRequired } from '../middleware/auth.js'
import { roomPhotosUpload } from '../utils/files.js'

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

// Admin create
router.post('/', authRequired, adminRequired, roomPhotosUpload().array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.parse(body)
    const photos = (req.files || []).map(f => `/uploads/rooms/${f.filename}`)
    const room = await Room.create({ ...parsed, photos })
    res.status(201).json({ room })
  } catch (e) { next(e) }
})

// Admin update
router.put('/:id', authRequired, adminRequired, roomPhotosUpload().array('photos', 5), async (req, res, next) => {
  try {
    const body = JSON.parse(req.body.data || '{}')
    const parsed = upsertSchema.partial().parse(body)
    const addPhotos = (req.files || []).map(f => `/uploads/rooms/${f.filename}`)
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ message: 'Not found' })
    Object.assign(room, parsed)
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
