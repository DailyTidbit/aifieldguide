// src/app/api/partners/preview/generate/route.ts
import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { companyId, expiresInHours = 72 } = await request.json()

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name, domain, domains')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000))

    // Store preview token
    const { error: insertError } = await supabaseAdmin
      .from('partner_preview_tokens')
      .insert({
        token,
        company_id: companyId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error creating preview token:', insertError)
      return NextResponse.json({ error: 'Failed to create preview token' }, { status: 500 })
    }

    // Generate preview URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const previewUrl = `${baseUrl}/partners/preview/${token}`

    return NextResponse.json({
      token,
      previewUrl,
      companyName: company.name,
      expiresAt: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Preview token generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to list existing tokens for a company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const { data: tokens, error } = await supabaseAdmin
      .from('partner_preview_tokens')
      .select('token, expires_at, created_at, used_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const formattedTokens = tokens.map(token => ({
      ...token,
      previewUrl: `${baseUrl}/partners/preview/${token.token}`,
      isExpired: new Date(token.expires_at) < new Date(),
      isUsed: !!token.used_at
    }))

    return NextResponse.json({ tokens: formattedTokens })

  } catch (error) {
    console.error('Error fetching preview tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}