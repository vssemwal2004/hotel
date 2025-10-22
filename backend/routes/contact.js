const { z } = require('zod')
const { db } = require('../db')
const { nanoid } = require('nanoid')

module.exports = function ({ adminKeyRequired }) {
  const router = require('express').Router()

  const createSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
    phone: z.string().min(7).max(20).optional().or(z.literal('')).transform(v => v || undefined),
    subject: z.string().min(2),
    message: z.string().min(5),
  })

  // Public: submit a contact message
  router.post('/', async (req, res) => {
    const parse = createSchema.safeParse(req.body)
    if (!parse.success) return res.status(400).json({ error: 'Invalid data', details: parse.error.flatten() })
    const m = {
      id: nanoid(),
      ...parse.data,
      status: 'new',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: ''
    }
    await db.read()
    db.data.messages.unshift(m)
    await db.write()
    res.status(201).json({ ok: true, id: m.id })
  })

  // Public: stats snapshot (no details)
  router.get('/stats', async (req, res) => {
    await db.read()
    const total = db.data.messages.length
    const unread = db.data.messages.filter(m => !m.isRead).length
    const replied = db.data.messages.filter(m => m.status === 'replied').length
    res.json({ total, unread, replied })
  })

  // Admin: list messages
  // NOTE: Admin guard disabled for simplicity in local dev
  router.get('/', async (req, res) => {
    await db.read()
    const list = db.data.messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(list)
  })

  // Admin: get one
  // NOTE: Admin guard disabled for simplicity in local dev
  router.get('/:id', async (req, res) => {
    await db.read()
    const item = db.data.messages.find(m => m.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    res.json(item)
  })

  // Admin: mark read
  // NOTE: Admin guard disabled for simplicity in local dev
  router.patch('/:id/read', async (req, res) => {
    await db.read()
    const item = db.data.messages.find(m => m.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    item.isRead = true
    item.updatedAt = new Date().toISOString()
    await db.write()
    res.json({ ok: true })
  })

  // Admin: update status or notes
  // NOTE: Admin guard disabled for simplicity in local dev
  router.patch('/:id', async (req, res) => {
    const schema = z.object({ status: z.enum(['new', 'in-progress', 'replied', 'archived']).optional(), adminNotes: z.string().optional() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid data' })
    await db.read()
    const item = db.data.messages.find(m => m.id === req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    Object.assign(item, parsed.data)
    item.updatedAt = new Date().toISOString()
    await db.write()
    res.json({ ok: true })
  })

  // Admin: delete
  // NOTE: Admin guard disabled for simplicity in local dev
  router.delete('/:id', async (req, res) => {
    await db.read()
    const before = db.data.messages.length
    db.data.messages = db.data.messages.filter(m => m.id !== req.params.id)
    const removed = before !== db.data.messages.length
    await db.write()
    if (!removed) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  })

  return router
}
