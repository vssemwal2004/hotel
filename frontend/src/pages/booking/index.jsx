import React, { useEffect, useMemo, useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import api from '../../utils/api'
import { useRouter } from 'next/router'

function diffNights(checkIn, checkOut, fullDay){
  if (fullDay) return 1
  if (!checkIn || !checkOut) return 1
  const s = new Date(checkIn)
  const e = new Date(checkOut)
  const ms = 24*60*60*1000
  const n = Math.ceil((e - s) / ms)
  return Math.max(1, n)
}

export default function BookingIndex(){
  const router = useRouter()
  const { checkIn:qi, checkOut:qo, fullDay:fd } = router.query
  const [types, setTypes] = useState([])
  const [cart, setCart] = useState([]) // {key,title,basePrice,quantity,guests:[]}
  const [selecting, setSelecting] = useState(null) // room type object being selected
  const [quantity, setQuantity] = useState(1)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [guests, setGuests] = useState([])
  const [packageType, setPackageType] = useState('roomOnly')
  const [extraBeds, setExtraBeds] = useState(0)
  const [extraPersons, setExtraPersons] = useState(0)
  const [creating, setCreating] = useState(false)

  const checkIn = useMemo(()=> Array.isArray(qi)?qi[0]:qi, [qi])
  const checkOut = useMemo(()=> Array.isArray(qo)?qo[0]:qo, [qo])
  const fullDay = useMemo(()=> fd === '1' || fd === 'true', [fd])
  const nights = useMemo(()=> diffNights(checkIn, checkOut, fullDay), [checkIn, checkOut, fullDay])

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/room-types')
      setTypes(data.types || [])
    })()
  }, [])

  useEffect(() => {
    // Build guest fields when counts change
    const total = adults + children
    const next = []
    for (let i=0;i<total;i++){
      next.push({ name: guests[i]?.name || '', age: guests[i]?.age || '', type: i < adults ? 'adult' : 'child' })
    }
    setGuests(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, children])

  const addToCart = (t) => {
    setSelecting(t)
    setQuantity(1)
    setAdults(2)
    setChildren(0)
    setGuests([])
    setPackageType('roomOnly')
    setExtraBeds(0)
    setExtraPersons(0)
  }

  const confirmAdd = () => {
    if (!selecting) return
    if (quantity < 1) return alert('Select at least 1 room')
    if (selecting.count === 0) return alert('Rooms full')
    if (quantity > selecting.count) return alert(`Only ${selecting.count} rooms available`)
    const item = {
      key: selecting.key,
      title: selecting.title,
      basePrice: (selecting.prices?.[packageType] ?? selecting.basePrice),
      quantity,
      packageType,
      extraBeds,
      extraPersons,
      guests: guests.map(g => ({ name: g.name || 'Guest', age: Number(g.age||0), type: g.type }))
    }
    setCart(prev => [...prev, item])
    setSelecting(null)
  }

  const lineTotal = (c) => {
    const combo = c.basePrice * c.quantity
    const extras = ((selecting?.extraBedPerPerson ?? 0) * 0) // placeholder not used in cart items
    return combo * nights
  }
  const total = useMemo(() => cart.reduce((s,a)=> s + (a.basePrice * a.quantity * nights) + (nights * ((types.find(t=>t.key===a.key)?.extraBedPerPerson||0) * (a.extraBeds||0) + (types.find(t=>t.key===a.key)?.extraPersonPerNight||0) * (a.extraPersons||0))), 0), [cart, nights, types])

  const createAndPay = async () => {
    if (!checkIn || (!fullDay && !checkOut)) return alert('Missing dates')
    if (cart.length === 0) return alert('Add at least one room')
    setCreating(true)
    try {
      const payload = {
        checkIn,
        fullDay,
        items: cart.map(c => ({ roomTypeKey: c.key, quantity: c.quantity, packageType: c.packageType, extraBeds: c.extraBeds, extraPersons: c.extraPersons, guests: c.guests })),
        ...(fullDay ? {} : { checkOut })
      }
      const { data } = await api.post('/bookings', payload)
      const bookingId = data.booking?._id
      await api.post(`/bookings/${bookingId}/pay`)
      router.push('/booking/confirmation')
    } catch (e) {
      alert(e?.response?.data?.message || 'Payment failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl mb-2">Choose Your Stay</h2>
      <div className="text-sm text-textsub mb-6">{fullDay ? `Full day on ${new Date(checkIn||'').toLocaleString()}` : `From ${new Date(checkIn||'').toLocaleString()} to ${new Date(checkOut||'').toLocaleString()} • ${nights} night(s)`}</div>
      <div className="grid lg:grid-cols-3 gap-6">
        {types.map(t => (
          <div key={t._id} className="bg-white rounded-2xl shadow p-5 flex flex-col">
            <div className="flex-1">
              <div className="text-lg font-semibold">{t.title}</div>
              <div className="text-amber-600 font-bold mt-1">₹{t.prices?.roomOnly ?? t.basePrice} <span className="text-gray-500 font-normal text-sm">/ night (Room Only)</span></div>
              <div className="text-gray-700 text-sm mt-1">Breakfast: ₹{t.prices?.roomBreakfast ?? t.basePrice} • Brk+Dinner: ₹{t.prices?.roomBreakfastDinner ?? t.basePrice}</div>
              {(t.extraBedPerPerson>0 || t.extraPersonPerNight>0) && (
                <div className="text-gray-600 text-xs mt-1">Extra bed: ₹{t.extraBedPerPerson||0}/person/night • Addl person: ₹{t.extraPersonPerNight||0}/night</div>
              )}
              <div className="mt-3">
                {(t.amenities||[]).length ? (
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    {t.amenities.map(a => <li key={a}>{a}</li>)}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">No amenities listed</div>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className={`text-sm ${t.count>0? 'text-green-600':'text-red-600'}`}>{t.count>0 ? `${t.count} room(s) available` : 'Rooms full'}</div>
              <button disabled={t.count===0} onClick={()=>addToCart(t)} className={`px-4 py-2 rounded-md text-white ${t.count===0?'bg-gray-400':'bg-amber-600 hover:bg-amber-700'}`}>Book</button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart */}
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow p-5">
          <h3 className="font-semibold mb-4">Cart</h3>
          {cart.length === 0 && <div className="text-gray-500 text-sm">No rooms selected yet.</div>}
          <ul className="space-y-3">
            {cart.map((c,i)=> (
              <li key={i} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.title} × {c.quantity} — {c.packageType.replace('room','Room ').replace('Breakfast','+ Breakfast').replace('Dinner','+ Dinner')}</div>
                  <div className="text-xs text-gray-500">{c.guests.length} guest(s)</div>
                  {(c.extraBeds||0) > 0 && <div className="text-xs text-gray-500">Extra beds: {c.extraBeds}</div>}
                  {(c.extraPersons||0) > 0 && <div className="text-xs text-gray-500">Additional persons: {c.extraPersons}</div>}
                </div>
                <div className="font-semibold">₹{(c.basePrice * c.quantity * nights) + (nights * ((types.find(t=>t.key===c.key)?.extraBedPerPerson||0) * (c.extraBeds||0) + (types.find(t=>t.key===c.key)?.extraPersonPerNight||0) * (c.extraPersons||0)) )}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 h-max">
          <h3 className="font-semibold mb-2">Summary</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Nights</span><span>{nights}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>Subtotal</span><span>₹{total}</span>
          </div>
          <button disabled={creating || cart.length===0} onClick={createAndPay} className="mt-4 w-full px-4 py-2 bg-amber-600 text-white rounded-md disabled:opacity-60">{creating? 'Processing…' : `Pay ₹${total}`}</button>
        </div>
      </div>

      {/* Selection Modal */}
      {selecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setSelecting(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg p-6">
            <h4 className="font-semibold text-lg">{selecting.title}</h4>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium">Rooms</label>
                <input type="number" min={1} max={selecting.count||1} value={quantity} onChange={e=>setQuantity(Number(e.target.value||1))} className="mt-1 w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Adults</label>
                <input type="number" min={0} value={adults} onChange={e=>setAdults(Number(e.target.value||0))} className="mt-1 w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium">Children</label>
                <input type="number" min={0} value={children} onChange={e=>setChildren(Number(e.target.value||0))} className="mt-1 w-full border rounded-md p-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium">Package</label>
                <select value={packageType} onChange={e=>setPackageType(e.target.value)} className="mt-1 w-full border rounded-md p-2">
                  <option value="roomOnly">Room Only — ₹{selecting.prices?.roomOnly ?? selecting.basePrice}</option>
                  <option value="roomBreakfast">Room + Breakfast — ₹{selecting.prices?.roomBreakfast ?? selecting.basePrice}</option>
                  <option value="roomBreakfastDinner">Room + Breakfast + Dinner — ₹{selecting.prices?.roomBreakfastDinner ?? selecting.basePrice}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Extra Beds (people)</label>
                <input type="number" min={0} value={extraBeds} onChange={e=>setExtraBeds(Number(e.target.value||0))} className="mt-1 w-full border rounded-md p-2" />
                <div className="text-xs text-gray-500 mt-1">₹{selecting.extraBedPerPerson||0} per person/night</div>
              </div>
              <div>
                <label className="block text-sm font-medium">Additional Persons</label>
                <input type="number" min={0} value={extraPersons} onChange={e=>setExtraPersons(Number(e.target.value||0))} className="mt-1 w-full border rounded-md p-2" />
                <div className="text-xs text-gray-500 mt-1">₹{selecting.extraPersonPerNight||0} per night</div>
              </div>
            </div>
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
              {guests.map((g,idx)=> (
                <div key={idx} className="grid grid-cols-6 gap-2 items-end">
                  <div className="col-span-3">
                    <label className="block text-xs text-gray-600">Name ({g.type})</label>
                    <input value={g.name} onChange={e=> setGuests(prev => prev.map((x,i)=> i===idx?{...x,name:e.target.value}:x))} className="mt-1 w-full border rounded-md p-2 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600">Age</label>
                    <input type="number" min={0} value={g.age} onChange={e=> setGuests(prev => prev.map((x,i)=> i===idx?{...x,age:e.target.value}:x))} className="mt-1 w-full border rounded-md p-2 text-sm" />
                  </div>
                  <div className="col-span-1 text-right text-xs text-gray-500">#{idx+1}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={()=>setSelecting(null)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="button" onClick={confirmAdd} className="px-4 py-2 bg-amber-600 text-white rounded-md">Add to cart</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
