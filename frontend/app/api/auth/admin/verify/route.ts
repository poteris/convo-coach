import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Check if this email is already an admin
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json(
        { error: 'Failed to verify user status' },
        { status: 500 }
      )
    }
    
    const adminUsers = users?.users.filter(user => 
      user.user_metadata?.role === 'admin'
    ) || []
    
    const isAdmin = adminUsers.some(user => user.email === email)
    
    // If not admin, check if any admin accounts exist
    if (!isAdmin) {
      if (adminUsers.length > 0) {
        return NextResponse.json(
          { error: 'Access denied. Only one admin is allowed.' },
          { status: 403 }
        )
      }
      
      // No admin exists, create new admin with this email
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        user_metadata: { role: 'admin' },
        email_confirm: true
      })
      
      if (createError) {
        console.error('Error creating admin user:', createError)
        return NextResponse.json(
          { error: 'Failed to create admin account' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}