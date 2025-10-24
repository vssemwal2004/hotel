import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Gallery Image'
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique order
gallerySchema.index({ order: 1 }, { unique: true });

export default mongoose.model('Gallery', gallerySchema);
