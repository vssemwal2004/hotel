# Production Deployment Guide
## Hotel Krishna & Restaurant - VPS Deployment

This guide covers deploying the full-stack application to your VPS at **https://hotelkrishnaandrestaurant.com**

---

## 🎯 Overview

**Tech Stack:**
- Frontend: Next.js (port 3000)
- Backend: Node.js + Express (ESM) (port 5000)
- Reverse Proxy: Nginx
- SSL: Let's Encrypt
- Domain: hotelkrishnaandrestaurant.com

**Key Changes Made:**
1. ✅ Backend CORS configured for production domain
2. ✅ Cookie settings fixed for HTTPS
3. ✅ Google OAuth COOP headers added
4. ✅ Frontend API calls route through Nginx
5. ✅ Environment-based configuration (local vs production)

---

## 📋 Pre-Deployment Checklist

### 1. Google OAuth Configuration

**Important:** Update your Google Cloud Console OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add authorized JavaScript origins:
   ```
   https://hotelkrishnaandrestaurant.com
   ```
6. Add authorized redirect URIs (if using redirect flow):
   ```
   https://hotelkrishnaandrestaurant.com
   https://hotelkrishnaandrestaurant.com/auth/login
   https://hotelkrishnaandrestaurant.com/auth/register
   ```

### 2. Verify Nginx Configuration

Your Nginx config should look like this:

```nginx
server {
    listen 80;
    server_name hotelkrishnaandrestaurant.com www.hotelkrishnaandrestaurant.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hotelkrishnaandrestaurant.com www.hotelkrishnaandrestaurant.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/hotelkrishnaandrestaurant.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hotelkrishnaandrestaurant.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important: Pass cookies correctly
        proxy_pass_header Set-Cookie;
        proxy_set_header Cookie $http_cookie;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Test Nginx config:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 Backend Deployment

### 1. Navigate to Backend Directory
```bash
cd /path/to/hotel/backend
```

### 2. Create Production Environment File

Copy the production template:
```bash
cp .env.production .env
```

Or create `.env` with these values:
```bash
# Server
PORT=5000
NODE_ENV=production

# Database (use your MongoDB URI)
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.xxx.mongodb.net/?appName=Cluster0

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Production Domain Configuration
COOKIE_DOMAIN=hotelkrishnaandrestaurant.com
CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com

# Admin Account
ADMIN_EMAIL=krishnahotelandrestaurants@gmail.com
ADMIN_PASSWORD=your_admin_password

# Google OAuth
GOOGLE_CLIENT_ID=886136587647-mnv280qmhreodsv40tucfjlbvdt7o9ug.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Cloudinary
CLOUDINARY_CLOUD_NAME=dnws96qum
CLOUDINARY_API_KEY=312118168318182
CLOUDINARY_API_SECRET=BZ1FUanBLdF2PxzMXZ-is95ZGws

# Razorpay
RAZORPAY_KEY_ID=rzp_live_RXGJ4qX8HPN7be
RAZORPAY_KEY_SECRET=Hb3rOeBYXZXI7yLMSd6MMetA

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=krishnahotelandrestaurants@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Backend with PM2

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the backend
pm2 start src/server.js --name hotel-backend --node-args="--experimental-modules"

# Save PM2 process list
pm2 save

# Configure PM2 to start on system boot
pm2 startup
```

### 5. Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hotel-backend

# Test backend health
curl http://127.0.0.1:5000/health
curl https://hotelkrishnaandrestaurant.com/api/health
```

---

## 🎨 Frontend Deployment

### 1. Navigate to Frontend Directory
```bash
cd /path/to/hotel/frontend
```

### 2. Create Production Environment File

Copy the production template:
```bash
cp .env.production .env.local
```

Or create `.env.local` with these values:
```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=886136587647-mnv280qmhreodsv40tucfjlbvdt7o9ug.apps.googleusercontent.com

# API URL - Use relative path for Nginx proxy
NEXT_PUBLIC_API_URL=/api

# Cloudinary (if needed)
CLOUDINARY_CLOUD_NAME=dnws96qum
CLOUDINARY_API_KEY=312118168318182
CLOUDINARY_API_SECRET=BZ1FUanBLdF2PxzMXZ-is95ZGws
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Build for Production
```bash
npm run build
```

### 5. Start Frontend with PM2

```bash
# Start the frontend
pm2 start npm --name hotel-frontend -- start

# Or if using a custom port:
PORT=3000 pm2 start npm --name hotel-frontend -- start

# Save PM2 configuration
pm2 save
```

### 6. Verify Frontend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hotel-frontend

# Test frontend
curl http://127.0.0.1:3000
curl https://hotelkrishnaandrestaurant.com
```

---

## 🧪 Testing the Deployment

### 1. Test Health Endpoints

```bash
# Backend health (direct)
curl http://127.0.0.1:5000/health

# Backend health (through Nginx)
curl https://hotelkrishnaandrestaurant.com/api/health

# Frontend (through Nginx)
curl https://hotelkrishnaandrestaurant.com
```

### 2. Test Login API

```bash
curl -X POST https://hotelkrishnaandrestaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v
```

Expected: 200 OK or 401 Unauthorized (not 404)

### 3. Test Authentication

1. Open browser to: https://hotelkrishnaandrestaurant.com
2. Try email/password login
3. Try Google OAuth login
4. Check browser DevTools:
   - Network tab: verify `/api/auth/login` returns 200
   - Application tab: verify cookies are set
   - Console: no CORS errors

### 4. Test Cookie Persistence

1. Login successfully
2. Refresh the page
3. Verify you remain logged in

---

## 🔍 Troubleshooting

### Issue: 404 on /api/auth/login

**Cause:** Backend routes not mounted correctly or Nginx not proxying

**Fix:**
1. Check backend logs: `pm2 logs hotel-backend`
2. Verify route is mounted in backend/src/app.js
3. Test direct backend: `curl http://127.0.0.1:5000/api/auth/login`
4. Check Nginx config and reload: `sudo nginx -t && sudo systemctl reload nginx`

### Issue: CORS Errors

**Cause:** Origin mismatch or credentials not enabled

**Fix:**
1. Verify `.env` has: `CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com`
2. Restart backend: `pm2 restart hotel-backend`
3. Check browser shows correct origin in request headers
4. Verify backend logs show correct CLIENT_ORIGIN

### Issue: Cookies Not Working

**Cause:** Domain mismatch or secure flag issues

**Fix:**
1. Verify `.env` has: `COOKIE_DOMAIN=hotelkrishnaandrestaurant.com`
2. Ensure `NODE_ENV=production` is set
3. Check browser DevTools > Application > Cookies
4. Cookie should have:
   - Domain: `.hotelkrishnaandrestaurant.com`
   - Secure: ✓
   - HttpOnly: ✓
   - SameSite: Lax

### Issue: Google OAuth COOP Error

**Cause:** Cross-Origin-Opener-Policy blocking popup

**Fix:**
- Already fixed in backend app.js with helmet configuration
- Verify response headers include: `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- Test: `curl -I https://hotelkrishnaandrestaurant.com/api/auth/google`

### Issue: API Requests Go to Localhost

**Cause:** Wrong API URL in frontend

**Fix:**
1. Verify `.env.local` has: `NEXT_PUBLIC_API_URL=/api`
2. Rebuild frontend: `npm run build`
3. Restart frontend: `pm2 restart hotel-frontend`
4. Clear browser cache

---

## 📊 Monitoring

### View Logs

```bash
# Backend logs
pm2 logs hotel-backend --lines 100

# Frontend logs  
pm2 logs hotel-frontend --lines 100

# All logs
pm2 logs --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Process Status

```bash
# PM2 status
pm2 status

# Restart services
pm2 restart hotel-backend
pm2 restart hotel-frontend

# Stop services
pm2 stop hotel-backend
pm2 stop hotel-frontend
```

---

## 🔄 Updates and Maintenance

### Updating Backend

```bash
cd /path/to/hotel/backend
git pull origin main  # or copy new files
npm install
pm2 restart hotel-backend
pm2 logs hotel-backend
```

### Updating Frontend

```bash
cd /path/to/hotel/frontend
git pull origin main  # or copy new files
npm install
npm run build
pm2 restart hotel-frontend
pm2 logs hotel-frontend
```

### SSL Certificate Renewal

Let's Encrypt certificates auto-renew, but verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew

# Reload Nginx after renewal
sudo systemctl reload nginx
```

---

## 📝 Summary of Changes Made

### Backend Changes

1. **app.js** - Enhanced CORS and security headers:
   - Environment-aware CORS configuration
   - Google OAuth compatible headers (COOP)
   - Production domain validation
   - Better error logging

2. **utils/auth.js** - Fixed cookie configuration:
   - Production domain support
   - Proper secure flag for HTTPS
   - SameSite: lax for same-domain setup

3. **Environment Files**:
   - Created `.env.production` template
   - Added production-specific settings

### Frontend Changes

1. **utils/api.js** - Smart API URL detection:
   - Environment-based URL selection
   - Production: `/api` (relative, Nginx proxy)
   - Development: `http://localhost:5000/api`
   - Better error logging

2. **Environment Files**:
   - Created `.env.production` template
   - Uses `/api` for production

### Why These Changes Work

1. **No Localhost in Production**: Frontend uses `/api` which Nginx proxies to backend
2. **Cookies Work**: Domain set to `hotelkrishnaandrestaurant.com`, secure flag enabled
3. **CORS Fixed**: Backend only allows production domain in production
4. **Google OAuth Works**: COOP headers allow popup authentication
5. **SSL Compatible**: All secure flags and HTTPS-only settings enabled

---

## ✅ Production Checklist

- [ ] Google OAuth configured with production domain
- [ ] Nginx configured and tested
- [ ] SSL certificates installed and valid
- [ ] Backend `.env` file created with production settings
- [ ] Frontend `.env.local` file created
- [ ] Backend running on PM2 (port 5000)
- [ ] Frontend running on PM2 (port 3000)
- [ ] Health endpoints accessible via HTTPS
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Cookies persist after page refresh
- [ ] No CORS errors in browser console
- [ ] PM2 configured to start on boot

---

## 🆘 Support

If issues persist:

1. Check all logs: `pm2 logs`
2. Verify environment variables are loaded
3. Test each component individually (backend, frontend, Nginx)
4. Check Google Cloud Console OAuth settings
5. Verify DNS points to your VPS IP
6. Ensure ports 80 and 443 are open in firewall

**Common Command Reference:**
```bash
# Restart everything
pm2 restart all
sudo systemctl reload nginx

# View environment
pm2 env hotel-backend
pm2 env hotel-frontend

# Monitor in real-time
pm2 monit
```

---

**Deployment Date:** February 18, 2026  
**Production URL:** https://hotelkrishnaandrestaurant.com  
**Status:** Ready for Production ✅
