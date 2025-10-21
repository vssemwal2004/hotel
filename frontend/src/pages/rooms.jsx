import React from 'react'
import MainLayout from '../layouts/MainLayout'
import RoomCard from '../components/RoomCard'

// Rooms page: displays a grid of available rooms
const sampleRooms = [
  { id:1, name:'Deluxe Room', price:3500, image:'/images/room1.jpg' },
  { id:2, name:'Suite', price:6500, image:'/images/room2.jpg' },
  { id:3, name:'Standard', price:2500, image:'/images/room3.jpg' }
]

export default function Rooms(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Our Rooms</h2>
      <p className="text-textsub mt-2">Choose from our comfortable rooms</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {sampleRooms.map(r => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </MainLayout>
  )
}
