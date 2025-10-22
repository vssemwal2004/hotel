import React from 'react'
import { motion } from 'framer-motion'
import { Facebook, Instagram, Phone, Mail, MapPin, Mountain, Scale, Shield, Compass } from 'lucide-react'
import Link from 'next/link'
import siteConfig from '../utils/siteConfig'

const FooterLink = ({ href, children }) => (
  <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
    <Link href={href} className="text-gray-300 hover:text-amber-400 transition-colors duration-300 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </Link>
  </motion.div>
)

export default function Footer(){
  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/rooms', label: 'Rooms & Suites' },
    { href: '/in-around', label: 'In & Around' },
    { href: '/about', label: 'About Us' },
    { href: '/offers', label: 'Special Offers' },
    { href: '/contact', label: 'Contact' }
  ]

  const legalLinks = [
    { href: '/terms', label: 'Terms & Conditions', icon: Scale },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield }
  ]

  const destinations = [
    { name: 'Kedarnath', distance: '26 km' },
    { name: 'Chopta', distance: '60 km' },
    { name: 'Tungnath', distance: '64 km' },
    { name: 'Kalimath', distance: '32 km' }
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          
          {/* Hotel Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h4 className="font-playfair text-xl font-bold mb-4">{siteConfig.shortName}</h4>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Experience divine hospitality in the heart of Garhwal Himalayas. Your gateway to sacred destinations.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href={siteConfig.phoneHref} className="flex items-center gap-3 text-gray-300 hover:text-amber-400 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <Phone size={16} className="text-amber-400" />
                </div>
                <span className="text-sm">{siteConfig.phone}</span>
              </a>
              
              <a href={siteConfig.emailHref} className="flex items-center gap-3 text-gray-300 hover:text-amber-400 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <Mail size={16} className="text-amber-400" />
                </div>
                <span className="text-sm break-all">{siteConfig.email}</span>
              </a>
              
              <a href={siteConfig.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-gray-300 hover:text-amber-400 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors mt-0.5">
                  <MapPin size={16} className="text-amber-400" />
                </div>
                <span className="text-sm">{siteConfig.address}</span>
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h5 className="font-playfair text-lg font-bold mb-4 flex items-center gap-2">
              <Compass size={20} className="text-amber-400" />
              Quick Links
            </h5>
            <ul className="space-y-2.5">
              {quickLinks.map((link, idx) => (
                <li key={idx} className="group">
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Nearby Destinations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h5 className="font-playfair text-lg font-bold mb-4 flex items-center gap-2">
              <Mountain size={20} className="text-amber-400" />
              Nearby Sacred Sites
            </h5>
            <ul className="space-y-2.5">
              {destinations.map((dest, idx) => (
                <li key={idx} className="text-gray-300 text-sm flex items-center justify-between">
                  <span>{dest.name}</span>
                  <span className="text-amber-400 text-xs font-semibold">{dest.distance}</span>
                </li>
              ))}
            </ul>
            <Link href="/in-around" className="inline-flex items-center gap-2 mt-4 text-amber-400 hover:text-amber-300 text-sm font-semibold transition-colors">
              View All Destinations →
            </Link>
          </motion.div>

          {/* Legal & Social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h5 className="font-playfair text-lg font-bold mb-4">Legal</h5>
            <ul className="space-y-2.5 mb-6">
              {legalLinks.map((link, idx) => {
                const Icon = link.icon
                return (
                  <li key={idx} className="group">
                    <Link href={link.href} className="text-gray-300 hover:text-amber-400 transition-colors flex items-center gap-2">
                      <Icon size={16} className="text-amber-400" />
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <h5 className="font-playfair text-lg font-bold mb-4">Follow Us</h5>
            <div className="flex gap-3">
              <motion.a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center hover:bg-amber-500 text-amber-400 hover:text-white transition-all"
              >
                <Facebook size={18} />
              </motion.a>
              <motion.a
                href={siteConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center hover:bg-amber-500 text-amber-400 hover:text-white transition-all"
              >
                <Instagram size={18} />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black/30 border-t border-gray-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-gray-400">
            <p>© 2025 {siteConfig.hotelName}. All Rights Reserved.</p>
            <p className="flex items-center gap-2">
              <span>Powered by</span>
              <a href={siteConfig.website} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                {siteConfig.shortName}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
