// src/app/api/partners/settings/profile/route.ts - ALL TYPESCRIPT ERRORS FIXED
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Proper types for the data structures
interface CompanyProfileData {
  support_email?: string | null
  billing_email?: string | null
  marketing_email?: string | null
  logo_url?: string | null
  socials?: Record<string, string> | null
}

interface MemberProfileData {
  title?: string | null
  phone?: string | null
  timezone?: string | null
  notify_new_messages?: boolean | null
  notify_listing_changes?: boolean | null
  billing_email?: string | null
  marketing_email?: string | null
}

interface CompanyUser {
  company_id: string
  role: 'company_admin' | 'company_member'
}

interface RequestBody {
  company?: CompanyProfileData
  member?: MemberProfileData
}

// Helper to create Supabase server client with proper typing
async function createSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { 
          return cookieStore.get(name)?.value 
        },
        set(name: string, value: string, options: CookieOptions) { 
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) { 
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Helper to get authenticated user and company membership
async function getAuthenticatedUserAndCompany(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // Fixed: Use proper typing without .returns()
  const { data: memberships, error: membershipError } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', user.id)
    .limit(1) as { data: CompanyUser[] | null; error: any }

  if (membershipError) {
    console.error('Membership query error:', membershipError)
    throw new Error('Failed to verify company membership')
  }

  if (!memberships || memberships.length === 0) {
    throw new Error('No company membership found')
  }

  return {
    user,
    companyId: memberships[0].company_id,
    userRole: memberships[0].role
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { user, companyId } = await getAuthenticatedUserAndCompany(supabase)

    // Fixed: Direct await instead of Promise.allSettled to avoid type conflicts
    const companyQuery = supabase
      .from('company_profiles')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

    const memberQuery = supabase
      .from('company_member_profiles')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Execute queries with proper error handling
    let company: CompanyProfileData = {}
    let member: MemberProfileData = {}

    try {
      const { data: companyData, error: companyError } = await companyQuery
      if (!companyError && companyData) {
        company = companyData as CompanyProfileData
      } else if (companyError) {
        console.warn('Company profile error:', companyError)
      }
    } catch (error) {
      console.warn('Company profile fetch failed:', error)
    }

    try {
      const { data: memberData, error: memberError } = await memberQuery
      if (!memberError && memberData) {
        member = memberData as MemberProfileData
      } else if (memberError) {
        console.warn('Member profile error:', memberError)
      }
    } catch (error) {
      console.warn('Member profile fetch failed:', error)
    }

    return NextResponse.json({ 
      company, 
      member 
    })

  } catch (error: unknown) {
    console.error('GET /api/partners/settings/profile error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
    
    if (errorMessage.includes('No company membership')) {
      return NextResponse.json(
        { error: 'Company membership required' }, 
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    let body: RequestBody
    
    try {
      body = await req.json() as RequestBody
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' }, 
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' }, 
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServer()
    const { user, companyId, userRole } = await getAuthenticatedUserAndCompany(supabase)

    // Handle company profile updates (only for admins)
    if (body.company && typeof body.company === 'object') {
      if (userRole !== 'company_admin') {
        return NextResponse.json(
          { error: 'Only company admins can update company profiles' }, 
          { status: 403 }
        )
      }

      // Build company data with proper typing
      const companyData: CompanyProfileData & { company_id: string } = {
        company_id: companyId,
        ...body.company
      }

      const { error: companyError } = await supabase
        .from('company_profiles')
        .upsert(companyData, { onConflict: 'company_id' })

      if (companyError) {
        console.error('Company profile update error:', companyError)
        return NextResponse.json(
          { error: 'Failed to update company profile' }, 
          { status: 500 }
        )
      }
    }

    // Handle member profile updates
    if (body.member && typeof body.member === 'object') {
      const memberData: MemberProfileData & { user_id: string; company_id: string } = {
        user_id: user.id,
        company_id: companyId,
        ...body.member
      }

      const { error: memberError } = await supabase
        .from('company_member_profiles')
        .upsert(memberData, { onConflict: 'user_id,company_id' })

      if (memberError) {
        console.error('Member profile update error:', memberError)
        return NextResponse.json(
          { error: 'Failed to update member profile' }, 
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('POST /api/partners/settings/profile error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
    
    if (errorMessage.includes('No company membership')) {
      return NextResponse.json(
        { error: 'Company membership required' }, 
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}