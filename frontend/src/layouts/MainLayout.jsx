import React from 'react'
import { useRouter } from 'next/router'
import Header from '../components/header'
import Footer from '../components/Footer'

// MainLayout wraps public-facing pages (landing, rooms, about, contact, etc.)
export default function MainLayout({ children }){
  const router = useRouter()
  const isAuthRoute = router.pathname.startsWith('/auth')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--text-main)' }}>
      {!isAuthRoute && <Header />}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">{children}</main>
      {!isAuthRoute && <Footer />}
    </div>
  )
}
