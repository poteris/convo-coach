// for more info on how this works see: https://supabase.com/docs/guides/auth/server-side/nextjs
// NOTE: this can be an api
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import axios from 'axios'

export async function loginWithOtp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  if (!email) {
    console.error('Email is required for OTP sign-in.')
    return { error: 'Email is required for OTP sign-in.' }
  }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const response = await axios.post(`${baseUrl}/api/auth/admin/verify`, { email })
    const data = response.data
    
    if (response.status !== 200) {
      console.error('Error during admin verification:', data.error)
      return { error: data.error || 'Failed to verify admin status' }
    }

     // If verification passed, send magic link
     const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('Error during OTP sign-in:', error.message)
      return { error: 'Failed to send login link. Please try again.' }
    }
    
    return { success: true }
  } catch (err) {
    console.error('Unexpected error during OTP sign-in:', err)
    return { error: 'An unexpected error occurred. Please try again later.' }
  }
}

export async function logoutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}