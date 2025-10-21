import React from 'react'
import MainLayout from '../../layouts/MainLayout'

// Profile page allows user to view/edit profile
export default function Profile(){
  return (
    <MainLayout>
      <h2 className="font-playfair text-2xl">Profile</h2>
      <div className="card max-w-md mt-4">User profile details go here.</div>
    </MainLayout>
  )
}
