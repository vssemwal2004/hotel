import mongoose from 'mongoose'

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    floor: { type: String, required: true },
    type: { type: String, required: true }, // Deluxe / Hill view / Family
    capacity: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, required: true, min: 0 }
    },
    basePrice: { type: Number, required: true, min: 0 },
    seasonalDiscount: { type: Number, default: 0, min: 0, max: 100 },
    amenities: [{ type: String }],
  photos: [{ type: String }], // Cloudinary URLs
    status: { type: String, enum: ['available', 'blocked', 'maintenance'], default: 'available' },
    description: { type: String }
  },
  { timestamps: true }
)

const Room = mongoose.model('Room', roomSchema)
export default Room
