import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useAuth from '../hooks/useAuth'

export default function IndexPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    
    // Redirect based on user role
    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin')
      } else if (user.role === 'worker') {
        router.replace('/worker')
      } else {
        router.replace('/home')
      }
    } else {
      // Not logged in, go to home
      router.replace('/home')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
