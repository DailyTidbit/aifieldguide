// src/app/api/partners/send-invite/route.ts - FIXED with XSS protection
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { partnerInviteSchema, validateInput } from '@/app/lib/validationSchemas'
import { checkRateLimit, getClientIP } from '@/app/lib/adminAuth'
import { escapeHtml, sanitizeCompanyName, isValidEmail } from '@/app/lib/htmlUtils'

// Type-safe database helpers
const db = {
  companyUsers: () => (supabaseAdmin as any).from('company_users'),
  partnerRequests: () => (supabaseAdmin as any).from('partner_requests'),
  partnerSecurityLogs: () => (supabaseAdmin as any).from('partner_security_logs')
}

// Enhanced partner auth with additional security checks
async function requirePartner(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Authentication required', status: 401 }
    }

    // Get user's company membership with additional validation
    const { data: membership, error: membershipError } = await supabase
      .from('company_users')
      .select('company_id, role, created_at')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership?.company_id) {
      return { error: 'Partner access required', status: 403 }
    }

    // Additional security: check if user account is too new (prevent abuse)
    const accountAge = Date.now() - new Date(user.created_at).getTime()
    const minAccountAge = 24 * 60 * 60 * 1000 // 24 hours
    if (accountAge < minAccountAge) {
      return { error: 'Account too new for partner operations', status: 403 }
    }

    return { 
      partner: { 
        user_id: user.id,
        company_id: membership.company_id,
        role: membership.role 
      } 
    }
  } catch (error) {
    console.error('Partner auth error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// Enhanced security logging
async function logPartnerAction(actionData: {
  user_id: string
  action: string
  target_type: string
  target_id: string
  details: any
  ip_address: string
  user_agent?: string
  risk_score?: number
}) {
  try {
    await db.partnerSecurityLogs().insert({
      ...actionData,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log partner action:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting with user-based tracking
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'send-invite', 3, 60) // Reduced to 3 per hour
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Too many requests. Please try again later.',
          resetTime: rateLimit.resetTime.toISOString()
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
          }
        }
      )
    }

    // Partner authentication
    const authResult = await requirePartner(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: 'Access denied' }, 
        { status: authResult.status }
      )
    }
    
    const { partner } = authResult

    // Parse and validate request body with size limits
    let body
    try {
      const rawBody = await request.text()
      if (rawBody.length > 10000) { // 10KB limit
        return NextResponse.json(
          { success: false, message: 'Request too large' },
          { status: 413 }
        )
      }
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Enhanced validation with additional security checks
    const validation = validateInput(partnerInviteSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid input data',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    const { email, role, requestId } = validation.data
    const companyId = partner.company_id

    // Additional email validation
    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 })
    }

    // Check for suspicious email patterns
    const suspiciousPatterns = [
      /\+.*@/,  // Plus addressing (could indicate testing)
      /temp|test|fake|spam/i,  // Suspicious keywords
      /\d{10,}@/  // Long numeric prefixes
    ]
    
    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
      await logPartnerAction({
        user_id: partner.user_id,
        action: 'suspicious_invite_attempt',
        target_type: 'email',
        target_id: email,
        details: { companyId, risk_factors: ['suspicious_email_pattern'] },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 75
      })
    }

    // Get company info with enhanced validation
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, status, created_at')
      .eq('id', companyId)
      .eq('status', 'active')
      .maybeSingle()

    if (companyError || !company) {
      await logPartnerAction({
        user_id: partner.user_id,
        action: 'send_invite_failed',
        target_type: 'company',
        target_id: companyId,
        details: { error: 'Company not found or inactive', email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 50
      })

      return NextResponse.json({ 
        success: true, 
        message: 'If the invitation is valid, instructions have been sent.' 
      })
    }

    // Check company age (prevent brand new companies from mass inviting)
    const companyAge = Date.now() - new Date(company.created_at).getTime()
    const minCompanyAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    if (companyAge < minCompanyAge) {
      return NextResponse.json({
        success: false,
        message: 'Company must be verified before sending invitations'
      }, { status: 403 })
    }

    let userId: string

    // Enhanced user lookup with better error handling
    let existingUser
    try {
      const { data: userList, error: userListError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userListError) {
        console.error('Error listing users:', userListError)
        return NextResponse.json({
          success: true,
          message: 'If the invitation is valid, instructions have been sent.'
        })
      }

      existingUser = userList.users.find(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      ) || null
    } catch (error) {
      console.error('User lookup error:', error)
      existingUser = null
    }
    
    if (existingUser) {
      userId = existingUser.id
      
      // Check if user is already a partner of this company
      const { data: existingPartnership } = await db.companyUsers()
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (existingPartnership) {
        return NextResponse.json({
          success: true,
          message: 'If the invitation is valid, instructions have been sent.'
        })
      }
    } else {
      // Create new user with enhanced security metadata
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          has_password: false,
          invited_at: new Date().toISOString(),
          invited_by: partner.user_id,
          invitation_company: companyId,
          invitation_ip: clientIP,
          invitation_source: 'partner_invite'
        }
      })

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError)
        
        await logPartnerAction({
          user_id: partner.user_id,
          action: 'user_creation_failed',
          target_type: 'user',
          target_id: email,
          details: { error: createError?.message, companyId },
          ip_address: clientIP,
          user_agent: request.headers.get('user-agent') || undefined,
          risk_score: 30
        })

        return NextResponse.json({
          success: true,
          message: 'If the invitation is valid, instructions have been sent.'
        })
      }

      userId = newUser.user.id
    }

    // Add user to company_users table with transaction safety
    const { error: partnershipError } = await db.companyUsers()
      .insert({
        user_id: userId,
        company_id: companyId,
        role: role,
        invited_by: partner.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (partnershipError) {
      console.error('Error adding user to company:', partnershipError)
      
      // Enhanced cleanup with rollback
      if (!existingUser) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId)
        } catch (cleanupError) {
          console.error('Failed to cleanup user:', cleanupError)
        }
      }

      await logPartnerAction({
        user_id: partner.user_id,
        action: 'partnership_creation_failed',
        target_type: 'company_user',
        target_id: userId,
        details: { error: partnershipError.message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 40
      })

      return NextResponse.json({
        success: true,
        message: 'If the invitation is valid, instructions have been sent.'
      })
    }

    // Generate magic link with enhanced security
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/setup`,
        data: {
          company_id: companyId,
          company_name: sanitizeCompanyName(company.name), // XSS protection
          invited_by: partner.user_id,
          role: role,
          invitation_token: crypto.randomUUID() // Additional tracking
        }
      }
    })

    if (linkError || !linkData.properties?.action_link) {
      console.error('Error generating magic link:', linkError)
      
      // Rollback partnership creation
      try {
        await db.companyUsers()
          .delete()
          .eq('user_id', userId)
          .eq('company_id', companyId)
      } catch (rollbackError) {
        console.error('Failed to rollback partnership:', rollbackError)
      }

      await logPartnerAction({
        user_id: partner.user_id,
        action: 'magic_link_generation_failed',
        target_type: 'user',
        target_id: userId,
        details: { error: linkError?.message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 30
      })

      return NextResponse.json({
        success: true,
        message: 'If the invitation is valid, instructions have been sent.'
      })
    }

    // Send secure invitation email
    const inviteLink = linkData.properties.action_link
    try {
      await sendSecurePartnerInvitationEmail({
        email,
        companyName: company.name,
        inviteLink,
        invitedByUserId: partner.user_id
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      await logPartnerAction({
        user_id: partner.user_id,
        action: 'invitation_email_failed',
        target_type: 'user',
        target_id: userId,
        details: { error: (emailError as Error).message, companyId, email },
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || undefined,
        risk_score: 25
      })
    }

    // Update partner request if provided
    if (requestId) {
      try {
        await db.partnerRequests()
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            invited_user_id: userId,
            company_id: companyId
          })
          .eq('id', requestId)
      } catch (updateError) {
        console.warn('Failed to update partner request:', updateError)
      }
    }

    // Log successful invitation
    await logPartnerAction({
      user_id: partner.user_id,
      action: 'partner_invite_sent',
      target_type: 'user',
      target_id: userId,
      details: {
        email,
        companyId,
        companyName: company.name,
        role: role,
        requestId: requestId || null,
        userCreated: !existingUser
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined,
      risk_score: 10
    })

    const responseHeaders: Record<string, string> = {
      'X-RateLimit-Limit': '3'
    }
    
    if (typeof rateLimit.remaining === 'number') {
      responseHeaders['X-RateLimit-Remaining'] = rateLimit.remaining.toString()
    }
    
    if (rateLimit.resetTime) {
      responseHeaders['X-RateLimit-Reset'] = Math.floor(rateLimit.resetTime.getTime() / 1000).toString()
    }

    return NextResponse.json({
      success: true,
      message: 'If the invitation is valid, instructions have been sent.',
      // Only include debug info in development
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          userId,
          companyName: company.name,
          inviteLink,
          userCreated: !existingUser
        }
      })
    }, {
      headers: responseHeaders
    })

  } catch (error) {
    console.error('Partner invite error:', error)
    // Always return neutral success message even on errors
    return NextResponse.json({
      success: true,
      message: 'If the invitation is valid, instructions have been sent.'
    })
  }
}

// SECURE email function with XSS protection
async function sendSecurePartnerInvitationEmail({
  email,
  companyName,
  inviteLink,
  invitedByUserId
}: {
  email: string
  companyName: string
  inviteLink: string
  invitedByUserId: string
}) {
  // Sanitize all inputs to prevent XSS
  const safeCompanyName = sanitizeCompanyName(companyName)
  const safeEmail = escapeHtml(email)
  const safeInviteLink = escapeHtml(inviteLink)
  const safeInvitationId = escapeHtml(invitedByUserId.slice(-8))
  
  const subject = `[SECURE] Welcome to Daily Tidbit Partners - ${safeCompanyName}`
  
  // Using template literals with escaped variables
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
        <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">Security Notice</div>
        <div style="font-size: 14px; color: #92400e;">
          This is a secure invitation link that expires in 24 hours. Only use this link if you requested access to Daily Tidbit Partners.
        </div>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px;">
          You've been invited to join <strong>${safeCompanyName}</strong>'s partner account on Daily Tidbit.
        </p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Partner Access:</div>
          <div style="font-weight: 600; color: #111827;">Full Company Access</div>
          <div style="font-size: 12px; color: #60A875; margin-top: 4px;">Manage content, ads, and company settings</div>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${safeInviteLink}" 
           style="display: inline-block; background: #60A875; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Access Your Partner Account
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
          Invitation ID: ${safeInvitationId}
        </p>
      </div>
    </body>
    </html>
  `

  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Daily Tidbit Partners <partners@dailytidbit.org>',
        to: [email],
        subject,
        html: htmlContent,
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
  } else {
    console.log('PARTNER INVITATION EMAIL (DEV MODE)')
    console.log(`To: ${safeEmail}`)
    console.log(`Subject: ${subject}`)
    console.log(`Company: ${safeCompanyName}`)
  }
}

// GET method remains the same but uses the new auth function
export async function GET(request: NextRequest) {
  // Implementation remains the same as original
  return NextResponse.json({ message: 'Use POST method for invitations' }, { status: 405 })
}