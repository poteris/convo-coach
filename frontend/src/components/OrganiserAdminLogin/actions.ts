'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import axios from 'axios'

export async function loginWithOtp(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Email is required' }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const response = await axios.post(`${baseUrl}/api/auth/organiser-admin/verify`, {
      email
    })

    if (response.status === 200) {
      return { success: true }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        return { error: 'You are not authorized to access this area' }
      }
      return { error: error.response?.data?.error || 'Failed to send login link' }
    }
    return { error: 'An unexpected error occurred' }
  }
}

export async function logoutUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  await supabase.auth.signOut()
  redirect('/')
} 