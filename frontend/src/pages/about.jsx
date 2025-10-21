import React from 'react'
import MainLayout from '../layouts/MainLayout'

// About page: tells story of the hotel
export default function About(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">About Us</h2>
      <p className="text-textsub mt-3">Krishna Hotel & Restaurant has been serving guests since 1998 with a focus on hospitality and delicious meals.</p>
    </MainLayout>
  )
}
