import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // On mount, hydrate token from localStorage (dev-friendly)
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (t) setToken(t)
    } catch {}
    fetchMe()
  }, [fetchMe])

  const login = async (creds) => {
    console.log('AuthContext: Attempting login...')
    try {
      const { data } = await api.post('/auth/login', creds)
      console.log('AuthContext: Login response received:', data)
      setUser(data.user)
      if (data.token) {
        setToken(data.token)
        try { 
          localStorage.setItem('auth_token', data.token)
          console.log('AuthContext: Token saved to localStorage')
        } catch (e) {
          console.error('AuthContext: Failed to save token:', e)
        }
      }
      return data.user
    } catch (error) {
      console.error('AuthContext: Login failed:', error)
      throw error
    }
  }

  const googleLogin = async (idToken) => {
    const { data } = await api.post('/auth/google', { idToken })
    setUser(data.user)
    if (data.token) {
      setToken(data.token)
      try { localStorage.setItem('auth_token', data.token) } catch {}
    }
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setUser(data.user)
    if (data.token) {
      setToken(data.token)
      try { localStorage.setItem('auth_token', data.token) } catch {}
    }
    return data.user
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    setToken(null)
    try { localStorage.removeItem('auth_token') } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(){
  return useContext(AuthContext)
}
