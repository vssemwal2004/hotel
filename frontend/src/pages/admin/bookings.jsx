import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'

export default function AdminBookings(){
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/bookings')
        setRows(data.bookings || [])
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    <AdminLayout>
      <h3 className="text-xl font-semibold">Bookings</h3>
      <div className="mt-4 bg-white rounded-xl shadow p-4">
        {loading ? 'Loading…' : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Guest</th>
                  <th className="py-2 pr-4">Dates</th>
                  <th className="py-2 pr-4">Nights</th>
                  <th className="py-2 pr-4">Items</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(b => (
                  <tr key={b._id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{b.user?.name || b.user?.email}</td>
                    <td className="py-2 pr-4">{new Date(b.checkIn).toLocaleString()} {b.fullDay ? '(Full day)' : `→ ${new Date(b.checkOut).toLocaleString()}`}</td>
                    <td className="py-2 pr-4">{b.nights}</td>
                    <td className="py-2 pr-4">{b.items.map(it=>`${it.title}×${it.quantity}`).join(', ')}</td>
                    <td className="py-2 pr-4">₹{b.total}</td>
                    <td className="py-2 pr-4 capitalize">{b.status}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan="7">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
