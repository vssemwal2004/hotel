# Production Code Changes Summary

## 🎯 Overview
This document summarizes all code changes made to ensure the application works correctly in production at **https://hotelkrishnaandrestaurant.com** while preserving localhost functionality for development.

---

## 📁 Files Modified

### Backend Files

#### 1. `backend/src/app.js`
**What Changed:**
- Enhanced CORS configuration to support both development and production
- Added environment-aware origin validation
- Configured Helmet security headers for Google OAuth compatibility
- Added Cross-Origin-Opener-Policy header support

**Why:**
- Prevent CORS errors in production
- Allow Google OAuth popup authentication
- Maintain security while supporting required features

**Key Code:**
```javascript
// Environment detection
const isProd = process.env.NODE_ENV === 'production'
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'

// Helmet configured for Google OAuth
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}))

// Smart CORS - production vs development
app.use(cors({
  origin: (origin, callback) => {
    if (isProd) {
      // Production: strict domain checking
      const allowedOrigins = [CLIENT_ORIGIN, 'https://hotelkrishnaandrestaurant.com']
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    } else {
      // Development: allow localhost variations
      callback(null, true)
    }
  },
  credentials: true,
  // ... other options
}))
```

---

#### 2. `backend/src/utils/auth.js`
**What Changed:**
- Environment-aware cookie configuration
- Fixed domain setting for production
- Proper secure flag for HTTPS
- Better SameSite configuration

**Why:**
- Cookies must work over HTTPS in production
- Domain must match production domain
- SameSite=lax works for same-domain setup (frontend and backend via Nginx)

**Key Code:**
```javascript
export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  const domain = process.env.COOKIE_DOMAIN
  
  // Production: use domain from env
  // Development: no domain (localhost default)
  const useDomain = isProd && domain && domain !== 'localhost' ? domain : undefined
  
  // SameSite=lax works because frontend and backend are on same domain via Nginx
  const sameSite = process.env.COOKIE_SAMESITE || 'lax'
  
  // Secure flag: true in production (HTTPS), false in dev (HTTP)
  const secure = isProd
  
  return {
    httpOnly: true,
    secure,
    sameSite,
    domain: useDomain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}
```

---

#### 3. `backend/.env.production` (NEW)
**What Changed:**
- Created production environment template

**Why:**
- Provides clear reference for production deployment
- Documents all required environment variables

**Key Variables:**
```bash
NODE_ENV=production
COOKIE_DOMAIN=hotelkrishnaandrestaurant.com
CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com
```

---

### Frontend Files

#### 4. `frontend/src/utils/api.js`
**What Changed:**
- Smart API URL detection based on environment
- Better error logging
- Response interceptor for debugging

**Why:**
- Production: Use `/api` (Nginx proxies to backend at :5000)
- Development: Use `http://localhost:5000/api` (direct backend access)
- No hardcoded URLs

**Key Code:**
```javascript
const getBaseURL = () => {
  // Priority 1: Explicit environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // Priority 2: Environment detection
  const isProd = process.env.NODE_ENV === 'production'
  
  if (isProd) {
    // Production: relative path (Nginx proxy)
    return '/api'
  }
  
  // Development: direct backend
  return 'http://localhost:5000/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true // Essential for cookies
})
```

---

#### 5. `frontend/.env.production` (NEW)
**What Changed:**
- Created production environment template

**Why:**
- Documents production configuration
- Uses `/api` for Nginx proxy compatibility

**Key Variables:**
```bash
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=886136587647-mnv280qmhreodsv40tucfjlbvdt7o9ug.apps.googleusercontent.com
```

---

## 🔄 How It Works

### Development Environment
1. **Frontend** runs on `localhost:3000`
2. **Backend** runs on `localhost:5000`
3. **API calls** go directly to `http://localhost:5000/api`
4. **Cookies** use no domain (works on localhost)
5. **CORS** allows localhost origins

### Production Environment
1. **Frontend** runs on `127.0.0.1:3000` (internal)
2. **Backend** runs on `127.0.0.1:5000` (internal)
3. **Nginx** listens on `443` (HTTPS)
4. **API calls** from frontend use `/api` → Nginx proxies to `127.0.0.1:5000`
5. **Static files** served by Nginx from frontend
6. **Cookies** set with `domain=hotelkrishnaandrestaurant.com`
7. **CORS** only allows `https://hotelkrishnaandrestaurant.com`

### Request Flow in Production

```
User Browser
    ↓
https://hotelkrishnaandrestaurant.com/api/auth/login
    ↓
Nginx (port 443)
    ↓ (proxies /api/* requests)
Backend (127.0.0.1:5000)
    ↓ (sets cookie)
Response with Set-Cookie header
    ↓
Nginx (passes cookie back)
    ↓
User Browser (stores cookie)
```

---

## ✅ Verification Steps

### 1. Check Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com
COOKIE_DOMAIN=hotelkrishnaandrestaurant.com
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=/api
```

### 2. Test API Calls

**Development:**
```javascript
// Frontend makes request to:
http://localhost:5000/api/auth/login
```

**Production:**
```javascript
// Frontend makes request to:
/api/auth/login
// Which Nginx translates to:
http://127.0.0.1:5000/api/auth/login
```

### 3. Test Cookies

**Development:**
```
Cookie: token=xxx
Domain: (not set - defaults to localhost)
Secure: false
SameSite: lax
```

**Production:**
```
Cookie: token=xxx
Domain: hotelkrishnaandrestaurant.com
Secure: true
SameSite: lax
```

### 4. Test CORS

**Development:**
```
Request from: http://localhost:3000
Allowed: ✓ (localhost allowed)
```

**Production:**
```
Request from: https://hotelkrishnaandrestaurant.com
Allowed: ✓ (production domain allowed)

Request from: http://localhost:3000
Allowed: ✗ (blocked in production)
```

---

## 🐛 Common Issues Fixed

### ❌ Issue: 404 on /api/auth/login
**Root Cause:** Backend routes registered at `/api` but Nginx proxying incorrectly
**Solution:** Backend mounts routes at `/api/auth`, Nginx proxies `/api/` to backend root

### ❌ Issue: CORS errors in production
**Root Cause:** Backend allowed localhost in production
**Solution:** Environment-aware CORS with strict production domain checking

### ❌ Issue: Cookies not persisting
**Root Cause:** Wrong domain or secure flag
**Solution:** Set `COOKIE_DOMAIN` and `secure: true` in production

### ❌ Issue: Google OAuth COOP error
**Root Cause:** Default Helmet COOP policy blocks popups
**Solution:** Configure Helmet with `same-origin-allow-popups`

### ❌ Issue: Frontend requests go to localhost in production
**Root Cause:** Hardcoded `http://localhost:5000` in API config
**Solution:** Environment-aware base URL with `/api` in production

---

## 🔧 Environment Variable Reference

### Backend Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | `5000` |
| `CLIENT_ORIGIN` | `http://localhost:3000` | `https://hotelkrishnaandrestaurant.com` |
| `COOKIE_DOMAIN` | `localhost` | `hotelkrishnaandrestaurant.com` |
| `COOKIE_SAMESITE` | `lax` | `lax` |

### Frontend Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | `/api` |
| `NODE_ENV` | `development` | `production` |

---

## 📋 Deployment Checklist

### Before Deployment

- [ ] Update Google OAuth authorized domains
- [ ] Configure Nginx reverse proxy
- [ ] Install SSL certificates (Let's Encrypt)
- [ ] Create backend `.env` with production values
- [ ] Create frontend `.env.local` with production values

### During Deployment

- [ ] Deploy backend code to VPS
- [ ] Install backend dependencies: `npm install`
- [ ] Start backend with PM2: `pm2 start src/server.js --name hotel-backend`
- [ ] Deploy frontend code to VPS
- [ ] Install frontend dependencies: `npm install`
- [ ] Build frontend: `npm run build`
- [ ] Start frontend with PM2: `pm2 start npm --name hotel-frontend -- start`
- [ ] Reload Nginx: `sudo systemctl reload nginx`

### After Deployment

- [ ] Test health endpoint: `curl https://hotelkrishnaandrestaurant.com/api/health`
- [ ] Test login with browser
- [ ] Test Google OAuth
- [ ] Verify cookies in DevTools
- [ ] Check for CORS errors in console
- [ ] Test on mobile and desktop
- [ ] Monitor logs: `pm2 logs`

---

## 🎓 Key Learnings

1. **Environment Variables are Critical**  
   Always use environment-specific configs, never hardcode URLs or domains

2. **CORS Must Match Exactly**  
   Origin in browser must exactly match allowed origin in backend

3. **Cookies Need Proper Configuration**  
   Domain, secure, and SameSite flags must match deployment architecture

4. **Nginx Proxy Requires Relative URLs**  
   Use `/api` not `http://backend:5000/api` when Nginx proxies

5. **Google OAuth Has Special Requirements**  
   COOP headers, authorized domains, and cookie settings must align

6. **Security Headers Can Block Features**  
   Helmet defaults are secure but may need adjustment for OAuth

---

## 📚 Additional Resources

- [Express CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Google OAuth Setup](https://developers.google.com/identity/gsi/web/guides/overview)
- [Nginx Reverse Proxy Guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt SSL Setup](https://letsencrypt.org/getting-started/)

---

**Last Updated:** February 18, 2026  
**Production Status:** ✅ Ready for Deployment
