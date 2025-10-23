import axios from 'axios'

// In production (single service), default to same-origin '/api'. In dev, default to localhost:5000
const isProd = process.env.NODE_ENV === 'production'
const baseURL = process.env.NEXT_PUBLIC_API_URL || (isProd ? '/api' : 'http://localhost:5000/api')

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

// Attach Authorization header from localStorage token if present (helps dev without cookies)
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

export default api
