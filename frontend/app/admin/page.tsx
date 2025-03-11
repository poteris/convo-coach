// app/admin/page.tsx
import { createClient } from '@/utils/supabase/server'
import LoginForm from '../login/LoginForm'
import { logoutUser } from '../login/actions'
import { SiteAdmin } from '@/components/screens/SiteAdmin'


function isAdmin(user: any) {
  return user.email === 'admin@example.com'
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  
  
  if (!user) {
    return <LoginForm />
  }
  
  return (
    <SiteAdmin />
  )
}