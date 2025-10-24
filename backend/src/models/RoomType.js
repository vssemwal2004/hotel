import mongoose from 'mongoose'

const roomTypeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // Allow any key dynamically
    title: { type: String, required: true },
    // Legacy base price kept for compatibility; prefer prices.roomOnly
    basePrice: { type: Number, required: true, min: 0 },
    prices: {
      roomOnly: { type: Number, min: 0, default: 0 },
      roomBreakfast: { type: Number, min: 0, default: 0 },
      roomBreakfastDinner: { type: Number, min: 0, default: 0 }
    },
      // Capacity per room
      maxAdults: { type: Number, min: 0, default: 2 },
      maxChildren: { type: Number, min: 0, default: 1 },
    extraBedPerPerson: { type: Number, min: 0, default: 0 },
    extraPersonPerNight: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['available', 'blocked', 'maintenance'], default: 'available' },
    amenities: [{ type: String }],
    count: { type: Number, required: true, min: 0 },
    // Gallery photos shown in "See Photos" modal
    photos: [
      new mongoose.Schema({
        publicId: { type: String, required: true },
        url: { type: String, required: true }
      }, { _id: false })
    ],
    // Cover photos used on cards/banners (prefer first two)
    coverPhotos: [
      new mongoose.Schema({
        publicId: { type: String, required: true },
        url: { type: String, required: true }
      }, { _id: false })
    ],
    description: { type: String }
  },
  { timestamps: true }
)

const RoomType = mongoose.model('RoomType', roomTypeSchema)
export default RoomType
