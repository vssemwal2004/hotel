# Krishna Hotel & Restaurant - Booking System

## 🎯 New Professional Booking System

The booking system has been completely redesigned with a **horizontal booking bar** on the landing page for easy, one-click bookings.

### ✨ Features

- **Prominent Booking Bar**: Fixed hotel name with intuitive date/guest selectors
- **Smart Defaults**: Auto-populates today's date and tomorrow for quick booking
- **Time Selection**: Check-in/check-out times included
- **Guest Management**: Separate controls for adults and children
- **Room Selection**: Easy increment/decrement buttons
- **Instant Navigation**: Seamlessly connects to the booking page with all parameters
- **Professional UI**: Matches the hotel's luxury branding with amber/gold theme
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop

### 📍 Location

The booking bar is positioned:
- **On the landing page** (`/home` or `/`)
- **Right after the hero section** with negative margin to overlap slightly
- **Before the About section** for maximum visibility

### 🎨 Design

- Rectangular horizontal layout (as per your image)
- Hotel name: **Krishna Hotel & Restaurant** (fixed, not editable)
- Fields arranged in a row: Check In | Check Out | Rooms | Adults | Children | **Book Now** button
- Premium gradient background (amber-themed)
- Icons from lucide-react for visual clarity
- Hover effects and smooth transitions

### 🔄 Booking Flow

1. **User visits landing page** → sees booking bar prominently displayed
2. **Selects dates, guests, rooms** → all in one place, no scrolling needed
3. **Clicks "Book Now"** → automatically navigates to `/booking` with parameters
4. **Booking page** → shows available room types based on dates
5. **User selects rooms** → adds to cart with guest details
6. **Payment** → completes booking

### 🛠️ Technical Implementation

#### New Component
- `frontend/src/components/BookingBar.jsx` - Main booking widget

#### Modified Files
- `frontend/src/pages/home.jsx` - Added BookingBar component import and placement
- `frontend/src/pages/booking/index.jsx` - Already handles query parameters from URL

#### Backend Integration
- Uses existing `/api/room-types` endpoint for availability
- Uses existing `/api/bookings` endpoint for creating bookings
- No backend changes required

### 🚀 How to Use

#### For Development:

1. **Start Backend**:
   ```powershell
   cd backend
   npm run dev
   ```
   (Make sure MongoDB is running and port 5000 is free)

2. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Visit**: `http://localhost:3000` or `http://localhost:3000/home`

4. **Test Booking**:
   - Adjust dates, guests, and rooms in the booking bar
   - Click "Book Now"
   - Select room types and complete booking

#### For Users:

1. Visit the homepage
2. Use the booking bar to set your preferences
3. Click **Book Now** button
4. Choose your preferred room type
5. Complete payment and booking

### 📱 Responsive Behavior

- **Desktop**: Full horizontal layout with all fields visible
- **Tablet**: Wrapped layout with 2-3 columns
- **Mobile**: Stacked vertical layout, all fields still accessible

### 🎨 Customization

To customize the booking bar, edit `frontend/src/components/BookingBar.jsx`:

- **Colors**: Change gradient classes (currently amber-themed)
- **Default Times**: Modify `checkInTime` and `checkOutTime` initial states
- **Max Values**: Adjust max rooms (currently 10), adults (20), children (10)
- **Icons**: Replace lucide-react icons with your preferred icon library

### ⚙️ Backend Setup (First Time)

1. Copy `.env.example` to `.env`:
   ```powershell
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and set:
   ```env
   PORT=5001  # or 5000 if port is free
   MONGODB_URI=mongodb://127.0.0.1:27017/hotel
   CLIENT_ORIGIN=http://localhost:3000
   JWT_SECRET=your-secret-key
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Start server:
   ```powershell
   npm run dev
   ```

### 🐛 Troubleshooting

**Port 5000 already in use**:
```powershell
# Option 1: Change port in backend/.env
PORT=5001

# Option 2: Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**MongoDB connection failed**:
- Ensure MongoDB is running locally
- Or use MongoDB Atlas connection string in `.env`

**Booking bar not showing**:
- Clear browser cache
- Check browser console for errors
- Verify lucide-react is installed: `npm list lucide-react`

### 📦 Dependencies

All dependencies are already in `package.json`:
- `lucide-react` - Icons
- `next` - Framework
- `axios` - API calls
- `framer-motion` - Animations
- `tailwindcss` - Styling

### 🔐 Git Ignore

Both root and frontend `.gitignore` files are configured to exclude:
- `node_modules/`
- `.next/`
- `.env` and `.env*.local`
- Build artifacts
- IDE/OS files

Safe to push to GitHub - no sensitive data or dependencies will be committed.

---

## 📝 Summary

The new booking system provides a **professional, easy-to-use interface** that eliminates the need for users to navigate through multiple pages. Everything is accessible from the landing page in a beautiful, responsive booking bar that matches your hotel's premium branding.

**Key Benefits**:
- ✅ Faster bookings (1 click instead of multiple)
- ✅ Better user experience
- ✅ Professional appearance
- ✅ Mobile-friendly
- ✅ Integrated with existing backend
- ✅ No breaking changes to existing functionality
