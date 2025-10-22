import React, { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import useAuth from '../../hooks/useAuth'
import { useRouter } from 'next/router'

export default function Register(){
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { register: registerUser } = useAuth()
  const router = useRouter()

  useEffect(() => setIsMounted(true), [])

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
  const u = await registerUser({ name: data.name, email: data.email, password: data.password })
  // Newly registered users are not admins unless seeded by backend
  router.push('/home')
    } catch (e) {
      alert(e?.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const password = watch('password')

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8 px-4 overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-red-200 to-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-amber-200 to-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-medium"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-fast"></div>
          {isMounted && [...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400/30 rounded-full animate-float-particle"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="relative mx-4 md:mx-0 md:flex min-h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-sm border border-white/30 transform transition-all duration-500 hover:shadow-3xl">
            <div className="hidden md:flex md:w-2/5 relative bg-gradient-to-br from-red-800 via-red-700 to-amber-700 p-12 overflow-hidden group">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMtMi4yIDAtNCAxLjgtNCA0czEuOCA0IDQgNCA0LTEuOCA0LTRzLTEuOC00LTQtNHoiLz48cGF0aCBkPSJNNTAgMTZjLTIuMiAwLTQgMS44LTQgNHMxLjggNCA0IDQgNC0xLjggNC00LTEuOC00LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10 animate-pattern-move"></div>

              {/* 3D Icons Background */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-12 transform rotate-12 transition-transform duration-700 group-hover:scale-110">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </div>
                <div className="absolute bottom-20 right-16 transform -rotate-6 transition-transform duration-700 group-hover:scale-110">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 11h8v2H8zm0 4h8v2H8zm0 4h8v2H8zM5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
                  </svg>
                </div>
                <div className="absolute top-1/2 left-1/3 transform rotate-45 transition-transform duration-700 group-hover:scale-110">
                  <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                  </svg>
                </div>
                <div className="absolute bottom-12 left-20 transform -rotate-12 transition-transform duration-700 group-hover:scale-110">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                  </svg>
                </div>
              </div>

              {/* Enhanced floating elements */}
              <div className="absolute top-8 left-8 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 animate-float-slow transition-all duration-300 hover:bg-white/20"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 bg-amber-300/30 rounded-lg transform rotate-45 backdrop-blur-sm animate-float-medium transition-all duration-300 hover:bg-amber-300/40"></div>
              <div className="absolute top-1/3 right-12 w-12 h-12 bg-red-300/20 rounded-full backdrop-blur-sm animate-float-fast transition-all duration-300 hover:bg-red-300/30"></div>

              {/* Enhanced Content */}
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 transform transition-transform duration-500 hover:scale-105 hover:rotate-3">
                    <img 
                      src="/images/logo-icon/logo.webp" 
                      alt="Luxury Hotel" 
                      className="w-20 h-20 object-contain transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  <h1 className="text-4xl font-playfair font-bold text-white mb-4 leading-tight">
                    Welcome Back
                  </h1>
                  <p className="text-white/90 text-lg max-w-xs leading-relaxed">
                    Experience luxury redefined. Your perfect stay awaits.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 transform transition-all duration-500 hover:scale-105 hover:bg-white/15">
                  <div className="flex items-center justify-center mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <svg 
                        key={star} 
                        className="w-5 h-5 text-amber-300 transform transition-transform duration-300 hover:scale-125" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/90 italic text-center text-sm leading-relaxed">
                    "Exceptional service and luxurious accommodations. The perfect getaway experience that exceeded all expectations."
                  </p>
                  <p className="text-white/70 text-xs text-center mt-3 font-medium">- Sarah Johnson, Premium Guest</p>
                </div>
              </div>

              {/* Bottom decorative line */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-amber-400/50 rounded-full"></div>
            </div>

            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-tr-3xl transition-all duration-500 hover:opacity-80"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-bl-3xl transition-all duration-500 hover:opacity-80"></div>

              <div className="max-w-md mx-auto w-full">
                <div className="text-center md:text-left">
                  <div className="md:hidden w-20 h-20 bg-gradient-to-br from-red-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 transform transition-transform duration-300 hover:scale-105">
                    <img src="/images/logo-icon/logo.webp" alt="Logo" className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="font-playfair text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-500 transform transition-transform duration-300 hover:scale-105">Create account</h3>
                  <p className="text-gray-600 mt-3 text-lg transition-colors duration-300 hover:text-gray-800">Sign up to start your luxury journey</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                      <input {...register('name', { required: 'Name is required' })} className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white/70 backdrop-blur-sm" placeholder="Your full name" />
                      {errors.name && <p className="text-red-600 text-sm mt-2">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white/70 backdrop-blur-sm" placeholder="you@email.com" />
                      {errors.email && <p className="text-red-600 text-sm mt-2">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                      <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } })} type="password" className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white/70 backdrop-blur-sm" placeholder="Create a password" />
                      {errors.password && <p className="text-red-600 text-sm mt-2">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                      <input {...register('confirmPassword', { required: 'Please confirm', validate: value => value === password || 'Passwords do not match' })} type="password" className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white/70 backdrop-blur-sm" placeholder="Confirm password" />
                      {errors.confirmPassword && <p className="text-red-600 text-sm mt-2">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-red-600 to-amber-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
                    {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Creating...</>) : 'Create account'}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <hr className="flex-1 border-gray-300" />
                  <span className="text-sm text-gray-500 font-medium">Or continue with</span>
                  <hr className="flex-1 border-gray-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl p-3 hover:border-red-300 hover:bg-red-50 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.9 0 6.6 1.7 8.1 3.1l6-5.8C34.8 3.6 29.8 1.5 24 1.5 14.7 1.5 6.9 7.7 3.6 16.1l7.4 5.7C12.6 15.1 17.8 9.5 24 9.5z"/>
                      <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.6H24v9.1h12.6c-.5 2.6-2 4.8-4.2 6.3l6.5 5c3.8-3.5 6-8.9 6-15.8z"/>
                      <path fill="#4A90E2" d="M10.9 29.1c-.8-2.3-1.3-4.7-1.3-7.1s.5-4.8 1.3-7.1L3.6 9.9C1.3 13.4 0 17.6 0 22s1.3 8.6 3.6 12.1l7.3-5z"/>
                      <path fill="#FBBC05" d="M24 46.5c6.1 0 11.2-2 15-5.5l-7.2-5.4c-2 1.3-4.8 2.2-7.8 2.2-6.4 0-11.8-4.2-13.7-9.9l-7.4 5.7C6.9 40.3 14.7 46.5 24 46.5z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Google</span>
                  </button>

                  <button className="flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl p-3 hover:border-amber-300 hover:bg-amber-50 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.09 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12 1.21.49 2.39 1.09 3.5a2 2 0 0 1-.45 2.11L9.91 10.9a16 16 0 0 0 6 6l1.56-1.56a2 2 0 0 1 2.11-.45c1.11.6 2.29.97 3.5 1.09A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Mobile</span>
                  </button>
                </div>

                <div className="mt-8 text-center">
                  <span className="text-gray-600">Already have an account? </span>
                  <Link href="/auth/login" className="font-semibold text-red-600 hover:text-red-700">Sign in</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
          @keyframes float-medium { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
          @keyframes float-fast { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
          @keyframes float-particle { 0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; } 25% { transform: translateY(-40px) translateX(20px); opacity: 0.6; } 50% { transform: translateY(-20px) translateX(-15px); opacity: 0.8; } 75% { transform: translateY(-30px) translateX(10px); opacity: 0.5; } }
          @keyframes pattern-move { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
          @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

          .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
          .animate-float-particle { animation: float-particle linear infinite; }
          .animate-pattern-move { animation: pattern-move 20s linear infinite; }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }

          .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 25px -5px rgba(249, 115, 22, 0.1); }
          .group:hover .group-hover\:scale-110 { transform: scale(1.1); }
        `}</style>
      </div>
    </MainLayout>
  )
}
