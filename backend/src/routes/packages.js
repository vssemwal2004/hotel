import { Router } from 'express'
import Package from '../models/Package.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

// Get all active packages (public)
router.get('/', async (req, res, next) => {
  try {
    const { roomTypeKey } = req.query
    const filter = { status: 'active' }
    if (roomTypeKey) filter.roomTypeKey = roomTypeKey
    
    const packages = await Package.find(filter).sort({ priority: -1, createdAt: -1 })
    res.json({ packages })
  } catch (err) {
    next(err)
  }
})

// Get single package
router.get('/:id', async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id)
    if (!pkg) return res.status(404).json({ message: 'Package not found' })
    res.json({ package: pkg })
  } catch (err) {
    next(err)
  }
})

// Create package (admin only)
router.post('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body)
    res.status(201).json({ package: pkg })
  } catch (err) {
    next(err)
  }
})

// Update package (admin only)
router.put('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!pkg) return res.status(404).json({ message: 'Package not found' })
    res.json({ package: pkg })
  } catch (err) {
    next(err)
  }
})

// Delete package (admin only)
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id)
    if (!pkg) return res.status(404).json({ message: 'Package not found' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
