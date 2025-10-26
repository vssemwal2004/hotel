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
  const domain = process.env.COOKIE_DOMAIN
  const useDomain = domain && domain !== 'localhost' ? domain : undefined
  // SameSite: allow cross-site in production (if frontend and API are on different subdomains)
  // Prefer lax locally unless you specifically need cross-port cookies
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax')
  return {
    httpOnly: true,
    // Secure must be true for SameSite=None cookies on HTTPS (production)
    secure: isProd,
    sameSite,
    domain: useDomain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}
