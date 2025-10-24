import React, { useEffect, useMemo, useState } from 'react'
import WorkerLayout from '../../layouts/WorkerLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'
import api from '../../utils/api'

export default function WorkerAllot(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const authorized = useMemo(()=> user && (user.role==='worker' || user.role==='admin'), [user])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [fullDay, setFullDay] = useState(false)
  const [checkOut, setCheckOut] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [roomTypeKey, setRoomTypeKey] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [markPaid, setMarkPaid] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    if (loading) return
    if (!authorized) router.replace('/auth/login')
  }, [authorized, loading, router])

  useEffect(()=>{
    (async ()=>{
      try {
        const { data } = await api.get('/room-types')
        const types = data?.types || []
        setRoomTypes(types)
        if (!roomTypeKey && types[0]?.key) setRoomTypeKey(types[0].key)
      } catch {}
    })()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setResult(null)
    try {
      const guests = [
        ...Array(Math.max(0, adults)).fill({ type: 'adult', name: 'Adult', age: 21 }),
        ...Array(Math.max(0, children)).fill({ type: 'child', name: 'Child', age: 8 })
      ]
      const payload = {
        user: { name, email },
        checkIn,
        fullDay,
        ...(fullDay ? {} : { checkOut }),
        items: [ { roomTypeKey, quantity: Number(quantity), guests } ],
        paid: markPaid
      }
      const { data } = await api.post('/bookings/manual', payload)
      setResult(data.booking)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to allot room')
    } finally { setSaving(false) }
  }

  if (loading || !authorized) {
    return (
      <WorkerLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading…</div>
      </WorkerLayout>
    )
  }

  return (
    <WorkerLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Room Allotment (Offline)</h1>
        <form onSubmit={submit} className="grid gap-4 bg-white p-4 rounded-2xl border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded-xl px-3 py-2" placeholder="Guest name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border rounded-xl px-3 py-2" placeholder="Guest email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Check-in</label>
              <input type="datetime-local" className="border rounded-xl px-3 py-2 w-full" value={checkIn} onChange={e=>setCheckIn(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <input id="fullday" type="checkbox" checked={fullDay} onChange={e=>setFullDay(e.target.checked)} />
              <label htmlFor="fullday" className="text-sm">Full day</label>
            </div>
            {!fullDay && (
              <div>
                <label className="text-sm text-gray-600">Check-out</label>
                <input type="datetime-local" className="border rounded-xl px-3 py-2 w-full" value={checkOut} onChange={e=>setCheckOut(e.target.value)} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-gray-600">Room Type</label>
              <select className="border rounded-xl px-3 py-2 w-full" value={roomTypeKey} onChange={e=>setRoomTypeKey(e.target.value)}>
                {roomTypes.map(rt => (<option key={rt.key} value={rt.key}>{rt.title}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Quantity</label>
              <input type="number" min={1} className="border rounded-xl px-3 py-2 w-full" value={quantity} onChange={e=>setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Adults</label>
              <input type="number" min={0} className="border rounded-xl px-3 py-2 w-full" value={adults} onChange={e=>setAdults(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Children</label>
              <input type="number" min={0} className="border rounded-xl px-3 py-2 w-full" value={children} onChange={e=>setChildren(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="markpaid" type="checkbox" checked={markPaid} onChange={e=>setMarkPaid(e.target.checked)} />
            <label htmlFor="markpaid" className="text-sm">Mark as paid (decrement availability now)</label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Saving…' : 'Allot Room'}</button>
          </div>
          {error && <div className="text-red-600">{error}</div>}
          {result && (
            <div className="text-green-700">Created booking #{result._id} for {result.user?.name} ({result.user?.email}) — status: {result.status}</div>
          )}
        </form>
      </div>
    </WorkerLayout>
  )
}
