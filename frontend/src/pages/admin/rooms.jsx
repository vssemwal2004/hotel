import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { useForm } from 'react-hook-form'
import api from '../../utils/api'

const typeOptions = [
  { key: 'deluxe-valley-view', title: 'Deluxe Valley View' },
  { key: 'hillside-suite', title: 'Hillside Suite' },
  { key: 'family-luxury-suite', title: 'Family Luxury Suite' }
]

export default function AdminRooms(){
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      key: 'deluxe-valley-view',
      title: 'Deluxe Valley View',
      basePrice: 0,
      prices: { roomOnly: 0, roomBreakfast: 0, roomBreakfastDinner: 0 },
      extraBedPerPerson: 0,
      extraPersonPerNight: 0,
      status: 'available',
      amenities: [],
      count: 0,
      description: ''
    }
  })
  const [types, setTypes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const loadTypes = async () => {
    const { data } = await api.get('/room-types')
    setTypes(data.types || [])
  }

  useEffect(() => { loadTypes() }, [])

  const onSubmit = async (form) => {
    setLoading(true)
    try {
      const payload = {
        key: form.key,
        title: typeOptions.find(t=>t.key===form.key)?.title || form.title,
        basePrice: Number(form.basePrice),
        prices: {
          roomOnly: Number(form.prices?.roomOnly ?? form.basePrice),
          roomBreakfast: Number(form.prices?.roomBreakfast ?? form.basePrice),
          roomBreakfastDinner: Number(form.prices?.roomBreakfastDinner ?? form.basePrice)
        },
        extraBedPerPerson: Number(form.extraBedPerPerson || 0),
        extraPersonPerNight: Number(form.extraPersonPerNight || 0),
        status: form.status,
        amenities: Array.isArray(form.amenities) ? form.amenities : (form.amenities ? [form.amenities] : []),
        count: Number(form.count),
        description: form.description || ''
      }
      const fd = new FormData()
      fd.append('data', JSON.stringify(payload))
      ;(files || []).forEach(f => fd.append('photos', f))
      if (editingId) {
        await api.put(`/room-types/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/room-types', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      reset()
      setFiles([])
      setEditingId(null)
      await loadTypes()
    } catch (e) {
      alert(e?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const onTypeChange = (e) => {
    const key = e.target.value
    const t = typeOptions.find(x=>x.key===key)
    setValue('key', key)
    setValue('title', t?.title || '')
  }

  const startEdit = (t) => {
    setEditingId(t._id)
    setValue('key', t.key)
    setValue('title', t.title)
    setValue('basePrice', t.basePrice)
    setValue('prices.roomOnly', t.prices?.roomOnly ?? t.basePrice)
    setValue('prices.roomBreakfast', t.prices?.roomBreakfast ?? t.basePrice)
    setValue('prices.roomBreakfastDinner', t.prices?.roomBreakfastDinner ?? t.basePrice)
    setValue('extraBedPerPerson', t.extraBedPerPerson || 0)
    setValue('extraPersonPerNight', t.extraPersonPerNight || 0)
    setValue('status', t.status || 'available')
    setValue('amenities', t.amenities || [])
    setValue('count', t.count || 0)
    setValue('description', t.description || '')
    setFiles([])
  }

  const amenitiesOptions = ['AC','TV','WiFi','Breakfast']
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'maintenance', label: 'Maintenance' }
  ]

  return (
    <AdminLayout>
      <h3 className="text-xl font-semibold">Manage Room Types</h3>
      <div className="mt-6 grid md:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Room Type</label>
              <select {...register('key')} onChange={onTypeChange} className="mt-1 w-full border rounded-md p-2">
                {typeOptions.map(t => <option key={t.key} value={t.key}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Base Price per Night (₹)</label>
              <input type="number" min="0" step="0.01" {...register('basePrice')} className="mt-1 w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Room Only (₹)</label>
              <input type="number" min="0" step="0.01" {...register('prices.roomOnly')} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Room + Breakfast (₹)</label>
              <input type="number" min="0" step="0.01" {...register('prices.roomBreakfast')} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Room + Breakfast + Dinner (₹)</label>
              <input type="number" min="0" step="0.01" {...register('prices.roomBreakfastDinner')} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Extra Bed (₹ per person/night)</label>
              <input type="number" min="0" step="0.01" {...register('extraBedPerPerson')} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Additional Person Charge (₹/night)</label>
              <input type="number" min="0" step="0.01" {...register('extraPersonPerNight')} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Availability Status</label>
              <select {...register('status')} className="mt-1 w-full border rounded-md p-2">
                {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Number of Rooms</label>
              <input type="number" min="0" {...register('count')} className="mt-1 w-full border rounded-md p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Amenities</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {amenitiesOptions.map(a => (
                <label key={a} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" value={a} {...register('amenities')} /> {a}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Photos (optional)</label>
            <input type="file" accept="image/*" multiple onChange={(e)=> setFiles(Array.from(e.target.files||[]))} className="mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows="3" {...register('description')} className="mt-1 w-full border rounded-md p-2" placeholder="Type description…" />
          </div>

          <div className="flex gap-3">
            <button disabled={loading} type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-md">{editingId ? 'Update Type' : 'Save Type'}</button>
            {editingId && (
              <button type="button" className="px-4 py-2 border rounded-md" onClick={()=>{ setEditingId(null); reset(); setFiles([]) }}>Cancel</button>
            )}
          </div>
        </form>

        {/* Types list */}
        <div className="bg-white rounded-xl shadow p-6">
          <h4 className="font-semibold mb-4">Room Types</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Room Only</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Count</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <tr key={t._id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{t.title}</td>
                    <td className="py-2 pr-4">₹{t.prices?.roomOnly ?? t.basePrice}</td>
                    <td className="py-2 pr-4 capitalize">{t.status}</td>
                    <td className="py-2 pr-4">{t.count}</td>
                    <td className="py-2 pr-4 space-x-2">
                      <button onClick={()=> startEdit(t)} className="px-3 py-1 bg-gray-100 rounded-md">Edit</button>
                    </td>
                  </tr>
                ))}
                {types.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan="5">No room types yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
