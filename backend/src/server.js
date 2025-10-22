import dotenv from 'dotenv'
dotenv.config({ override: true })
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import { ensureAdminFromEnv } from './utils/seedAdmin.js'

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
  })
  .catch((e) => {
    console.error('MongoDB connection error:', e)
    process.exit(1)
  })

// Routes
app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server Error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`API listening on :${PORT}`))
