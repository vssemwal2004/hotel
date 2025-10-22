import mongoose from 'mongoose'

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    roomTypeKey: { type: String, required: true, enum: ['deluxe-valley-view', 'hillside-suite', 'family-luxury-suite'] },
    
    // Pricing
    basePrice: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    taxesAndFees: { type: Number, min: 0, default: 0 },
    
    // Amenities and Benefits
    amenities: [{
      icon: { type: String },
      title: { type: String, required: true },
      description: { type: String }
    }],
    
    // Discounts
    discounts: [{
      category: { type: String, required: true }, // 'food', 'spa', 'beverage', etc.
      percentage: { type: Number, min: 0, max: 100 },
      description: { type: String }
    }],
    
    // Additional Info
    isRefundable: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    validFrom: { type: Date },
    validUntil: { type: Date },
    
    // Display order
    priority: { type: Number, default: 0 },
    
    // Images
    images: [{ type: String }]
  },
  { timestamps: true }
)

const Package = mongoose.model('Package', packageSchema)
export default Package
