import React from 'react'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/ToastProvider'

// Suppress console output in production for security
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log = () => {}
  console.warn = () => {}
  console.info = () => {}
  console.debug = () => {}
}

export default function App({ Component, pageProps }){
  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  )
}
