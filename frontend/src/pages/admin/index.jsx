import React from 'react'
import AdminLayout from '../../layouts/AdminLayout'

// Admin dashboard overview with key stats (charts integration placeholder)
export default function AdminIndex(){
  return (
    <AdminLayout>
      <h2 className="text-2xl font-semibold">Admin Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="card">Total bookings<br/>123</div>
        <div className="card">Revenue<br/>₹1,23,456</div>
        <div className="card">Rooms<br/>24</div>
      </div>
    </AdminLayout>
  )
}
