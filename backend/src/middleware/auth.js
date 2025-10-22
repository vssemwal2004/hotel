import { verifyToken } from '../utils/auth.js'
import User from '../models/User.js'

export async function authRequired(req, res, next) {
  try {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ message: 'Not authenticated' })
    const { sub } = verifyToken(token)
    const user = await User.findById(sub).select('name email role')
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export function adminRequired(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
  next()
}
