import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

function verifyMpSignature(req: NextRequest, rawBody: string): boolean {
  if (!MP_WEBHOOK_SECRET) return false // reject if secret not configured
  const xSig = req.headers.get('x-signature') || ''
  const xReqId = req.headers.get('x-request-id') || ''
  const tsMatch = xSig.match(/ts=(\d+)/)
  const v1Match = xSig.match(/v1=([a-f0-9]+)/)
  if (!tsMatch || !v1Match) return false
  const ts = tsMatch[1]
  const v1 = v1Match[1]
  // MP manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>
  // Extract id from body for manifest
  let dataId = ''
  try { dataId = String((JSON.parse(rawBody) as { data?: { id?: unknown } }).data?.id ?? '') } catch { /* ignore */ }
  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts}`
  const expected = createHmac('sha256', MP_WEBHOOK_SECRET).update(manifest).digest('hex')
  return expected === v1
}

function baseUrl(raw: string): string {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function adminClient() {
  return createSupabaseClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function sendReceipt(to: string, name: string, jobTitle: string, amount: string, credits: number) {
  await fetch(`${BASE_URL}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'payment_confirmed',
      to,
      name,
      extra: { jobTitle, amount, credits: credits > 0 ? String(credits) : '' },
    }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!verifyMpSignature(req, rawBody)) {
    console.warn('[mp-webhook] Invalid signature — rejected')
    return NextResponse.json({ ok: true }) // always 200 to MP
  }

  let body: Record<string, unknown>
  try { body = JSON.parse(rawBody) } catch { return NextResponse.json({ ok: true }) }

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

  // external_reference: "jobId" or "jobId:credits:companyId"
  const [jobId, creditsStr, companyId] = ref.split(':')
  const extraCredits = parseInt(creditsStr ?? '0', 10) || 0

  const sb = adminClient()

  if (payment.status === 'approved') {
    // Idempotency: skip if job is already active (payment already processed)
    const { data: existingJob } = await sb.from('jobs').select('active, payment_pending').eq('id', jobId).maybeSingle()
    if (existingJob?.active === true && existingJob?.payment_pending === false) {
      console.log(`[mp-webhook] Payment ${paymentId} already processed for job ${jobId}, skipping`)
      return NextResponse.json({ ok: true })
    }

    // Activate the job and clear payment_pending flag
    await sb.from('jobs').update({ active: true, payment_pending: false }).eq('id', jobId)

    // Fetch job title + company info for receipt
    const { data: job } = await sb.from('jobs').select('title, companies(company_name, email)').eq('id', jobId).maybeSingle()
    const co = (job?.companies as { company_name?: string; email?: string } | null)
    const totalCOP = payment.transaction_amount
      ? `$${Number(payment.transaction_amount).toLocaleString('es-CO')} COP`
      : '—'

    // Bundle credits — use RPC for atomic server-side increment to prevent double-grant
    if (extraCredits > 0 && companyId) {
      await sb.rpc('increment_job_credits', { company_id: companyId, amount: extraCredits })
    }

    // Send receipt email to company
    if (co?.email) {
      await sendReceipt(co.email, co.company_name ?? 'equipo', job?.title ?? '', totalCOP, extraCredits)
    }

    console.log(`[mp-webhook] Job ${jobId} activated, +${extraCredits} credits — payment ${paymentId}`)
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await sb.from('jobs').delete().eq('id', jobId).eq('active', false)
    console.log(`[mp-webhook] Job ${jobId} draft removed — ${payment.status}`)
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
