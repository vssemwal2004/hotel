import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import { useToast } from '../../components/ToastProvider'
import { useForm } from 'react-hook-form'
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  User, 
  Briefcase,
  Mail,
  Phone,
  Lock,
  X,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function AdminUsers(){
  const { show } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'worker',
      phone: '',
      department: '',
      status: 'active'
    }
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/users')
      setUsers(data.users || [])
    } catch (e) {
      console.error('Failed to fetch users:', e)
      show({ type: 'error', title: 'Failed to load users', message: e?.response?.data?.message || e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const onSubmit = async (formData) => {
    try {
      if (editingId) {
        // Update existing user
        await api.put(`/users/${editingId}`, formData)
        show({ type: 'success', title: 'User updated' })
      } else {
        // Create new user
        await api.post('/users', formData)
        show({ type: 'success', title: 'User created' })
      }
      fetchUsers()
      handleCancel()
    } catch (e) {
      show({ type: 'error', title: 'Save failed', message: e?.response?.data?.message || 'Failed to save user' })
    }
  }

  const handleEdit = (user) => {
    setEditingId(user._id)
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('role', user.role)
    setValue('phone', user.phone || '')
    setValue('department', user.department || '')
    setValue('status', user.status || 'active')
    setValue('password', '') // Don't pre-fill password
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      await api.delete(`/users/${id}`)
      show({ type: 'success', title: 'User deleted' })
      fetchUsers()
    } catch (e) {
      show({ type: 'error', title: 'Delete failed', message: e?.response?.data?.message || 'Failed to delete user' })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    reset()
  }

  const getRoleBadge = (role) => {
    const configs = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', icon: Shield },
      worker: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', icon: Briefcase },
      user: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: User }
    }
    const config = configs[role] || configs.user
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        <Icon size={14} />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300">
        <CheckCircle size={14} />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-red-100 text-red-700 border border-red-300">
        <XCircle size={14} />
        Inactive
      </span>
    )
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    workers: users.filter(u => u.role === 'worker').length,
    users: users.filter(u => u.role === 'user').length
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage admin users, workers, and customer accounts</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              reset()
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Admins</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-700">{stats.admins}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Briefcase size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Workers</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-700">{stats.workers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-xl">
              <User size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Customers</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-700">{stats.users}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'admin', 'worker', 'user'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  roleFilter === role
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus size={24} />
                {editingId ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                  })}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="worker@hotelkrishna.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock size={16} />
                  Password {editingId ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  {...register('password', { 
                    required: editingId ? false : 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  {...register('role')}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  {...register('department')}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Front Desk, Housekeeping, Reception"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  {...register('status')}
                  className="w-full border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {editingId ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-gray-700 uppercase">User</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-gray-700 uppercase">Role</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-gray-700 uppercase hidden md:table-cell">Department</th>
                  <th className="px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-4 md:px-6 py-4 text-center text-xs md:text-sm font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <span className="text-gray-700">{user.department || '—'}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      {getStatusBadge(user.status || 'active')}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
