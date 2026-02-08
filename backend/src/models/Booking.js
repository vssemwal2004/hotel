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
  basePrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  guests: [guestSchema],
  subtotal: { type: Number, required: true, min: 0 }
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
  total: { type: Number, required: true, min: 0 },
  // status: pending -> paid -> completed | cancelled
  status: { type: String, enum: ['pending','paid','completed','cancelled'], default: 'pending' },
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
