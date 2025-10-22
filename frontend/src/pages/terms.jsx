import React from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { Scale, CheckCircle, AlertCircle, Phone, Mail, Globe } from 'lucide-react'
import siteConfig from '../utils/siteConfig'

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

export default function Terms(){
  const sections = [
    {
      title: "General Information",
      content: "Hotel Krishna and Restaurant provides accommodation and dining services at our physical location. The content on this Website is for general information and booking purposes only. We reserve the right to modify, update, or discontinue any part of the Website at any time without prior notice."
    },
    {
      title: "Room Reservations and Bookings",
      points: [
        "All bookings made through our Website are subject to availability and confirmation.",
        "A booking is confirmed only after successful payment via Razorpay or other approved methods.",
        "Guests are required to provide accurate personal and contact information during booking.",
        "Any incorrect details may lead to cancellation of the reservation without refund."
      ]
    },
    {
      title: "Check-In and Check-Out Policy",
      points: [
        "Standard check-in time: 12:00 PM | Check-out time: 11:00 AM",
        "Early check-in or late check-out is subject to room availability and may incur additional charges."
      ]
    },
    {
      title: "Cancellation and Refund Policy",
      points: [
        "Cancellations must be made at least 48 hours before the scheduled check-in date to receive a refund (after deducting applicable charges).",
        "No refunds will be issued for cancellations made within 48 hours of check-in or in case of a \"no-show.\"",
        "Refunds, if applicable, will be processed within 7–10 working days via the original payment method."
      ]
    },
    {
      title: "Payment Terms",
      points: [
        "All payments are processed securely through Razorpay.",
        "Hotel Krishna and Restaurant is not responsible for any payment errors, technical issues, or delays caused by third-party payment gateways.",
        "Prices displayed on the Website are subject to change without notice."
      ]
    },
    {
      title: "Guest Conduct",
      content: "Guests are expected to maintain proper decorum and follow hotel rules during their stay. Any misconduct, illegal activity, or damage to property may result in cancellation of the booking without refund and/or legal action."
    },
    {
      title: "Liability Disclaimer",
      content: "While we strive to provide accurate information on our Website, we make no guarantees regarding completeness or reliability. Hotel Krishna and Restaurant shall not be liable for any direct, indirect, or incidental damages arising from your use of this Website or our services."
    },
    {
      title: "Intellectual Property",
      content: "All content, images, logos, and text on this Website are the property of Hotel Krishna and Restaurant. Unauthorized use, reproduction, or distribution is strictly prohibited."
    },
    {
      title: "Third-Party Links",
      content: "Our Website may contain links to external sites for your convenience. We do not control or endorse these sites and are not responsible for their content or privacy practices."
    },
    {
      title: "Governing Law",
      content: "These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of local courts where the hotel is located."
    }
  ]

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-600 text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
              <Scale size={18} className="text-amber-200" />
              <span className="text-sm font-semibold">Legal Information</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair mb-4">
              Terms & Conditions
            </h1>
            <p className="text-lg md:text-xl text-amber-100 max-w-2xl mx-auto">
              Last Updated: October 2025
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200 mb-12">
              <p className="text-lg text-gray-800 leading-relaxed">
                Welcome to <span className="font-bold text-amber-700">{siteConfig.hotelName}</span> ("we," "our," or "us"). 
                By accessing or using our website <a href={siteConfig.website} className="text-amber-600 hover:text-amber-700 font-semibold underline" target="_blank" rel="noopener noreferrer">{siteConfig.website}</a> ("Website"), 
                you agree to be bound by the following terms and conditions. If you do not agree with any part of these terms, please do not use our Website or services.
              </p>
            </div>
          </FadeIn>

          {/* Sections */}
          {sections.map((section, idx) => (
            <FadeIn key={idx} delay={0.1 + idx * 0.05}>
              <div className="mb-10">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair">
                    {section.title}
                  </h2>
                </div>
                
                {section.content && (
                  <p className="text-gray-700 leading-relaxed ml-11">
                    {section.content}
                  </p>
                )}
                
                {section.points && (
                  <ul className="space-y-3 ml-11">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-1" />
                        <span className="text-gray-700 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FadeIn>
          ))}

          {/* Contact Section */}
          <FadeIn delay={0.8}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border-2 border-blue-200 mt-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-6 flex items-center gap-3">
                <AlertCircle className="text-blue-600" />
                Contact Information
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                For any queries, booking assistance, or complaints, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href={siteConfig.phoneHref} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <Phone size={20} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">Phone</div>
                    <div className="text-sm font-bold text-gray-900">{siteConfig.phone}</div>
                  </div>
                </a>
                <a href={siteConfig.emailHref} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <Mail size={20} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">Email</div>
                    <div className="text-sm font-bold text-gray-900 break-all">{siteConfig.email}</div>
                  </div>
                </a>
                <a href={siteConfig.website} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow" target="_blank" rel="noopener noreferrer">
                  <Globe size={20} className="text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">Website</div>
                    <div className="text-sm font-bold text-gray-900 break-all">{new URL(siteConfig.website).host}</div>
                  </div>
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Hotel Krishna and Restaurant. All Rights Reserved.
          </p>
        </div>
      </section>
    </MainLayout>
  )
}
