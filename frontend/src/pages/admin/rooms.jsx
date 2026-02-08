import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { useForm } from 'react-hook-form'
import api from '../../utils/api'
import { 
  Plus, 
  Edit, 
  Save, 
  X, 
  Bed, 
  IndianRupee, 
  Image, 
  Check,
  AlertCircle,
  Percent,
  Users,
  Wifi,
  Tv,
  Coffee,
  Utensils
} from 'lucide-react'

export default function AdminRooms(){
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      key: '',
      title: '',
      basePrice: 0,
      prices: { roomOnly: 0, roomBreakfast: 0, roomBreakfastDinner: 0 },
      discount: 0,
      maxAdults: 2,
      maxChildren: 1,
      extraBedPerPerson: 0,
      extraPersonPerNight: 0,
      status: 'available',
      amenities: [],
      count: 0,
      description: '',
      photos: [],
      coverPhotos: [],
      gstEnabled: true,
      gstPercentage: null
    }
  })
  const [types, setTypes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [coverFiles, setCoverFiles] = useState([])
  const [galleryFiles, setGalleryFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadTypes = async () => {
    try {
      const { data } = await api.get('/room-types')
      setTypes(data.types || [])
    } catch (error) {
      console.error('Error loading room types:', error)
    }
  }

  const refreshEditing = async () => {
    if (!editingId) return
    try {
      const { data } = await api.get('/room-types')
      const t = (data.types || []).find(x => x._id === editingId)
      if (t) {
        setValue('photos', t.photos || [])
        setValue('coverPhotos', t.coverPhotos || [])
      }
    } catch {}
  }

  useEffect(() => { loadTypes() }, [])

  const onSubmit = async (form) => {
    setLoading(true)
    try {
      const payload = {
        key: (form.key || '').trim(),
        title: (form.title || '').trim(),
        basePrice: Number(form.prices?.roomOnly || 0), // Use roomOnly as basePrice
        prices: {
          roomOnly: Number(form.prices?.roomOnly || 0),
          roomBreakfast: Number(form.prices?.roomBreakfast || 0),
          roomBreakfastDinner: Number(form.prices?.roomBreakfastDinner || 0)
        },
        discount: Number(form.discount || 0),
        maxAdults: Number(form.maxAdults || 0),
        maxChildren: Number(form.maxChildren || 0),
        extraBedPerPerson: Number(form.extraBedPerPerson || 0),
        extraPersonPerNight: Number(form.extraPersonPerNight || 0),
        status: form.status,
        amenities: Array.isArray(form.amenities) ? form.amenities : (form.amenities ? [form.amenities] : []),
        count: Number(form.count),
        description: form.description || '',
        gstEnabled: form.gstEnabled !== undefined ? Boolean(form.gstEnabled) : true,
        gstPercentage: form.gstPercentage !== '' && form.gstPercentage !== null ? Number(form.gstPercentage) : null
      }
  const fd = new FormData()
  fd.append('data', JSON.stringify(payload))
  ;(coverFiles || []).forEach(f => fd.append('covers', f))
  ;(galleryFiles || []).forEach(f => fd.append('subPhotos', f))
      if (editingId) {
        await api.put(`/room-types/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/room-types', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      reset()
  setCoverFiles([])
  setGalleryFiles([])
      setEditingId(null)
      setShowForm(false)
      await loadTypes()
    } catch (e) {
      alert(e?.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (t) => {
    setEditingId(t._id)
    setShowForm(true)
    setValue('key', t.key)
    setValue('title', t.title)
    setValue('basePrice', t.basePrice)
    setValue('prices.roomOnly', t.prices?.roomOnly ?? t.basePrice)
    setValue('prices.roomBreakfast', t.prices?.roomBreakfast ?? t.basePrice)
    setValue('prices.roomBreakfastDinner', t.prices?.roomBreakfastDinner ?? t.basePrice)
    setValue('discount', t.discount || 0)
    setValue('maxAdults', t.maxAdults ?? 2)
    setValue('maxChildren', t.maxChildren ?? 1)
    setValue('extraBedPerPerson', t.extraBedPerPerson || 0)
    setValue('extraPersonPerNight', t.extraPersonPerNight || 0)
    setValue('status', t.status || 'available')
    setValue('amenities', t.amenities || [])
    setValue('count', t.count || 0)
    setValue('description', t.description || '')
    setValue('photos', t.photos || [])
    setValue('coverPhotos', t.coverPhotos || [])
    setValue('gstEnabled', t.gstEnabled !== undefined ? t.gstEnabled : true)
    setValue('gstPercentage', t.gstPercentage !== undefined ? t.gstPercentage : null)
  setCoverFiles([])
  setGalleryFiles([])
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
    reset()
  setCoverFiles([])
  setGalleryFiles([])
  }

  const amenitiesOptions = [
    'AC',
    'TV',
    'WiFi',
    'Breakfast',
    'Complimentary Evening Hi-Tea',
    '20% Discount on Food & Beverages',
    '15% Discount on Spa',
    'Free Wi-Fi',
    'Room Service',
    'Minibar',
    'Safe',
    'Balcony',
    'Mountain View',
    'Valley View'
  ]
  
  const statusOptions = [
    { value: 'available', label: 'Available', color: 'green' },
    { value: 'blocked', label: 'Blocked', color: 'red' },
    { value: 'maintenance', label: 'Maintenance', color: 'amber' }
  ]

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status) || statusOptions[0]
    const colors = {
      green: 'bg-green-100 text-green-700 border-green-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200'
    }
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${colors[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Room Types Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Manage your hotel room categories and pricing</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold text-sm md:text-base transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Add New Room Type
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 md:mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3 sm:p-5 border-l-4 border-purple-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Room Types</p>
          <p className="text-3xl font-bold text-gray-900">{types.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border-l-4 border-blue-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
          <p className="text-3xl font-bold text-blue-600">{types.reduce((sum, t) => sum + (t.count || 0), 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-5 border-l-4 border-green-500 shadow-md">
          <p className="text-sm text-gray-600 mb-1">Available</p>
          <p className="text-3xl font-bold text-green-600">{types.filter(t => t.status === 'available').reduce((sum, t) => sum + (t.count || 0), 0)}</p>
        </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 mb-4 md:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">{editingId ? 'Edit Room Type' : 'Add New Room Type'}</h2>
                <p className="text-purple-100 text-xs md:text-sm mt-1">Fill in the details below</p>
              </div>
              <button onClick={cancelEdit} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <Bed size={20} className="text-purple-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type Key *</label>
                  <input
                    {...register('key', { required: true })}
                    placeholder="e.g., deluxe-valley-view"
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique URL-friendly key (use hyphens)</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type Title *</label>
                  <input
                    {...register('title', { required: true })}
                    placeholder="e.g., Deluxe Valley View"
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Rooms *</label>
                  <input 
                    type="number" 
                    min="0" 
                    {...register('count')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Availability Status *</label>
                  <select 
                    {...register('status')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Percent size={16} className="text-purple-600" />
                    Discount (%)
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="1" 
                    {...register('discount')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0-100"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <IndianRupee size={20} className="text-green-600" />
                Pricing Plans
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-blue-50 rounded-xl p-3 md:p-4 border-2 border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Bed size={16} className="text-blue-600" />
                    Room Only (₹) *
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...register('prices.roomOnly')} 
                    className="w-full border-2 border-blue-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
                <div className="bg-amber-50 rounded-xl p-3 md:p-4 border-2 border-amber-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Coffee size={16} className="text-amber-600" />
                    Room + Breakfast (₹) *
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...register('prices.roomBreakfast')} 
                    className="w-full border-2 border-amber-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
                <div className="bg-green-50 rounded-xl p-3 md:p-4 border-2 border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Utensils size={16} className="text-green-600" />
                    Full Board (₹) *
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...register('prices.roomBreakfastDinner')} 
                    className="w-full border-2 border-green-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* GST Configuration */}
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 md:p-6 rounded-2xl border-2 border-purple-200">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <IndianRupee size={20} className="text-purple-600" />
                GST Configuration
              </h3>
              
              {/* GST Enable Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('gstEnabled')}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Enable GST for this room type</span>
                    <span className="text-xs text-gray-600">When enabled, GST will be calculated based on Indian tax slabs</span>
                  </div>
                </label>
              </div>

              {/* Custom GST Percentage */}
              <div className="bg-white rounded-xl p-3 md:p-4 border-2 border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom GST Percentage (%)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  step="0.01"
                  placeholder="Leave blank for automatic slab calculation"
                  {...register('gstPercentage')} 
                  className="w-full border-2 border-purple-300 rounded-lg p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Indian GST Slabs:</strong><br/>
                  • Up to ₹1,000/night: 0% GST<br/>
                  • ₹1,001 - ₹7,500/night: 5% GST<br/>
                  • Above ₹7,500/night: 18% GST<br/>
                  Leave empty to use automatic slab-based calculation
                </p>
              </div>
            </div>

            {/* Capacity */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                Capacity per Room
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Adults</label>
                  <input 
                    type="number" 
                    min="0" 
                    {...register('maxAdults')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Children</label>
                  <input 
                    type="number" 
                    min="0" 
                    {...register('maxChildren')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
                </div>
              </div>
            </div>

            {/* Additional Charges */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                <Users size={20} className="text-pink-600" />
                Additional Charges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Extra Bed (₹ per person/night)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...register('extraBedPerPerson')}
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Person (₹/night)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...register('extraPersonPerNight')} 
                    className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
                {amenitiesOptions.map(a => (
                  <label key={a} className="flex items-center gap-2 p-2.5 md:p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all">
                    <input type="checkbox" value={a} {...register('amenities')} className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500" />
                    <span className="text-sm font-medium text-gray-700">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cover Photos */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-2 flex items-center gap-2">
                <Image size={20} className="text-blue-600" />
                Cover Photos (shown on cards)
              </h3>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 md:p-6 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e)=> setCoverFiles(Array.from(e.target.files||[]).slice(0,2))}
                  className="w-full"
                  id="cover-upload"
                />
                <label htmlFor="cover-upload" className="block text-center cursor-pointer">
                  <Image size={40} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">Upload up to 2 images</p>
                </label>
                {coverFiles.length > 0 && (
                  <p className="text-sm text-blue-700 mt-3 text-center font-semibold">{coverFiles.length} cover image(s) selected</p>
                )}
              </div>
            </div>

            {/* Gallery Photos */}
            <div className="mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-2 flex items-center gap-2">
                <Image size={20} className="text-purple-600" />
                Gallery Photos (for "See Photos")
              </h3>
              <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 md:p-6 hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e)=> setGalleryFiles(Array.from(e.target.files||[]))}
                  className="w-full"
                  id="gallery-upload"
                />
                <label htmlFor="gallery-upload" className="block text-center cursor-pointer">
                  <Image size={40} className="mx-auto text-purple-400 mb-2" />
                  <p className="text-xs md:text-sm text-gray-600">Upload multiple photos for the gallery</p>
                </label>
                {galleryFiles.length > 0 && (
                  <p className="text-sm text-purple-700 mt-3 text-center font-semibold">{galleryFiles.length} gallery image(s) selected</p>
                )}
              </div>
            </div>

            {/* Existing Images with Delete */}
            {editingId && (
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Existing Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(watch('coverPhotos') || []).map((p, idx) => (
                    <ImageItem key={`c-${idx}`} photo={p} type="cover" roomId={editingId} onDeleted={refreshEditing} />
                  ))}
                  {(watch('photos') || []).map((p, idx) => (
                    <ImageItem key={`g-${idx}`} photo={p} type="gallery" roomId={editingId} onDeleted={refreshEditing} />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea 
                rows="4" 
                {...register('description')} 
                className="w-full border-2 border-gray-300 rounded-xl p-2.5 md:p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the room type, its features, and what makes it special..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3">
              <button 
                disabled={loading} 
                type="submit" 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {editingId ? 'Update Room Type' : 'Save Room Type'}
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={cancelEdit}
                className="px-4 py-3 md:px-6 md:py-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-semibold text-sm md:text-base transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Types List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Bed size={24} />
            Room Types ({types.length})
          </h2>
        </div>

        {types.length === 0 ? (
          <div className="text-center py-10 md:py-12">
            <Bed size={48} className="mx-auto text-gray-300 mb-3 md:mb-4" />
            <p className="text-gray-600 text-base md:text-lg mb-2">No room types found</p>
            <p className="text-gray-500 text-sm mb-4">Add your first room type to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm md:text-base transition-colors"
            >
              <Plus size={20} />
              Add Room Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 p-4 md:p-6">
            {types.map(t => (
              <div key={t._id} className="group bg-gradient-to-br from-white to-purple-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 overflow-hidden transition-all duration-300 hover:shadow-xl">
                {/* Image */}
                {(t.coverPhotos && t.coverPhotos[0]) || (t.photos && t.photos[0]) ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={(t.coverPhotos && t.coverPhotos[0]?.url) || (t.photos && t.photos[0]?.url)} 
                      alt={t.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Bed size={48} className="text-white opacity-50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">{t.title}</h3>
                      {getStatusBadge(t.status)}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white rounded-lg p-3 mb-3 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm text-gray-600">Room Only</span>
                      <span className="text-base md:text-lg font-bold text-green-600">₹{t.prices?.roomOnly?.toLocaleString() || t.basePrice?.toLocaleString()}</span>
                    </div>
                    {t.discount > 0 && (
                      <div className="flex items-center gap-2 text-[11px] md:text-xs">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">{t.discount}% OFF</span>
                        <span className="text-gray-500 line-through">₹{Math.round((t.prices?.roomOnly || t.basePrice) / (1 - t.discount/100)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Bed size={16} className="text-purple-600" />
                      <span>{t.count || 0} rooms</span>
                    </div>
                    {t.amenities && t.amenities.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Check size={16} className="text-green-600" />
                        <span>{t.amenities.length} amenities</span>
                      </div>
                    )}
                  </div>

                  {/* GST Info Badge */}
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    {t.gstEnabled !== false ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium">
                        <IndianRupee size={12} />
                        GST: {t.gstPercentage !== null && t.gstPercentage !== undefined ? `${t.gstPercentage}%` : 'Auto Slab'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium">
                        GST Disabled
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => startEdit(t)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm md:text-base transition-colors"
                  >
                    <Edit size={18} />
                    Edit Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function ImageItem({ photo, type, roomId, onDeleted }){
  const [deleting, setDeleting] = useState(false)
  const url = photo?.url || photo
  const publicId = photo?.publicId
  const remove = async () => {
    if (!publicId) return
    if (!confirm('Delete this photo?')) return
    setDeleting(true)
    try {
      await api.delete(`/room-types/${roomId}/photo`, { params: { publicId, type: type === 'cover' ? 'cover' : 'gallery' } })
      onDeleted && onDeleted()
    } catch (e) {
      alert(e?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }
  return (
    <div className="relative rounded-lg overflow-hidden border">
      <img src={url} alt="photo" className="w-full h-36 object-cover" />
      {publicId && (
        <button onClick={remove} disabled={deleting} className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 text-xs font-semibold px-2 py-1 rounded">
          {deleting ? '...' : 'Delete'}
        </button>
      )}
    </div>
  )
}
