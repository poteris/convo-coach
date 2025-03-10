import { supabase } from '../init'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(request: Request) {
    const { email, redirectUrl } = await request.json()
    const verifiedEmail = z.string().email().parse(email)
    // if there are no admins at all, create one using the incoming email
    const { data: admins, error: adminsError } = await supabase.auth.admin.listUsers()
    const adminUsers = admins?.users.filter(
      user => user.user_metadata?.role === 'admin' 
    ) || [];
    if (adminsError) {
        console.error('Error in listUsers:', adminsError)
        return NextResponse.json({ error: adminsError })
    }
    if (  adminUsers.length === 0) {
      const { error } = await supabase.auth.admin.createUser({
        email: verifiedEmail,
        user_metadata: {
          role: 'admin'
        },
        email_confirm: true  // This confirms the email without sending verification
      });
      if (error) {
        console.error('Error in createUser:', error)
        return NextResponse.json({ error: error })
      }
    }

    // sign in with the incoming email
    const { error } = await supabase.auth.signInWithOtp({
        email: verifiedEmail,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: {
          csrf_protection: true
        }
      }
        })
    return NextResponse.json({ error })
}