import React from 'react'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import Chatbot from '../components/Chatbot'
import { ToastProvider } from '../components/ToastProvider'

export default function App({ Component, pageProps }){
  return (
    <AuthProvider>
      <ToastProvider>
        <Component {...pageProps} />
        <Chatbot />
      </ToastProvider>
    </AuthProvider>
  )
}
