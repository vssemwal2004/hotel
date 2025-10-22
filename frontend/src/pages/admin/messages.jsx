import React, { useState, useEffect } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Mail, Trash2, Eye, Clock, CheckCircle, Reply } from 'lucide-react'
import api from '../../utils/api'

export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCount: 0, newCount: 0, unreadCount: 0 })
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchMessages()
    fetchStats()
    // Refresh every 30 seconds for "real-time" updates
    const interval = setInterval(() => {
      fetchMessages()
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get('/contact')
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      alert('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/contact/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/contact/${id}/mark-read`)
      fetchMessages()
      fetchStats()
    } catch (error) {
      console.error('Error marking message as read:', error)
      alert('Failed to mark as read')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/contact/${id}/status`, { status })
      fetchMessages()
      fetchStats()
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) return
    
    try {
      await api.delete(`/contact/${id}`)
      alert('Message deleted successfully')
      fetchMessages()
      fetchStats()
      if (selectedMessage && selectedMessage._id === id) {
        setShowModal(false)
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const openMessageModal = async (message) => {
    setSelectedMessage(message)
    setShowModal(true)
    
    // Mark as read if not already
    if (!message.isRead) {
      await handleMarkRead(message._id)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'read': return 'bg-yellow-100 text-yellow-700'
      case 'replied': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-playfair">
            Contact Messages
          </h1>
          <p className="text-gray-600 mt-1">Manage customer inquiries and messages</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Replied</p>
                <p className="text-2xl font-bold text-gray-900">{stats.repliedCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
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
                  {messages.map((message) => (
                    <tr 
                      key={message._id} 
                      className={`hover:bg-gray-50 cursor-pointer ${!message.isRead ? 'bg-blue-50/30' : ''}`}
                      onClick={() => openMessageModal(message)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{message.name}</div>
                            <div className="text-sm text-gray-600">{message.email}</div>
                            {message.phone && (
                              <div className="text-xs text-gray-500">{message.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700 font-medium">{message.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{message.message}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(message.status)}`}>
                          {message.status === 'new' && <Clock size={12} />}
                          {message.status === 'read' && <Eye size={12} />}
                          {message.status === 'replied' && <CheckCircle size={12} />}
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(message.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openMessageModal(message)
                            }}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(message._id)
                            }}
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

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    From: <span className="font-semibold">{selectedMessage.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedMessage.status)}`}>
                  {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Email</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Phone</p>
                    <a href={`tel:${selectedMessage.phone}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Message:</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.message}
              </p>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleUpdateStatus(selectedMessage._id, e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
                
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Reply size={18} />
                  Reply via Email
                </a>
                
                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
