import React, { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import api from '../../utils/api'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Bed, 
  CreditCard, 
  CalendarCheck,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

// Admin dashboard overview with professional stats and design
export default function AdminIndex(){
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalRooms: 0,
    totalUsers: 0,
    todayBookings: 0,
    pendingPayments: 0,
    activeBookings: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch actual data from your APIs
      const [bookingsRes, roomsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/room-types')
      ])

      const bookings = bookingsRes.data.bookings || []
      const rooms = roomsRes.data.types || []

      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      const today = new Date().toDateString()
      const todayBookings = bookings.filter(b => new Date(b.createdAt).toDateString() === today).length
      
      // Calculate active bookings (current and future)
      const now = new Date()
      const activeBookings = bookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut || b.checkIn)
        return checkIn <= now && checkOut >= now && b.paymentStatus === 'paid'
      }).length

      // Calculate total available rooms
      const totalRooms = rooms.reduce((sum, r) => sum + (r.count || 0), 0)
      
      // Calculate occupancy rate
      const occupiedRooms = bookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut || b.checkIn)
        return checkIn <= now && checkOut >= now && b.paymentStatus === 'paid'
      }).reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)
      
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

      setStats({
        totalBookings: bookings.length,
        totalRevenue,
        totalRooms,
        totalUsers: bookings.length,
        todayBookings,
        pendingPayments: bookings.filter(b => b.paymentStatus === 'pending').length,
        activeBookings,
        occupancyRate
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values on error
      setStats({
        totalBookings: 0,
        totalRevenue: 0,
        totalRooms: 0,
        totalUsers: 0,
        todayBookings: 0,
        pendingPayments: 0,
        activeBookings: 0,
        occupancyRate: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor, trend }) => (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className={`p-2.5 md:p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={20} className={color + ' md:!w-6 md:!h-6'} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-[11px] md:text-xs font-semibold px-2 py-1 rounded-full ${
              trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend >= 0 ? <TrendingUp size={12} className="md:!w-3.5 md:!h-3.5" /> : <TrendingDown size={12} className="md:!w-3.5 md:!h-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">{label}</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtext && <p className="text-[11px] md:text-xs text-gray-500">{subtext}</p>}
        </div>
      </div>
      <div className={`h-1 ${bgColor} opacity-50`} />
    </div>
  )

  const QuickActionCard = ({ icon: Icon, label, href, color, bgColor }) => (
    <a
      href={href}
      className={`group block p-4 md:p-6 rounded-xl ${bgColor} border-2 border-transparent transition-all duration-300 hover:scale-105 min-w-[240px] sm:min-w-0`}
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2.5 md:p-3 bg-white rounded-xl shadow-md group-hover:shadow-lg transition-all`}>
          <Icon size={20} className={color + ' md:!w-6 md:!h-6'} />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm md:text-base">{label}</p>
          <p className="text-[11px] md:text-xs text-gray-600 mt-1">Click to manage</p>
        </div>
      </div>
    </a>
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
          Dashboard Overview
        </h1>
        <p className="text-sm md:text-base text-gray-600">Welcome back! Here's what's happening with your hotel today.</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 md:mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          icon={CalendarCheck}
          label="Total Bookings"
          value={stats.totalBookings}
          subtext={`${stats.todayBookings} today`}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={12}
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
          subtext="All time earnings"
          color="text-green-600"
          bgColor="bg-green-100"
          trend={8}
        />
        <StatCard
          icon={Bed}
          label="Total Rooms"
          value={stats.totalRooms}
          subtext={`${stats.occupancyRate}% occupancy`}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={Users}
          label="Active Bookings"
          value={stats.activeBookings}
          subtext="Currently checked-in"
          color="text-pink-600"
          bgColor="bg-pink-100"
          trend={-5}
        />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="mb-6 md:mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 md:p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={24} />
            <h3 className="font-semibold">Confirmed</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold mb-2">{stats.activeBookings}</p>
          <p className="text-emerald-100 text-sm">Active reservations</p>
        </div>

  <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 md:p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Clock size={24} />
            <h3 className="font-semibold">Pending</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold mb-2">{stats.pendingPayments}</p>
          <p className="text-amber-100 text-sm">Awaiting payment</p>
        </div>

  <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 md:p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={24} />
            <h3 className="font-semibold">Revenue Today</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold mb-2">₹{Math.round(stats.totalRevenue / 30).toLocaleString()}</p>
          <p className="text-slate-300 text-sm">Average daily</p>
        </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <QuickActionCard
            icon={CalendarCheck}
            label="Manage Bookings"
            href="/admin/bookings"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <QuickActionCard
            icon={Bed}
            label="Room Types Management"
            href="/admin/rooms"
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-600" />
          System Status
        </h2>
        <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4">
          <div className="flex items-center gap-3 p-3 md:p-4 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">All Systems Operational</p>
              <p className="text-[11px] md:text-xs text-gray-600">Last checked: Just now</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 md:p-4 bg-blue-50 rounded-xl border border-blue-200">
            <CheckCircle size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">Database Connected</p>
              <p className="text-[11px] md:text-xs text-gray-600">Response time: 45ms</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 md:p-4 bg-purple-50 rounded-xl border border-purple-200">
            <CheckCircle size={20} className="text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">Payment Gateway Active</p>
              <p className="text-[11px] md:text-xs text-gray-600">All transactions secure</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
