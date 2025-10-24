import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../layouts/WorkerLayout'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../utils/api'

export default function WorkerPage(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [all, setAll] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const authorized = useMemo(() => {
    if (!user) return false
    return user.role === 'worker' || user.role === 'admin'
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  // Load all bookings on mount for worker/admin
  useEffect(() => {
    if (!authorized) return
    (async () => {
      try {
        const { data } = await api.get('/bookings')
        setAll(data.bookings || [])
      } catch (e) {
        console.warn('Failed to fetch all bookings', e?.response?.data || e?.message)
      }
    })()
  }, [authorized])

  const doSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) {
      // If query cleared, restore full list
      setResults([])
      return
    }
    setError('')
    setSearching(true)
    try {
      const { data } = await api.get('/bookings/search', { params: { q: query.trim() } })
      setResults(data.bookings || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const markPaid = async (id) => {
    try {
      await api.post(`/bookings/${id}/pay`)
      setResults(prev => prev.map(b => b._id === id ? { ...b, status: 'paid' } : b))
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to mark as paid')
    }
  }

  const checkout = async (id) => {
    try {
      await api.post(`/bookings/${id}/checkout`)
      setResults(prev => prev.map(b => b._id === id ? { ...b, status: 'completed' } : b))
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to checkout')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—'

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading…</div>
      </WorkerLayout>
    )
  }

  return (
  <WorkerLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Worker Desk</h1>
        <form onSubmit={doSearch} className="flex gap-3 mb-6">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search by guest email, name, or booking ID"
            className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <button type="submit" disabled={searching} className="bg-red-600 text-white px-5 rounded-xl hover:bg-red-700 disabled:opacity-50">
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {(results.length === 0 ? all : results).length === 0 ? (
          <div className="text-gray-600">No bookings found.</div>
        ) : (
          <div className="grid gap-4">
            {(results.length === 0 ? all : results).map(b => (
              <div key={b._id} className="border rounded-2xl p-4 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-500">Booking ID</div>
                    <div className="font-mono text-sm">{b._id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Guest</div>
                    <div className="font-medium">{b.user?.name} <span className="text-gray-500">({b.user?.email})</span></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <span className={`px-3 py-1 rounded-full text-sm ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-semibold">₹{b.total?.toLocaleString?.() || b.total}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Check-in</div>
                    <div>{formatDate(b.checkIn)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Check-out</div>
                    <div>{formatDate(b.checkOut)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Nights / Full day</div>
                    <div>{b.fullDay ? 'Full day' : `${b.nights} night(s)`}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2">Rooms & Guests</div>
                  <div className="grid gap-2">
                    {(b.items || []).map((it, idx) => {
                      const adults = (it.guests || []).filter(g=>g.type==='adult').length
                      const children = (it.guests || []).filter(g=>g.type==='child').length
                      return (
                        <div key={idx} className="rounded-xl border p-3 bg-gray-50 flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-gray-600">Qty: {it.quantity}</div>
                          <div className="text-gray-600">Guests: {adults} adults, {children} children</div>
                          <div className="text-gray-600">Subtotal: ₹{it.subtotal?.toLocaleString?.() || it.subtotal}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  {b.status !== 'paid' && b.status !== 'completed' && (
                    <button onClick={()=>markPaid(b._id)} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                      Mark as Paid
                    </button>
                  )}
                  {b.status === 'paid' && (
                    <button onClick={()=>checkout(b._id)} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                      Checkout
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkerLayout>
  )
}
