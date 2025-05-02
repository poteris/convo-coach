import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, invitedBy } = await req.json()
    console.log('Organiser admin verification requested for email')
    
    if (!email) {
      console.log('Organiser admin verification failed: Email is required')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!invitedBy) {
      console.log('Organiser admin verification failed: Inviter ID is required')
      return NextResponse.json(
        { error: 'Inviter ID is required' },
        { status: 400 }
      )
    }
    
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {db: { schema: process.env.SUPABASE_SCHEMA || 'public' }});
    
    // Verify that the inviter is an admin
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', invitedBy)
      .single()
    
    if (inviterError || !inviterProfile?.is_admin) {
      console.error('Error verifying inviter:', inviterError)
      return NextResponse.json(
        { error: 'Only admins can invite organisers' },
        { status: 403 }
      )
    }
    
    // Check if this email is already an organiser
    console.log('Checking if user is already an organiser...')
    const { data: organiserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', email)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking organiser profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user status' },
        { status: 500 }
      )
    }
    
    if (organiserProfile) {
      // User exists, update their profile to be an organiser
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_organiser: true })
        .eq('user_id', organiserProfile.user_id)
      
      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user profile' },
          { status: 500 }
        )
      }
    } else {
      // Create new user and profile
      console.log('Creating new organiser account...')
      const { error: createError, data: { user } } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true
      })
      
      if (createError || !user) {
        console.error('Error creating organiser user:', createError)
        return NextResponse.json(
          { error: 'Failed to create organiser account' },
          { status: 500 }
        )
      }

      // Create profile record for the organiser
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: user.id,
        email,
        is_organiser: true
      })
      
      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to create profile record' + profileError.message },
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