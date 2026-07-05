import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const RENEWAL_PRICE = 150000
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

function makeToken(jobId: string): string {
  return createHmac('sha256', process.env.CRON_SECRET || '').update(jobId).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { jobId, tok, title } = body as { jobId?: string; tok?: string; title?: string }

  if (!jobId || !tok) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  if (tok !== makeToken(jobId)) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  if (!MP_ACCESS_TOKEN) return NextResponse.json({ error: 'MP not configured' }, { status: 500 })

  const preference = {
    items: [{
      id: `renewal-${jobId}`,
      title: `Renovación 30 días — ${(title || 'Vacante').slice(0, 60)}`,
      quantity: 1,
      unit_price: RENEWAL_PRICE,
      currency_id: 'COP',
    }],
    back_urls: {
      success: `${BASE_URL}/app/renovar?job=${jobId}&tok=${tok}&payment=success`,
      failure: `${BASE_URL}/app/renovar?job=${jobId}&tok=${tok}&payment=failure`,
      pending: `${BASE_URL}/app/renovar?job=${jobId}&tok=${tok}&payment=pending`,
    },
    auto_return: 'approved',
    external_reference: `renewal:${jobId}`,
    notification_url: `${BASE_URL}/api/mp-webhook`,
    statement_descriptor: 'Candidato',
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    body: JSON.stringify(preference),
  })

  const mpData = await mpRes.json()
  if (!mpRes.ok) {
    console.error('[mp-renewal] MP error:', mpData)
    return NextResponse.json({ error: 'mp_error', detail: mpData?.message ?? JSON.stringify(mpData).slice(0, 200) }, { status: 500 })
  }

  const isTest = MP_ACCESS_TOKEN.startsWith('TEST-')
  const url = isTest ? mpData.sandbox_init_point : mpData.init_point
  if (!url) return NextResponse.json({ error: 'No checkout URL' }, { status: 500 })

  return NextResponse.json({ url })
}
