// src/app/api/partners/send-invite/route.ts - Secure Admin-Only Route
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { requireAdmin, logAdminAction, checkRateLimit, getClientIP } from '@/app/lib/adminAuth'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'send-invite', 10, 60) // 10 requests per hour
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: rateLimit.resetTime.toISOString()
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
          }
        }
      )
    }

    // Admin authentication
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }
    
    const { admin } = authResult

    // Validate request body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { email, companyId, role = 'company_member', requestId } = body

    // Input validation
    if (!email || !companyId) {
      return NextResponse.json(
        { error: 'Email and company ID are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!['company_admin', 'company_member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'send_invite_failed',
        target_type: 'company',
        target_id: companyId,
        details: { error: 'Company not found', email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    let userId: string

    // Check if user already exists (use service role to list users)
    const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userListError) {
      console.error('Error listing users:', userListError)
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      )
    }

    const existingUser = userList.users.find(user => user.email === email)
    
    if (existingUser) {
      userId = existingUser.id
      
      // Check if user is already a member of this company
      const { data: existingMembership } = await supabaseAdmin
        .from('company_users')
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this company' },
          { status: 400 }
        )
      }
    } else {
      // Create new user with secure defaults
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          has_password: false,
          invited_at: new Date().toISOString(),
          invited_by: admin.user_id,
          invitation_company: companyId
        }
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        
        await logAdminAction({
          admin_user_id: admin.id,
          action: 'user_creation_failed',
          target_type: 'user',
          target_id: email,
          details: { error: createError?.message, companyId },
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        )
      }

      userId = newUser.user.id
    }

    // Add user to company with transaction safety
    const { error: membershipError } = await supabaseAdmin
      .from('company_users')
      .insert({
        user_id: userId,
        company_id: companyId,
        role: role,
        invited_by: admin.user_id,
        created_at: new Date().toISOString()
      })

    if (membershipError) {
      console.error('Error adding user to company:', membershipError)
      
      // If user was just created and this fails, clean up the user
      if (!existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }

      await logAdminAction({
        admin_user_id: admin.id,
        action: 'membership_creation_failed',
        target_type: 'company_user',
        target_id: userId,
        details: { error: membershipError.message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { error: 'Failed to add user to company' },
        { status: 500 }
      )
    }

    // Generate magic link with security parameters
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/setup`,
        data: {
          company_id: companyId,
          invited_by: admin.user_id
        }
      }
    })

    if (linkError || !linkData.properties?.action_link) {
      console.error('Error generating magic link:', linkError)
      
      // Rollback membership creation
      await supabaseAdmin
        .from('company_users')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', companyId)

      await logAdminAction({
        admin_user_id: admin.id,
        action: 'magic_link_generation_failed',
        target_type: 'user',
        target_id: userId,
        details: { error: linkError?.message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })

      return NextResponse.json(
        { error: 'Failed to generate invitation link' },
        { status: 500 }
      )
    }

    // Send invitation email
    const inviteLink = linkData.properties.action_link
    try {
      await sendSecureInvitationEmail({
        email,
        companyName: company.name,
        inviteLink,
        role,
        invitedBy: admin.user_id
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the entire operation, but log it
      await logAdminAction({
        admin_user_id: admin.id,
        action: 'invitation_email_failed',
        target_type: 'user',
        target_id: userId,
        details: { error: (emailError as Error).message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined
      })
    }

    // Update partner request if provided
    if (requestId) {
      await supabaseAdmin
        .from('partner_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          invited_user_id: userId,
          company_id: companyId
        })
        .eq('id', requestId)
    }

    // Log successful invitation
    await logAdminAction({
      admin_user_id: admin.id,
      action: 'partner_invite_sent',
      target_type: 'user',
      target_id: userId,
      details: {
        email,
        companyId,
        companyName: company.name,
        role,
        requestId: requestId || null
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      userId,
      // Security: Don't return invite link in production
      ...(process.env.NODE_ENV === 'development' && { inviteLink })
    }, {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
      }
    })

  } catch (error) {
    console.error('Partner invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list partner requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'list-requests', 50, 15) // 50 requests per 15 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { admin } = authResult
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'pending'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
    }

    const { data: requests, error, count } = await supabaseAdmin
      .from('partner_requests')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Log admin access
    await logAdminAction({
      admin_user_id: admin.id,
      action: 'list_partner_requests',
      target_type: 'partner_requests',
      target_id: status,
      details: { status, limit, offset, count },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json({ 
      requests: requests || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching partner requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partner requests' },
      { status: 500 }
    )
  }
}

// Secure email sending with enhanced template
async function sendSecureInvitationEmail({
  email,
  companyName,
  inviteLink,
  role,
  invitedBy
}: {
  email: string
  companyName: string
  inviteLink: string
  role: string
  invitedBy: string
}) {
  const isAdmin = role === 'company_admin'
  const roleText = isAdmin ? 'Company Administrator' : 'Team Member'
  
  // Security: Add expiration notice and security warnings
  const subject = `[SECURE] Welcome to Daily Tidbit Partners - ${companyName}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Tidbit Partner Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #60A875; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: white; font-size: 24px; font-weight: bold;">DT</span>
        </div>
        <h1 style="color: #111827; margin: 0;">Welcome to Daily Tidbit Partners!</h1>
      </div>

      <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">🔒 Security Notice</div>
        <div style="font-size: 14px; color: #92400e;">
          This is a secure invitation link that expires in 24 hours. Only use this link if you requested access to Daily Tidbit Partners.
        </div>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px;">
          You've been invited to join <strong>${companyName}</strong>'s partner account on Daily Tidbit.
        </p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Your Role:</div>
          <div style="font-weight: 600; color: #111827;">${roleText}</div>
          ${isAdmin ? '<div style="font-size: 12px; color: #60A875; margin-top: 4px;">✓ Full company management access</div>' : ''}
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" 
           style="display: inline-block; background: #60A875; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Set Up Your Secure Account
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <h3 style="color: #111827; margin-bottom: 12px;">Important Security Information:</h3>
        <ul style="color: #6b7280; font-size: 14px; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This invitation expires in 24 hours</li>
          <li style="margin-bottom: 8px;">Only click this link if you requested partner access</li>
          <li style="margin-bottom: 8px;">You'll be asked to create a secure password</li>
          <li style="margin-bottom: 8px;">Never share your login credentials with anyone</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Questions or concerns? Contact us at 
          <a href="mailto:partners@dailytidbit.org" style="color: #60A875;">partners@dailytidbit.org</a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
          <strong>The Daily Tidbit Team</strong><br>
          Invitation ID: ${invitedBy.slice(-8)}
        </p>
      </div>
    </body>
    </html>
  `

  const textContent = `
SECURE INVITATION - Daily Tidbit Partners

You've been invited to join ${companyName}'s partner account.

SECURITY NOTICE: This invitation expires in 24 hours. Only use this link if you requested access.

Role: ${roleText}

Set up your account: ${inviteLink}

IMPORTANT:
- This invitation expires in 24 hours
- Only click if you requested partner access  
- Create a secure password when prompted
- Never share your credentials

Questions? Email partners@dailytidbit.org

The Daily Tidbit Team
Invitation ID: ${invitedBy.slice(-8)}
  `

  // Use the same email service logic as before but with enhanced security messaging
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Daily Tidbit Security <partners@dailytidbit.org>',
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Security-Level': 'high',
          'X-Invitation-Type': 'partner-access'
        }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Email service error: ${error}`)
    }

    return
  }

  // Fallback logging for development
  console.log('='.repeat(50))
  console.log('SECURE INVITATION EMAIL')
  console.log('='.repeat(50))
  console.log(`To: ${email}`)
  console.log(`Subject: ${subject}`)
  console.log('\nContent:')
  console.log(textContent)
  console.log('='.repeat(50))
}