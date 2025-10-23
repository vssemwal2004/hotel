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
import { ensureAdminFromEnv } from './utils/seedAdmin.js'

// Load env for local dev and general usage
try {
  dotenv.config({ override: true })
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })
} catch {}

export const app = express()

// Security headers
app.use(helmet())

// Logging
app.use(morgan('dev'))

// Parse JSON and cookies
app.use(express.json())
app.use(cookieParser())

// CORS with credentials
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

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
