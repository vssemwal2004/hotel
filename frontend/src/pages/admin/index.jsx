import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
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
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  BarChart3,
  Eye
} from 'lucide-react'

// Admin dashboard overview with professional stats and design
export default function AdminIndex(){
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalRooms: 0,
    availableRooms: 0,
    bookedRooms: 0,
    totalUsers: 0,
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    occupancyRate: 0,
    avgBookingValue: 0,
    revenueGrowth: 0,
    bookingGrowth: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
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

      // Date calculations
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      const twoWeeksAgo = new Date(today)
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const twoMonthsAgo = new Date(today)
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      // Filter bookings by time periods
      const todayBookings = bookings.filter(b => new Date(b.createdAt) >= today)
      const weekBookings = bookings.filter(b => new Date(b.createdAt) >= weekAgo)
      const monthBookings = bookings.filter(b => new Date(b.createdAt) >= monthAgo)
      const prevWeekBookings = bookings.filter(b => {
        const date = new Date(b.createdAt)
        return date >= twoWeeksAgo && date < weekAgo
      })
      const prevMonthBookings = bookings.filter(b => {
        const date = new Date(b.createdAt)
        return date >= twoMonthsAgo && date < monthAgo
      })

      // Calculate revenues
      const totalRevenue = bookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)
      const todayRevenue = todayBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)
      const weekRevenue = weekBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)
      const monthRevenue = monthBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)
      const prevWeekRevenue = prevWeekBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)
      const prevMonthRevenue = prevMonthBookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || b.total || 0), 0)

      // Calculate growth rates
      const revenueGrowth = prevMonthRevenue > 0 ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0
      const bookingGrowth = prevWeekBookings.length > 0 ? Math.round(((weekBookings.length - prevWeekBookings.length) / prevWeekBookings.length) * 100) : 0
      
      // Calculate active bookings (current and future)
      const activeBookings = bookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut || b.checkIn)
        return checkIn <= now && checkOut >= now && b.status === 'paid'
      }).length

      // Calculate total available rooms
      const totalRooms = rooms.reduce((sum, r) => sum + (r.count || 0), 0)
      
      // Calculate occupancy rate and booked rooms
      const bookedRooms = bookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut || b.checkIn)
        return checkIn <= now && checkOut >= now && b.status === 'paid'
      }).reduce((sum, b) => sum + (b.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0)
      
      const availableRooms = totalRooms - bookedRooms
      const occupancyRate = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0

      // Average booking value
      const paidBookings = bookings.filter(b => b.status === 'paid')
      const avgBookingValue = paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0

      setStats({
        totalBookings: bookings.length,
        totalRevenue,
        totalRooms,
        availableRooms,
        bookedRooms,
        todayBookings: todayBookings.length,
        weekBookings: weekBookings.length,
        monthBookings: monthBookings.length,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        pendingPayments: bookings.filter(b => b.status === 'pending').length,
        activeBookings,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        occupancyRate,
        avgBookingValue,
        revenueGrowth,
        bookingGrowth
      })

      // Get recent bookings (last 5)
      const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setRecentBookings(sorted.slice(0, 5))
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor, trend, onClick }) => (
    <div 
      onClick={onClick}
      className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-gray-200 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-lg ${bgColor} group-hover:scale-105 transition-transform duration-200`}>
            <Icon size={18} className={color} />
          </div>
          {trend !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-gray-600 text-xs font-medium mb-0.5">{label}</h3>
          <p className="text-xl font-bold text-gray-900 mb-0.5">{value}</p>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
      </div>
      <div className={`h-0.5 ${bgColor} opacity-50`} />
    </div>
  )

  const QuickStat = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-3 border border-opacity-20`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={16} className={color} />
        <h3 className="font-semibold text-sm">{label}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    const safeStatus = typeof status === 'string' && status.length ? status : 'pending'
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[safeStatus] || styles.pending}`}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    )
  }

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
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
          Dashboard Overview
        </h1>
        <p className="text-xs md:text-sm text-gray-600">Real-time hotel performance metrics and analytics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats.totalBookings}
            subtext={`${stats.todayBookings} today`}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend={stats.bookingGrowth}
            onClick={() => router.push('/admin/bookings')}
          />
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
            subtext={`₹${(stats.monthRevenue / 1000).toFixed(1)}K this month`}
            color="text-green-600"
            bgColor="bg-green-100"
            trend={stats.revenueGrowth}
          />
          <StatCard
            icon={Bed}
            label="Total Rooms"
            value={stats.totalRooms}
            subtext={`${stats.occupancyRate}% occupancy`}
            color="text-purple-600"
            bgColor="bg-purple-100"
            onClick={() => router.push('/admin/rooms')}
          />
          <StatCard
            icon={Users}
            label="Active Bookings"
            value={stats.activeBookings}
            subtext="Currently checked-in"
            color="text-pink-600"
            bgColor="bg-pink-100"
          />
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Today */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <Activity size={14} className="text-blue-600" />
              Today's Performance
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Bookings</p>
                <p className="text-lg font-bold text-blue-600">{stats.todayBookings}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-green-600">₹{(stats.todayRevenue / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <BarChart3 size={14} className="text-purple-600" />
              This Week
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Bookings</p>
                <p className="text-lg font-bold text-purple-600">{stats.weekBookings}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-green-600">₹{(stats.weekRevenue / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
              <TrendingUp size={14} className="text-indigo-600" />
              This Month
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Bookings</p>
                <p className="text-lg font-bold text-indigo-600">{stats.monthBookings}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-green-600">₹{(stats.monthRevenue / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickStat
            icon={CheckCircle}
            label="Confirmed"
            value={stats.activeBookings}
            color="text-emerald-700"
            bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
          />
          <QuickStat
            icon={Clock}
            label="Pending"
            value={stats.pendingPayments}
            color="text-amber-700"
            bgColor="bg-gradient-to-br from-amber-500 to-amber-600 text-white"
          />
          <QuickStat
            icon={CheckCircle}
            label="Completed"
            value={stats.completedBookings}
            color="text-blue-700"
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          />
          <QuickStat
            icon={DollarSign}
            label="Avg. Value"
            value={`₹${(stats.avgBookingValue / 1000).toFixed(1)}K`}
            color="text-purple-700"
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600 text-white"
          />
          <QuickStat
            icon={Bed}
            label="Available"
            value={stats.availableRooms}
            color="text-green-700"
            bgColor="bg-gradient-to-br from-green-500 to-green-600 text-white"
          />
          <QuickStat
            icon={Bed}
            label="Booked"
            value={stats.bookedRooms}
            color="text-rose-700"
            bgColor="bg-gradient-to-br from-rose-500 to-rose-600 text-white"
          />
        </div>
      </div>

      {/* Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck size={16} className="text-blue-600" />
              Recent Bookings
            </h2>
            <button 
              onClick={() => router.push('/admin/bookings')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <Eye size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <div key={booking._id} className="p-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push('/admin/bookings')}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {booking.user?.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{booking.user?.name || 'Guest'}</p>
                      <p className="text-xs text-gray-500">#{booking._id.slice(-6)} • {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="flex items-center justify-between ml-10">
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span>•</span>
                    <span>{booking.nights || 1}N</span>
                    <span>•</span>
                    <span>{booking.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} Room(s)</span>
                  </div>
                  <p className="text-sm font-bold text-green-600">₹{(booking.totalAmount || booking.total || 0).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No bookings yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/bookings')}
              className="w-full flex items-center gap-3 p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                <CalendarCheck size={16} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-800">Manage Bookings</p>
                <p className="text-xs text-gray-600">View & update</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/rooms')}
              className="w-full flex items-center gap-3 p-2.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                <Bed size={16} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-800">Room Management</p>
                <p className="text-xs text-gray-600">Types & availability</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full flex items-center gap-3 p-2.5 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                <Users size={16} className="text-pink-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-800">User Management</p>
                <p className="text-xs text-gray-600">Add workers</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/admin/available-rooms')}
              className="w-full flex items-center gap-3 p-2.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                <Bed size={16} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-gray-800">Available Rooms</p>
                <p className="text-xs text-gray-600">View availability</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-600" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle size={16} className="text-green-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">All Systems OK</p>
              <p className="text-xs text-gray-600">Last checked: Just now</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle size={16} className="text-blue-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Database Online</p>
              <p className="text-xs text-gray-600">Response: 45ms</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
            <CheckCircle size={16} className="text-purple-600" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Payments Active</p>
              <p className="text-xs text-gray-600">Secure transactions</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
