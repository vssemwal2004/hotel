import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import roomsRouter from './routes/rooms.js'
import roomTypesRouter from './routes/roomTypes.js'
import bookingsRouter from './routes/bookings.js'
import paymentsRouter from './routes/payments.js'
import testimonialsRouter from './routes/testimonials.js'
import contactRouter from './routes/contact.js'
import galleryRouter from './routes/gallery.js'
import usersRouter from './routes/users.js'
import activityLogsRouter from './routes/activityLogs.js'
import { ensureAdminFromEnv } from './utils/seedAdmin.js'

// Load env for local dev and general usage
try {
  dotenv.config({ override: true })
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })
} catch {}

export const app = express()

// Determine if running in production
const isProd = process.env.NODE_ENV === 'production'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'

// Suppress console.log/warn in production for security (keep console.error for critical issues)
if (isProd) {
  console.log = () => {}
  console.warn = () => {}
  console.info = () => {}
  console.debug = () => {}
}

// Security headers - Configure helmet for Google OAuth compatibility
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP to allow Google OAuth scripts
}))

// Logging (only in development)
if (!isProd) {
  app.use(morgan('dev'))
}

// Parse JSON and cookies
app.use(express.json())
app.use(cookieParser())

// CORS configuration - Support both local and production
app.use(
  cors({
    origin: (origin, callback) => {
      // In production, only allow the production domain
      if (isProd) {
        const allowedOrigins = [CLIENT_ORIGIN, 'https://hotelkrishnaandrestaurant.com']
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          console.warn('CORS blocked origin:', origin)
          callback(new Error('Not allowed by CORS'))
        }
      } else {
        // In development, allow localhost variations
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5000'
        ]
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, true) // Allow all in dev for flexibility
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
  })
)

// Additional headers for Google OAuth and cookie handling
app.use((req, res, next) => {
  // Allow cookies to be set from the frontend
  res.header('Access-Control-Allow-Credentials', 'true')
  // Support Google OAuth popup
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  next()
})

// Routes
app.get('/health', (req, res) => res.json({ ok: true }))
// Convenience root route for API-only project
app.get('/', (req, res) => res.json({ ok: true, service: 'hotel-backend', version: '1.0' }))
app.use('/api/auth', authRouter)
// Diagnostics (non-prod)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/google-config', (req, res) => {
    const cid = process.env.GOOGLE_CLIENT_ID || ''
    res.json({
      hasClientId: Boolean(cid),
      clientIdPrefix: cid ? cid.slice(0, 20) : null,
      clientOrigin: process.env.CLIENT_ORIGIN || null
    })
  })
}
// static files (local dev only, not used on Vercel)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/api/rooms', roomsRouter)
app.use('/api/room-types', roomTypesRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/testimonials', testimonialsRouter)
app.use('/api/contact', contactRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/users', usersRouter)
app.use('/api/activity-logs', activityLogsRouter)

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server Error' })
})

let mongoPromise
export async function ensureDb() {
  if (!mongoPromise) {
    const rawUri = process.env.MONGODB_URI
    if (!rawUri || !rawUri.trim()) {
      throw new Error('MONGODB_URI is not set')
    }
    const MONGODB_URI = rawUri.trim().replace(/^['\"]|['\"]$/g, '')
    console.log('MONGODB_URI used ->', JSON.stringify(MONGODB_URI.replace(/:\w+@/, '://****@')))
    mongoPromise = mongoose
      .connect(MONGODB_URI)
      .then(async () => {
        console.log('MongoDB connected')
        await ensureAdminFromEnv()
      })
      .catch((e) => {
        console.error('MongoDB connection error:', e?.message)
        throw e
      })
  }
  return mongoPromise
}
