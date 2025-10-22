import React, { useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import { useRouter } from 'next/router'

// AdminLayout provides a simple two-column admin layout with a sidebar
export default function AdminLayout({ children }){
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (user.role !== 'admin') router.replace('/home')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white shadow-inner p-4">
        <h3 className="text-lg font-semibold">Admin</h3>
        <nav className="mt-4 space-y-2 text-sm text-textsub">
          <a href="/admin" className="block py-2 px-3 rounded hover:bg-background">Overview</a>
          <a href="/admin/bookings" className="block py-2 px-3 rounded hover:bg-background">Bookings</a>
          <a href="/admin/rooms" className="block py-2 px-3 rounded hover:bg-background">Rooms</a>
        </nav>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
