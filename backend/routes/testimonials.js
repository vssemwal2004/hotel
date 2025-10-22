const { z } = require('zod')
const { db } = require('../db')
const { nanoid } = require('nanoid')

module.exports = function ({ adminKeyRequired }) {
  const router = require('express').Router()

  const createSchema = z.object({
    name: z.string().min(2),
    rating: z.number().int().min(1).max(5),
    message: z.string().min(5),
  })

  // List testimonials (public)
  router.get('/', async (req, res) => {
    await db.read()
    const { top } = req.query
    let items = db.data.testimonials
      .filter(t => t.isApproved !== false) // default to approved
      .sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt) - new Date(a.createdAt)))
    if (top) {
      const n = parseInt(top, 10)
      if (!Number.isNaN(n)) items = items.slice(0, n)
    }
    res.json(items)
  })

  // Stats (public)
  router.get('/stats', async (req, res) => {
    await db.read()
    const items = db.data.testimonials
    const total = items.length
    const avgRating = total ? (items.reduce((s, t) => s + t.rating, 0) / total) : 0
    const fiveStar = items.filter(t => t.rating === 5).length
    res.json({ total, avgRating, fiveStar })
  })

  // Create testimonial (auto-approve)
  router.post('/', async (req, res) => {
    const parse = createSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'Invalid data', details: parse.error.flatten() })
    const t = {
      id: nanoid(),
      name: parse.data.name,
      rating: parse.data.rating,
      message: parse.data.message,
      isApproved: true,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    }
    await db.read()
    db.data.testimonials.unshift(t)
    await db.write()
    res.status(201).json(t)
  })

  // Admin: list all
  // NOTE: Admin guard disabled for simplicity in local dev
  router.get('/admin', async (req, res) => {
    await db.read()
    res.json(db.data.testimonials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
  })

  // Admin: delete
  // NOTE: Admin guard disabled for simplicity in local dev
  router.delete('/:id', async (req, res) => {
    await db.read()
    const before = db.data.testimonials.length
    db.data.testimonials = db.data.testimonials.filter(t => t.id !== req.params.id)
    const removed = before !== db.data.testimonials.length
    await db.write()
    if (!removed) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  })

  return router
}
