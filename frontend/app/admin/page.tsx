import { createClient } from '@/utils/supabase/server'
import LoginForm from '@/components/AdminLogin/LoginForm'
import { SiteAdmin } from '@/components/screens/SiteAdmin'


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
    return <div>Unable to access admin page. Please try again later.</div>
  }
}