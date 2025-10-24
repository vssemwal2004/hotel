# Worker Role-Based Access Control

## 🔒 Access Control Implementation

### Changes Made:

#### 1. **Login Redirect Logic** (`frontend/src/pages/auth/login.jsx`)

**Regular Login:**
```javascript
// After successful login
if (u?.role === 'admin') {
  router.push('/admin')
} else if (u?.role === 'worker') {
  router.push('/worker')  // ✅ Workers go to /worker
} else {
  // Regular users check for pending bookings or go to /home
  router.push('/home')
}
```

**Google Login:**
- Updated both Google login callbacks to follow same logic
- Workers are redirected to `/worker` portal
- Admins go to `/admin`
- Regular users go to `/home` or booking page

#### 2. **MainLayout Protection** (`frontend/src/layouts/MainLayout.jsx`)

**Added Worker Redirect:**
```javascript
useEffect(() => {
  if (!loading && user && user.role === 'worker') {
    router.replace('/worker')
  }
}, [user, loading, router])
```

**Effect:**
- If a worker tries to access any page using MainLayout (home, rooms, about, contact, etc.)
- They are automatically redirected to `/worker` portal
- Shows loading message: "Redirecting to worker portal..."

#### 3. **Index Page Smart Redirect** (`frontend/src/pages/index.jsx`)

**Role-Based Routing:**
```javascript
if (user) {
  if (user.role === 'admin') {
    router.replace('/admin')
  } else if (user.role === 'worker') {
    router.replace('/worker')  // ✅ Workers always go here
  } else {
    router.replace('/home')
  }
} else {
  router.replace('/home')  // Not logged in
}
```

## 🎯 Access Matrix

| Role | Login Redirect | Can Access /home | Can Access /admin | Can Access /worker |
|------|---------------|------------------|-------------------|-------------------|
| **Admin** | `/admin` | ✅ Yes | ✅ Yes | ✅ Yes |
| **Worker** | `/worker` | ❌ No (redirects to /worker) | ❌ No (redirected) | ✅ Yes |
| **User** | `/home` | ✅ Yes | ❌ No (redirected) | ❌ No (redirected) |
| **Not logged in** | `/home` | ✅ Yes | ❌ No (redirected) | ❌ No (redirected) |

## 🔐 Protected Routes

### Worker-Only Routes:
- `/worker` - Main dashboard
- `/worker/allot` - Room allotment

### Admin-Only Routes:
- `/admin` - Dashboard
- `/admin/users` - User management
- `/admin/bookings` - Booking management
- `/admin/rooms` - Room types
- `/admin/testimonials` - Testimonials
- `/admin/gallery` - Gallery management
- `/admin/messages` - Contact messages

### User Routes (Workers Cannot Access):
- `/home` - Landing page
- `/rooms` - Room browsing
- `/booking` - Booking creation
- `/about` - About page
- `/contact` - Contact page
- `/gallery` - Gallery view
- `/testimonials` - Testimonials view
- `/dashboard/bookings` - User's own bookings
- `/dashboard/profile` - User profile

## 🚀 Workflow Examples

### Worker Login Flow:
1. Worker goes to `/auth/login`
2. Enters credentials: `worker@hotel.com` / `password123`
3. Login successful ✅
4. **Automatically redirected to `/worker`** 🎯
5. Worker sees booking management dashboard
6. If worker tries to navigate to `/home` → Redirected back to `/worker`

### Admin Login Flow:
1. Admin goes to `/auth/login`
2. Enters admin credentials
3. Login successful ✅
4. Redirected to `/admin` dashboard
5. Admin can access both `/admin` and `/worker` portals
6. Admin has full system access

### Regular User Login Flow:
1. User goes to `/auth/login`
2. Enters user credentials
3. Login successful ✅
4. Redirected to `/home`
5. User can browse and book rooms
6. User cannot access `/admin` or `/worker`

## 🛡️ Security Features

1. **Automatic Redirect**: Workers can't manually navigate to user pages
2. **Layout Protection**: MainLayout checks user role on every render
3. **Loading States**: Shows appropriate loading messages during redirects
4. **No Manual Intervention**: Workers don't need to know about restrictions
5. **Seamless UX**: Instant redirect without errors or broken pages

## 📱 Testing Instructions

### Test Worker Access Control:

**Step 1: Create Worker Account**
```
1. Login as Admin
2. Go to /admin/users
3. Click "Add New User"
4. Create worker:
   - Name: Test Worker
   - Email: testworker@hotel.com
   - Password: worker123
   - Role: Worker
5. Save
```

**Step 2: Test Worker Login**
```
1. Logout from admin
2. Go to /auth/login
3. Login with worker credentials
4. ✅ Should redirect to /worker (NOT /home)
```

**Step 3: Test Page Access**
```
1. While logged in as worker, try to manually visit:
   - http://localhost:3000/home → Should redirect to /worker
   - http://localhost:3000/rooms → Should redirect to /worker
   - http://localhost:3000/about → Should redirect to /worker
   - http://localhost:3000/admin → Should show "Unauthorized" or redirect
2. ✅ All should redirect to /worker portal
```

**Step 4: Test Worker Portal Access**
```
1. Visit /worker → ✅ Should work
2. Visit /worker/allot → ✅ Should work
3. Can view all bookings ✅
4. Can mark bookings as paid ✅
5. Can checkout guests ✅
```

## 🎨 Visual Indicators

### Worker Portal Features:
- **Teal/Emerald Color Scheme** (distinct from admin purple/pink)
- **Sidebar Navigation** (similar to admin layout)
- **Dashboard Stats** (total bookings, pending, paid, completed)
- **Search & Filter** (by guest name, email, or booking ID)
- **Status Colors**:
  - 🟡 Pending (Amber)
  - 🟢 Paid (Emerald)
  - 🔵 Completed (Blue)
  - 🔴 Cancelled (Red)

## 🔧 Technical Details

### Files Modified:
1. `frontend/src/pages/auth/login.jsx` - Login redirect logic (2 locations)
2. `frontend/src/layouts/MainLayout.jsx` - Worker redirect protection
3. `frontend/src/pages/index.jsx` - Smart role-based routing

### No Breaking Changes:
- Existing user and admin functionality unchanged
- Only adds worker-specific redirects
- Backward compatible with existing code

## ✅ Summary

Workers now have:
- ✅ Dedicated `/worker` portal access
- ✅ Automatic redirect on login
- ✅ Cannot access user-facing pages
- ✅ Cannot access admin panel
- ✅ Clean, isolated work environment
- ✅ Professional UI matching admin design
- ✅ Mobile-responsive layout
- ✅ Complete booking management tools

The system now properly isolates worker access to only the worker portal, preventing them from accessing customer-facing pages or admin areas! 🎉
