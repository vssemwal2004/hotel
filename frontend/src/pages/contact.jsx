import React from 'react'
import MainLayout from '../layouts/MainLayout'

// Contact page: contact details and form
export default function Contact(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Contact Us</h2>
      <p className="text-textsub mt-2">Reach out for bookings, events and inquiries.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="font-semibold">Get in touch</h4>
          <p className="text-textsub mt-2">Phone: +91 98XXXXXXX<br/>Email: hello@krishnahotel.com</p>
          <a href="https://maps.google.com" className="mt-4 inline-block text-primary">Open in Google Maps</a>
        </div>

        <div className="card">
          <h4 className="font-semibold">Send us a message</h4>
          <form className="mt-3 space-y-3">
            <input className="w-full border p-2 rounded" placeholder="Your name" />
            <input className="w-full border p-2 rounded" placeholder="Email" />
            <textarea className="w-full border p-2 rounded" rows="4" placeholder="Message" />
            <button className="btn-primary">Send</button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
