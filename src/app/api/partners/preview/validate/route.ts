// src/app/api/partners/preview/validate/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Validate token and get company data
    const { data: previewToken, error: tokenError } = await supabaseAdmin
      .from('partner_preview_tokens')
      .select(`
        token,
        company_id,
        expires_at,
        used_at,
        companies (
          id,
          name,
          domain,
          domains,
          company_profiles (
            logo_url,
            support_email,
            billing_email,
            marketing_email
          )
        )
      `)
      .eq('token', token)
      .single()

    if (tokenError || !previewToken) {
      return NextResponse.json({ 
        error: 'Invalid preview token',
        isValid: false 
      }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(previewToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json({ 
        error: 'Preview token has expired',
        isValid: false,
        isExpired: true 
      }, { status: 410 })
    }

    // Mark token as used (first time only)
    if (!previewToken.used_at) {
      await supabaseAdmin
        .from('partner_preview_tokens')
        .update({ used_at: now.toISOString() })
        .eq('token', token)
    }

    // Get additional company data for preview
    const companyId = previewToken.company_id

    // Get tool listings count and sample data
    const { data: toolListings, count: toolListingsCount } = await supabaseAdmin
      .from('tool_listings')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .limit(3)

    // Get mock analytics data (you'd replace with real data)
    const mockAnalytics = {
      monthlyViews: Math.floor(Math.random() * 5000) + 1000,
      clickThroughs: Math.floor(Math.random() * 500) + 50,
      conversionRate: (Math.random() * 5 + 2).toFixed(1),
      totalImpressions: Math.floor(Math.random() * 10000) + 5000
    }

    // Get company member count
    const { count: memberCount } = await supabaseAdmin
      .from('company_users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)

    return NextResponse.json({
      isValid: true,
      company: previewToken.companies,
      preview: {
        toolListingsCount: toolListingsCount || 0,
        toolListings: toolListings || [],
        memberCount: memberCount || 0,
        analytics: mockAnalytics,
        expiresAt: previewToken.expires_at
      }
    })

  } catch (error) {
    console.error('Preview validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}