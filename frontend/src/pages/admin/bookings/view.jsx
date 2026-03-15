import { useEffect } from 'react'
import { useRouter } from 'next/router'

// This page has been merged into /admin/bookings
export default function ViewBookingsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/bookings') }, [router])
  return null
}

