import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/header'
import Footer from '../components/Footer'
import useAuth from '../hooks/useAuth'

// MainLayout wraps public-facing pages (landing, rooms, about, contact, etc.)
export default function MainLayout({ children }){
  const router = useRouter()
  const { user, loading } = useAuth()
  const isAuthRoute = router.pathname.startsWith('/auth')

  // Redirect workers to worker portal
  useEffect(() => {
    if (!loading && user && user.role === 'worker') {
      router.replace('/worker')
    }
  }, [user, loading, router])

  // Show loading while checking auth for workers
  if (!loading && user && user.role === 'worker') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to worker portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--text-main)' }}>
      {!isAuthRoute && <Header />}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">{children}</main>
      {!isAuthRoute && <Footer />}
    </div>
  )
}
