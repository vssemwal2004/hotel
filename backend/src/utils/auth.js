import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const isProd = process.env.NODE_ENV === 'production'

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  const domain = process.env.COOKIE_DOMAIN
  
  // In production, use the root domain (no subdomain prefix)
  // This allows cookies to work across the entire domain
  const useDomain = isProd && domain && domain !== 'localhost' ? domain : undefined
  
  // SameSite configuration:
  // - Production: Use 'lax' for same-site requests (frontend and backend on same domain via Nginx)
  // - Development: Use 'lax' for cross-port localhost access
  const sameSite = process.env.COOKIE_SAMESITE || 'lax'
  
  // Secure flag: true in production (HTTPS required), false in development
  const secure = isProd
  
  console.log('Cookie options:', { 
    domain: useDomain || 'none', 
    secure, 
    sameSite, 
    isProd 
  })
  
  return {
    httpOnly: true,
    secure,
    sameSite,
    domain: useDomain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}
