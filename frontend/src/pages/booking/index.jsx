import React from 'react'
import MainLayout from '../../layouts/MainLayout'
import BookingCard from '../../components/BookingCard'

// Booking flow: simple cart + checkout placeholder
export default function BookingIndex(){
  const cart = [{room:'Deluxe Room', dates:'3 Aug - 5 Aug', amount:7000}]
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Your Booking</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div>
          {cart.map((c,i)=> <BookingCard key={i} booking={c} />)}
        </div>
        <div className="card">
          <h4 className="font-semibold">Payment</h4>
          <p className="text-textsub mt-2">Payment integration placeholder. Connect your gateway here.</p>
          <button className="mt-4 btn-primary">Pay ₹{cart.reduce((s,a)=>s+a.amount,0)}</button>
        </div>
      </div>
    </MainLayout>
  )
}
