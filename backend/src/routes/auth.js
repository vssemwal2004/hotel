import { Router } from 'express'
import { z } from 'zod'
import User from '../models/User.js'
import { signToken, verifyToken, cookieOptions } from '../utils/auth.js'

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

export default router
