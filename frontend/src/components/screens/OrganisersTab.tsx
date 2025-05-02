'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import axios from 'axios'

interface Organiser {
  user_id: string
  email: string
  created_at: string
}

export function OrganisersTab() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [organisers, setOrganisers] = useState<Organiser[]>([])
  const [isLoadingOrganisers, setIsLoadingOrganisers] = useState(true)

  const supabase = createClient()

  const loadOrganisers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .eq('is_organiser', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrganisers(data || [])
    } catch (error) {
      console.error('Error loading organisers:', error)
      setMessage({ type: 'error', text: 'Failed to load organisers' })
    } finally {
      setIsLoadingOrganisers(false)
    }
  }

  // Load organisers on component mount
  useEffect(() => {
    loadOrganisers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
      const response = await axios.post(`${baseUrl}/api/auth/organiser-admin/verify`, {
        email,
        invitedBy: user.id
      })

      if (response.status === 200) {
        setMessage({ 
          type: 'success', 
          text: 'Invitation sent successfully. The user will receive a login link via email.' 
        })
        setEmail('')
        loadOrganisers() // Refresh the list
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to send invitation' 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: 'An unexpected error occurred' 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveOrganiser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this organiser?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_organiser: false })
        .eq('user_id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Organiser removed successfully' })
      loadOrganisers() // Refresh the list
    } catch (error) {
      console.error('Error removing organiser:', error)
      setMessage({ type: 'error', text: 'Failed to remove organiser' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Invite Organiser</h2>
        <p className="mt-1 text-sm text-gray-500">
          Invite a new organiser by entering their email address. They will receive a login link via email.
        </p>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="email"
              id="email"
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'error' ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <p
            className={`text-sm ${
              message.type === 'error' ? 'text-red-800' : 'text-green-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium text-gray-900">Current Organisers</h2>
        {isLoadingOrganisers ? (
          <p className="mt-2 text-sm text-gray-500">Loading organisers...</p>
        ) : organisers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No organisers found</p>
        ) : (
          <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Email
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Added
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {organisers.map((organiser) => (
                  <tr key={organiser.user_id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {organiser.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(organiser.created_at).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => handleRemoveOrganiser(organiser.user_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 