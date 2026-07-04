import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'enrique280196@gmail.com,carlos280196@hotmail.com')
  .split(',').map(e => e.trim().toLowerCase())

const ADMIN_SECRET = process.env.ADMIN_SECRET

export async function POST(req: NextRequest) {
  let body: { email?: string; secret?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const email = (body.email || '').trim().toLowerCase()
  const secret = body.secret || ''

  const emailOk = ADMIN_EMAILS.includes(email)
  const secretOk = !ADMIN_SECRET || secret === ADMIN_SECRET

  if (!emailOk || !secretOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_ok', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_ok')
  return res
}
