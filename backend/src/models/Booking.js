import mongoose from 'mongoose'

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
  total: { type: Number, required: true, min: 0 },
  // status: pending -> paid -> completed | cancelled
  status: { type: String, enum: ['pending','paid','completed','cancelled'], default: 'pending' }
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
