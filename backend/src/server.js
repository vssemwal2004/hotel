import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
// Load .env from both CWD and project root to be robust whether started from backend/ or backend/src
try {
  dotenv.config({ override: true })
  // Attempt to also load parent folder .env (when starting from backend/src)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true })
} catch {}
import express from 'express'
import fs from 'fs'
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
import { startAvailabilityResetJob } from './scheduler/availabilityReset.js'

const app = express()

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

// Connect DB
const rawUri = process.env.MONGODB_URI
const MONGODB_URI = (rawUri && rawUri.trim().replace(/^['"]|['"]$/g, '')) || 'mongodb://127.0.0.1:27017/hotel'
console.log('MONGODB_URI from env ->', JSON.stringify(rawUri))
console.log('MONGODB_URI used ->', JSON.stringify(MONGODB_URI))
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected')
    await ensureAdminFromEnv()
    // Start background jobs after DB is ready
    startAvailabilityResetJob()
  })
  .catch((e) => {
    console.error('MongoDB connection error:', e)
    process.exit(1)
  })

// Routes
app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
// Diagnostics: surface minimal config for troubleshooting (safe in dev)
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
// static files for uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/api/rooms', roomsRouter)
app.use('/api/room-types', roomTypesRouter)
app.use('/api/bookings', bookingsRouter)

// Serve static frontend (Next.js exported) if available
try {
  const FRONTEND_DIST = process.env.FRONTEND_DIST || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/out')
  if (fs.existsSync(FRONTEND_DIST)) {
    console.log('Serving static frontend from:', FRONTEND_DIST)
    app.use(express.static(FRONTEND_DIST))
  } else {
    console.log('Static frontend not found at', FRONTEND_DIST)
  }
} catch (e) {
  console.warn('Static frontend serve skipped:', e?.message)
}

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server Error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`API listening on :${PORT}`))
