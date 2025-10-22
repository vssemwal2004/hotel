import React from 'react'
import { motion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import { MapPin, Mountain, Compass, Sparkles } from 'lucide-react'

const DESTINATIONS = [
  { 
    name: 'Kedarnath', 
    distanceKm: 26, 
    image: '/images/around in/Kedarnath_Temple_in_Rainy_season.webp',
    description: 'The sacred site of Kedarnath is believed to have been originally built by the Pandavas of the Mahabharata era to atone for their sins, and later the present form was restored by Adi Shankaracharya in the 8th century A.D. It stands in a high Himalayan valley and is one of the most revered Jyotirlinga sites of Lord Shiva. The temple has survived natural calamities—including the 2013 floods—and continues to draw pilgrims from all over India.'
  },
  { 
    name: 'Badrinath', 
    distanceKm: 212, 
    image: '/images/around in/badrinath.webp',
    description: 'The holy shrine of Badrinath is dedicated to Lord Vishnu and its origins trace to the Vedic period; later it was revived by Adi Shankaracharya who established the current structure around the 8th–9th century. According to legend, Vishnu meditated here in the form of a berry ("Badri") tree to protect himself from the harsh Himalayan climate. The site became one of the major pilgrimage circuits in the Garhwal Himalayas and has undergone repeated restoration over centuries.'
  },
  { 
    name: 'Chopta', 
    distanceKm: 60, 
    image: '/images/around in/chopta.webp',
    description: 'The region of Chopta is a high-meadow hill station in Uttarakhand, known for its lush alpine forests and as the gateway to the Tungnath-Chandrashila trek. Its serene environment has long been a natural refuge and pilgrimage base in the Garhwal Himalayas, combining nature and spiritual exploration. Today it serves as a scenic stop for travelers exploring nearby ancient shrines and Himalayan vistas.'
  },
  { 
    name: 'Tungnath', 
    distanceKm: 64, 
    image: '/images/around in/tungnath.webp',
    description: 'The temple of Tungnath is said to be built by the Pandavas and is the highest of the Panch Kedar temples, located at an altitude of 3,680 m. Mythology holds that Lord Shiva took the form of a bull and hid in the Himalayas, and the Pandavas pursued him, resulting in his arms appearing at Tungnath. The setting is remote yet majestic and has long attracted pilgrims seeking spiritual cleansing amid crisp high-altitude air.'
  },
  { 
    name: 'Madhyamaheshwar', 
    distanceKm: 63, 
    image: '/images/around in/madmaheshwar.webp',
    description: 'The shrine of Madhyamaheshwar (sometimes spelt "Madhmeshwar") is part of the Panch Kedar circuit and is believed to be the spot where Lord Shiva\'s navel or "madhya" appeared in the Himalayas. Legend says the Pandavas travelled here seeking forgiveness for their actions in the Kurukshetra war, and found this sacred site. The temple is tucked away amid towering Himalayan peaks and pristine meadows, offering both pilgrimage and nature\'s serenity.'
  },
  { 
    name: 'Kalimath', 
    distanceKm: 32, 
    image: '/images/around in/kalimath.webp',
    description: 'The temple village of Kalimath is one of the 108 Shakti Peethas, where it is believed Goddess Kali defeated the demon Raktabīja and then submerged underground. The sacred site is unique: rather than an idol, a silver plate (Sri Yantra) covers the spot of the divine event, and it is opened only once a year during Navratri. The village and its temple complex combine mythic power with traditional Himalayan architecture and serene river-valley surroundings.'
  },
  { 
    name: 'Chandrashila', 
    distanceKm: 65, 
    image: '/images/around in/chandrashila.webp',
    description: 'The summit of Chandrashila (meaning "Moon-Rock") is accessible from Chopta/Tungnath and offers sweeping panoramic views of the Garhwal Himalayas including peaks like Nanda Devi. The trek to Chandrashila itself has become iconic for combining spiritual pilgrimage and mountain panorama, with the adjacent Tungnath shrine adding mythic weight. Historically, the region has served as a natural lookout and sacred place of communion between human and divine across generations.'
  },
  { 
    name: 'Omkareshwar (Ukhimath)', 
    distanceKm: 31, 
    image: '/images/around in/omkaleshwar.webp',
    description: 'The sacred town of Ukhimath (also known for its Omkareshwar shrine) is an ancient pilgrimage centre in the Garhwal Himalayas, and during the winter months many idols from higher altitudes are brought here for worship. Historically, the region has had importance as a foothold of Himalayan pilgrimage in the valley and as a winter seat for temples from higher elevations. With its accessible location and rich temple heritage, it has long been a significant stopping point for pilgrims journeying into the high mountain shrines.'
  },
  { 
    name: 'Triyuginarayan Temple', 
    distanceKm: 17, 
    image: '/images/around in/triyugi naryan.webp',
    description: 'The hallowed site of Triyuginarayan Temple is believed to mark the divine wedding of Lord Shiva and Goddess Parvati, with a sacred fire (Akhand Dhuni) that has been burning through the ages ("tri-yuga" meaning three ages). Built around the 8th century (with traditions saying it was built by Adi Shankaracharya), its sanctity is tied to mythic union and eternal flame of devotion.'
  },
]

const FadeInUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    viewport={{ once: true, margin: "-50px" }}
  >
    {children}
  </motion.div>
)

export default function InAroundPage(){
  return (
    <MainLayout>
      {/* Full-Page Hero Banner - Improved Readability */}
      <section className="relative h-screen w-full -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        {/* Background Image with Zoom Animation */}
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="/images/landing page/hotel.webp"
            alt="Hotel Krishna & sacred Himalayan destinations"
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Stronger Dark Overlay for Better Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/85" />
        
        {/* Subtle Animated floating elements - less distracting */}
        <motion.div
          className="absolute top-20 left-10 w-24 h-24 border border-amber-400/20 rounded-full hidden md:block"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.08, 1]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-32 h-32 border border-amber-400/15 rounded-full hidden md:block"
          animate={{ 
            rotate: [360, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Content Container with Better Spacing */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-20">
          
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-4 sm:mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md rounded-full border border-white/30 text-white shadow-xl">
              <Compass size={16} className="text-amber-400" />
              <span className="text-xs sm:text-sm font-semibold">Discover Sacred Destinations</span>
            </div>
          </motion.div>

          {/* Main Heading - More Readable Sizes */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-playfair tracking-wide mb-4 sm:mb-6"
          >
            <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-2 sm:mb-3 drop-shadow-2xl">
              In & Around
            </span>
            <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-amber-300 tracking-wider drop-shadow-xl">
              Krishna Hotel
            </span>
          </motion.h1>

          {/* Description - Better Line Height and Spacing */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-4 sm:mt-6 text-white text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed drop-shadow-lg px-4"
          >
            Explore ancient temples, sacred shrines, pristine meadows, and breathtaking Himalayan treks. 
            Journey through mythic landscapes where nature meets divinity.
          </motion.p>

          {/* Stats Badges - Mobile Friendly */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-white/90"
          >
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg">
              <Mountain size={20} className="text-amber-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">9 Sacred Sites</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg">
              <MapPin size={20} className="text-amber-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">17-212 km</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg">
              <Sparkles size={20} className="text-amber-400" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">Ancient Heritage</span>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-white/70 flex flex-col items-center gap-2"
            >
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider">SCROLL TO EXPLORE</span>
              <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-1">
                <motion.div 
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <FadeInUp>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-playfair mb-6">
              Sacred Journeys Await
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              From the divine heights of Kedarnath to the eternal flame of Triyuginarayan, each destination near our hotel 
              carries centuries of spiritual heritage and natural wonder. Let your journey through the Garhwal Himalayas 
              be a pilgrimage of both faith and discovery.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* Destinations - Premium Cards */}
      <section className="py-12 md:py-16 bg-white">
        <div className="space-y-12 md:space-y-16">
          {DESTINATIONS.map((destination, idx) => (
            <FadeInUp key={destination.name} delay={idx * 0.1}>
              <motion.article 
                className="group bg-gradient-to-br from-white to-amber-50/30 rounded-3xl shadow-xl border-2 border-amber-100 overflow-hidden hover:shadow-2xl transition-all duration-500"
                whileHover={{ scale: 1.01, y: -5 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Image - Left */}
                  <div className="lg:col-span-5 relative h-64 md:h-80 lg:h-96 overflow-hidden">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Overlay badge */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="absolute top-5 left-5"
                    >
                      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-amber-600" />
                          <span className="font-bold text-amber-700">{destination.distanceKm} km</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Content - Right */}
                  <div className="lg:col-span-7 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      {/* Destination name */}
                      <div className="mb-5">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-playfair mb-2 group-hover:text-amber-600 transition-colors duration-300">
                          {destination.name}
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full group-hover:w-32 transition-all duration-500" />
                      </div>

                      {/* Description with hover reveal effect */}
                      <motion.p 
                        className="text-gray-700 leading-relaxed text-base md:text-lg mb-6"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                      >
                        {destination.description}
                      </motion.p>

                      {/* Action badges */}
                      <div className="flex flex-wrap gap-3">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-200 cursor-pointer"
                        >
                          <Mountain size={18} className="text-amber-700" />
                          <span className="text-sm font-semibold text-amber-800">Sacred Site</span>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-200 cursor-pointer"
                        >
                          <Compass size={18} className="text-blue-700" />
                          <span className="text-sm font-semibold text-blue-800">Plan Visit</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.article>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <FadeInUp>
            <h2 className="text-3xl md:text-5xl font-bold font-playfair mb-6">
              Begin Your Spiritual Journey
            </h2>
            <p className="text-lg md:text-xl text-amber-100 mb-8 leading-relaxed">
              Stay with us at Krishna Hotel and explore the divine heritage of the Garhwal Himalayas. 
              Let our location be your gateway to ancient temples, sacred peaks, and timeless stories.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/#booking'}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-amber-700 font-bold text-lg rounded-full shadow-2xl hover:bg-amber-50 transition-all"
            >
              <span>Book Your Stay</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
          </FadeInUp>
        </div>
      </section>
    </MainLayout>
  )
}
