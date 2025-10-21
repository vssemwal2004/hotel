import React from 'react'
import MainLayout from '../../layouts/MainLayout'

// Booking confirmation page with QR placeholder
export default function Confirmation(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Booking Confirmed</h2>
      <p className="text-textsub mt-2">Thank you! Your booking is confirmed. Show this QR at check-in.</p>
      <div className="mt-6 card w-64 h-64 flex items-center justify-center">QR CODE</div>
    </MainLayout>
  )
}
