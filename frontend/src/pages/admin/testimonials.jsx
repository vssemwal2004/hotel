import React, { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Star, Trash2, Eye, MessageSquare, CheckCircle } from 'lucide-react'
import api from '../../utils/api'

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCount: 0, averageRating: 0 })

  useEffect(() => {
    fetchTestimonials()
    fetchStats()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const response = await api.get('/testimonials/all')
      setTestimonials(response.data)
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      alert('Failed to fetch testimonials')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/testimonials/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) return
    
    try {
      await api.delete(`/testimonials/${id}`)
      alert('Testimonial deleted successfully')
      fetchTestimonials()
      fetchStats()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      alert('Failed to delete testimonial')
    }
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100'
    if (rating >= 3.5) return 'text-blue-600 bg-blue-100'
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair">
            Testimonials Management
          </h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and testimonials</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{testimonials.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">5-Star Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.fiveStarCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">4-Star Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.fourStarCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-blue-600 fill-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials List */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading testimonials...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="p-12 text-center">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No testimonials found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {testimonials.map((testimonial) => (
                    <tr key={testimonial._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-600">{testimonial.email}</div>
                          {testimonial.role && (
                            <div className="text-xs text-gray-500">{testimonial.role}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-sm font-bold ${getRatingColor(testimonial.rating)}`}>
                            {testimonial.rating}
                          </span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${
                                  i < testimonial.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {testimonial.message}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(testimonial._id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
