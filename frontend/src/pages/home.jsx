import Head from 'next/head'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Header from '../components/header' // Import your custom header
import BookingBar from '../components/BookingBar' // Import BookingBar component
import Footer from '../components/Footer' // Import Footer component
import api from '../utils/api'
import siteConfig from '../utils/siteConfig'

// Animation Components
const FadeIn = ({ children, delay = 0, direction = "up", duration = 0.8 }) => (
  <motion.div
    initial={{ 
      opacity: 0, 
      y: direction === "up" ? 60 : direction === "down" ? -60 : 0,
      x: direction === "left" ? 60 : direction === "right" ? -60 : 0
    }}
    whileInView={{ 
      opacity: 1, 
      y: 0,
      x: 0
    }}
    transition={{ 
      duration, 
      delay,
      ease: [0.25, 0.4, 0.25, 1]
    }}
    viewport={{ once: true, margin: "-50px" }}
  >
    {children}
  </motion.div>
)

const SlideIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ 
      opacity: 0,
      x: -80
    }}
    whileInView={{ 
      opacity: 1,
      x: 0
    }}
    transition={{ 
      duration: 1,
      delay,
      ease: [0.25, 0.4, 0.25, 1]
    }}
    viewport={{ once: true }}
  >
    {children}
  </motion.div>
)

const ScaleIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ 
      opacity: 0,
      scale: 0.8
    }}
    whileInView={{ 
      opacity: 1,
      scale: 1
    }}
    transition={{ 
      duration: 0.7,
      delay,
      ease: "easeOut"
    }}
    viewport={{ once: true }}
  >
    {children}
  </motion.div>
)

export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1])
  
  const [isScrolled, setIsScrolled] = useState(false)
  const [typePrices, setTypePrices] = useState({})
  const [testimonials, setTestimonials] = useState([])
  const [types, setTypes] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Load room type prices
    (async () => {
      try {
        const { data } = await api.get('/room-types')
        const map = {}
  ;(data.types || []).forEach(t => { map[t.key] = t.prices?.roomOnly ?? t.basePrice })
        setTypes(data.types || [])
        setTypePrices(map)
      } catch {}
    })()
  }, [])

  // Fetch top testimonials
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/testimonials?top=3&rating=4')
        console.log('Home page testimonials:', res.data)
        console.log('Number of testimonials:', res.data.length)
        setTestimonials(res.data)
      } catch (error) {
        console.error('Error fetching testimonials:', error)
        console.error('Error details:', error.response?.data || error.message)
      } finally {
        setLoadingTestimonials(false)
      }
    })()
  }, [])

  // Smooth scroll function for navigation
  const handleSmoothScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>Krishna Hotel & Restaurant — Luxury Hill Retreat</title>
        <meta name="description" content="Experience unparalleled luxury and serenity at Krishna Hotel & Restaurant. Premium accommodations with breathtaking hill views and authentic vegetarian cuisine." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Use your custom Header component */}
      <Header />

      <main className="min-h-screen font-inter bg-white text-gray-800 overflow-hidden">
        {/* Luxurious Hero Section with Centered Logo */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-0">
          {/* Parallax Background */}
          <motion.div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: "url('/images/langing page/hotel.webp')",
              scale,
              opacity
            }}
          />
          
          {/* Elegant Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/50" />
          
          {/* Animated Decorative Elements - Adjusted for no overlap */}
          <motion.div
            className="absolute top-32 md:top-40 left-4 md:left-10 w-24 h-24 md:w-32 md:h-32 border border-amber-400/20 rounded-full"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-4 md:right-10 w-28 h-28 md:w-40 md:h-40 border border-amber-400/15 rounded-full"
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/4 w-20 h-20 md:w-24 md:h-24 border border-amber-400/10 rounded-full hidden lg:block"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="space-y-6 md:space-y-8"
            >
              {/* Premium Logo Display - Mobile Optimized */}
              <motion.div
                className="mb-6 md:mb-10"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div
                  className="inline-block relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Glow Effect Behind Logo */}
                  <motion.div
                    className="absolute inset-0 bg-amber-400 rounded-full blur-2xl md:blur-3xl opacity-20 md:opacity-30"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Logo Container - Responsive Sizing */}
                  <div className="relative bg-white/10 backdrop-blur-md rounded-full p-3 sm:p-4 md:p-5 border border-amber-400/40 md:border-2 md:border-amber-400/50 shadow-2xl">
                    <motion.img 
                      src="/images/logo-icon/logo.webp" 
                      alt="Krishna Hotel & Restaurant" 
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain drop-shadow-2xl"
                      animate={{
                        filter: [
                          "drop-shadow(0 0 15px rgba(251, 191, 36, 0.4))",
                          "drop-shadow(0 0 30px rgba(251, 191, 36, 0.7))",
                          "drop-shadow(0 0 15px rgba(251, 191, 36, 0.4))"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Elegant Typography - Mobile Responsive */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="space-y-3 md:space-y-4"
              >
                <motion.h1 
                  className="text-white font-playfair text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-wide"
                  style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}
                >
                  KRISHNA
                  <motion.span 
                    className="block text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-light mt-2 md:mt-3 text-amber-300 tracking-wide md:tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 1 }}
                  >
                    Hotel & Restaurant
                  </motion.span>
                </motion.h1>
                
                {/* Decorative Line - Responsive */}
                <motion.div
                  className="w-20 sm:w-24 md:w-32 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto my-4 md:my-6"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 1.5, delay: 1.2 }}
                />
                
                <motion.p 
                  className="text-white/95 text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed px-4 md:px-0 mb-2 md:mb-4 font-light tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.4 }}
                  style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                >
                  Where Timeless Luxury Embraces the Serenity of the Hills
                </motion.p>

                <motion.p
                  className="text-amber-200/80 text-xs sm:text-sm md:text-base max-w-2xl mx-auto italic px-4 md:px-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.6 }}
                >
                  An unforgettable escape into elegance, comfort, and authentic hospitality
                </motion.p>
              </motion.div>

              {/* Premium CTA Buttons - Mobile Optimized */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center mt-8 md:mt-12 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
              >
                <motion.button 
                  onClick={() => handleSmoothScroll('rooms')}
                  className="w-full sm:w-auto group relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-semibold text-sm sm:text-base md:text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl overflow-hidden"
                  whileHover={{ boxShadow: "0 20px 60px rgba(245, 158, 11, 0.6)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Reserve Your Experience</span>
                    <span className="sm:hidden">Reserve Now</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.button>
                
                <motion.button 
                  onClick={() => handleSmoothScroll('rooms')}
                  className="w-full sm:w-auto group relative border border-white/70 md:border-2 md:border-white/80 hover:border-amber-400 text-white hover:text-amber-400 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full font-semibold text-sm sm:text-base md:text-lg transition-all duration-500 backdrop-blur-md bg-white/5 hover:bg-white/10"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 40px rgba(255, 255, 255, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">
                    <span className="hidden sm:inline">Explore Our Suites</span>
                    <span className="sm:hidden">Explore Suites</span>
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Booking Bar Section - Clean Separate Section - Mobile Optimized */}
        <section id="booking" className="relative py-12 md:py-20 bg-gradient-to-br from-white via-amber-50/30 to-white overflow-hidden scroll-mt-20">
          {/* Decorative subtle background elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-300 rounded-full translate-x-1/2 translate-y-1/2 opacity-10 blur-3xl" />
          
          <div className="container mx-auto px-4 md:px-4 relative z-10">
            <FadeIn>
              <div className="text-center mb-6 md:mb-10">
                <motion.h2 
                  className="text-2xl md:text-4xl font-playfair font-bold text-gray-800 mb-2 md:mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  Reserve Your Stay
                </motion.h2>
                <motion.div 
                  className="w-20 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-3 md:mb-4"
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                />
                <motion.p 
                  className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  Select your dates and experience luxury at Krishna Hotel & Restaurant
                </motion.p>
              </div>
            </FadeIn>
            
            <BookingBar />
            
            {/* Trust Indicators */}
            <FadeIn delay={0.4}>
              <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium">Best Price Guarantee</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium">Instant Confirmation</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-600 text-lg font-bold">✓</span>
                  </div>
                  <span className="font-medium">24/7 Support</span>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* About Section - Mobile Optimized: Image left, text right in one line */}
        <section id="about" className="py-12 md:py-24 bg-gradient-to-br from-amber-50 to-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-300 rounded-full translate-x-1/3 translate-y-1/3 opacity-10" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-16 items-center">
              <SlideIn>
                <div className="relative h-64 md:h-auto">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl"
                  >
                    <img 
                      src="/images/landing page/hotel.webp" 
                      alt="Luxury Hotel" 
                      className="w-full h-64 md:h-[600px] object-cover"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-2xl"
                  >
                    <div className="text-xl md:text-3xl font-bold text-amber-600">15+</div>
                    <div className="text-xs md:text-base text-gray-600">Years of Excellence</div>
                  </motion.div>
                </div>
              </SlideIn>

              <FadeIn delay={0.2} direction="right">
                <div>
                  <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-4 md:mb-6 leading-tight">
                    Experience Unparalleled <span className="text-amber-600">Luxury</span> in the Hills
                  </h2>
                  <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 leading-relaxed">
                    Nestled amidst pristine hills, Krishna Hotel & Restaurant offers a sanctuary where modern luxury harmonizes with natural beauty. Our commitment to exceptional service, authentic vegetarian cuisine, and breathtaking views creates memories that last a lifetime.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
                    {['Luxury Accommodations', 'Panoramic Views', 'Gourmet Dining', '24/7 Service'].map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center space-x-2 md:space-x-3"
                      >
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-600 rounded-full" />
                        </div>
                        <span className="font-medium text-gray-700 text-xs md:text-base">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 md:gap-4">
                    <a
                      href="https://www.google.com/maps/dir//Kedarnath+Rd,+near+heritage+halipad,+Sersi,+Uttarakhand+246471/@30.6072346,78.9354361,12z/data=!3m1!4b1!4m8!4m7!1m0!1m5!1m1!1s0x3908495d3bbab39b:0x479d9bf085c33764!2m2!1d79.0178374!2d30.6072606?entry=ttu&g_ep=EgoyMDI1MTAxNC4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-2 border-gray-300 hover:border-amber-600 text-gray-700 hover:text-amber-600 px-5 md:px-8 py-2.5 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Rooms & Suites - Mobile: 3 cards in one line */}
  <section id="rooms" className="py-16 md:py-24 bg-white scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">Luxury Accommodations</h2>
                <p className="text-sm md:text-xl text-gray-600">Each room is meticulously designed to provide comfort, elegance, and breathtaking views of the surrounding hills.</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 md:gap-8">
              {['deluxe-valley-view','hillside-suite','family-luxury-suite'].map((k, index) => {
                const t = types.find(x=>x.key===k)
                const title = t?.title || (k==='deluxe-valley-view'?'Deluxe Valley View':k==='hillside-suite'?'Hillside Suite':'Family Luxury Suite')
                const img = (t?.coverPhotos && t.coverPhotos[0]?.url) || (t?.photos && t.photos[0]?.url) || `/images/landing page/hotel.webp`
                const features = t?.amenities?.slice(0,3) || (index===0?["King Bed","Mountain View","Free WiFi"]: index===1?["Private Balcony","Panoramic Views","Luxury Bath"]:["Two Bedrooms","Living Area","Special Amenities"]) 
                const price = typePrices[k] ?? (index===0?4500:index===1?6500:8200)
                return (
                  <FadeIn key={k} delay={index * 0.15}>
                    <HomeRoomCard key={k} img={img} title={title} price={price} features={features} photos={[...(t?.coverPhotos||[]), ...(t?.photos||[])]} />
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </section>

        {/* Restaurant Section - Mobile Optimized */}
  <section id="restaurant" className="py-12 md:py-24 bg-gradient-to-br from-gray-50 to-amber-50 scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">Authentic Vegetarian Cuisine</h2>
                <p className="text-sm md:text-xl text-gray-600">Savor the flavors of the hills with our carefully crafted vegetarian dishes made from locally sourced ingredients</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
              <FadeIn delay={0.1}>
                <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-2xl">
                  <img 
                    src="/images/restaurant/restaurant.webp" 
                    alt="Restaurant" 
                    className="w-full h-48 md:h-96 object-cover"
                  />
                </div>
              </FadeIn>
              
              <FadeIn delay={0.2} direction="left">
                <div>
                  <h3 className="text-xl md:text-3xl font-playfair font-bold mb-3 md:mb-6">Culinary Excellence</h3>
                  <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6 leading-relaxed">
                    Our chefs combine traditional recipes with modern techniques to create unforgettable dining experiences. Every dish tells a story of the hills and our commitment to quality.
                  </p>
                  <div className="space-y-2 md:space-y-4 mb-6 md:mb-8">
                    {['Fresh Local Ingredients', 'Traditional Recipes', 'Modern Presentation', 'Seasonal Specialties'].map((item, index) => (
                      <div key={item} className="flex items-center space-x-2 md:space-x-3">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-amber-100 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-600 rounded-full" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm md:text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                  <button className="bg-amber-600 hover:bg-amber-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105">
                    View Menu
                  </button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Enhanced Facilities - 4 tabs in one line on mobile */}
        <section id="experiences" className="py-12 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">World-Class Amenities</h2>
                <p className="text-sm md:text-xl text-gray-600">Designed to enhance your stay with premium services and facilities</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-4 md:grid-cols-4 gap-3 md:gap-6">
              {[
                { icon: "📶", title: "High-Speed WiFi", desc: "Complimentary high-speed internet" },
                { icon: "🍽️", title: "Fine Dining", desc: "Authentic vegetarian cuisine" },
                { icon: "🚗", title: "Valet Parking", desc: "Secure parking facilities" },
                { icon: "🌅", title: "Sunset Deck", desc: "Panoramic viewing platform" },
                { icon: "🔥", title: "Bonfire Nights", desc: "Evening gatherings" },
                { icon: "🏋️", title: "Wellness", desc: "Yoga and meditation sessions" },
                { icon: "🚿", title: "Spa Services", desc: "Relaxing treatments" },
                { icon: "📞", title: "24/7 Service", desc: "Round-the-clock assistance" }
              ].map((facility, index) => (
                <FadeIn key={facility.title} delay={index * 0.05}>
                  <FacilityCard {...facility} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section - Mobile Optimized */}
  <section id="gallery" className="py-12 md:py-24 bg-gradient-to-br from-amber-50 to-white scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">Moments of Bliss</h2>
                <p className="text-sm md:text-xl text-gray-600">Capture the essence of your unforgettable stay through our lens</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg cursor-pointer"
                  >
                    <img 
                      src={`/images/gallery-${i+1}.jpg`} 
                      alt={`Gallery ${i+1}`} 
                      className="w-full h-40 md:h-64 object-cover transition-transform duration-300"
                    />
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials - Mobile Optimized */}
        <section className="py-12 md:py-24 bg-gradient-to-br from-amber-600 to-amber-700 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">Guest Stories</h2>
                <p className="text-sm md:text-xl text-amber-100">Discover what our guests say about their experiences</p>
              </div>
            </FadeIn>

            {loadingTestimonials ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
              </div>
            ) : testimonials.length > 0 ? (
              <>
                <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-8">
                  {testimonials.map((testimonial, index) => (
                    <FadeIn key={testimonial._id} delay={index * 0.2}>
                      <TestimonialCard 
                        name={testimonial.name}
                        rating={testimonial.rating}
                        message={testimonial.message}
                        role={testimonial.role || 'Guest'}
                      />
                    </FadeIn>
                  ))}
                </div>
                <FadeIn delay={0.8}>
                  <div className="text-center mt-8 md:mt-12">
                    <Link href="/testimonials" className="inline-flex items-center gap-2 bg-white text-amber-700 hover:bg-amber-50 px-5 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                      View All Reviews →
                    </Link>
                  </div>
                </FadeIn>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-base md:text-xl text-amber-100 mb-6">Be the first to share your experience!</p>
                <Link href="/testimonials" className="inline-flex items-center gap-2 bg-white text-amber-700 hover:bg-amber-50 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Write a Review →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section - Mobile: 3 tabs in one line */}
  <section id="contact" className="py-12 md:py-24 bg-white scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <FadeIn>
              <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                <h2 className="text-2xl md:text-5xl font-playfair font-bold mb-2 md:mb-4">Get In Touch</h2>
                <p className="text-sm md:text-xl text-gray-600">We'd love to hear from you and help plan your perfect stay</p>
              </div>
            </FadeIn>

            {/* Mobile: 3 columns, Desktop: 2 columns */}
            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-12">
              {/* Address - Mobile Column 1 */}
              <FadeIn delay={0.1}>
                <div className="bg-gray-50 rounded-xl md:rounded-3xl p-3 md:p-8">
                  <div className="flex flex-col items-center md:items-start">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 md:mb-0">
                      <span className="text-amber-600 text-base md:text-xl">📍</span>
                    </div>
                    <div className="text-center md:text-left mt-2 md:mt-4">
                      <div className="font-semibold text-xs md:text-base mb-1">Address</div>
                      <div className="text-gray-600 text-[10px] md:text-base leading-tight">{siteConfig.address}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Phone - Mobile Column 2 */}
              <FadeIn delay={0.15}>
                <div className="bg-gray-50 rounded-xl md:rounded-3xl p-3 md:p-8">
                  <div className="flex flex-col items-center md:items-start">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 md:mb-0">
                      <span className="text-amber-600 text-base md:text-xl">📞</span>
                    </div>
                    <div className="text-center md:text-left mt-2 md:mt-4">
                      <div className="font-semibold text-xs md:text-base mb-1">Phone</div>
                      <div className="text-gray-600 text-[10px] md:text-base">{siteConfig.phone}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>

              {/* Email - Mobile Column 3 */}
              <FadeIn delay={0.2}>
                <div className="bg-gray-50 rounded-xl md:rounded-3xl p-3 md:p-8">
                  <div className="flex flex-col items-center md:items-start">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 md:mb-0">
                      <span className="text-amber-600 text-base md:text-xl">✉️</span>
                    </div>
                    <div className="text-center md:text-left mt-2 md:mt-4">
                      <div className="font-semibold text-xs md:text-base mb-1">Email</div>
                      <div className="text-gray-600 text-[10px] md:text-base break-all">{siteConfig.email}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Message Form - Full Width Below on Mobile */}
            <FadeIn delay={0.3}>
              <div className="bg-amber-50 rounded-2xl md:rounded-3xl p-4 md:p-8 mt-4 md:mt-12">
                <h3 className="text-lg md:text-2xl font-playfair font-bold mb-4 md:mb-6 text-center md:text-left">Send us a Message</h3>
                <form className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <input 
                      type="email" 
                      placeholder="Your Email" 
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Subject" 
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <textarea 
                    placeholder="Your Message" 
                    rows="3"
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  ></textarea>
                  <button 
                    type="submit"
                    className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-6 md:px-8 py-3 md:py-4 text-sm md:text-base rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <FadeIn>
              <h2 className="text-5xl font-playfair font-bold mb-6">Ready for Your Hilltop Retreat?</h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Book your stay today and experience luxury amidst nature's grandeur
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={() => handleSmoothScroll('rooms')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  Book Now
                </button>
                <button 
                  onClick={() => handleSmoothScroll('contact')}
                  className="border-2 border-white text-white hover:bg-white/10 px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
                >
                  Contact Us
                </button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}

function HomeRoomCard({ img, title, price, features, photos = [] }){
  const [isHovered, setIsHovered] = useState(false)
  // Removed per-card booking CTA per request. Single global Book Now is kept at the top.

  return (
    <motion.div
      className="bg-white rounded-xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-xl hover:shadow-xl md:hover:shadow-2xl transition-all duration-500"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -10 }}
    >
      <div className="relative overflow-hidden">
        <motion.img 
          src={img} 
          alt={title}
          className="w-full h-32 md:h-64 object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
          <h3 className="text-xs md:text-2xl font-playfair font-bold leading-tight">{title}</h3>
        </div>
      </div>
      
      <div className="p-3 md:p-6">
        <div className="mb-2 md:mb-4 hidden md:block">
          {features.map((feature, index) => (
            <div key={feature} className="flex items-center text-gray-600 mb-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3" />
              {feature}
            </div>
          ))}
        </div>
        
        {/* Mobile: Show only first feature */}
        <div className="mb-2 md:hidden">
          <div className="flex items-center text-gray-600 text-[10px]">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5" />
            {features[0]}
          </div>
        </div>
        
        <div>
          <span className="text-sm md:text-2xl font-bold text-amber-600">₹{price}</span>
          <span className="text-gray-500 text-[10px] md:text-sm ml-1">/ night</span>
        </div>
      </div>

      {/* Photos modal removed per request */}
    </motion.div>
  )
}

// Enhanced Facility Card Component
function FacilityCard({ icon, title, desc }){
  return (
    <motion.div
      className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center group cursor-pointer"
      whileHover={{ y: -5 }}
    >
      <motion.div 
        className="text-2xl md:text-4xl mb-2 md:mb-4"
        whileHover={{ scale: 1.2, rotate: 5 }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.div>
      <h3 className="font-semibold text-xs md:text-lg mb-1 md:mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 text-[10px] md:text-sm hidden md:block">{desc}</p>
    </motion.div>
  )
}

// Enhanced Testimonial Card Component
function TestimonialCard({ name, rating = 5, message, role }){
  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-3xl p-3 md:p-8 border border-white/20 hover:border-white/40 transition-all duration-300"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 mb-3 md:mb-6">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-400/20 rounded-full flex items-center justify-center text-amber-200 font-semibold text-sm md:text-lg flex-shrink-0">
          {name[0]}
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-semibold text-xs md:text-lg truncate">{name}</h4>
          <p className="text-amber-200 text-[10px] md:text-sm">{role}</p>
          <div className="flex items-center justify-center md:justify-start gap-0.5 md:gap-1 text-amber-300 mt-0.5 md:mt-1">
            {Array.from({ length: rating }).map((_,i) => (
              <motion.span 
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="text-xs md:text-base"
              >★</motion.span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-amber-100 leading-tight md:leading-relaxed italic text-[10px] md:text-base line-clamp-3 md:line-clamp-none">"{message}"</p>
    </motion.div>
  )
}