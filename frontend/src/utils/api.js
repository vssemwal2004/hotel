import axios from 'axios'

// In production (single service), default to same-origin '/api'. In dev, default to localhost:5000
const isProd = process.env.NODE_ENV === 'production'
const baseURL = process.env.NEXT_PUBLIC_API_URL || (isProd ? '/api' : 'http://localhost:5000/api')

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

export default api
