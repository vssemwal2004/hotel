import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      lowercase: true, 
      trim: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    message: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 500 
    },
    role: { 
      type: String, 
      default: 'Guest',
      trim: true 
    },
    isApproved: { 
      type: Boolean, 
      default: false 
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    }
  },
  { 
    timestamps: true 
  }
)

// Index for faster queries
testimonialSchema.index({ isApproved: 1, rating: -1, createdAt: -1 })

const Testimonial = mongoose.model('Testimonial', testimonialSchema)
export default Testimonial
