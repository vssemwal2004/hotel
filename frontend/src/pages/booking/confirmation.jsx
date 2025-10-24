import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import MainLayout from '../../layouts/MainLayout'
import useAuth from '../../hooks/useAuth'
import api from '../../utils/api'
import { Calendar, CheckCircle, IndianRupee, Bed } from 'lucide-react'

export default function Confirmation(){
  const router = useRouter()
  const { bookingId } = router.query
  const { user, loading: authLoading } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return
      try {
        setLoading(true)
        // Fetch user's bookings and find the one we just created
        const { data } = await api.get('/bookings/my-bookings')
        const found = (data.bookings || []).find(b => b._id === bookingId)
        setBooking(found || null)
      } catch (e) {
        console.error('Failed to load booking', e)
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  const payWithRazorpay = async () => {
    if (!booking) return
    try {
      setPaying(true)
      // Create order on backend
      const { data } = await api.post('/payments/create-order', { bookingId: booking._id })
      const { orderId, key, amount, currency } = data

      // Load Razorpay script if not present
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          s.onerror = reject
          document.body.appendChild(s)
        })
      }

      const options = {
        key,
        amount,
        currency,
        name: 'Hotel Krishna',
        description: `Booking #${booking._id.slice(-6).toUpperCase()}`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || ''
        },
        theme: { color: '#f59e0b' },
        handler: async function (resp) {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              bookingId: booking._id
            })
            // Go to user's bookings page
            router.push('/bookings')
          } catch (e) {
            alert(e?.response?.data?.message || 'Payment verification failed')
          }
        }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Preparing your booking...</p>
            </div>
          ) : !booking ? (
            <div className="text-center py-20">
              <h2 className="font-playfair text-3xl font-bold mb-2">Booking Not Found</h2>
              <p className="text-gray-600 mb-6">We couldn't find your booking details.</p>
              <button onClick={() => router.push('/bookings')} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow">Go to My Bookings</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border-2 border-amber-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6">
                <h2 className="font-playfair text-3xl font-bold">Confirm Your Booking</h2>
                <p className="text-amber-100 mt-1">Booking #{booking._id.slice(-6).toUpperCase()}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white border border-amber-200">
                      <Calendar size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="font-semibold text-gray-900">{formatDate(booking.checkIn)}</p>
                    </div>
                  </div>
                  {booking.checkOut && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-blue-200">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className="font-semibold text-gray-900">{formatDate(booking.checkOut)}</p>
                      </div>
                    </div>
                  )}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-green-200">
                        <CheckCircle size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount Payable</p>
                        <div className="flex items-center gap-1 text-2xl font-bold text-green-700">
                          <IndianRupee size={20} />
                          <span>{booking.total?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {booking.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Bed size={18} className="text-amber-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600">{item.quantity} Room{item.quantity>1?'s':''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <IndianRupee size={16} />
                        <span>{item.subtotal?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* QR Placeholder */}
                <div className="mt-2 flex items-center justify-center">
                  <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400">
                    QR CODE
                  </div>
                </div>

                {/* Actions */}
                {booking.status === 'pending' ? (
                  <button
                    disabled={paying}
                    onClick={payWithRazorpay}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {paying ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-semibold border border-green-200">
                      <CheckCircle size={18} /> Payment Complete
                    </div>
                    <div className="mt-4">
                      <button onClick={() => router.push('/bookings')} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow">Go to My Bookings</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
