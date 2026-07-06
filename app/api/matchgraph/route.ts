import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'candidatojobs@gmail.com'
const COOKIE = 'mg_session'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  return createSupabaseClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getEmail(req: NextRequest) { return req.cookies.get(COOKIE)?.value ?? null }

async function logActivity(
  client: ReturnType<typeof sb>,
  engagement_id: string,
  candidate_id: string | null,
  actor_email: string,
  action: string,
  details?: string
) {
  try {
    await client.from('matchgraph_activity').insert([{
      engagement_id,
      candidate_id: candidate_id ?? null,
      actor_email,
      action,
      details: details ?? null,
    }])
  } catch {
    // Activity table may not exist yet — fail silently
  }
}

export async function GET(req: NextRequest) {
  const email = getEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isAdmin = email === ADMIN_EMAIL
  const client = sb()
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'list') {
    let q = client.from('matchgraph_engagements').select('*').order('created_at', { ascending: false })
    if (!isAdmin) q = q.ilike('client_email', email)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ engagements: data || [] })
  }

  if (action === 'detail') {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    let eq = client.from('matchgraph_engagements').select('*').eq('id', id)
    if (!isAdmin) eq = eq.ilike('client_email', email)
    const { data: eng } = await eq.maybeSingle()
    if (!eng) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: candidates } = await client
      .from('matchgraph_candidates')
      .select('id, engagement_id, sort_order, name, photo_url, cv_url, score_profession, score_experience, score_sector, score_requirements, score_availability, is_top, formation, relevant_experience, technical_strengths, qa_notes, salary_expectation, mobility, interview_date, client_notes, client_feedback, pipeline_status, created_at')
      .eq('engagement_id', id)
      .order('sort_order')
    return NextResponse.json({ engagement: eng, candidates: candidates || [] })
  }

  if (action === 'analytics') {
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: engagements, error: engErr } = await client
      .from('matchgraph_engagements')
      .select('id, title, company_name, status, created_at')
      .order('created_at', { ascending: false })
    if (engErr) return NextResponse.json({ error: engErr.message }, { status: 500 })
    const { data: candidates, error: candErr } = await client
      .from('matchgraph_candidates')
      .select('id, engagement_id, score_profession, score_experience, score_sector, score_requirements, score_availability, is_top, pipeline_status, client_feedback')
    if (candErr) return NextResponse.json({ error: candErr.message }, { status: 500 })
    const engList = engagements || []
    const candList = candidates || []
    const totalEngagements = engList.length
    const openEngagements = engList.filter((e: { status?: string }) => e.status !== 'closed').length
    const closedEngagements = engList.filter((e: { status?: string }) => e.status === 'closed').length
    const totalCandidates = candList.length
    const fitScores = candList.map((c: { score_profession?: number; score_experience?: number; score_sector?: number; score_requirements?: number; score_availability?: number }) =>
      Math.round(((c.score_profession ?? 0) + (c.score_experience ?? 0) + (c.score_sector ?? 0) + (c.score_requirements ?? 0) + (c.score_availability ?? 0)) / 5 * 20)
    )
    const avgFitScore = totalCandidates > 0 ? Math.round(fitScores.reduce((a: number, b: number) => a + b, 0) / totalCandidates) : 0
    const topCount = candList.filter((c: { is_top?: boolean }) => c.is_top).length
    const pipeline = {
      sent: candList.filter((c: { pipeline_status?: string }) => c.pipeline_status === 'sent').length,
      interview: candList.filter((c: { pipeline_status?: string }) => c.pipeline_status === 'interview').length,
      finalist: candList.filter((c: { pipeline_status?: string }) => c.pipeline_status === 'finalist').length,
      hired: candList.filter((c: { pipeline_status?: string }) => c.pipeline_status === 'hired').length,
      rejected: candList.filter((c: { pipeline_status?: string }) => c.pipeline_status === 'rejected').length,
    }
    const feedback = {
      interested: candList.filter((c: { client_feedback?: string }) => c.client_feedback === 'interested').length,
      maybe: candList.filter((c: { client_feedback?: string }) => c.client_feedback === 'maybe').length,
      no: candList.filter((c: { client_feedback?: string }) => c.client_feedback === 'no').length,
      none: candList.filter((c: { client_feedback?: string }) => !c.client_feedback || c.client_feedback === 'none').length,
    }
    return NextResponse.json({
      engagements: engList,
      candidates: candList,
      stats: { totalEngagements, openEngagements, closedEngagements, totalCandidates, avgFitScore, topCount, pipeline, feedback },
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const email = getEmail(req)
  const isAdmin = email === ADMIN_EMAIL
  const client = sb()
  const body = await req.json()
  const { action } = body

  // Client-only: save own notes on a candidate (verify ownership via engagement)
  if (action === 'save_client_notes' && email) {
    const { candidateId, client_notes } = body
    // Fetch the candidate's engagement and verify client_email matches the session
    const { data: cand } = await client
      .from('matchgraph_candidates')
      .select('engagement_id')
      .eq('id', candidateId)
      .maybeSingle()
    if (!cand) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: eng } = await client
      .from('matchgraph_engagements')
      .select('client_email')
      .eq('id', cand.engagement_id)
      .maybeSingle()
    if (!eng || eng.client_email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await client.from('matchgraph_candidates').update({ client_notes }).eq('id', candidateId)
    return NextResponse.json({ ok: true })
  }

  // Client or admin: save feedback on a candidate
  if (action === 'save_feedback' && email) {
    const { candidateId, client_feedback } = body
    const { data: cand } = await client
      .from('matchgraph_candidates')
      .select('engagement_id')
      .eq('id', candidateId)
      .maybeSingle()
    if (!cand) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!isAdmin) {
      const { data: eng } = await client
        .from('matchgraph_engagements')
        .select('client_email')
        .eq('id', cand.engagement_id)
        .maybeSingle()
      if (!eng || eng.client_email?.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    await client.from('matchgraph_candidates').update({ client_feedback }).eq('id', candidateId)
    await logActivity(client, cand.engagement_id, candidateId, email, 'client_feedback', client_feedback)
    return NextResponse.json({ ok: true })
  }

  // get_activity: any authenticated user
  if (action === 'get_activity') {
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { engagement_id } = body
    if (!engagement_id) return NextResponse.json({ error: 'Missing engagement_id' }, { status: 400 })
    // Verify ownership or admin
    if (!isAdmin) {
      const { data: eng } = await client
        .from('matchgraph_engagements')
        .select('client_email')
        .eq('id', engagement_id)
        .maybeSingle()
      if (!eng || eng.client_email?.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    const { data: activity, error } = await client
      .from('matchgraph_activity')
      .select('*')
      .eq('engagement_id', engagement_id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ activity: activity || [] })
  }

  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'create_engagement') {
    const { title, company_name, client_email, job_area, city } = body
    const normalizedEmail = (client_email || '').toLowerCase().trim()
    const { data, error } = await client.from('matchgraph_engagements').insert([{
      title, company_name, client_email: normalizedEmail, job_area, city,
    }]).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify client that their evaluation is ready (fire-and-forget)
    if (normalizedEmail) {
      const origin = req.nextUrl.origin
      fetch(`${origin}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'matchgraph_engagement_opened',
          to: normalizedEmail,
          name: company_name || normalizedEmail.split('@')[0],
          extra: { jobTitle: title, companyName: company_name, to: normalizedEmail },
        }),
      }).catch(() => {})
    }

    // Log activity
    if (data?.id) {
      await logActivity(client, data.id, null, email || 'admin', 'engagement_created', title)
    }

    return NextResponse.json({ engagement: data })
  }

  if (action === 'update_engagement') {
    const { id, ...rest } = body; delete rest.action
    await client.from('matchgraph_engagements').update(rest).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'upsert_candidate') {
    const { id, ...rest } = body; delete rest.action
    if (id) {
      await client.from('matchgraph_candidates').update(rest).eq('id', id)
      return NextResponse.json({ ok: true })
    }
    const { data, error } = await client.from('matchgraph_candidates').insert([rest]).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity for new candidate
    if (data?.id && data?.engagement_id) {
      await logActivity(client, data.engagement_id, data.id, email || 'admin', 'candidate_added', data.name || rest.name)
    }

    return NextResponse.json({ candidate: data })
  }

  if (action === 'update_pipeline_status') {
    const { candidateId, pipeline_status } = body
    // Fetch engagement_id from candidate
    const { data: cand } = await client
      .from('matchgraph_candidates')
      .select('engagement_id')
      .eq('id', candidateId)
      .maybeSingle()
    if (!cand) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await client.from('matchgraph_candidates').update({ pipeline_status }).eq('id', candidateId)
    await logActivity(client, cand.engagement_id, candidateId, email || 'admin', 'pipeline_status', pipeline_status)
    return NextResponse.json({ ok: true })
  }

  if (action === 'generate_share') {
    const { engagement_id } = body
    if (!engagement_id) return NextResponse.json({ error: 'Missing engagement_id' }, { status: 400 })
    const { data: eng } = await client
      .from('matchgraph_engagements')
      .select('share_token')
      .eq('id', engagement_id)
      .maybeSingle()
    if (!eng) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (eng.share_token) return NextResponse.json({ share_token: eng.share_token })
    const share_token = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
    await client.from('matchgraph_engagements').update({ share_token }).eq('id', engagement_id)
    return NextResponse.json({ share_token })
  }

  if (action === 'notify_client') {
    const { engagement_id } = body
    if (!engagement_id) return NextResponse.json({ error: 'Missing engagement_id' }, { status: 400 })
    const { data: eng } = await client
      .from('matchgraph_engagements')
      .select('title, company_name, client_email')
      .eq('id', engagement_id)
      .maybeSingle()
    if (!eng) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const origin = req.nextUrl.origin
    await fetch(`${origin}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'matchgraph_engagement_opened',
        to: eng.client_email,
        name: eng.company_name || eng.client_email.split('@')[0],
        extra: {
          jobTitle: eng.title,
          company_name: eng.company_name,
          to: eng.client_email,
        },
      }),
    }).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const email = getEmail(req)
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { action, id } = await req.json()
  const client = sb()
  if (action === 'delete_engagement') { await client.from('matchgraph_engagements').delete().eq('id', id); return NextResponse.json({ ok: true }) }
  if (action === 'delete_candidate') { await client.from('matchgraph_candidates').delete().eq('id', id); return NextResponse.json({ ok: true }) }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
