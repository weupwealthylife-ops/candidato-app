import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'candidatojobs@gmail.com'
const COOKIE = 'mg_session'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  return createSupabaseClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE)
  if (!cookie?.value) return NextResponse.json({ email: null })
  return NextResponse.json({ email: cookie.value, isAdmin: cookie.value === ADMIN_EMAIL })
}

export async function POST(req: NextRequest) {
  let email = ''
  try { email = ((await req.json()).email || '').toLowerCase().trim() } catch { /* */ }
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })

  const isAdmin = email === ADMIN_EMAIL

  if (!isAdmin) {
    const client = sb()
    const { data: engagements, count } = await client
      .from('matchgraph_engagements')
      .select('company_name', { count: 'exact' })
      .ilike('client_email', email)
      .limit(1)

    if (!count || count === 0) {
      return NextResponse.json({
        error: 'no_access',
        message: 'No encontramos ninguna empresa registrada con este email. Contactá a tu consultor de Candidato®.',
      }, { status: 404 })
    }

    const companyName = engagements?.[0]?.company_name || null
    const res = NextResponse.json({ ok: true, isAdmin: false, companyName })
    res.cookies.set(COOKIE, email, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  }

  const res = NextResponse.json({ ok: true, isAdmin: true, companyName: null })
  res.cookies.set(COOKIE, email, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE)
  return res
}
