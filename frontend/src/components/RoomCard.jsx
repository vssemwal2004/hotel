import React from 'react'
import { useRouter } from 'next/router'
import { useAuthContext } from '../context/AuthContext'

// RoomCard shows brief info for a room with image, title, price and book button
export default function RoomCard({room}){
  const router = useRouter()
  const { user } = useAuthContext()

  const handleRoomClick = () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page
      router.push('/auth/login')
    } else {
      // Navigate to booking page to see room details
      router.push('/booking')
    }
  }

  return (
    <div 
      className="card hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-105" 
      onClick={handleRoomClick}
    >
      <div className="h-44 bg-gray-200 rounded-lg overflow-hidden mb-3">
        <img src={room?.image || '/images/room-sample.jpg'} alt={room?.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="font-semibold text-textmain">{room?.name || 'Deluxe Room'}</h3>
      <p className="text-textsub text-sm mt-1">{room?.desc || 'Comfortable stay with breakfast included.'}</p>
      <div className="mt-3">
        <div className="text-lg font-bold">₹{room?.price || '3500'}</div>
      </div>
    </div>
  )
}
