import React, { useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'

export default function Dashboard(){
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [loading, user, router])

  if (loading) return <MainLayout><div className="p-8">Loading...</div></MainLayout>
  if (!user) return null

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-gray-600">You are logged in as {user.email}</p>
        <button onClick={logout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">Logout</button>
      </div>
    </MainLayout>
  )
}
