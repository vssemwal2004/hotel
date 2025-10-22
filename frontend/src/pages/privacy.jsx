import React from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { Shield, CheckCircle, Lock, Phone, Mail, Globe, Cookie, Database } from 'lucide-react'
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

export default function Privacy(){
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: "We may collect the following types of personal information:",
      points: [
        "Personal Details: Name, email address, phone number, and address.",
        "Booking Details: Check-in/check-out dates, room preferences, and number of guests.",
        "Payment Information: Processed securely via Razorpay; we do not store your payment card details.",
        "Technical Data: IP address, browser type, device information, and cookies for analytics and functionality."
      ]
    },
    {
      title: "How We Use Your Information",
      icon: CheckCircle,
      content: "We use the collected data to:",
      points: [
        "Process and confirm your room reservations.",
        "Communicate booking details and updates.",
        "Provide customer support and respond to inquiries.",
        "Improve our services, website performance, and user experience.",
        "Comply with legal or regulatory requirements."
      ]
    },
    {
      title: "Payment and Security",
      icon: Lock,
      points: [
        "All online payments are securely processed through Razorpay.",
        "We do not collect or store any credit/debit card information on our servers.",
        "Razorpay may collect necessary financial data as per their own privacy policy.",
        "Our Website uses SSL (Secure Socket Layer) encryption to protect your data."
      ]
    },
    {
      title: "Cookies",
      icon: Cookie,
      content: "Our Website uses cookies to enhance your browsing experience. Cookies help us remember your preferences and analyze website traffic. You can choose to disable cookies in your browser settings, but some features may not function properly."
    },
    {
      title: "Data Sharing and Disclosure",
      icon: Shield,
      content: "We respect your privacy — we do not sell, trade, or rent users' personal information. Your data may be shared only with:",
      points: [
        "Service providers involved in booking or payment processing (e.g., Razorpay).",
        "Legal authorities, if required by law."
      ]
    },
    {
      title: "Data Retention",
      content: "We retain your information only for as long as necessary to fulfill the purposes outlined in this policy or as required by law."
    },
    {
      title: "Your Rights",
      content: "You have the right to:",
      points: [
        "Request access to your personal data.",
        "Ask for correction or deletion of your data.",
        "Withdraw consent for processing (where applicable)."
      ],
      note: "To exercise these rights, contact us using the details below."
    },
    {
      title: "External Links",
      content: "Our Website may contain links to third-party sites (e.g., Razorpay or travel partners). We are not responsible for the privacy practices or content of these external websites."
    },
    {
      title: "Updates to This Policy",
      content: "We may update this Privacy Policy from time to time. The updated version will be posted on this page with the revised date at the top."
    }
  ]

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-600 text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 mb-6">
              <Shield size={18} className="text-blue-200" />
              <span className="text-sm font-semibold">Your Privacy Matters</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Last Updated: October 2025
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border-2 border-blue-200 mb-12">
              <p className="text-lg text-gray-800 leading-relaxed">
                At <span className="font-bold text-blue-700">{siteConfig.hotelName}</span>, accessible from{' '}
                <a href={siteConfig.website} className="text-blue-600 hover:text-blue-700 font-semibold underline" target="_blank" rel="noopener noreferrer">
                  {siteConfig.website}
                </a>, we respect your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, and protect the data you share with us through our Website and booking system.
              </p>
            </div>
          </FadeIn>

          {/* Sections */}
          {sections.map((section, idx) => {
            const Icon = section.icon || CheckCircle
            return (
              <FadeIn key={idx} delay={0.1 + idx * 0.05}>
                <div className="mb-10">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Icon size={20} className="text-blue-700" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair pt-1">
                      {section.title}
                    </h2>
                  </div>
                  
                  {section.content && (
                    <p className="text-gray-700 leading-relaxed ml-13 mb-4">
                      {section.content}
                    </p>
                  )}
                  
                  {section.points && (
                    <ul className="space-y-3 ml-13">
                      {section.points.map((point, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-1" />
                          <span className="text-gray-700 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.note && (
                    <p className="text-gray-600 italic ml-13 mt-3 text-sm">
                      {section.note}
                    </p>
                  )}
                </div>
              </FadeIn>
            )
          })}

          {/* Consent Section */}
          <FadeIn delay={0.9}>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 md:p-8 border-2 border-green-200 mt-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-4 flex items-center gap-3">
                <CheckCircle className="text-green-600" />
                Consent
              </h2>
              <p className="text-gray-700 leading-relaxed">
                By using our Website, you hereby consent to our Privacy Policy and agree to its terms.
              </p>
            </div>
          </FadeIn>

          {/* Contact Section */}
          <FadeIn delay={1}>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200 mt-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair mb-6">
                Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                If you have any questions or concerns about this Privacy Policy, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href={siteConfig.phoneHref} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <Phone size={20} className="text-amber-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">Phone</div>
                    <div className="text-sm font-bold text-gray-900">{siteConfig.phone}</div>
                  </div>
                </a>
                <a href={siteConfig.emailHref} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow">
                  <Mail size={20} className="text-amber-600" />
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">Email</div>
                    <div className="text-sm font-bold text-gray-900 break-all">{siteConfig.email}</div>
                  </div>
                </a>
                <a href={siteConfig.website} className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-lg transition-shadow" target="_blank" rel="noopener noreferrer">
                  <Globe size={20} className="text-amber-600" />
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
