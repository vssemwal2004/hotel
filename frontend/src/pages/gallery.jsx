import React from 'react'
import MainLayout from '../layouts/MainLayout'

// Gallery page: showcase images
export default function Gallery(){
  const images = ['/images/room1.jpg','/images/room2.jpg','/images/hotel-hero.jpg']
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Gallery</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {images.map((src,i)=> (
          <div className="h-44 bg-gray-200 rounded overflow-hidden" key={i}><img src={src} className="w-full h-full object-cover"/></div>
        ))}
      </div>
    </MainLayout>
  )
}
