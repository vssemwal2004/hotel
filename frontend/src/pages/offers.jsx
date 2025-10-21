import React from 'react'
import MainLayout from '../layouts/MainLayout'

// Offers page: seasonal promotions
export default function Offers(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Offers & Promotions</h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h4 className="font-semibold">Weekend Staycation</h4>
          <p className="text-textsub">Stay 2 nights, get 1 free breakfast.</p>
        </div>
      </div>
    </MainLayout>
  )
}
