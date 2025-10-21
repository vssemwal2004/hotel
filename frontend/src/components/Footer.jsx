import React from 'react'
import { Facebook, Twitter, Instagram } from 'lucide-react'

// Footer with hotel info and quick links
export default function Footer(){
  return (
    <footer className="bg-dark text-background mt-12">
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-playfair text-lg">Krishna Hotel & Restaurant</h4>
          <p className="text-textsub mt-2">123 Temple Road, Holy City, 560001</p>
          <p className="text-textsub">Phone: +91 98XXXXXXX</p>
        </div>

        <div>
          <h5 className="font-semibold">Useful Links</h5>
          <ul className="mt-2 text-textsub">
            <li><a href="/rooms">Rooms</a></li>
            <li><a href="/offers">Offers</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-semibold">Follow Us</h5>
          <div className="flex gap-3 mt-2">
            <a className="p-2 bg-white rounded-full text-dark"><Facebook size={16} /></a>
            <a className="p-2 bg-white rounded-full text-dark"><Twitter size={16} /></a>
            <a className="p-2 bg-white rounded-full text-dark"><Instagram size={16} /></a>
          </div>
        </div>
      </div>
      <div className="bg-black/10 text-center py-3 text-sm">© {new Date().getFullYear()} Krishna Hotel & Restaurant</div>
    </footer>
  )
}
