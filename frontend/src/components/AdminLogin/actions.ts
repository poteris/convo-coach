// for more info on how this works see: https://supabase.com/docs/guides/auth/server-side/nextjs
// NOTE: this can be an api
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginWithOtp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
  
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
      },
    })
    if (error) {
      console.error('Error during OTP sign-in:', error.message)
      return { error }
    }
  } catch (err) {
    console.error('Unexpected error during OTP sign-in:', err)
    return { error: err }
  }
}

export async function logoutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}