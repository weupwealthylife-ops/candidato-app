import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function baseUrl(raw: string): string {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!), key)
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { job_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { job_id } = body
  if (!job_id) return NextResponse.json({ error: 'Missing job_id' }, { status: 400 })

  const client = sb()

  // Get job + company name
  const { data: job } = await client
    .from('jobs')
    .select('id, title, area, modality, city, required_experience, skills, companies(company_name)')
    .eq('id', job_id)
    .single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Find strong-fit candidates via scoring function
  const { data: matches, error: rpcErr } = await client.rpc('find_matches_for_job', {
    p_job_id: job_id,
    p_threshold: 70,
  })
  if (rpcErr) {
    console.error('[match-push] RPC error:', rpcErr.message)
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }
  if (!matches || matches.length === 0) {
    await client.from('jobs').update({ push_sent_at: new Date().toISOString() }).eq('id', job_id)
    return NextResponse.json({ ok: true, count: 0 })
  }

  // Upsert suggestions (ignore duplicates — idempotent)
  const rows = matches.map((m: { candidate_id: string; match_score: number }) => ({
    candidate_id: m.candidate_id,
    job_id,
    match_score: m.match_score,
    status: 'pending',
  }))
  await client.from('suggestions').upsert(rows, { onConflict: 'candidate_id,job_id', ignoreDuplicates: true })

  // Fetch candidate emails for notification
  const candidateIds = matches.map((m: { candidate_id: string }) => m.candidate_id)
  const scoreMap: Record<string, number> = Object.fromEntries(
    matches.map((m: { candidate_id: string; match_score: number }) => [m.candidate_id, m.match_score])
  )
  const { data: candidates } = await client
    .from('candidates')
    .select('id, name, email, notify_matches')
    .in('id', candidateIds)

  // Send emails (fire-and-forget)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  const companyName = (job.companies as { company_name?: string })?.company_name || ''
  for (const cand of (candidates || [])) {
    if (!cand.email || cand.notify_matches === false) continue
    fetch(`${siteUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'match_found',
        to: cand.email,
        name: (cand.name as string)?.split(' ')[0] || cand.name,
        extra: {
          jobTitle: job.title,
          companyName,
          matchCount: String(scoreMap[cand.id] || ''),
        },
      }),
    }).catch(() => {})
  }

  // Mark push as sent on the job
  await client.from('jobs').update({ push_sent_at: new Date().toISOString() }).eq('id', job_id)

  return NextResponse.json({ ok: true, count: matches.length })
}
