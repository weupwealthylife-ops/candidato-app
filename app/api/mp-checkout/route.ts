import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const { title, modality, city, area, salary_range, description, skills, required_experience, closes_at, userEmail } = payload

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  // Save job as inactive until payment confirmed
  const sb = adminClient()
  const { data: co } = await sb.from('companies').select('id').ilike('email', userEmail ?? '').maybeSingle()

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
  }]).select('id').single()

  if (jobErr || !job) {
    console.error('[mp-checkout] DB insert error:', jobErr)
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
  }

  const jobId = job.id

  // Create Mercado Pago preference
  const preference = {
    items: [{
      id: jobId,
      title: `Vacante: ${title.trim()}`,
      quantity: 1,
      unit_price: 99000,
      currency_id: 'COP',
    }],
    back_urls: {
      success: `${BASE_URL}/app?payment=success&job_id=${jobId}`,
      failure: `${BASE_URL}/app?payment=failure&job_id=${jobId}`,
      pending: `${BASE_URL}/app?payment=pending&job_id=${jobId}`,
    },
    auto_return: 'approved',
    external_reference: jobId,
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
    console.error('[mp-checkout] MP API error:', mpData)
    // Clean up draft job on MP failure
    await sb.from('jobs').delete().eq('id', jobId)
    return NextResponse.json({ error: 'Payment provider error' }, { status: 500 })
  }

  // sandbox_init_point = test URL; init_point = production URL
  const url = mpData.sandbox_init_point ?? mpData.init_point

  return NextResponse.json({ url, job_id: jobId })
}
