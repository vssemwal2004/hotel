import { Router } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import User from '../models/User.js'
import { signToken, verifyToken, cookieOptions } from '../utils/auth.js'
import { sendPasswordResetEmail } from '../utils/email.js'
import { OAuth2Client } from 'google-auth-library'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6)
})

const loginSchema = z.object({
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
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
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    console.log('Login attempt:', req.body?.email)
    const { email, password } = loginSchema.parse(req.body)
    const user = await User.findOne({ email })
    if (!user) {
      console.log('User not found:', email)
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const ok = await user.comparePassword(password)
    if (!ok) {
      console.log('Password mismatch for:', email)
      return res.status(401).json({ message: 'Invalid credentials. If you signed up with Google, please use Google login or set a new password.' })
    }
    const token = signToken({ sub: user._id, role: user.role })
    res.cookie('token', token, cookieOptions())
    console.log('Login successful:', email)
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid email or password format', errors: err.errors })
    }
    next(err)
  }
})

router.post('/logout', async (req, res) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
})

router.get('/me', async (req, res) => {
  // Prefer Authorization header (explicit client intent), fallback to cookie
  let token
  const auth = req.headers['authorization'] || ''
  if (auth && auth.toLowerCase().startsWith('bearer ')) token = auth.slice(7).trim()
  if (!token) token = req.cookies?.token
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

// Forgot password - request reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Save token and expiry (1 hour)
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send email
    const emailSent = await sendPasswordResetEmail(user, resetToken)
    if (!emailSent) {
      console.error('Failed to send password reset email to:', email)
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' })
  } catch (err) {
    console.error('Forgot password error:', err)
    next(err)
  }
})

// Verify reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body || {}
    if (!token) return res.status(400).json({ valid: false, message: 'Token is required' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired reset token' })
    }

    res.json({ valid: true, message: 'Token is valid' })
  } catch (err) {
    console.error('Verify reset token error:', err)
    res.status(500).json({ valid: false, message: 'Server error' })
  }
})

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body || {}
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    // Update password and clear reset token
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err)
    next(err)
  }
})

export default router

// Google OAuth login with ID token
router.post('/google', async (req, res, next) => {
  try {
    const { idToken } = req.body || {}
    if (!idToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth/google] Missing idToken. Body keys:', Object.keys(req.body || {}))
      }
      return res.status(400).json({ message: 'Missing idToken' })
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    if (!CLIENT_ID) return res.status(500).json({ message: 'Server misconfigured: GOOGLE_CLIENT_ID missing' })
  const client = new OAuth2Client(CLIENT_ID)
  const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload || !payload.email) return res.status(401).json({ message: 'Invalid Google token' })

    const email = payload.email.toLowerCase()
    const name = payload.name || email.split('@')[0]

    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({ name, email, password: Math.random().toString(36).slice(2,10) })
    }

    // Promote to admin if email matches configured admin email(s)
    const adminEmails = [
      (process.env.ADMIN_EMAIL || '').toLowerCase(),
  
    ].filter(Boolean)
    if (adminEmails.includes(email) && user.role !== 'admin') {
      user.role = 'admin'
      await user.save()
    }

    const token = signToken({ sub: user._id, role: user.role })
    res.cookie('token', token, cookieOptions())
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[auth/google] Error:', err?.message || err)
    }
    next(err)
  }
})
