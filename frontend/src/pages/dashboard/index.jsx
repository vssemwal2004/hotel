import React from 'react'
import MainLayout from '../../layouts/MainLayout'

// User Dashboard: show bookings, quick actions
export default function Dashboard(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">My Dashboard</h2>
      <p className="text-textsub mt-2">Recent bookings and account summary.</p>
    </MainLayout>
  )
}
