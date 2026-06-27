import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

export const revalidate = 300 // cache 5 minutes

export async function GET() {
  const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!url || !key) {
    return NextResponse.json({ activeJobs: 0, candidates: 0 })
  }

  const sb = createClient(url, key)
  const [jobsRes, candidatesRes] = await Promise.all([
    sb.from('jobs').select('id', { count: 'exact', head: true }).eq('active', true),
    sb.from('candidates').select('id', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    activeJobs: jobsRes.count ?? 0,
    candidates: candidatesRes.count ?? 0,
  })
}
