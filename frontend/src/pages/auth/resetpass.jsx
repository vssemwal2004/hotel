import React from 'react'
import MainLayout from '../../layouts/MainLayout'
import { useForm } from 'react-hook-form'
import api from '../../utils/api'

// Reset password stub
export default function ResetPass(){
  const { register, handleSubmit } = useForm()
  const onSubmit = async (data) => {
    try {
      await api.post('/auth/reset-password', { token: data.token, password: data.password })
      alert('Password reset successful. You can now login.')
    } catch (e) {
      alert(e?.response?.data?.message || 'Reset failed')
    }
  }
  return (
    <MainLayout>
      <div className="max-w-md mx-auto card">
        <h3 className="font-playfair text-xl">Reset Password</h3>
        <form className="mt-4" onSubmit={handleSubmit(onSubmit)}>
          <input {...register('token', { required: true })} className="w-full border p-2 rounded mb-2" placeholder="Reset token" />
          <input {...register('password', { required: true, minLength: 6 })} type="password" className="w-full border p-2 rounded" placeholder="New password" />
          <button className="btn-primary mt-3">Reset password</button>
        </form>
      </div>
    </MainLayout>
  )
}
