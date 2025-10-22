import React, { useState } from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { MapPin, Phone, Mail, Send, CheckCircle, Clock, Globe } from 'lucide-react'
import siteConfig from '../utils/siteConfig'
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

export default function Contact(){
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
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
    
    if (!formData.subject.trim() || formData.subject.length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters'
    }
    
    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    if (formData.message.length > 1000) {
      newErrors.message = 'Message must be less than 1000 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    try {
      await api.post('/contact', formData)
      
      setSubmitSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
      
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to submit message. Please try again.' })
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
              <Mail size={18} className="text-amber-200" />
              <span className="text-sm font-semibold">Get In Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair mb-4">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-amber-100 max-w-2xl mx-auto">
              We'd love to hear from you and help plan your perfect stay
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 font-playfair mb-12">
              Contact Information
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Address */}
            <FadeIn delay={0.1}>
              <motion.a
                href={siteConfig.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all block"
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MapPin size={28} className="text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Address</h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed">
                  {siteConfig.address}
                </p>
                <p className="text-amber-600 text-sm font-semibold text-center mt-3">
                  View on Map →
                </p>
              </motion.a>
            </FadeIn>

            {/* Phone */}
            <FadeIn delay={0.2}>
              <motion.a
                href={siteConfig.phoneHref}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all block"
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Phone size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Phone</h3>
                <p className="text-gray-600 text-center text-lg font-semibold">
                  {siteConfig.phone}
                </p>
                <p className="text-gray-500 text-sm text-center mt-2">
                  Available 24/7
                </p>
              </motion.a>
            </FadeIn>

            {/* Email */}
            <FadeIn delay={0.3}>
              <motion.a
                href={siteConfig.emailHref}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all block"
                whileHover={{ y: -5 }}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Mail size={28} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Email</h3>
                <p className="text-gray-600 text-center text-sm break-all leading-relaxed">
                  {siteConfig.email}
                </p>
                <p className="text-blue-600 text-sm font-semibold text-center mt-3">
                  Send Email →
                </p>
              </motion.a>
            </FadeIn>
          </div>

          {/* Additional Info */}
          <FadeIn delay={0.4}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">
              <div className="bg-white rounded-xl p-4 shadow text-center">
                <Clock size={20} className="text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">Check-in: 12:00 PM</p>
                <p className="text-sm font-semibold text-gray-900">Check-out: 11:00 AM</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow text-center">
                <Globe size={20} className="text-amber-600 mx-auto mb-2" />
                <a 
                  href={siteConfig.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {new URL(siteConfig.website).host}
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 font-playfair mb-4">
              Send us a Message
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Have a question or special request? We're here to help!
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            {submitSuccess ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-700">
                  Thank you for contacting us! We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200">
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

                  {/* Phone (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                      placeholder="e.g., Booking Inquiry, Special Request"
                    />
                    {errors.subject && (
                      <p className="text-red-600 text-sm mt-1">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {formData.message.length}/1000 characters
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Map Section (Optional) */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-5xl mx-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.789!2d79.0192!3d30.7343!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDQ0JzAzLjUiTiA3OcKwMDEnMDkuMSJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          </FadeIn>
        </div>
      </section>
    </MainLayout>
  )
}
