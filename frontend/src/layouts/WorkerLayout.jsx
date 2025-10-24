import React from 'react'
import Link from 'next/link'
import useAuth from '../hooks/useAuth'

export default function WorkerLayout({ children }){
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <Link className="font-semibold text-red-600" href="/worker">Details</Link>
            <Link className="text-gray-700 hover:text-gray-900" href="/worker/allot">Room Allotment</Link>
            <Link className="text-gray-700 hover:text-gray-900" href="/dashboard/profile">Profile</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">{user?.name} <span className="text-gray-400">({user?.role})</span></span>
            <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black">Logout</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
