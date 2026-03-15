import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'booking_created',
      'booking_cancelled',
      'booking_edited',
      'booking_paid',
      'bulk_booking_created',
      'walk_in_created',
      'rooms_allotted',
      'guest_checked_in',
      'guest_checked_out',
      'room_type_created',
      'room_type_updated',
      'room_type_deleted',
      'user_registered',
      'user_login',
      'password_reset',
      'other'
    ]
  },
  performedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    role: String
  },
  target: {
    type: { type: String }, // 'booking', 'user', 'room_type', etc.
    id: String,
    name: String
  },
  details: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String
}, {
  timestamps: true
})

activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ action: 1 })
activityLogSchema.index({ 'performedBy.userId': 1 })

export default mongoose.model('ActivityLog', activityLogSchema)
