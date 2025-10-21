import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function IndexPage() {
  const router = useRouter()

  useEffect(() => {
    // use replace to avoid keeping the redirect in history
    router.replace('/home')
  }, [router])

  return null
}
