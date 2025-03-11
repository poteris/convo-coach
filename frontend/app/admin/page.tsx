import { createClient } from '@/utils/supabase/server'
import LoginForm from '../login/LoginForm'
import { SiteAdmin } from '@/components/screens/SiteAdmin'
import { redirect } from 'next/navigation'

/**
 * Checks if a user has admin privileges
 * @param user The user object from Supabase auth
 * @returns boolean indicating if the user has admin role
 */
function isAdmin(user: { user_metadata?: { role?: string } } | null): boolean {
  return user?.user_metadata?.role === 'admin'
}

export default async function AdminPage() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error fetching user:', error)
      return <LoginForm />
    }
    
    if (!user || !isAdmin(user)) {
      return <LoginForm />
    }
        
    return (
      <SiteAdmin />
    )
  } catch (error) {
    console.error('Error in AdminPage:', error)
    // Only show generic error to frontend
    return <div>Unable to access admin page. Please try again later.</div>
  }
}