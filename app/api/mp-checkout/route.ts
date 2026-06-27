import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

const BUNDLE_PRICES: Record<number, number> = { 1: 300000, 2: 500000, 3: 700000 }

function baseUrl(raw: string): string {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function adminClient() {
  return createSupabaseClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { title, modality, city, area, salary_range, description, skills, required_experience, closes_at, userEmail, qty } = payload

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const quantity = Math.min(Math.max(Number(qty) || 1, 1), 3)
  const totalPrice = BUNDLE_PRICES[quantity] ?? 300000

  const sb = adminClient()
  const { data: co } = await sb.from('companies').select('id').ilike('email', userEmail ?? '').maybeSingle()

  // Insert the job the company filled out (starts inactive)
  const { data: job, error: jobErr } = await sb.from('jobs').insert([{
    company_id: co?.id ?? null,
    title: title.trim(),
    modality: modality || null,
    city: city || null,
    area: area || null,
    salary_range: salary_range || null,
    description: description?.trim() || null,
    skills: skills ?? [],
    required_experience: required_experience || null,
    closes_at: closes_at ? new Date(closes_at).toISOString() : null,
    active: false,
    payment_pending: true,
  }]).select('id').single()

  if (jobErr || !job) {
    console.error('[mp-checkout] DB insert error:', jobErr)
    return NextResponse.json({ error: 'db_error', detail: jobErr?.message ?? 'insert returned null' }, { status: 500 })
  }

  const jobId = job.id

  // Build the MP preference title
  const bundleLabel = quantity > 1
    ? `Pack ${quantity} vacantes — Candidato`
    : `Vacante: ${title.trim()}`

  const preference = {
    items: [{
      id: jobId,
      title: bundleLabel,
      quantity: 1,
      unit_price: totalPrice,
      currency_id: 'COP',
    }],
    back_urls: {
      success: `${BASE_URL}/app?payment=success&job_id=${jobId}&qty=${quantity}`,
      failure: `${BASE_URL}/app?payment=failure&job_id=${jobId}`,
      pending: `${BASE_URL}/app?payment=pending&job_id=${jobId}&qty=${quantity}`,
    },
    auto_return: 'approved',
    // external_reference encodes both job_id and extra credits: "jobId:credits"
    external_reference: quantity > 1 ? `${jobId}:${quantity - 1}:${co?.id ?? ''}` : jobId,
    notification_url: `${BASE_URL}/api/mp-webhook`,
    statement_descriptor: 'Candidato',
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preference),
  })

  const mpData = await mpRes.json()
  if (!mpRes.ok) {
    await sb.from('jobs').delete().eq('id', jobId)
    return NextResponse.json({ error: 'mp_error', detail: mpData?.message ?? mpData?.cause ?? JSON.stringify(mpData).slice(0, 200) }, { status: 500 })
  }

  // TEST- tokens → sandbox checkout; APP_USR- tokens → real checkout
  const isTest = MP_ACCESS_TOKEN.startsWith('TEST-')
  const url = isTest ? mpData.sandbox_init_point : mpData.init_point
  if (!url) {
    await sb.from('jobs').delete().eq('id', jobId)
    return NextResponse.json({ error: 'mp_error', detail: 'No checkout URL in MP response' }, { status: 500 })
  }

  return NextResponse.json({ url, job_id: jobId })
}
