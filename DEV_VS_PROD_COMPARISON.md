# Development vs Production Configuration

## Environment Comparison Table

| Setting | Development (Local) | Production (VPS) |
|---------|-------------------|------------------|
| **Frontend URL** | http://localhost:3000 | https://hotelkrishnaandrestaurant.com |
| **Backend URL** | http://localhost:5000 | https://hotelkrishnaandrestaurant.com/api |
| **Frontend API Calls** | http://localhost:5000/api | /api (Nginx proxy) |
| **NODE_ENV** | development | production |
| **SSL/HTTPS** | ❌ HTTP only | ✅ HTTPS required |
| **Cookie Domain** | localhost (default) | hotelkrishnaandrestaurant.com |
| **Cookie Secure Flag** | false | true |
| **CORS Origin** | http://localhost:3000 | https://hotelkrishnaandrestaurant.com |

---

## Backend Configuration Differences

### Development (.env)
```bash
NODE_ENV=development
PORT=5000
COOKIE_DOMAIN=localhost
CLIENT_ORIGIN=http://localhost:3000
```

**Behavior:**
- CORS allows all localhost variations
- Cookies without domain (works on localhost)
- Secure flag: false (HTTP)
- Relaxed security for debugging

### Production (.env)
```bash
NODE_ENV=production
PORT=5000
COOKIE_DOMAIN=hotelkrishnaandrestaurant.com
CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com
```

**Behavior:**
- CORS strictly validates production domain only
- Cookies with specific domain
- Secure flag: true (HTTPS required)
- Strict security

---

## Frontend Configuration Differences

### Development (.env)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Behavior:**
- Direct API calls to backend server
- No proxy involved
- Full URL with protocol and port

### Production (.env.local)
```bash
NEXT_PUBLIC_API_URL=/api
```

**Behavior:**
- Relative URL (no protocol/domain)
- Nginx proxies to backend
- Same-origin requests

---

## Request Flow Comparison

### Development Flow
```
Browser
  ↓ http://localhost:3000/
Next.js Dev Server (3000)
  ↓ Axios request: http://localhost:5000/api/auth/login
Express Server (5000)
  ↓ Response with cookie (domain: none, secure: false)
Browser (stores cookie for localhost)
```

### Production Flow
```
Browser
  ↓ https://hotelkrishnaandrestaurant.com/
Nginx (443)
  ↓ Proxies to 127.0.0.1:3000
Next.js Server (3000)
  ↓ Axios request: /api/auth/login (relative)
Nginx (443)
  ↓ Proxies /api/* to 127.0.0.1:5000
Express Server (5000)
  ↓ Response with cookie (domain: hotelkrishnaandrestaurant.com, secure: true)
Nginx (443)
  ↓ Passes cookie back
Browser (stores cookie for hotelkrishnaandrestaurant.com)
```

---

## Code Behavior Differences

### app.js CORS Configuration

**Development:**
```javascript
// Allows localhost variations
origin: (origin, callback) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000'
  ]
  callback(null, true) // Permissive for dev
}
```

**Production:**
```javascript
// Strict domain checking
origin: (origin, callback) => {
  const allowedOrigins = [
    'https://hotelkrishnaandrestaurant.com'
  ]
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
```

### utils/auth.js Cookie Options

**Development:**
```javascript
{
  httpOnly: true,
  secure: false,        // HTTP allowed
  sameSite: 'lax',
  domain: undefined,    // Defaults to localhost
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

**Production:**
```javascript
{
  httpOnly: true,
  secure: true,         // HTTPS required
  sameSite: 'lax',
  domain: 'hotelkrishnaandrestaurant.com',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}
```

### utils/api.js Base URL

**Development:**
```javascript
const baseURL = 'http://localhost:5000/api'
// Direct connection to backend
```

**Production:**
```javascript
const baseURL = '/api'
// Relative URL, Nginx handles routing
```

---

## Testing Scenarios

### Test 1: Login Request

**Development:**
```bash
# Frontend makes request:
POST http://localhost:5000/api/auth/login

# Backend receives:
Origin: http://localhost:3000
Host: localhost:5000

# Backend responds:
Set-Cookie: token=xxx; Path=/; HttpOnly; SameSite=Lax
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

**Production:**
```bash
# Frontend makes request:
POST /api/auth/login
# Browser sends to: https://hotelkrishnaandrestaurant.com/api/auth/login
# Nginx proxies to: http://127.0.0.1:5000/api/auth/login

# Backend receives:
Origin: https://hotelkrishnaandrestaurant.com
Host: hotelkrishnaandrestaurant.com
X-Forwarded-Proto: https
X-Real-IP: client_ip

# Backend responds:
Set-Cookie: token=xxx; Domain=hotelkrishnaandrestaurant.com; Path=/; Secure; HttpOnly; SameSite=Lax
Access-Control-Allow-Origin: https://hotelkrishnaandrestaurant.com
Access-Control-Allow-Credentials: true
```

### Test 2: Authenticated Request

**Development:**
```bash
# Browser includes:
Cookie: token=xxx
# Request goes to: http://localhost:5000/api/auth/me
```

**Production:**
```bash
# Browser includes:
Cookie: token=xxx
# Request goes to: /api/auth/me
# Nginx proxies to: http://127.0.0.1:5000/api/auth/me
# Nginx forwards: Cookie: token=xxx
```

---

## Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct |
|-----------|----------|
| Using `CLIENT_ORIGIN=http://localhost:3000` in production | Use `CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com` |
| Using `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in production | Use `NEXT_PUBLIC_API_URL=/api` |
| Forgetting to set `NODE_ENV=production` | Always set `NODE_ENV=production` on VPS |
| Setting `COOKIE_DOMAIN=localhost` in production | Use `COOKIE_DOMAIN=hotelkrishnaandrestaurant.com` |
| Not rebuilding frontend after env changes | Always run `npm run build` after env changes |
| Testing with localhost after deploying | Always test with actual domain |

---

## Environment Variable Priority

### Backend
1. ✅ **Use:** Environment variables from `.env` file
2. ✅ **Override:** System environment variables (if set)
3. ✅ **Default:** Fallback values in code

### Frontend (Next.js)
1. ✅ **Build time:** Variables baked into build
2. ✅ **Must rebuild:** After changing env vars
3. ✅ **NEXT_PUBLIC_* only:** Available in browser

**Important:** Changing frontend `.env.local` requires rebuild!

```bash
# After changing frontend env:
npm run build
pm2 restart hotel-frontend
```

---

## Switching Between Environments

### From Development to Production

1. **Backend:**
   ```bash
   # Copy production env
   cp .env.production .env
   
   # Verify critical vars
   grep NODE_ENV .env            # Should be: production
   grep CLIENT_ORIGIN .env       # Should be: https://hotelkrishnaandrestaurant.com
   grep COOKIE_DOMAIN .env       # Should be: hotelkrishnaandrestaurant.com
   
   # Restart
   pm2 restart hotel-backend
   ```

2. **Frontend:**
   ```bash
   # Copy production env
   cp .env.production .env.local
   
   # Verify
   grep NEXT_PUBLIC_API_URL .env.local  # Should be: /api
   
   # Rebuild and restart
   npm run build
   pm2 restart hotel-frontend
   ```

3. **Verify:**
   ```bash
   # Should return production settings
   pm2 env hotel-backend | grep NODE_ENV
   
   # Test API
   curl https://hotelkrishnaandrestaurant.com/api/health
   ```

### From Production to Development

1. **Backend:**
   ```bash
   # Use development env
   cp .env .env.production.backup  # Backup first
   # Edit .env for development
   
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:3000
   COOKIE_DOMAIN=localhost
   
   # Restart
   npm run dev  # or pm2 restart
   ```

2. **Frontend:**
   ```bash
   # Use development env
   cp .env.local .env.production.backup  # Backup first
   # Edit .env.local for development
   
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   
   # Restart dev server
   npm run dev
   ```

---

## Checklist: Ready for Production?

### Backend
- [ ] `.env` has `NODE_ENV=production`
- [ ] `.env` has correct `CLIENT_ORIGIN` (https://...)
- [ ] `.env` has correct `COOKIE_DOMAIN`
- [ ] MONGODB_URI is production database
- [ ] JWT_SECRET is strong and unique
- [ ] Google OAuth credentials are production ones
- [ ] Running via PM2, not `npm run dev`

### Frontend
- [ ] `.env.local` has `NEXT_PUBLIC_API_URL=/api`
- [ ] Built with `npm run build`
- [ ] Running `npm start`, not `npm run dev`
- [ ] Running via PM2
- [ ] No console errors about localhost

### Infrastructure
- [ ] Nginx configured and running
- [ ] SSL certificates installed and valid
- [ ] Port 443 open in firewall
- [ ] DNS points to VPS IP
- [ ] Google OAuth authorized origins updated

### Testing
- [ ] Can access: https://hotelkrishnaandrestaurant.com
- [ ] Can login with email/password
- [ ] Can login with Google OAuth
- [ ] Cookies persist after refresh
- [ ] No 404 errors on API calls
- [ ] No CORS errors in console

---

## Quick Debug Commands

```bash
# Check what environment backend thinks it's in
pm2 logs hotel-backend | grep "Environment:"

# Check what CLIENT_ORIGIN is being used
pm2 logs hotel-backend | grep "CLIENT_ORIGIN:"

# Check what API URL frontend is using
pm2 logs hotel-frontend | grep "API Configuration:"

# Watch for CORS errors
pm2 logs hotel-backend | grep "CORS"

# Check cookie settings
pm2 logs hotel-backend | grep "Cookie options:"
```

---

**Summary:** The key to smooth deployment is ensuring environment variables match the deployment environment. Development uses localhost, production uses the actual domain. Always verify settings after deployment!
