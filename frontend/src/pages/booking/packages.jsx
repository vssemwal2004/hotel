import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { Coffee, Wifi, Utensils, Sparkles, Check, Info, Clock, Calendar, Users, ChevronRight, Star, Gift } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import api from '../../utils/api'

export default function BookingIndex() {
  const router = useRouter()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showDetails, setShowDetails] = useState(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data } = await api.get('/packages')
      setPackages(data.packages)
    } catch (err) {
      console.error('Error fetching packages:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAmenityIcon = (iconName) => {
    const icons = {
      Coffee, Wifi, Utensils, Sparkles, Gift, Star, Check
    }
    const Icon = icons[iconName] || Check
    return Icon
  }

  const handleBookNow = (pkg) => {
    // Navigate to booking confirmation with package details
    router.push(`/booking/confirmation?packageId=${pkg._id}`)
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading exclusive packages...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Exclusive <span className="text-amber-600">Room Packages</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our carefully curated packages with exceptional amenities and unbeatable prices
            </p>
          </motion.div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                {/* Package Header */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white relative overflow-hidden">
                  {/* Decorative Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-2xl font-bold">{pkg.name}</h2>
                      {pkg.badge && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-amber-100 text-sm font-medium">{pkg.roomType?.title}</p>
                  </div>
                </div>

                {/* Package Content */}
                <div className="p-6">
                  {/* Description */}
                  <p className="text-gray-600 mb-6 line-clamp-3">{pkg.description}</p>

                  {/* Pricing */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-3xl font-bold text-gray-900">₹{pkg.discountedPrice.toLocaleString()}</span>
                      <span className="text-xl text-gray-400 line-through">₹{pkg.originalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                          {pkg.discountPercentage}% OFF
                        </span>
                        <span className="text-xs text-gray-500">/ Night</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Plus ₹{pkg.calculations?.taxAmount.toFixed(2)} in Taxes and Fees/Night
                    </p>
                    <p className="text-lg font-bold text-amber-600 mt-3">
                      Total ₹{pkg.calculations?.totalPrice.toLocaleString()} for 1 Night
                    </p>
                    <p className="text-xs text-gray-500">Includes Taxes and Fees</p>
                  </div>

                  {/* Amenities */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-600" />
                      What's Included
                    </h3>
                    <div className="space-y-2">
                      {pkg.amenities?.slice(0, 4).map((amenity, i) => {
                        const Icon = getAmenityIcon(amenity.icon)
                        return (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Icon size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{amenity.title}</p>
                              {amenity.description && (
                                <p className="text-gray-500 text-xs mt-0.5">{amenity.description}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {pkg.amenities?.length > 4 && (
                        <button
                          onClick={() => setShowDetails(showDetails === pkg._id ? null : pkg._id)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1"
                        >
                          <Info size={14} />
                          View {pkg.amenities.length - 4} more amenities
                        </button>
                      )}
                    </div>

                    {/* Expanded Amenities */}
                    {showDetails === pkg._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-gray-100 space-y-2"
                      >
                        {pkg.amenities?.slice(4).map((amenity, i) => {
                          const Icon = getAmenityIcon(amenity.icon)
                          return (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <Icon size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium">{amenity.title}</p>
                                {amenity.description && (
                                  <p className="text-gray-500 text-xs mt-0.5">{amenity.description}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </div>

                  {/* Policy Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-amber-600" />
                        <span>Check-in: {pkg.checkInTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={14} className="text-amber-600" />
                        <span>Check-out: {pkg.checkOutTime}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${pkg.isRefundable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} font-semibold`}>
                        {pkg.isRefundable ? 'Refundable' : 'Non-Refundable'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleBookNow(pkg)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      Book Now
                      <ChevronRight size={20} />
                    </button>
                    
                    {pkg.cancellationPolicy && (
                      <button
                        onClick={() => setShowDetails(showDetails === pkg._id ? null : pkg._id)}
                        className="w-full text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <Info size={14} />
                        View Cancellation Policy
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No Packages */}
          {packages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                <Gift className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Packages Available</h3>
                <p className="text-gray-600 mb-6">
                  We're currently updating our exclusive offers. Please check back soon!
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </motion.div>
          )}

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="text-green-600" size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Best Price Guarantee</h4>
                <p className="text-sm text-gray-600">Lowest rates guaranteed</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="text-blue-600" size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Premium Amenities</h4>
                <p className="text-sm text-gray-600">Luxury at every step</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="text-amber-600" size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">5-Star Service</h4>
                <p className="text-sm text-gray-600">Exceptional hospitality</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  )
}
