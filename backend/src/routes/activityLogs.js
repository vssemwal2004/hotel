import { Router } from 'express'
import { authRequired, adminRequired } from '../middleware/auth.js'
import ActivityLog from '../models/ActivityLog.js'

const router = Router()

// GET /api/activity-logs - Admin only, paginated
router.get('/', authRequired, adminRequired, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const skip = (page - 1) * limit

    const filter = {}

    if (req.query.action) {
      filter.action = req.query.action
    }
    if (req.query.userId) {
      filter['performedBy.userId'] = req.query.userId
    }
    if (req.query.role) {
      filter['performedBy.role'] = req.query.role
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {}
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from)
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to)
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter)
    ])

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/activity-logs/stats - Summary counts
router.get('/stats', authRequired, adminRequired, async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalLogs, todayLogs, actionCounts] = await Promise.all([
      ActivityLog.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ])

    res.json({
      totalLogs,
      todayLogs,
      actionCounts: actionCounts.reduce((acc, { _id, count }) => {
        acc[_id] = count
        return acc
      }, {})
    })
  } catch (err) {
    next(err)
  }
})

export default router
