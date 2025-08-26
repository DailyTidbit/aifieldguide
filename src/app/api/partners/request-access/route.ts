// src/app/api/partners/request-access/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      fullName,
      companyName,
      companyWebsite,
      toolName,
      toolDescription,
      role
    } = await request.json()

    // Validation
    if (!email || !fullName || !companyName || !toolName || !toolDescription || !role) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if there's already a pending or approved request for this email/company
    const { data: existingRequest } = await supabaseAdmin
      .from('partner_requests')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending partner request. Please wait for our team to review it.' },
        { status: 400 }
      )
    }

    // Create the partner request
    const { data, error } = await supabaseAdmin
      .from('partner_requests')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        company_name: companyName,
        company_website: companyWebsite || null,
        tool_name: toolName,
        tool_description: toolDescription,
        role: role,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating partner request:', error)
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send notification email to your team about the new partner request
    // You might want to use a service like Resend, SendGrid, or similar
    try {
      // Example notification (you'll need to implement this with your email service)
      await sendPartnerRequestNotification({
        email,
        fullName,
        companyName,
        toolName,
        toolDescription,
        role,
        requestId: data.id
      })
    } catch (notificationError) {
      console.error('Failed to send notification email:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Partner access request submitted successfully',
      requestId: data.id
    })

  } catch (error) {
    console.error('Partner request error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

// Helper function to send notification email to your team
async function sendPartnerRequestNotification(requestData: {
  email: string
  fullName: string
  companyName: string
  toolName: string
  toolDescription: string
  role: string
  requestId: string
}) {
  // TODO: Implement with your preferred email service
  // This is just a placeholder structure
  
  const emailContent = `
    New Partner Access Request
    
    Requester: ${requestData.fullName} (${requestData.role})
    Email: ${requestData.email}
    Company: ${requestData.companyName}
    
    Tool: ${requestData.toolName}
    Description: ${requestData.toolDescription}
    
    Request ID: ${requestData.requestId}
    
    Review at: https://dailytidbit.org/admin/partner-requests/${requestData.requestId}
  `

  // Example with a hypothetical email service
  // await emailService.send({
  //   to: 'partners@dailytidbit.org',
  //   subject: `New Partner Request: ${requestData.companyName}`,
  //   text: emailContent
  // })

  console.log('Partner request notification:', emailContent)
}