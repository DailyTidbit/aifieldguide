// src/app/api/partners/send-invite/route.ts - Complete file with TypeScript errors fixed
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { requirePartner, logPartnerAction, checkRateLimit, getClientIP } from '@/app/lib/adminAuth'
import { partnerInviteSchema, validateInput } from '@/app/lib/validationSchemas'

// Type-safe database helpers to avoid repeated (supabaseAdmin as any)
const db = {
  companyUsers: () => (supabaseAdmin as any).from('company_users'),
  partnerRequests: () => (supabaseAdmin as any).from('partner_requests'),
  partnerSecurityLogs: () => (supabaseAdmin as any).from('partner_security_logs')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)
    const rateLimit = await checkRateLimit(clientIP, 'send-invite', 5, 60) // 5 requests per hour
    
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
            'X-RateLimit-Limit': '5',
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

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
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

    // Get company info
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, status')
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
        user_agent: request.headers.get('user-agent') || undefined
      })

      // Always return neutral success message
      return NextResponse.json({ 
        success: true, 
        message: 'If the invitation is valid, instructions have been sent.' 
      })
    }

    let userId: string

    // FIXED: Use listUsers with email filter (getUserByEmail doesn't exist in Supabase Admin API)
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

      existingUser = userList.users.find(user => user.email?.toLowerCase() === email.toLowerCase()) || null
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
        // User already has access - return neutral success message
        return NextResponse.json({
          success: true,
          message: 'If the invitation is valid, instructions have been sent.'
        })
      }
    } else {
      // Create new user with secure defaults
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          has_password: false,
          invited_at: new Date().toISOString(),
          invited_by: partner.user_id,
          invitation_company: companyId
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
          user_agent: request.headers.get('user-agent') || undefined
        })

        // Always return neutral success message
        return NextResponse.json({
          success: true,
          message: 'If the invitation is valid, instructions have been sent.'
        })
      }

      userId = newUser.user.id
    }

    // Add user to company_users table (ensures company association)
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
      
      // If user was just created and this fails, clean up the user
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
        user_agent: request.headers.get('user-agent') || undefined
      })

      // Always return neutral success message
      return NextResponse.json({
        success: true,
        message: 'If the invitation is valid, instructions have been sent.'
      })
    }

    // FIXED: Generate magic link with correct redirectTo parameter (camelCase)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/partners/setup`, // Fixed: camelCase not snake_case
        data: {
          company_id: companyId,
          company_name: company.name,
          invited_by: partner.user_id,
          role: role
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
        user_agent: request.headers.get('user-agent') || undefined
      })

      // Always return neutral success message
      return NextResponse.json({
        success: true,
        message: 'If the invitation is valid, instructions have been sent.'
      })
    }

    // Send invitation email
    const inviteLink = linkData.properties.action_link
    try {
      await sendPartnerInvitationEmail({
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
        user_agent: request.headers.get('user-agent') || undefined
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
        requestId: requestId || null
      },
      ip_address: clientIP,
      user_agent: request.headers.get('user-agent') || undefined
    })

    // FIXED: Only include rate limit headers if the values exist
    const responseHeaders: Record<string, string> = {
      'X-RateLimit-Limit': '5'
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

async function sendPartnerInvitationEmail({
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
        <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">Security Notice</div>
        <div style="font-size: 14px; color: #92400e;">
          This is a secure invitation link that expires in 24 hours. Only use this link if you requested access to Daily Tidbit Partners.
        </div>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px;">
          You've been invited to join <strong>${companyName}</strong>'s partner account on Daily Tidbit.
        </p>
        
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Partner Access:</div>
          <div style="font-weight: 600; color: #111827;">Full Company Access</div>
          <div style="font-size: 12px; color: #60A875; margin-top: 4px;">Manage content, ads, and company settings</div>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" 
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
          Invitation ID: ${invitedByUserId.slice(-8)}
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
    console.log('PARTNER INVITATION EMAIL')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log('\nInvite Link:', inviteLink)
  }
}