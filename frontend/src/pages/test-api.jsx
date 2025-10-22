import React, { useState } from 'react'
import MainLayout from '../layouts/MainLayout'

export default function TestAPI() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      // Test 1: Get all testimonials
      const response1 = await fetch('http://localhost:5000/api/testimonials?limit=50')
      const data1 = await response1.json()
      
      // Test 2: Get stats
      const response2 = await fetch('http://localhost:5000/api/testimonials/stats')
      const data2 = await response2.json()
      
      setResult(JSON.stringify({
        testimonials: data1,
        stats: data2,
        count: data1.length
      }, null, 2))
    } catch (error) {
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
        
        <button
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-6"
        >
          {loading ? 'Testing...' : 'Test Testimonials API'}
        </button>

        {result && (
          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">API Response:</h2>
            <pre className="whitespace-pre-wrap text-sm overflow-auto">
              {result}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Testimonials must be <strong>approved by admin</strong> to show on frontend</li>
            <li>Go to <code>/admin/testimonials</code> to approve pending testimonials</li>
            <li>Only approved testimonials with rating 4+ show on homepage</li>
            <li>Check browser console (F12) for detailed error messages</li>
            <li>Make sure backend is running on port 5000</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
