require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const { initDB } = require('./db')

const app = express()

// CORS
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))

// Body parsers
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'hotel-backend', time: new Date().toISOString() })
})

// Admin key middleware (simple guard for admin routes)
function adminKeyRequired(req, res, next) {
  const key = req.headers['x-admin-key']
  if (!key || key !== (process.env.ADMIN_KEY || 'changeme')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// Routers
app.use('/api/testimonials', require('./routes/testimonials')({ adminKeyRequired }))
app.use('/api/contact', require('./routes/contact')({ adminKeyRequired }))

// Static (optional placeholder)
app.use('/public', express.static(path.join(__dirname, 'public')))

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = process.env.PORT || 5000

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Hotel backend running on http://localhost:${PORT}`)
    console.log(`CORS origin: ${CLIENT_ORIGIN}`)
  })
}).catch(err => {
  console.error('Failed to initialize DB', err)
  process.exit(1)
})
