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
  return {
    httpOnly: true,
    secure: isProd, // set true behind HTTPS in production
    sameSite: isProd ? 'none' : 'lax',
    domain: useDomain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}
