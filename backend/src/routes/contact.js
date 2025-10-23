import { Router } from 'express'
import { z } from 'zod'
import ContactMessage from '../models/ContactMessage.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

// Validation schema
const contactMessageSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(1000)
})

// POST /api/contact - Submit contact form (auth required)
router.post('/', authRequired, async (req, res, next) => {
  try {
    // Get name and email from authenticated user
    const data = {
      name: req.user.name,
      email: req.user.email,
      subject: req.body.subject,
      message: req.body.message,
      phone: req.body.phone
    }
    
    // Validate subject and message
    const bodySchema = z.object({
      subject: z.string().min(3).max(200),
      message: z.string().min(10).max(1000),
      phone: z.string().max(20).optional()
    })
    
    bodySchema.parse(req.body)
    
    const contactMessage = await ContactMessage.create(data)
    
    res.status(201).json({ 
      message: 'Thank you for contacting us! We will get back to you soon.',
      id: contactMessage._id
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/contact - Get all contact messages (admin only)
router.get('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query
    
    let query = {}
    if (status) {
      query.status = status
    }
    
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-__v')
    
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

// GET /api/contact/stats - Get contact message statistics (admin only)
router.get('/stats', authRequired, adminRequired, async (req, res, next) => {
  try {
    const totalCount = await ContactMessage.countDocuments()
    const newCount = await ContactMessage.countDocuments({ status: 'new' })
    const readCount = await ContactMessage.countDocuments({ status: 'read' })
    const repliedCount = await ContactMessage.countDocuments({ status: 'replied' })
    const unreadCount = await ContactMessage.countDocuments({ isRead: false })
    
    res.json({
      totalCount,
      newCount,
      readCount,
      repliedCount,
      unreadCount
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/contact/:id - Get single contact message (admin only)
router.get('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const message = await ContactMessage.findById(req.params.id)
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' })
    }
    
    res.json(message)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/contact/:id/mark-read - Mark message as read (admin only)
router.patch('/:id/mark-read', authRequired, adminRequired, async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { 
        isRead: true,
        readBy: req.user._id,
        readAt: new Date(),
        status: 'read'
      },
      { new: true }
    )
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' })
    }
    
    res.json({ message: 'Message marked as read', data: message })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/contact/:id/status - Update message status (admin only)
router.patch('/:id/status', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { status } = req.body
    
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' })
    }
    
    res.json({ message: 'Status updated', data: message })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/contact/:id/notes - Update admin notes (admin only)
router.patch('/:id/notes', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { notes } = req.body
    
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { adminNotes: notes },
      { new: true }
    )
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' })
    }
    
    res.json({ message: 'Notes updated', data: message })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/contact/:id - Delete contact message (admin only)
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id)
    
    if (!message) {
      return res.status(404).json({ message: 'Contact message not found' })
    }
    
    res.json({ message: 'Contact message deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
