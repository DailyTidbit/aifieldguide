// src/app/api/partners/claim/route.ts - Enhanced Version
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

// Enhanced domain normalization function
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .trim()
    .replace(/^www\./, '') // Remove www prefix
    .replace(/\/+$/, '') // Remove trailing slashes
}

// Enhanced domain matching with comprehensive subdomain support
function isEmailDomainValid(emailDomain: string, allowedDomains: string[]): boolean {
  const normalizedEmailDomain = normalizeDomain(emailDomain)
  
  return allowedDomains.some(allowedDomain => {
    const normalizedAllowed = normalizeDomain(allowedDomain)
    
    // Exact match
    if (normalizedEmailDomain === normalizedAllowed) {
      return true
    }
    
    // Subdomain match (email: user@sub.example.com, allowed: example.com)
    if (normalizedEmailDomain.endsWith(`.${normalizedAllowed}`)) {
      return true
    }
    
    // Reverse subdomain match (email: user@example.com, allowed: sub.example.com)
    if (normalizedAllowed.endsWith(`.${normalizedEmailDomain}`)) {
      return true
    }
    
    // Handle www variations
    if (normalizedEmailDomain === `www.${normalizedAllowed}` || 
        normalizedAllowed === `www.${normalizedEmailDomain}`) {
      return true
    }
    
    return false
  })
}

// Generate helpful error messages
function generateDomainSuggestions(emailDomain: string, allowedDomains: string[]): string {
  const suggestions = allowedDomains.map(domain => `@${domain}`)
  
  if (suggestions.length === 1) {
    return `Try using an email ending with ${suggestions[0]}`
  } else if (suggestions.length === 2) {
    return `Try using an email ending with ${suggestions[0]} or ${suggestions[1]}`
  } else {
    return `Try using an email ending with: ${suggestions.slice(0, -1).join(', ')}, or ${suggestions.slice(-1)[0]}`
  }
}

// Log verification attempts for monitoring
async function logVerificationAttempt(
  userId: string, 
  email: string, 
  companyId: string, 
  success: boolean, 
  reason?: string
) {
  try {
    await supabaseAdmin
      .from('partner_verification_logs') // You'd need to create this table
      .insert({
        user_id: userId,
        email: email,
        company_id: companyId,
        success: success,
        reason: reason,
        timestamp: new Date().toISOString(),
        ip_address: null, // Could add IP tracking if needed
        user_agent: null  // Could add user agent if needed
      })
  } catch (error) {
    console.error('Failed to log verification attempt:', error)
  }
}

export async function POST(req: Request) {
  try {
    const { companyId } = (await req.json()) as { companyId?: string }
    
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID is required',
        code: 'MISSING_COMPANY_ID' 
      }, { status: 400 })
    }

    // Set up Supabase client with cookies
    const jar = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(n: string) { return jar.get(n)?.value },
          set(n: string, v: string, o: CookieOptions) { jar.set({ name: n, value: v, ...o }) },
          remove(n: string, o: CookieOptions) { jar.set({ name: n, value: '', ...o }) }
        }
      }
    )

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return NextResponse.json({ 
        error: 'You must be signed in to claim company access',
        code: 'NOT_AUTHENTICATED',
        suggestion: 'Please sign in with your work email first'
      }, { status: 401 })
    }

    // Extract and normalize email domain
    const emailDomain = normalizeDomain(user.email.split('@')[1] || '')
    
    if (!emailDomain) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT' 
      }, { status: 400 })
    }

    // Get company details with enhanced error handling
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, domain, domains, status')
      .eq('id', companyId)
      .maybeSingle()

    if (companyError) {
      console.error('Company lookup error:', companyError)
      return NextResponse.json({ 
        error: 'Failed to verify company information',
        code: 'COMPANY_LOOKUP_FAILED' 
      }, { status: 500 })
    }

    if (!company) {
      return NextResponse.json({ 
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
        suggestion: 'Please check your invitation link or contact support'
      }, { status: 404 })
    }

    // Check if company is active
    if (company.status && company.status !== 'active') {
      return NextResponse.json({ 
        error: `Company account is ${company.status}`,
        code: 'COMPANY_INACTIVE',
        suggestion: 'Please contact support to activate your company account'
      }, { status: 403 })
    }

    // Build comprehensive allowed domains list
    const allowedDomains: string[] = Array.from(new Set([
      ...(company.domains ?? []),
      ...(company.domain ? [company.domain] : [])
    ].filter(Boolean)))

    if (allowedDomains.length === 0) {
      console.error(`No domains configured for company ${company.id}`)
      return NextResponse.json({ 
        error: 'No email domains configured for this company',
        code: 'NO_DOMAINS_CONFIGURED',
        suggestion: 'Please contact support to configure your company domains'
      }, { status: 500 })
    }

    // Enhanced domain validation
    const isValidDomain = isEmailDomainValid(emailDomain, allowedDomains)

    if (!isValidDomain) {
      await logVerificationAttempt(
        user.id, 
        user.email, 
        companyId, 
        false, 
        `Invalid domain: ${emailDomain}`
      )

      return NextResponse.json({ 
        ok: false, 
        error: `Email domain @${emailDomain} is not authorized for ${company.name}`,
        code: 'DOMAIN_NOT_ALLOWED',
        emailDomain: emailDomain,
        companyName: company.name,
        allowedDomains: allowedDomains,
        suggestion: generateDomainSuggestions(emailDomain, allowedDomains),
        manualVerificationLink: `/partners/messages/new?company=${company.id}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@dailytidbit.org'
      }, { status: 403 })
    }

    // Check if user is already a member of this company
    const { data: existingMembership } = await supabaseAdmin
      .from('company_users')
      .select('role, created_at')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({ 
        ok: true, 
        role: existingMembership.role,
        message: 'You are already a member of this company',
        isExistingMember: true,
        memberSince: existingMembership.created_at
      })
    }

    // Check if user belongs to any other companies (optional business logic)
    const { data: otherMemberships, error: membershipError } = await supabaseAdmin
      .from('company_users')
      .select('company_id, companies!inner(name)')
      .eq('user_id', user.id)

    if (membershipError) {
      console.error('Error checking existing memberships:', membershipError)
    }

    // Determine role: first user becomes admin, others become editors
    const { count: existingMemberCount } = await supabaseAdmin
      .from('company_users')
      .select('*', { head: true, count: 'exact' })
      .eq('company_id', companyId)

    const isFirstUser = (existingMemberCount ?? 0) === 0
    const role = isFirstUser ? 'company_admin' : 'company_editor'

    // Add user to company with proper error handling
    const { error: membershipInsertError } = await supabaseAdmin
      .from('company_users')
      .upsert({ 
        user_id: user.id, 
        company_id: companyId, 
        role: role,
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,company_id',
        ignoreDuplicates: false 
      })

    if (membershipInsertError) {
      console.error('Error adding user to company:', membershipInsertError)
      await logVerificationAttempt(user.id, user.email, companyId, false, 'Membership creation failed')
      
      return NextResponse.json({ 
        error: 'Failed to add you to the company',
        code: 'MEMBERSHIP_CREATION_FAILED',
        suggestion: 'Please try again or contact support'
      }, { status: 500 })
    }

    // Initialize user profiles with enhanced error handling
    try {
      // Ensure consumer profile exists
      const displayName = (user.user_metadata as any)?.full_name || 
                         user.email.split('@')[0] || 
                         'User'

      await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: user.id, 
          full_name: displayName,
          username: null,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id', 
          ignoreDuplicates: true 
        })

      // Ensure company profile exists
      await supabaseAdmin
        .from('company_profiles')
        .upsert({ 
          company_id: companyId,
          created_at: new Date().toISOString()
        }, { 
          onConflict: 'company_id', 
          ignoreDuplicates: true 
        })

      // Ensure company member profile exists
      await supabaseAdmin
        .from('company_member_profiles')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          created_at: new Date().toISOString(),
          // Set default notification preferences
          notify_new_messages: true,
          notify_listing_changes: true
        }, { 
          onConflict: 'user_id,company_id', 
          ignoreDuplicates: true 
        })

    } catch (profileError) {
      console.error('Error initializing profiles:', profileError)
      // Don't fail the entire request for profile initialization errors
      // The user can still access the dashboard and complete setup later
    }

    // Log successful verification
    await logVerificationAttempt(user.id, user.email, companyId, true, `Added as ${role}`)

    // Send notification email to existing company admins (if not first user)
    if (!isFirstUser) {
      try {
        // Get company admins to notify
        const { data: companyAdmins } = await supabaseAdmin
          .from('company_users')
          .select(`
            profiles!inner(full_name, id),
            company_member_profiles!inner(marketing_email)
          `)
          .eq('company_id', companyId)
          .eq('role', 'company_admin')

        // TODO: Send email notification to admins about new team member
        // This would integrate with your email service
        
      } catch (notificationError) {
        console.error('Failed to send admin notifications:', notificationError)
        // Don't fail the request for notification errors
      }
    }

    // Return success response with comprehensive information
    return NextResponse.json({ 
      ok: true, 
      role: role,
      isFirstUser: isFirstUser,
      companyName: company.name,
      memberCount: (existingMemberCount ?? 0) + 1,
      message: `Successfully added as ${role === 'company_admin' ? 'Company Admin' : 'Team Member'}`,
      nextSteps: [
        'Complete your company profile',
        'Review your tool listings', 
        'Set up team notifications',
        ...(isFirstUser ? ['Add team members'] : [])
      ],
      redirectUrl: '/partners/dashboard'
    })

  } catch (error) {
    console.error('[partners/claim] Unexpected error:', error)
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during verification',
      code: 'INTERNAL_ERROR',
      suggestion: 'Please try again or contact support if the problem persists'
    }, { status: 500 })
  }
}

// Optional: Add a GET endpoint to check company information
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  
  if (!companyId) {
    return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
  }

  try {
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, domain, domains, status')
      .eq('id', companyId)
      .maybeSingle()

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const allowedDomains = Array.from(new Set([
      ...(company.domains ?? []),
      ...(company.domain ? [company.domain] : [])
    ].filter(Boolean)))

    return NextResponse.json({
      id: company.id,
      name: company.name,
      allowedDomains: allowedDomains,
      status: company.status
    })

  } catch (error) {
    console.error('Error fetching company info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}