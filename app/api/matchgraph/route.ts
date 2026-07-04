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

function getEmail(req: NextRequest) { return req.cookies.get(COOKIE)?.value ?? null }

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
    const { data: candidates } = await client.from('matchgraph_candidates').select('*').eq('engagement_id', id).order('sort_order')
    return NextResponse.json({ engagement: eng, candidates: candidates || [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const email = getEmail(req)
  const isAdmin = email === ADMIN_EMAIL
  const client = sb()
  const body = await req.json()
  const { action } = body

  // Client-only: save own notes on a candidate
  if (action === 'save_client_notes' && email) {
    const { candidateId, client_notes } = body
    await client.from('matchgraph_candidates').update({ client_notes }).eq('id', candidateId)
    return NextResponse.json({ ok: true })
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
    return NextResponse.json({ candidate: data })
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
