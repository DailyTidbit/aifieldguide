// src/app/api/partners/settings/profile/route.ts - Optimized cookie auth
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has completed password setup
    if (!user.user_metadata?.has_password) {
      return NextResponse.json({ error: 'Password setup required' }, { status: 403 })
    }

    // Get user's company membership
    const { data: membership, error: membershipError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      console.error('Membership query error:', membershipError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!membership?.company_id) {
      return NextResponse.json({ error: 'No company membership found' }, { status: 404 })
    }

    const companyId = membership.company_id
    const userRole = membership.role

    // Fetch company and member profiles
    const [companyResult, memberResult] = await Promise.all([
      supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle(),
      supabase
        .from('company_member_profiles')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .maybeSingle()
    ])

    // Handle database errors (ignore "not found" errors - PGRST116)
    if (companyResult.error && companyResult.error.code !== 'PGRST116') {
      console.error('Company profile error:', companyResult.error)
      return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 })
    }

    if (memberResult.error && memberResult.error.code !== 'PGRST116') {
      console.error('Member profile error:', memberResult.error)
      return NextResponse.json({ error: 'Failed to fetch member profile' }, { status: 500 })
    }

    return NextResponse.json({
      company: companyResult.data || {},
      member: memberResult.data || {},
      userRole,
      companyId
    })

  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { company, member } = body

    if (!company && !member) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check password setup
    if (!user.user_metadata?.has_password) {
      return NextResponse.json({ error: 'Password setup required' }, { status: 403 })
    }

    // Get user's company membership
    const { data: membership, error: membershipError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError || !membership?.company_id) {
      return NextResponse.json({ error: 'No company membership found' }, { status: 404 })
    }

    const companyId = membership.company_id
    const userRole = membership.role
    const timestamp = new Date().toISOString()

    // Update company profile (only if user is admin and data provided)
    if (company && userRole === 'company_admin') {
      // Validate company data
      if (company.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.support_email)) {
        return NextResponse.json({ error: 'Invalid support email format' }, { status: 400 })
      }
      
      if (company.billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.billing_email)) {
        return NextResponse.json({ error: 'Invalid billing email format' }, { status: 400 })
      }
      
      if (company.marketing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.marketing_email)) {
        return NextResponse.json({ error: 'Invalid marketing email format' }, { status: 400 })
      }

      const { error: companyError } = await supabase
        .from('company_profiles')
        .upsert({
          company_id: companyId,
          logo_url: company.logo_url || null,
          support_email: company.support_email || null,
          billing_email: company.billing_email || null,
          marketing_email: company.marketing_email || null,
          updated_at: timestamp
        }, { 
          onConflict: 'company_id'
        })

      if (companyError) {
        console.error('Company profile update error:', companyError)
        return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 })
      }
    }

    // Update member profile (if data provided)
    if (member) {
      // Validate member data
      if (member.billing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.billing_email)) {
        return NextResponse.json({ error: 'Invalid billing email format' }, { status: 400 })
      }
      
      if (member.marketing_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.marketing_email)) {
        return NextResponse.json({ error: 'Invalid marketing email format' }, { status: 400 })
      }

      const { error: memberError } = await supabase
        .from('company_member_profiles')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          title: member.title || null,
          phone: member.phone || null,
          timezone: member.timezone || null,
          billing_email: member.billing_email || null,
          marketing_email: member.marketing_email || null,
          notify_new_messages: member.notify_new_messages ?? true,
          notify_listing_changes: member.notify_listing_changes ?? true,
          updated_at: timestamp
        }, { 
          onConflict: 'user_id,company_id' 
        })

      if (memberError) {
        console.error('Member profile update error:', memberError)
        return NextResponse.json({ error: 'Failed to update member profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      timestamp 
    })

  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}