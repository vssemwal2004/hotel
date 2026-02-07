import { Router } from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import Booking from '../models/Booking.js'
import RoomType from '../models/RoomType.js'
import User from '../models/User.js'
import { authRequired } from '../middleware/auth.js'
import { sendBookingConfirmationToUser, sendBookingNotificationToAdmin } from '../utils/email.js'

const router = Router()

function inPaise(amount) { return Math.round((Number(amount)||0) * 100) }

function getRazor() {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET
  if (!key_id || !key_secret) throw new Error('Razorpay not configured')
  return new Razorpay({ key_id, key_secret })
}

// Create an order for a booking
router.post('/create-order', authRequired, async (req, res, next) => {
  try {
    const { bookingId } = req.body || {}
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' })
    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status !== 'pending') return res.status(400).json({ message: 'Only pending bookings can be paid' })

    const instance = getRazor()
    const order = await instance.orders.create({
      amount: inPaise(booking.total),
      currency: 'INR',
      receipt: booking._id.toString(),
      notes: { bookingId: booking._id.toString() }
    })

    // Store order id in booking for traceability
    booking.payment = booking.payment || {}
    booking.payment.provider = 'razorpay'
    booking.payment.orderId = order.id
    booking.payment.status = 'created'
    await booking.save()

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID })
  } catch (e) { next(e) }
})

// Verify payment and mark booking as paid
router.post('/verify', authRequired, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body || {}
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return res.status(400).json({ message: 'Missing payment verification fields' })
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET
    const hmac = crypto.createHmac('sha256', key_secret)
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id)
    const digest = hmac.digest('hex')

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })
    if (booking.status === 'paid') return res.json({ booking })

    // Validate order id matches
    if (booking.payment?.orderId && booking.payment.orderId !== razorpay_order_id) {
      return res.status(400).json({ message: 'Order mismatch' })
    }

    // Decrement availability
    for (const it of booking.items) {
      const t = await RoomType.findOne({ key: it.roomTypeKey })
      if (!t || t.count < it.quantity) return res.status(409).json({ message: `${it.title} rooms full` })
    }
    for (const it of booking.items) {
      await RoomType.updateOne({ key: it.roomTypeKey }, { $inc: { count: -it.quantity } })
    }

    booking.status = 'paid'
    booking.payment = {
      provider: 'razorpay',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: 'paid'
    }
    await booking.save()

    // Fetch user details for email
    const user = await User.findById(booking.user).select('name email phone')
    
    // Send confirmation emails (don't wait, fire and forget)
    if (user) {
      sendBookingConfirmationToUser(booking, user).catch(err => 
        console.error('Failed to send user confirmation email:', err)
      )
      sendBookingNotificationToAdmin(booking, user).catch(err => 
        console.error('Failed to send admin notification email:', err)
      )
    }

    res.json({ booking })
  } catch (e) { next(e) }
})

export default router
