import mongoose from 'mongoose'

const roomTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, enum: ['deluxe-valley-view', 'hillside-suite', 'family-luxury-suite'], unique: true },
    title: { type: String, required: true },
    // Legacy base price kept for compatibility; prefer prices.roomOnly
    basePrice: { type: Number, required: true, min: 0 },
    prices: {
      roomOnly: { type: Number, min: 0, default: 0 },
      roomBreakfast: { type: Number, min: 0, default: 0 },
      roomBreakfastDinner: { type: Number, min: 0, default: 0 }
    },
    extraBedPerPerson: { type: Number, min: 0, default: 0 },
    extraPersonPerNight: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['available', 'blocked', 'maintenance'], default: 'available' },
    amenities: [{ type: String }],
    count: { type: Number, required: true, min: 0 },
    photos: [{ type: String }],
    description: { type: String }
  },
  { timestamps: true }
)

const RoomType = mongoose.model('RoomType', roomTypeSchema)
export default RoomType
