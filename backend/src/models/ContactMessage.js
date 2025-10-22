import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      trim: true
    },
    subject: { 
      type: String, 
      required: true, 
      trim: true 
    },
    message: { 
      type: String, 
      required: true, 
      trim: true 
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date
    },
    adminNotes: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true 
  }
)

// Index for faster queries
contactMessageSchema.index({ status: 1, createdAt: -1 })
contactMessageSchema.index({ isRead: 1, createdAt: -1 })

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema)
export default ContactMessage
