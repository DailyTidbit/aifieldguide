// src/app/admin/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '../lib/supabaseServer'
import AdminDashboard from '../components/AdminDashboard'

async function checkAdminAccess() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth?redirect=/admin')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      redirect('/')
    }

    return user
  } catch (error) {
    console.error('Admin auth error:', error)
    redirect('/auth?redirect=/admin')
  }
}

export default async function AdminPage() {
  // Server-side auth check before rendering
  await checkAdminAccess()
  
  return <AdminDashboard />
}