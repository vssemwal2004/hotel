import mongoose from 'mongoose'

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  age: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['adult','child'], required: true }
}, { _id: false })

const itemSchema = new mongoose.Schema({
  roomTypeKey: { type: String, required: true },
  title: { type: String, required: true },
  packageType: { type: String, enum: ['roomOnly', 'roomBreakfast', 'roomBreakfastDinner'], default: 'roomOnly' },
  basePrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  guests: [guestSchema],
  subtotal: { type: Number, required: true, min: 0 },
  // Room numbers allotted to this item (worker assigns during check-in)
  allottedRoomNumbers: [{ type: String }]
}, { _id: false })

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  fullDay: { type: Boolean, default: false },
  nights: { type: Number, required: true, min: 1 },
  items: [itemSchema],
  subtotal: { type: Number, min: 0 }, // Pre-tax amount
  gstPercentage: { type: Number, min: 0, default: 0 }, // GST % applied
  gstAmount: { type: Number, min: 0, default: 0 }, // GST amount
  // Negotiated discount applied after tax (admin/worker flow)
  negotiatedDiscount: { type: Number, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  // Offline/advance payments (amount received so far)
  amountPaid: { type: Number, min: 0, default: 0 },
  // For count-based room types, whether we have reserved inventory (decremented count)
  inventoryCommitted: { type: Boolean, default: false },
  // Operational status: whether guest has arrived and been checked in
  checkedInAt: { type: Date, default: null },
  checkedInBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  // status: pending -> paid -> completed | cancelled
  status: { type: String, enum: ['pending','paid','completed','cancelled'], default: 'pending' },
  // Cancellation metadata (used for worker/admin cancel + undo-cancel)
  statusBeforeCancel: { type: String, enum: ['pending','paid', null], default: null },
  cancelledAt: { type: Date, default: null },
  cancelledBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  payment: {
    provider: { type: String },
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    status: { type: String, enum: ['created','paid','refunded','failed'], default: 'created' }
  }
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
