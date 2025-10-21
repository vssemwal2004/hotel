import React from 'react'

// BookingCard displays a simplified booking summary or cart item
export default function BookingCard({booking}){
  return (
    <div className="card flex items-center gap-4">
      <div className="w-24 h-20 bg-gray-200 rounded overflow-hidden">
        <img src={booking?.image || '/images/room-sample.jpg'} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{booking?.room || 'Deluxe Room'}</h4>
        <p className="text-textsub text-sm">{booking?.dates || '3 Aug - 5 Aug'}</p>
      </div>
      <div className="text-right">
        <div className="font-bold">₹{booking?.amount || '7000'}</div>
      </div>
    </div>
  )
}
