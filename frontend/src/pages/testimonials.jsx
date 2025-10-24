import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { Star, Send, CheckCircle, MessageSquare, TrendingUp } from 'lucide-react'
import api from '../utils/api'

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    {children}
  </motion.div>
)

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [stats, setStats] = useState({ totalCount: 0, averageRating: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    message: '',
    role: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch testimonials and stats
  useEffect(() => {
    fetchTestimonials()
    fetchStats()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials?limit=50')
      console.log('Fetched testimonials:', response.data)
      console.log('Number of testimonials:', response.data.length)
      setTestimonials(response.data)
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      console.error('Error details:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/testimonials/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }))
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    if (formData.message.length > 500) {
      newErrors.message = 'Message must be less than 500 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    try {
      await api.post('/testimonials', {
        ...formData,
        rating: parseInt(formData.rating)
      })
      
      setSubmitSuccess(true)
      // Refresh the list and stats so everyone (including current user) sees the new review immediately
      await Promise.all([fetchTestimonials(), fetchStats()])
      setFormData({
        name: '',
        email: '',
        rating: 5,
        message: '',
        role: ''
      })
      
      // Hide success message and form after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
        setShowForm(false)
      }, 5000)
      
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to submit testimonial. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
              <MessageSquare size={18} className="text-amber-200" />
              <span className="text-sm font-semibold">Guest Experiences</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair mb-4">
              Guest Stories
            </h1>
            <p className="text-lg md:text-xl text-amber-100 max-w-2xl mx-auto mb-6">
              Discover what our guests say about their experiences at Hotel Krishna
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <Star size={20} className="text-amber-300 fill-amber-300" />
                  <span className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
                <p className="text-sm text-amber-100">Average Rating</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-amber-300" />
                  <span className="text-2xl font-bold">{stats.totalCount || 0}</span>
                </div>
                <p className="text-sm text-amber-100">Total Reviews</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-amber-300" />
                  <span className="text-2xl font-bold">{stats.fiveStarCount || 0}</span>
                </div>
                <p className="text-sm text-amber-100">5-Star Reviews</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Write Review Button */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
              >
                <Send size={20} />
                Write a Review
              </button>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Review Form */}
      {showForm && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-2xl">
            <FadeIn>
              {submitSuccess ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-700">
                    Your testimonial has been published successfully and is now visible to everyone!
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200">
                  <h2 className="text-3xl font-bold text-gray-900 font-playfair mb-6 text-center">
                    Share Your Experience
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        placeholder="Enter your name"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    {/* Role/Occupation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role/Occupation (Optional)
                      </label>
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        placeholder="e.g., Travel Blogger, Software Engineer"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Your Rating *
                      </label>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="focus:outline-none"
                          >
                            <Star
                              size={40}
                              className={`${
                                star <= formData.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              } transition-all`}
                            />
                          </motion.button>
                        ))}
                      </div>
                      <p className="text-center text-sm text-gray-600 mt-2">
                        {formData.rating} out of 5 stars
                      </p>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Your Review *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                        placeholder="Share your experience with us..."
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">
                          {formData.message.length}/500 characters
                        </span>
                        {errors.message && (
                          <p className="text-red-600 text-sm">{errors.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                        {errors.submit}
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setErrors({})
                        }}
                        className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            Submit Review
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </FadeIn>
          </div>
        </section>
      )}

      {/* Testimonials Grid */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" />
              <p className="text-gray-600 mt-4">Loading testimonials...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No testimonials yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <FadeIn key={testimonial._id} delay={index * 0.1}>
                  <motion.div
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all h-full"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-lg">
                        {testimonial.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        {testimonial.role && (
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${
                            i < testimonial.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        ({testimonial.rating}/5)
                      </span>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed italic">
                      "{testimonial.message}"
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-4">
                      {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}
