import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function baseUrl(raw: string): string {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  return createClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Vercel cron calls this with Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const client = sb()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin

  // Fetch all active jobs that haven't had a push in the last 7 days (or ever)
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: jobs, error: jobsErr } = await client
    .from('jobs')
    .select('id, title, companies(company_name)')
    .eq('active', true)
    .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString()}`)
    .or(`push_sent_at.is.null,push_sent_at.lte.${cutoff}`)

  if (jobsErr || !jobs?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: jobsErr?.message || 'No eligible jobs' })
  }

  let totalMatches = 0

  for (const job of jobs) {
    try {
      const res = await fetch(`${siteUrl}/api/match-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id }),
      })
      const result = await res.json() as { count?: number }
      totalMatches += result.count || 0
    } catch (e) {
      console.error(`[cron] match-push failed for job ${job.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true, processed: jobs.length, totalMatches })
}
