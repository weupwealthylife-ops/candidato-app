import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!

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
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const { type, data } = body as { type?: string; data?: { id?: string | number } }

  // MP also sends GET pings — handle gracefully
  if (type !== 'payment' || !data?.id) return NextResponse.json({ ok: true })

  const paymentId = String(data.id)

  // Verify payment with MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) return NextResponse.json({ ok: true })

  const payment = await mpRes.json()
  const jobId = payment.external_reference as string | undefined

  if (!jobId) return NextResponse.json({ ok: true })

  const sb = adminClient()

  if (payment.status === 'approved') {
    await sb.from('jobs').update({ active: true }).eq('id', jobId)
    console.log(`[mp-webhook] Job ${jobId} activated — payment ${paymentId}`)
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    // Remove draft job to keep DB clean
    await sb.from('jobs').delete().eq('id', jobId).eq('active', false)
    console.log(`[mp-webhook] Job ${jobId} draft removed — payment ${payment.status}`)
  }

  return NextResponse.json({ ok: true })
}

// MP sends GET requests to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true })
}
