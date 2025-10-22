import cron from 'node-cron'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'

function getBookingEnd(booking) {
  const start = new Date(booking.checkIn)
  if (booking.checkOut) return new Date(booking.checkOut)
  // Fallback: use nights to derive end
  const ms = 24 * 60 * 60 * 1000
  return new Date(start.getTime() + (booking.nights || 1) * ms)
}

async function processCompletedBookings(now = new Date()) {
  // Find bookings whose stay ended and are still marked as 'paid'
  const candidates = await Booking.find({ status: 'paid' })
  for (const b of candidates) {
    try {
      const end = getBookingEnd(b)
      if (!end || isNaN(end.getTime())) continue
      if (end > now) continue // not yet finished

      // Restore counts for each item
      for (const it of b.items) {
        await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: it.quantity } })
      }

      // Mark booking as completed to avoid double-processing
      b.status = 'completed'
      await b.save()
    } catch (e) {
      // Continue processing other bookings
      console.error('availabilityReset: error processing booking', b._id, e)
    }
  }
}

export function startAvailabilityResetJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await processCompletedBookings()
    } catch (e) {
      console.error('availabilityReset: job error', e)
    }
  })
  console.log('availabilityReset: scheduled job started (every 15 minutes)')
}

export async function runAvailabilityResetNow() {
  return processCompletedBookings()
}
