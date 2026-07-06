import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

function makeToken(jobId: string): string {
  const secret = process.env.CRON_SECRET || ''
  return createHmac('sha256', secret).update(jobId).digest('hex').slice(0, 16)
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('job')
  const tok = searchParams.get('tok')

  if (!jobId || !tok) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  if (tok !== makeToken(jobId)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const supabase = getSupabase()
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, title, closes_at, active, companies(company_name)')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const companiesRaw = job.companies as { company_name?: string } | { company_name?: string }[] | null
  const companyName = Array.isArray(companiesRaw)
    ? (companiesRaw[0]?.company_name ?? '')
    : (companiesRaw?.company_name ?? '')

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      company_name: companyName,
      closes_at: job.closes_at,
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { jobId, tok } = body as { jobId?: string; tok?: string }

  if (!jobId || !tok) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  if (tok !== makeToken(jobId)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  const supabase = getSupabase()

  // Fetch current closes_at to decide base date
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('id, closes_at')
    .eq('id', jobId)
    .maybeSingle()

  if (fetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const now = new Date()
  const currentClose = job.closes_at ? new Date(job.closes_at) : now
  const base = currentClose > now ? currentClose : now
  const newClosesAt = new Date(base)
  newClosesAt.setDate(newClosesAt.getDate() + 30)

  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      closes_at: newClosesAt.toISOString(),
      expiry_reminder_sent: false,
    })
    .eq('id', jobId)

  if (updateError) {
    console.error('[renew-job] Update error:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, new_closes_at: newClosesAt.toISOString() })
}
