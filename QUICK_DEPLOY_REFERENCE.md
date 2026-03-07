# 🚀 Quick Reference - Production Deployment

## Environment Files to Create on VPS

### Backend: `/path/to/hotel/backend/.env`
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://krishnahotelandrestaurants_db_user:W06EvAPBCbL2g5Qn@cluster0.cq1ie7a.mongodb.net/?appName=Cluster0
JWT_SECRET=SFVSKFHBVJFDSIVBDSLFBVBDSFLBVJBSFLBVBbdfljbdfbljbvlidfjbnldsbnjerlgbergujbnsgjbnergoeihtgojbndsajbna
COOKIE_DOMAIN=hotelkrishnaandrestaurant.com
CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com
ADMIN_EMAIL=krishnahotelandrestaurants@gmail.com
ADMIN_PASSWORD=hotelkrishna
GOOGLE_CLIENT_ID=886136587647-mnv280qmhreodsv40tucfjlbvdt7o9ug.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
CLOUDINARY_CLOUD_NAME=dnws96qum
CLOUDINARY_API_KEY=312118168318182
CLOUDINARY_API_SECRET=BZ1FUanBLdF2PxzMXZ-is95ZGws
RAZORPAY_KEY_ID=rzp_live_RXGJ4qX8HPN7be
RAZORPAY_KEY_SECRET=Hb3rOeBYXZXI7yLMSd6MMetA
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=krishnahotelandrestaurants@gmail.com
SMTP_APP_PASSWORD=qdxj ptox ubct qeyv
```

### Frontend: `/path/to/hotel/frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=886136587647-mnv280qmhreodsv40tucfjlbvdt7o9ug.apps.googleusercontent.com
CLOUDINARY_CLOUD_NAME=dnws96qum
CLOUDINARY_API_KEY=312118168318182
CLOUDINARY_API_SECRET=BZ1FUanBLdF2PxzMXZ-is95ZGws
```

---

## Deployment Commands

### Backend
```bash
cd /path/to/hotel/backend
npm install
pm2 start src/server.js --name hotel-backend --node-args="--experimental-modules"
pm2 save
```

### Frontend
```bash
cd /path/to/hotel/frontend
npm install
npm run build
pm2 start npm --name hotel-frontend -- start
pm2 save
```

### PM2 Auto-Start on Boot
```bash
pm2 startup
pm2 save
```

---

## Testing Commands

```bash
# Backend health (direct)
curl http://127.0.0.1:5000/health

# Backend health (through Nginx)
curl https://hotelkrishnaandrestaurant.com/api/health

# Test login
curl -X POST https://hotelkrishnaandrestaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v

# Check PM2 status
pm2 status

# View logs
pm2 logs hotel-backend --lines 50
pm2 logs hotel-frontend --lines 50

# Restart services
pm2 restart hotel-backend
pm2 restart hotel-frontend

# Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > Credentials
3. Edit OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins:**
   ```
   https://hotelkrishnaandrestaurant.com
   ```

---

## Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| 404 on API | Backend logs | `pm2 logs hotel-backend` |
| CORS error | Environment vars | Verify `CLIENT_ORIGIN` |
| Cookies not working | Cookie settings | Verify `COOKIE_DOMAIN` |
| Google OAuth fails | COOP headers | Already fixed in code |
| localhost in production | Frontend env | Set `NEXT_PUBLIC_API_URL=/api` |

---

## File Changes Made

✅ `backend/src/app.js` - Enhanced CORS + COOP headers  
✅ `backend/src/utils/auth.js` - Fixed cookie config  
✅ `backend/.env.production` - Production template  
✅ `frontend/src/utils/api.js` - Smart API URL detection  
✅ `frontend/.env.production` - Production template  

---

## Critical Settings

**Must be set correctly:**
- ✅ `NODE_ENV=production` (backend)
- ✅ `CLIENT_ORIGIN=https://hotelkrishnaandrestaurant.com` (backend)
- ✅ `COOKIE_DOMAIN=hotelkrishnaandrestaurant.com` (backend)
- ✅ `NEXT_PUBLIC_API_URL=/api` (frontend)

**Google OAuth:**
- ✅ Authorized JavaScript origins updated
- ✅ COOP headers configured in backend

**Nginx:**
- ✅ Proxy `/api/` to `http://127.0.0.1:5000`
- ✅ Proxy `/` to `http://127.0.0.1:3000`
- ✅ Pass cookies correctly

---

📖 **Full Documentation:** [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)  
📋 **Code Changes:** [PRODUCTION_CODE_CHANGES.md](PRODUCTION_CODE_CHANGES.md)
