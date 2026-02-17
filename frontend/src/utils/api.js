import axios from 'axios'

// Determine the API base URL based on environment
// Priority:
// 1. NEXT_PUBLIC_API_URL environment variable
// 2. Production: /api (relative path - Nginx will proxy to backend)
// 3. Development: http://localhost:5000/api
const getBaseURL = () => {
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Check if we're running in production
  const isProd = process.env.NODE_ENV === 'production'
  
  if (isProd) {
    // In production with Nginx reverse proxy, use relative path
    // This ensures requests go to https://hotelkrishnaandrestaurant.com/api
    return '/api'
  }
  
  // Development: use localhost backend
  return 'http://localhost:5000/api'
}

const baseURL = getBaseURL()

console.log('API Configuration:', {
  baseURL,
  env: process.env.NODE_ENV,
  explicitURL: process.env.NEXT_PUBLIC_API_URL || 'not set'
})

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Required for cookies to work
})

// Attach Authorization header from localStorage token if present
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (err) {
    console.error('Failed to retrieve auth token:', err)
  }
  return config
})

// Log errors for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        message: error.response.data?.message || error.message
      })
    } else if (error.request) {
      console.error('Network Error:', {
        url: error.config?.url,
        message: 'No response received from server'
      })
    }
    return Promise.reject(error)
  }
)

export default api
