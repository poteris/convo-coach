import { createClient } from '@/utils/supabase/server'
import LoginForm from '@/components/OrganiserAdminLogin/LoginForm'
import { OrganiserAdmin } from '@/components/screens/OrganiserAdmin'

async function isOrganiser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_organiser')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return false
  }
  
  return data.is_organiser
}

export default async function OrganiserAdminPage() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user || !(await isOrganiser(supabase, user.id))) {
      return <LoginForm />
    }

    return (
      <OrganiserAdmin />
    )
  } catch (error) {
    console.error('Error in OrganiserAdminPage:', error)
    return <div>Unable to access organiser admin page. Please try again later.</div>
  }
}
