import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const COOKIE = 'co_session'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  return createClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function makeRenewToken(jobId: string): string {
  const secret = process.env.CRON_SECRET || ''
  return createHmac('sha256', secret).update(jobId).digest('hex').slice(0, 16)
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE)
  if (!cookie?.value) return NextResponse.json({ email: null })

  const email = cookie.value

  const { data: company, error } = await sb()
    .from('companies')
    .select('id, company_name, industry, city, job_credits')
    .ilike('email', email)
    .maybeSingle()

  if (error || !company) return NextResponse.json({ email: null })

  // Handle renew_link action
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  if (action === 'renew_link') {
    const jobId = searchParams.get('job_id')
    if (!jobId) return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })

    // Verify the job belongs to this company
    const { data: job, error: jobError } = await sb()
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('company_id', company.id)
      .maybeSingle()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found or not authorized' }, { status: 403 })
    }

    const tok = makeRenewToken(jobId)
    const url = `/app/renovar?job=${jobId}&tok=${tok}`
    return NextResponse.json({ url })
  }

  return NextResponse.json({ email, company })
}

export async function POST(req: NextRequest) {
  let email = ''
  try { email = ((await req.json()).email || '').toLowerCase().trim() } catch { /* */ }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const { data: company, error } = await sb()
    .from('companies')
    .select('id, company_name, industry, city, job_credits')
    .ilike('email', email)
    .maybeSingle()

  if (error || !company) {
    return NextResponse.json(
      { error: 'No encontramos una empresa registrada con ese email. Verificá el email o registrá tu empresa.' },
      { status: 404 }
    )
  }

  const res = NextResponse.json({ ok: true, company })
  res.cookies.set(COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE)
  return res
}
