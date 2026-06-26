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

  if (type !== 'payment' || !data?.id) return NextResponse.json({ ok: true })

  const paymentId = String(data.id)

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) return NextResponse.json({ ok: true })

  const payment = await mpRes.json()
  const ref = payment.external_reference as string | undefined
  if (!ref) return NextResponse.json({ ok: true })

  // external_reference format: "jobId" or "jobId:credits:companyId"
  const [jobId, creditsStr, companyId] = ref.split(':')
  const extraCredits = parseInt(creditsStr ?? '0', 10) || 0

  const sb = adminClient()

  if (payment.status === 'approved') {
    // Activate the primary job
    await sb.from('jobs').update({ active: true }).eq('id', jobId)

    // If bundle purchase, add remaining credits to the company
    if (extraCredits > 0 && companyId) {
      const { data: co } = await sb.from('companies').select('job_credits').eq('id', companyId).maybeSingle()
      const current = (co as { job_credits?: number } | null)?.job_credits ?? 0
      await sb.from('companies').update({ job_credits: current + extraCredits }).eq('id', companyId)
    }

    console.log(`[mp-webhook] Job ${jobId} activated, +${extraCredits} credits to company ${companyId ?? 'n/a'} — payment ${paymentId}`)
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await sb.from('jobs').delete().eq('id', jobId).eq('active', false)
    console.log(`[mp-webhook] Job ${jobId} draft removed — payment ${payment.status}`)
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
