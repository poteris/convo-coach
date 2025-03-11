"use client"

import { useState } from 'react'
import { loginWithOtp } from './actions'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  
  const handleLogin = async (formData: FormData) => {
    const { error } = await loginWithOtp(formData)
    
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Magic link sent! Check your email.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        
        {message && (
          <div className="p-4 bg-blue-100 rounded-md text-blue-800">
            {message}
          </div>
        )}
        
        <form action={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Send Magic Link
          </button>
        </form>
      </div>
    </div>
  )
}