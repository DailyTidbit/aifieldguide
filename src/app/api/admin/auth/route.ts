import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token } = await request.json()
  const validToken = process.env.ADMIN_API_TOKEN

  if (!validToken || !token || token !== validToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
