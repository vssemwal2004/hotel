import React, { useEffect, useMemo, useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import api from '../../utils/api'
import { useRouter } from 'next/router'
import { Calendar, Users, Bed, Wifi, Tv, Coffee, Utensils, Sparkles, Check, X, ChevronRight, ShoppingCart, Tag, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { calculateGST, formatGSTLabel } from '../../utils/gst'

function diffNights(checkIn, checkOut, fullDay){
  if (fullDay) return 1
  if (!checkIn || !checkOut) return 1
  const s = new Date(checkIn)
  const e = new Date(checkOut)
  const ms = 24*60*60*1000
  const n = Math.ceil((e - s) / ms)
  return Math.max(1, n)
}

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
)

export default function BookingIndex(){
  const router = useRouter()
  const { 
    checkIn: qi, 
    checkOut: qo, 
    fullDay: fd,
    rooms: qRooms,
    adults: qAdults,
    children: qChildren,
    checkInTime: qCheckInTime,
    checkOutTime: qCheckOutTime
  } = router.query
  
  const [types, setTypes] = useState([])
  const [cart, setCart] = useState([]) // {key,title,basePrice,quantity,guests:[]}
  const [selecting, setSelecting] = useState(null) // room type object being selected
  const [quantity, setQuantity] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [guests, setGuests] = useState([])
  const [packageType, setPackageType] = useState('roomOnly')
  const [extraBeds, setExtraBeds] = useState(0)
  const [extraPersons, setExtraPersons] = useState(0)
  const [creating, setCreating] = useState(false)
  const [showMobileSummary, setShowMobileSummary] = useState(true)
  const [expandedDesc, setExpandedDesc] = useState(null) // track which room's description is expanded

  const checkIn = useMemo(()=> Array.isArray(qi)?qi[0]:qi, [qi])
  const checkOut = useMemo(()=> Array.isArray(qo)?qo[0]:qo, [qo])
  const fullDay = useMemo(()=> fd === '1' || fd === 'true', [fd])
  const nights = useMemo(()=> diffNights(checkIn, checkOut, fullDay), [checkIn, checkOut, fullDay])

  // Initialize from URL query params
  useEffect(() => {
    if (qRooms) setQuantity(Number(qRooms))
    if (qAdults) setAdults(Number(qAdults))
    if (qChildren) setChildren(Number(qChildren))
  }, [qRooms, qAdults, qChildren])

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/room-types')
      setTypes(data.types || [])
    })()
  }, [])

  useEffect(() => {
    // Build guest fields when counts change
    const total = adults + children
    const next = []
    for (let i=0;i<total;i++){
      next.push({ name: guests[i]?.name || '', age: guests[i]?.age || '', type: i < adults ? 'adult' : 'child' })
    }
    setGuests(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, children])

  const addToCart = (t) => {
    // Check availability
    if (t.count === 0) return alert('No rooms available')
    
    // Open modal with pre-filled data
    setSelecting(t)
    
    // Use query params if available, otherwise defaults
    const roomsToBook = Number(qRooms) || 1
    const adultsCount = Number(qAdults) || 2
    const childrenCount = Number(qChildren) || 0
    
    if (roomsToBook > t.count) {
      return alert(`Only ${t.count} room${t.count > 1 ? 's' : ''} available`)
    }

    setQuantity(roomsToBook)
    setAdults(adultsCount)
    setChildren(childrenCount)
    setPackageType('roomOnly') // Default to room only
    setExtraBeds(0)
    setExtraPersons(0)
    
    // Build guest array automatically
    const totalGuests = adultsCount + childrenCount
    const guestList = []
    for (let i = 0; i < totalGuests; i++) {
      guestList.push({
        name: `Guest ${i + 1}`,
        age: i < adultsCount ? 25 : 10,
        type: i < adultsCount ? 'adult' : 'child'
      })
    }
    setGuests(guestList)
  }

  const confirmAdd = () => {
    if (!selecting) return
    if (quantity < 1) return alert('Select at least 1 room')
    if (selecting.count === 0) return alert('Rooms full')
    if (quantity > selecting.count) return alert(`Only ${selecting.count} rooms available`)
    // Capacity validation
    const maxA = (selecting.maxAdults || 0) * quantity
    const maxC = (selecting.maxChildren || 0) * quantity
    if (adults > maxA || children > maxC) {
      const needByA = (selecting.maxAdults || 1) > 0 ? Math.ceil(adults / (selecting.maxAdults || 1)) : adults
      const needByC = (selecting.maxChildren || 1) > 0 ? Math.ceil(children / (selecting.maxChildren || 1)) : children
      const requiredRooms = Math.max(needByA, needByC)
      return alert(`Selected rooms cannot accommodate all guests. Please add more rooms.\nTo accommodate ${adults} adults and ${children} children, you need at least ${requiredRooms} ${selecting.title}.`)
    }
    const item = {
      key: selecting.key,
      title: selecting.title,
      basePrice: (selecting.prices?.[packageType] ?? selecting.basePrice),
      quantity,
      packageType,
      extraBeds,
      extraPersons,
      guests: guests.map(g => ({ name: g.name || 'Guest', age: Number(g.age||0), type: g.type }))
    }
    setCart(prev => [...prev, item])
    setSelecting(null)
  }

  const lineTotal = (c) => {
    const combo = c.basePrice * c.quantity
    const extras = ((selecting?.extraBedPerPerson ?? 0) * 0) // placeholder not used in cart items
    return combo * nights
  }
  
  // Calculate total with dynamic GST based on Indian tax slabs
  const subtotal = useMemo(() => cart.reduce((s,a)=> s + (a.basePrice * a.quantity * nights) + (nights * ((types.find(t=>t.key===a.key)?.extraBedPerPerson||0) * (a.extraBeds||0) + (types.find(t=>t.key===a.key)?.extraPersonPerNight||0) * (a.extraPersons||0))), 0), [cart, nights, types])
  
  // Calculate GST dynamically
  const gstData = useMemo(() => {
    if (cart.length === 0 || subtotal === 0) {
      return { gstPercentage: 0, gstAmount: 0, totalAmount: 0 }
    }
    // Get the first room type for GST configuration (you can enhance this for multi-room carts)
    const firstCartItem = cart[0]
    const roomType = types.find(t => t.key === firstCartItem.key) || {}
    const pricePerNight = subtotal / nights
    return calculateGST(subtotal, roomType, pricePerNight)
  }, [cart, subtotal, types, nights])
  
  const taxAmount = gstData.gstAmount
  const gstPercentage = gstData.gstPercentage
  const total = gstData.totalAmount || subtotal

  const createAndPay = async () => {
    if (!checkIn || (!fullDay && !checkOut)) return alert('Missing dates')
    if (cart.length === 0) return alert('Add at least one room')
    // Global capacity validation across cart items
    for (const c of cart) {
      const t = types.find(x => x.key === c.key)
      if (!t) continue
      const maxA = (t.maxAdults || 0) * c.quantity
      const maxC = (t.maxChildren || 0) * c.quantity
      const adultCount = (c.guests || []).filter(g => g.type === 'adult').length
      const childCount = (c.guests || []).filter(g => g.type === 'child').length
      if (adultCount > maxA || childCount > maxC) {
        const needByA = (t.maxAdults || 1) > 0 ? Math.ceil(adultCount / (t.maxAdults || 1)) : adultCount
        const needByC = (t.maxChildren || 1) > 0 ? Math.ceil(childCount / (t.maxChildren || 1)) : childCount
        const requiredRooms = Math.max(needByA, needByC)
        alert(`Selected ${t.title} rooms cannot accommodate all guests. Please add more rooms.\nSuggested: ${requiredRooms} rooms for ${adultCount} adults and ${childCount} children.`)
        return
      }
    }
    setCreating(true)
    try {
      const payload = {
        checkIn,
        fullDay,
        items: cart.map(c => ({ roomTypeKey: c.key, quantity: c.quantity, packageType: c.packageType, extraBeds: c.extraBeds, extraPersons: c.extraPersons, guests: c.guests })),
        ...(fullDay ? {} : { checkOut })
      }
      const { data } = await api.post('/bookings', payload)
      const bookingId = data.booking?._id
      // Redirect to confirmation page where payment will be initiated
      router.push({ pathname: '/booking/confirmation', query: { bookingId } })
    } catch (e) {
      alert(e?.response?.data?.message || 'Payment failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Header Section */}
          <FadeIn>
            <div className="text-center mb-8">
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Choose Your Perfect Stay
              </h1>
              <div className="flex items-center justify-center gap-3 text-gray-600 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Calendar size={18} className="text-amber-600" />
                  <span className="text-sm font-medium">
                    {fullDay 
                      ? `Full Day: ${new Date(checkIn||'').toLocaleDateString()}` 
                      : `${new Date(checkIn||'').toLocaleDateString()} - ${new Date(checkOut||'').toLocaleDateString()}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Bed size={18} className="text-amber-600" />
                  <span className="text-sm font-medium">{nights} Night{nights > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Booking Details from Home Page */}
            {(qRooms || qAdults || qChildren) && (
              <div className="mb-8 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-6 border border-amber-300">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Info size={20} className="text-amber-700" />
                    <span className="text-sm font-semibold text-gray-800">Your Booking Preferences:</span>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                      <Bed size={16} className="text-amber-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {qRooms || 1} Room{(Number(qRooms) > 1) ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                      <Users size={16} className="text-amber-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {qAdults || 2} Adult{(Number(qAdults) > 1) ? 's' : ''}
                      </span>
                    </div>
                    {qChildren && Number(qChildren) > 0 && (
                      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                        <Users size={16} className="text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {qChildren} Child{Number(qChildren) > 1 ? 'ren' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-3 text-center">
                  Click "Book Now" to review details and select your meal plan
                </p>
              </div>
            )}
          </FadeIn>

          {/* Mobile Booking Summary at Top */}
          {cart.length > 0 && (
            <div className="lg:hidden sticky top-20 z-20 mb-4">
              <div className="rounded-2xl border-2 border-amber-200 shadow-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowMobileSummary(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <ShoppingCart size={18} />
                    <span>Booking Summary</span>
                    <span className="ml-2 text-amber-100 text-xs">{cart.length} item{cart.length>1?'s':''}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm leading-none opacity-90">Total</div>
                    <div className="text-lg font-bold">₹{total.toLocaleString()}</div>
                  </div>
                </button>
                {showMobileSummary && (
                  <div className="p-4 bg-white">
                    <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-2">
                      {cart.map((c, i) => (
                        <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-sm">{c.title}</div>
                              <div className="text-xs text-gray-600">× {c.quantity} • {c.guests.length} guest{c.guests.length>1?'s':''}</div>
                            </div>
                            <button
                              onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-amber-200 mt-2 text-sm">
                            <span className="text-gray-600">{nights} night{nights>1?'s':''}</span>
                            <span className="font-bold text-green-600">₹{(c.basePrice * c.quantity * nights).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-amber-200 pt-3 mb-3">
                      <span className="text-sm text-gray-700">Grand Total</span>
                      <span className="text-xl font-extrabold text-amber-600">₹{total.toLocaleString()}</span>
                    </div>
                    <button
                      disabled={creating || cart.length === 0}
                      onClick={createAndPay}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Calendar size={18} />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          Confirm & Pay
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content - Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Room Cards Section - Left Side */}
            <div className={`${cart.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
              {types.map((t, idx) => {
                const originalPrice = t.prices?.roomOnly ?? t.basePrice
                const discountPercent = t.discount || 0
                const discountedPrice = discountPercent > 0 
                  ? Math.round(originalPrice * (1 - discountPercent / 100))
                  : originalPrice
                
                // Calculate GST dynamically for this room type
                const roomGST = calculateGST(discountedPrice, t, discountedPrice)
                const taxesAndFees = roomGST.gstAmount
                const gstPercent = roomGST.gstPercentage
                const totalPerNight = roomGST.totalAmount

                return (
                  <FadeIn key={t._id} delay={idx * 0.05}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
                      
                      {/* Top: Full-width Image */}
                      <div className="relative w-full h-56 md:h-72">
                        {((t.coverPhotos && t.coverPhotos[0]) || (t.photos && t.photos[0])) ? (
                          <img 
                            src={(t.coverPhotos && t.coverPhotos[0]?.url) || (t.photos && t.photos[0]?.url)} 
                            alt={t.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <Bed size={56} className="text-white opacity-50" />
                          </div>
                        )}
                        {/* Overlay badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          {discountPercent > 0 && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                              {discountPercent}% OFF
                            </span>
                          )}
                          {t.count > 0 ? (
                            <span className="bg-green-500/90 text-white px-3 py-1 rounded-full font-medium text-xs shadow">
                              {t.count} room{t.count > 1 ? 's' : ''} left
                            </span>
                          ) : (
                            <span className="bg-red-600/90 text-white px-3 py-1 rounded-full font-medium text-xs shadow">
                              Sold Out
                            </span>
                          )}
                        </div>
                        {/* See Photos */}
                        <button
                          type="button"
                          onClick={() => setSelecting({ ...t, __photosOnly: true })}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all flex items-center gap-1"
                        >
                          <Sparkles size={12} />
                          See Photos
                        </button>
                        {/* Sold out overlay */}
                        {t.count === 0 && (
                          <div className="absolute inset-0 bg-black/40" />
                        )}
                      </div>

                      {/* Bottom: Details */}
                      <div className="p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          
                          {/* Left: Room Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t.title}</h3>

                            {/* Description - truncated with View More */}
                            {t.description && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {t.description.length > 120 
                                    ? t.description.slice(0, 120) + '...' 
                                    : t.description
                                  }
                                </p>
                                {t.description.length > 120 && (
                                  <button 
                                    onClick={() => setExpandedDesc(expandedDesc === t._id ? null : t._id)}
                                    className="text-amber-600 hover:text-amber-700 text-sm font-semibold mt-1 inline-flex items-center gap-1"
                                  >
                                    {expandedDesc === t._id ? 'Show Less' : 'View More'}
                                    <ChevronRight size={14} className={`transition-transform ${expandedDesc === t._id ? 'rotate-90' : ''}`} />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Expanded Description Card */}
                            {expandedDesc === t._id && t.description && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 max-h-60 overflow-y-auto"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-bold text-gray-900">Room Details</h4>
                                  <button onClick={() => setExpandedDesc(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{t.description}</p>
                              </motion.div>
                            )}

                            {/* Amenities */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(t.amenities || []).slice(0, 5).map((amenity, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                  <Check size={12} className="text-green-500 flex-shrink-0" />
                                  {amenity}
                                </span>
                              ))}
                              {(t.amenities || []).length > 5 && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 font-medium">
                                  +{(t.amenities || []).length - 5} more
                                </span>
                              )}
                            </div>

                            {/* Meal Add-ons */}
                            {(t.prices?.roomBreakfast > originalPrice || t.prices?.roomBreakfastDinner > originalPrice) && (
                              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                {t.prices?.roomBreakfast > originalPrice && (
                                  <span className="inline-flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200">
                                    <Coffee size={12} className="text-orange-500" />
                                    +Breakfast: ₹{t.prices.roomBreakfast - originalPrice}
                                  </span>
                                )}
                                {t.prices?.roomBreakfastDinner > originalPrice && (
                                  <span className="inline-flex items-center gap-1 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200">
                                    <Utensils size={12} className="text-orange-500" />
                                    +Full Board: ₹{t.prices.roomBreakfastDinner - originalPrice}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Pricing & Book */}
                          <div className="md:w-52 flex-shrink-0 md:text-right md:border-l md:border-gray-100 md:pl-6">
                            <div className="flex items-baseline md:justify-end gap-2 mb-1">
                              <span className="text-3xl font-bold text-amber-600">₹{discountedPrice.toLocaleString()}</span>
                              {discountPercent > 0 && (
                                <span className="text-sm text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">per night</p>
                            <p className="text-xs text-green-600 font-medium">+₹{taxesAndFees.toLocaleString()} ({gstPercent}% GST)</p>

                            <div className="bg-gray-50 rounded-lg p-3 my-3 border border-gray-200 md:text-left">
                              <div className="text-xs text-gray-500 mb-0.5">Total for {nights} night{nights > 1 ? 's' : ''}</div>
                              <div className="text-lg font-bold text-gray-900">₹{(totalPerNight * nights).toLocaleString()}</div>
                              <div className="text-[10px] text-gray-400">Includes taxes & fees</div>
                            </div>

                            <button
                              disabled={t.count === 0}
                              onClick={() => addToCart(t)}
                              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                                t.count === 0
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                              }`}
                            >
                              {t.count === 0 ? (
                                <><X size={16} /> Sold Out</>
                              ) : (
                                <><ShoppingCart size={16} /> Book Now</>
                              )}
                            </button>
                            <p className="text-[10px] text-gray-400 mt-2 flex items-center md:justify-center gap-1">
                              <Info size={10} /> Non-Refundable
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
              )
            })}

              {/* Empty State */}
              {types.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-amber-100">
                  <Bed size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No rooms available</p>
                  <p className="text-gray-500 text-sm">Please check back later</p>
                </div>
              )}
            </div>

            {/* Booking Summary Sidebar - Right Side */}
            {cart.length > 0 && (
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl border-2 border-amber-200 shadow-xl overflow-hidden">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCart size={22} />
                        Booking Summary
                      </h3>
                      <p className="text-amber-100 text-sm mt-1">{cart.length} room{cart.length > 1 ? 's' : ''} selected</p>
                    </div>

                    {/* Cart Items */}
                    <div className="p-5">
                      <div className="space-y-3 mb-5 max-h-[400px] overflow-y-auto pr-2">
                        {cart.map((c, i) => (
                          <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm mb-1">
                                  {c.title}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="bg-white px-2 py-0.5 rounded text-xs text-amber-700 font-medium border border-amber-200">
                                    × {c.quantity}
                                  </span>
                                  <span className="bg-white px-2 py-0.5 rounded text-xs text-gray-600 border border-gray-200">
                                    {c.guests.length} guest{c.guests.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Remove"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            <div className="text-xs text-gray-600 mb-2">
                              {c.packageType === 'roomOnly' && '🛏️ Room Only'}
                              {c.packageType === 'roomBreakfast' && '☕ Room + Breakfast'}
                              {c.packageType === 'roomBreakfastDinner' && '🍽️ Full Board'}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                              <span className="text-xs text-gray-600">{nights} night{nights > 1 ? 's' : ''}</span>
                              <span className="text-sm font-bold text-green-600">
                                ₹{(c.basePrice * c.quantity * nights).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Price Breakdown */}
                      <div className="border-t-2 border-amber-200 pt-4 space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Calendar size={14} className="text-amber-600" />
                            {nights} Night{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-medium text-gray-700">
                            {cart.reduce((sum, c) => sum + c.quantity, 0)} Room{cart.reduce((sum, c) => sum + c.quantity, 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Subtotal</span>
                          <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>{formatGSTLabel(gstPercentage)}</span>
                          <span>₹{taxAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">₹{total.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">All inclusive</div>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Button */}
                      <button
                        disabled={creating || cart.length === 0}
                        onClick={createAndPay}
                        className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        {creating ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Calendar size={20} />
                            </motion.div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check size={20} />
                            Confirm & Pay
                          </>
                        )}
                      </button>

                      <p className="text-xs text-center text-gray-500 mt-3">
                        🔒 Secure payment • Non-refundable
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Empty Cart Message */}
          {cart.length === 0 && types.length > 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-amber-100 mt-8">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg mb-2">No rooms selected yet</p>
              <p className="text-gray-500 text-sm">Choose a room above to get started</p>
            </div>
          )}

          {/* Booking Details Modal */}
          {selecting && !selecting.__photosOnly && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setSelecting(null)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{selecting.title}</h3>
                      <p className="text-amber-100 text-sm">Review your booking details</p>
                    </div>
                    <button 
                      onClick={()=>setSelecting(null)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  
                  {/* Booking Summary */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-6 border border-amber-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-amber-600" />
                      Booking Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Rooms */}
                      <div className="bg-white rounded-lg p-3">
                        <Bed size={20} className="mx-auto text-amber-600 mb-2" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <div className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">{quantity}</div>
                          <button
                            onClick={() => setQuantity(Math.min(selecting.count, quantity + 1))}
                            disabled={quantity >= selecting.count}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 text-center">Room{quantity > 1 ? 's' : ''}</div>
                      </div>

                      {/* Adults */}
                      <div className="bg-white rounded-lg p-3">
                        <Users size={20} className="mx-auto text-amber-600 mb-2" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <button
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            disabled={adults <= 1}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <div className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">{adults}</div>
                          <button
                            onClick={() => setAdults(adults + 1)}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 text-center">Adult{adults > 1 ? 's' : ''}</div>
                      </div>

                      {/* Children */}
                      <div className="bg-white rounded-lg p-3">
                        <Users size={20} className="mx-auto text-amber-600 mb-2" />
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <button
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            disabled={children <= 0}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:text-gray-400 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            -
                          </button>
                          <div className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">{children}</div>
                          <button
                            onClick={() => setChildren(children + 1)}
                            className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 text-center">Child{children > 1 ? 'ren' : ''}</div>
                      </div>

                      {/* Nights */}
                      <div className="bg-white rounded-lg p-3 text-center">
                        <Calendar size={20} className="mx-auto text-amber-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{nights}</div>
                        <div className="text-xs text-gray-600">Night{nights > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Notice and Auto-Recommend */}
                  <div className="mb-6">
                    {(() => {
                      const maxA = (selecting.maxAdults || 0) * quantity
                      const maxC = (selecting.maxChildren || 0) * quantity
                      const ok = adults <= maxA && children <= maxC
                      if (ok) {
                        return (
                          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl p-3">
                            ✓ Capacity OK for {adults} adult{adults>1?'s':''} and {children} child{children!==1?'ren':''} with {quantity} room{quantity>1?'s':''}.
                          </div>
                        )
                      }
                      const needByA = (selecting.maxAdults || 1) > 0 ? Math.ceil(adults / (selecting.maxAdults || 1)) : adults
                      const needByC = (selecting.maxChildren || 1) > 0 ? Math.ceil(children / (selecting.maxChildren || 1)) : children
                      const requiredRooms = Math.max(needByA, needByC)
                      return (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3">
                          <div className="text-sm font-semibold mb-2">Selected rooms cannot accommodate all guests. Please add more rooms.</div>
                          <div className="text-xs mb-3">To accommodate {adults} adults and {children} children, you need at least <b>{requiredRooms}</b> {selecting.title}.</div>
                          <button
                            type="button"
                            onClick={() => {
                              const tRooms = Math.max(needByA, needByC)
                              if (tRooms > (selecting.count || 0)) {
                                alert(`Only ${selecting.count || 0} rooms available for ${selecting.title}. Please choose another type or adjust guests.`)
                              } else {
                                setQuantity(tRooms)
                              }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
                          >
                            Add Recommended Rooms Automatically
                          </button>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Meal Options - Prominent Display */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Utensils size={18} className="text-amber-600" />
                      Select Your Meal Plan
                    </h4>
                    <div className="space-y-3">
                      {/* Room Only */}
                      <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        packageType === 'roomOnly' 
                          ? 'border-green-500 bg-green-50/50' 
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="package"
                            value="roomOnly"
                            checked={packageType === 'roomOnly'}
                            onChange={e => setPackageType(e.target.value)}
                            className="w-5 h-5 text-green-600"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">Room Only</div>
                            <div className="text-xs text-gray-600">Just the room, no meals included</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {selecting.discount > 0 && (
                            <div className="text-sm text-gray-400 line-through mb-1">
                              ₹{Math.round((selecting.prices?.roomOnly ?? selecting.basePrice) / (1 - selecting.discount / 100)).toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-2xl font-bold text-green-600">₹{(selecting.prices?.roomOnly ?? selecting.basePrice).toLocaleString()}</div>
                            {selecting.discount > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                {selecting.discount}% OFF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </label>

                      {/* Room + Breakfast */}
                      <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        packageType === 'roomBreakfast' 
                          ? 'border-green-500 bg-green-50/50' 
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="package"
                            value="roomBreakfast"
                            checked={packageType === 'roomBreakfast'}
                            onChange={e => setPackageType(e.target.value)}
                            className="w-5 h-5 text-green-600"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              Room + Breakfast
                              <Coffee size={16} className="text-amber-600" />
                            </div>
                            <div className="text-xs text-gray-600">Start your day with complimentary breakfast</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {selecting.discount > 0 && (
                            <div className="text-sm text-gray-400 line-through mb-1">
                              ₹{Math.round((selecting.prices?.roomBreakfast ?? selecting.basePrice) / (1 - selecting.discount / 100)).toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-2xl font-bold text-green-600">₹{(selecting.prices?.roomBreakfast ?? selecting.basePrice).toLocaleString()}</div>
                            {selecting.discount > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                {selecting.discount}% OFF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </label>

                      {/* Room + Breakfast + Dinner */}
                      <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        packageType === 'roomBreakfastDinner' 
                          ? 'border-green-500 bg-green-50/50' 
                          : 'border-gray-200 hover:border-green-300 bg-white'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="package"
                            value="roomBreakfastDinner"
                            checked={packageType === 'roomBreakfastDinner'}
                            onChange={e => setPackageType(e.target.value)}
                            className="w-5 h-5 text-green-600"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              Room + Breakfast + Dinner
                              <Utensils size={16} className="text-amber-600" />
                              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">Best Value</span>
                            </div>
                            <div className="text-xs text-gray-600">Full board - breakfast and dinner included</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {selecting.discount > 0 && (
                            <div className="text-sm text-gray-400 line-through mb-1">
                              ₹{Math.round((selecting.prices?.roomBreakfastDinner ?? selecting.basePrice) / (1 - selecting.discount / 100)).toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-2xl font-bold text-green-600">₹{(selecting.prices?.roomBreakfastDinner ?? selecting.basePrice).toLocaleString()}</div>
                            {selecting.discount > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                {selecting.discount}% OFF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Guest Details */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Guest Information</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {guests.map((g, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Guest {idx + 1} Name ({g.type})</label>
                            <input
                              value={g.name}
                              onChange={e => setGuests(prev => prev.map((x, i) => i === idx ? {...x, name: e.target.value} : x))}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="Enter name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Age</label>
                            <input
                              type="number"
                              min={0}
                              value={g.age}
                              onChange={e => setGuests(prev => prev.map((x, i) => i === idx ? {...x, age: e.target.value} : x))}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-6 border border-amber-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">
                          {quantity} Room{quantity > 1 ? 's' : ''} × {nights} Night{nights > 1 ? 's' : ''}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₹{((selecting.prices?.[packageType] ?? selecting.basePrice) * quantity * nights).toLocaleString()}
                        </span>
                      </div>
                      {extraBeds > 0 && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Extra Beds ({extraBeds} × {nights} nights)</span>
                          <span>₹{(selecting.extraBedPerPerson * extraBeds * nights).toLocaleString()}</span>
                        </div>
                      )}
                      {extraPersons > 0 && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Additional Persons ({extraPersons} × {nights} nights)</span>
                          <span>₹{(selecting.extraPersonPerNight * extraPersons * nights).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-amber-300 pt-2 mt-2">
                        <div className="flex items-center justify-between text-base mb-2">
                          <span className="text-gray-700">Subtotal</span>
                          <span className="text-gray-900">
                            ₹{(
                              (selecting.prices?.[packageType] ?? selecting.basePrice) * quantity * nights +
                              (selecting.extraBedPerPerson * extraBeds * nights) +
                              (selecting.extraPersonPerNight * extraPersons * nights)
                            ).toLocaleString()}
                          </span>
                        </div>
                        {(() => {
                          const modalSubtotal = (selecting.prices?.[packageType] ?? selecting.basePrice) * quantity * nights +
                            (selecting.extraBedPerPerson * extraBeds * nights) +
                            (selecting.extraPersonPerNight * extraPersons * nights)
                          const pricePerNight = (selecting.prices?.[packageType] ?? selecting.basePrice)
                          const modalGST = calculateGST(modalSubtotal, selecting, pricePerNight)
                          return (
                            <>
                              <div className="flex items-center justify-between text-base mb-2">
                                <span className="text-gray-700">{formatGSTLabel(modalGST.gstPercentage)}</span>
                                <span className="text-gray-900">
                                  ₹{modalGST.gstAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-lg border-t border-amber-300 pt-2">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="font-bold text-amber-600">
                                  ₹{modalGST.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )
                        })()}
                        <div className="text-xs text-gray-600 text-right mt-1">Includes all taxes & fees</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelecting(null)}
                      className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmAdd}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photos Modal */}
          {selecting && selecting.__photosOnly && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6">
              <div className="absolute inset-0 bg-black/80" onClick={()=>setSelecting(null)} />
              <div className="relative bg-white rounded-3xl shadow-2xl max-w-7xl w-full h-[90vh] overflow-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-xl font-bold">{selecting.title} — Photos</h3>
                  <button onClick={()=>setSelecting(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
                  {[...(selecting.coverPhotos||[]), ...(selecting.photos||[])].map((p, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border bg-gray-50">
                      <img src={p.url || p} alt={`photo-${i}`} className="w-full h-56 md:h-64 object-cover" />
                    </div>
                  ))}
                  {(!selecting.photos || selecting.photos.length===0) && (!selecting.coverPhotos || selecting.coverPhotos.length===0) && (
                    <div className="text-center text-gray-500 col-span-full py-8">No photos uploaded yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
