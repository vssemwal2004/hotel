import React from 'react'
import MainLayout from '../../layouts/MainLayout'
import { useForm } from 'react-hook-form'

// Reset password stub
export default function ResetPass(){
  const { register, handleSubmit } = useForm()
  const onSubmit = data => console.log('reset', data)
  return (
    <MainLayout>
      <div className="max-w-md mx-auto card">
        <h3 className="font-playfair text-xl">Reset Password</h3>
        <form className="mt-4" onSubmit={handleSubmit(onSubmit)}>
          <input {...register('password')} type="password" className="w-full border p-2 rounded" placeholder="New password" />
          <button className="btn-primary mt-3">Reset password</button>
        </form>
      </div>
    </MainLayout>
  )
}
