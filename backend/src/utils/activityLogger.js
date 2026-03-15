import ActivityLog from '../models/ActivityLog.js'

/**
 * Log an activity. Call this from any route handler.
 * @param {object} opts
 * @param {string} opts.action - one of the enum values
 * @param {object} opts.req - express request (used for user info + IP)
 * @param {object} [opts.target] - { type, id, name }
 * @param {string} [opts.details] - human-readable description
 * @param {object} [opts.metadata] - any extra data to store
 */
export async function logActivity({ action, req, target, details, metadata }) {
  try {
    const user = req?.user
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || ''

    await ActivityLog.create({
      action,
      performedBy: user ? {
        userId: user._id,
        name: user.name,
        role: user.role
      } : { name: 'System', role: 'system' },
      target: target || {},
      details: details || '',
      metadata: metadata || {},
      ipAddress: ip
    })
  } catch (err) {
    // Never let logging failures break the main flow
    console.error('Activity log error:', err.message)
  }
}
