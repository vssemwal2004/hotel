import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Coffee, Wifi, Utensils, Sparkles } from 'lucide-react'
import api from '../../utils/api'

export default function AdminPackages() {
  const [packages, setPackages] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    roomType: '',
    originalPrice: '',
    discountedPrice: '',
    taxPercentage: 5,
    amenities: [],
    isRefundable: false,
    cancellationPolicy: '',
    checkInTime: '2:00 PM',
    checkOutTime: '11:00 AM',
    isActive: true,
    priority: 0,
    badge: ''
  })
  const [amenityInput, setAmenityInput] = useState({ title: '', description: '', icon: 'Check' })

  useEffect(() => {
    fetchPackages()
    fetchRoomTypes()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data } = await api.get('/packages/admin/all')
      setPackages(data.packages)
    } catch (err) {
      console.error('Error fetching packages:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const { data } = await api.get('/room-types')
      setRoomTypes(data.roomTypes)
    } catch (err) {
      console.error('Error fetching room types:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPackage) {
        await api.put(`/packages/${editingPackage._id}`, formData)
      } else {
        await api.post('/packages', formData)
      }
      fetchPackages()
      resetForm()
      setShowModal(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving package')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    try {
      await api.delete(`/packages/${id}`)
      fetchPackages()
    } catch (err) {
      alert('Error deleting package')
    }
  }

  const toggleActive = async (id) => {
    try {
      await api.patch(`/packages/${id}/toggle`)
      fetchPackages()
    } catch (err) {
      alert('Error toggling package status')
    }
  }

  const openEditModal = (pkg) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description,
      roomType: pkg.roomType?._id || '',
      originalPrice: pkg.originalPrice,
      discountedPrice: pkg.discountedPrice,
      taxPercentage: pkg.taxPercentage,
      amenities: pkg.amenities || [],
      isRefundable: pkg.isRefundable,
      cancellationPolicy: pkg.cancellationPolicy || '',
      checkInTime: pkg.checkInTime,
      checkOutTime: pkg.checkOutTime,
      isActive: pkg.isActive,
      priority: pkg.priority,
      badge: pkg.badge || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingPackage(null)
    setFormData({
      name: '',
      description: '',
      roomType: '',
      originalPrice: '',
      discountedPrice: '',
      taxPercentage: 5,
      amenities: [],
      isRefundable: false,
      cancellationPolicy: '',
      checkInTime: '2:00 PM',
      checkOutTime: '11:00 AM',
      isActive: true,
      priority: 0,
      badge: ''
    })
  }

  const addAmenity = () => {
    if (!amenityInput.title) return
    setFormData({
      ...formData,
      amenities: [...formData.amenities, { ...amenityInput }]
    })
    setAmenityInput({ title: '', description: '', icon: 'Check' })
  }

  const removeAmenity = (index) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="text-amber-600" size={32} />
              Manage Packages
            </h1>
            <p className="text-gray-600 mt-2">Create and manage room packages with special offers</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Create Package
          </button>
        </div>

        {/* Packages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <motion.div
              key={pkg._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className={`p-6 ${!pkg.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                    <p className="text-sm text-amber-600 mt-1">{pkg.roomType?.title}</p>
                    {pkg.badge && (
                      <span className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleActive(pkg._id)}
                    className={`p-2 rounded-lg ${pkg.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {pkg.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>

                {/* Pricing */}
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">₹{pkg.discountedPrice}</span>
                    <span className="text-lg text-gray-400 line-through">₹{pkg.originalPrice}</span>
                    <span className="text-sm text-green-600 font-semibold">{pkg.discountPercentage}% OFF</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">+ ₹{(pkg.discountedPrice * pkg.taxPercentage / 100).toFixed(2)} taxes</p>
                </div>

                {/* Amenities Preview */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Amenities ({pkg.amenities?.length || 0})</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.amenities?.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded">
                        {amenity.title}
                      </span>
                    ))}
                    {pkg.amenities?.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        +{pkg.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(pkg)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {packages.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Package className="mx-auto text-gray-300" size={64} />
              <p className="text-gray-500 mt-4">No packages created yet</p>
              <button
                onClick={() => { resetForm(); setShowModal(true) }}
                className="mt-4 text-amber-600 hover:text-amber-700 font-semibold"
              >
                Create your first package
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Premium Deluxe Package"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe the package benefits..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
                  <select
                    required
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map((rt) => (
                      <option key={rt._id} value={rt._id}>{rt.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Best Value, Most Popular"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Original Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Discounted Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority (Display Order)</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Higher = Shows first"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Time</label>
                  <input
                    type="text"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Time</label>
                  <input
                    type="text"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
                  <textarea
                    rows="2"
                    value={formData.cancellationPolicy}
                    onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe cancellation terms..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRefundable}
                      onChange={(e) => setFormData({ ...formData, isRefundable: e.target.checked })}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Refundable</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities & Benefits</h3>
                
                {/* Add Amenity Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={amenityInput.title}
                      onChange={(e) => setAmenityInput({ ...amenityInput, title: e.target.value })}
                      placeholder="Amenity title (e.g., Evening Hi-Tea)"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={amenityInput.description}
                      onChange={(e) => setAmenityInput({ ...amenityInput, description: e.target.value })}
                      placeholder="Description (optional)"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={addAmenity}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Amenities List */}
                <div className="space-y-2">
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{amenity.title}</p>
                        {amenity.description && <p className="text-sm text-gray-600">{amenity.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.amenities.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No amenities added yet</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
