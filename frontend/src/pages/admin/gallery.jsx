import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '../../layouts/AdminLayout'
import useAuth from '../../hooks/useAuth'
import api from '../../utils/api'
import { Upload, Trash2, Edit2, Save, X, Image as ImageIcon } from 'lucide-react'

export default function AdminGallery() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: '',
    file: null
  })

  // Fetch gallery images
  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/gallery')
      setImages(data)
    } catch (error) {
      console.error('Error fetching gallery:', error)
      alert('Failed to fetch gallery images')
    } finally {
      setLoading(false)
    }
  }

  // Upload new image
  const handleUpload = async (e) => {
    e.preventDefault()
    
    if (!formData.file) {
      alert('Please select an image file')
      return
    }

    if (!formData.order || formData.order < 1 || formData.order > 8) {
      alert('Please enter a position between 1 and 8')
      return
    }

    try {
      setUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('image', formData.file)
      uploadFormData.append('title', formData.title || 'Gallery Image')
      uploadFormData.append('description', formData.description || '')
      uploadFormData.append('order', formData.order)

      await api.post('/gallery', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Image uploaded successfully!')
      setFormData({ title: '', description: '', order: '', file: null })
      fetchImages()
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  // Update existing image
  const handleUpdate = async (id) => {
    try {
      setUploading(true)
      const updateFormData = new FormData()
      
      if (formData.title) updateFormData.append('title', formData.title)
      if (formData.description !== undefined) updateFormData.append('description', formData.description)
      if (formData.order) updateFormData.append('order', formData.order)
      if (formData.file) updateFormData.append('image', formData.file)

      await api.put(`/gallery/${id}`, updateFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Image updated successfully!')
      setEditingId(null)
      setFormData({ title: '', description: '', order: '', file: null })
      fetchImages()
    } catch (error) {
      console.error('Error updating image:', error)
      alert(error.response?.data?.message || 'Failed to update image')
    } finally {
      setUploading(false)
    }
  }

  // Delete image
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await api.delete(`/gallery/${id}`)
      alert('Image deleted successfully!')
      fetchImages()
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  // Start editing
  const startEdit = (image) => {
    setEditingId(image._id)
    setFormData({
      title: image.title,
      description: image.description,
      order: image.order,
      file: null
    })
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ title: '', description: '', order: '', file: null })
  }

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const availablePositions = [1, 2, 3, 4, 5, 6, 7, 8].filter(
    pos => !images.some(img => img.order === pos && img._id !== editingId)
  )

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gallery Management</h1>
          <p className="text-gray-600">Manage the 8 photos displayed in "Moments of Bliss" section</p>
        </div>

        {/* Upload New Image Form */}
        {!editingId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload size={24} className="text-amber-600" />
              Upload New Image
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Gallery Image"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position (1-8) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select position</option>
                    {availablePositions.map(pos => (
                      <option key={pos} value={pos}>Position {pos}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows="2"
                  placeholder="Image description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading || availablePositions.length === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
              {availablePositions.length === 0 && (
                <p className="text-sm text-red-600">All 8 positions are filled. Please delete or update an existing image.</p>
              )}
            </form>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {editingId === image._id ? (
                // Edit Mode
                <div className="p-4">
                  <div className="mb-4">
                    <img src={image.imageUrl} alt={image.title} className="w-full h-48 object-cover rounded-lg" />
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Title"
                    />
                    <select
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {[...availablePositions, image.order].sort((a, b) => a - b).map(pos => (
                        <option key={pos} value={pos}>Position {pos}</option>
                      ))}
                    </select>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                      placeholder="Description"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                      className="w-full text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(image._id)}
                        disabled={uploading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="relative">
                    <img src={image.imageUrl} alt={image.title} className="w-full h-48 object-cover" />
                    <div className="absolute top-2 left-2 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Position {image.order}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 mb-3">{image.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(image)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(image._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 8 - images.length }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-64">
              <ImageIcon size={48} className="text-gray-400 mb-2" />
              <p className="text-gray-500 text-sm">Empty Slot</p>
              <p className="text-gray-400 text-xs">Position {availablePositions[index] || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
