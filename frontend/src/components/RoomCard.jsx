import React from 'react'

// RoomCard shows brief info for a room with image, title, price and book button
export default function RoomCard({room}){
  return (
    <div className="card hover:shadow-lg">
      <div className="h-44 bg-gray-200 rounded-lg overflow-hidden mb-3">
        <img src={room?.image || '/images/room-sample.jpg'} alt={room?.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="font-semibold text-textmain">{room?.name || 'Deluxe Room'}</h3>
      <p className="text-textsub text-sm mt-1">{room?.desc || 'Comfortable stay with breakfast included.'}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-lg font-bold">₹{room?.price || '3500'}</div>
        <a href="/booking" className="px-3 py-1 bg-primary text-white rounded">Book</a>
      </div>
    </div>
  )
}
