import { Router } from 'express'
import { z } from 'zod'
import User from '../models/User.js'
import { signToken, verifyToken, cookieOptions } from '../utils/auth.js'
import crypto from 'crypto'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Email already registered' })
    const user = await User.create({ name, email, password })
    const token = signToken({ sub: user._id, role: user.role })
    res.cookie('token', token, cookieOptions())
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
    const token = signToken({ sub: user._id, role: user.role })
    res.cookie('token', token, cookieOptions())
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ message: 'Not authenticated' })
  try {
    const { sub } = verifyToken(token)
    const user = await User.findById(sub).select('name email role')
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
})

// Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() })
    const { email } = schema.parse(req.body)
    const user = await User.findOne({ email })
    if (!user) return res.json({ ok: true }) // avoid user enumeration
    const token = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000) // 1 hour
    await user.save()
    // In production, send email with reset link containing token
    res.json({ ok: true, token }) // expose token for local testing only
  } catch (err) {
    next(err)
  }
})

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const schema = z.object({ token: z.string().min(10), password: z.string().min(6) })
    const { token, password } = schema.parse(req.body)
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })
    user.password = password
    user.clearResetToken()
    await user.save()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
