import { Router } from 'express'
import { z } from 'zod'
import Testimonial from '../models/Testimonial.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

// Validation schema for creating testimonial
const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  rating: z.number().min(1).max(5),
  message: z.string().min(10).max(500),
  role: z.string().max(50).optional()
})

// GET /api/testimonials - Get approved testimonials (public)
router.get('/', async (req, res, next) => {
  try {
    const { limit = 10, rating, top } = req.query
    
    let query = { isApproved: true }
    
    // Filter by minimum rating
    if (rating) {
      query.rating = { $gte: parseInt(rating) }
    }
    
    let testimonials
    
    if (top) {
      // Get top-rated testimonials for homepage
      testimonials = await Testimonial.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .limit(parseInt(top))
        .select('-__v')
    } else {
      testimonials = await Testimonial.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-__v')
    }
    
    res.json(testimonials)
  } catch (err) {
    next(err)
  }
})

// GET /api/testimonials/stats - Get testimonial statistics (public)
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Testimonial.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          }
        }
      }
    ])
    
    res.json(stats[0] || { totalCount: 0, averageRating: 0, fiveStarCount: 0, fourStarCount: 0 })
  } catch (err) {
    next(err)
  }
})

// POST /api/testimonials - Create new testimonial (public)
router.post('/', async (req, res, next) => {
  try {
    const data = testimonialSchema.parse(req.body)
    const testimonial = await Testimonial.create({
      ...data,
      isApproved: true, // Auto-approve testimonials
      approvedAt: new Date()
    })
    
    res.status(201).json({ 
      message: 'Thank you for your feedback! Your testimonial has been published.',
      testimonial: {
        id: testimonial._id,
        name: testimonial.name,
        rating: testimonial.rating
      }
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/testimonials/all - Get all testimonials including pending (admin only)
router.get('/all', authRequired, adminRequired, async (req, res, next) => {
  try {
    const { status } = req.query
    
    let query = {}
    if (status === 'approved') {
      query.isApproved = true
    } else if (status === 'pending') {
      query.isApproved = false
    }
    
    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .select('-__v')
    
    res.json(testimonials)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/testimonials/:id/approve - Approve testimonial (admin only)
router.patch('/:id/approve', authRequired, adminRequired, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        approvedBy: req.user.sub,
        approvedAt: new Date()
      },
      { new: true }
    )
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }
    
    res.json({ message: 'Testimonial approved', testimonial })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/testimonials/:id - Delete testimonial (admin only)
router.delete('/:id', authRequired, adminRequired, async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id)
    
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' })
    }
    
    res.json({ message: 'Testimonial deleted' })
  } catch (err) {
    next(err)
  }
})

export default router
