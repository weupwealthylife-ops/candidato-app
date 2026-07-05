import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'

function baseUrl(raw: string): string {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

interface Company {
  name: string
  email: string
}

interface Job {
  id: string
  title: string
  closes_at: string
  company_id: string
  companies: Company | Company[] | null
}

export async function GET(req: NextRequest) {
  // Validate Authorization header
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const supabase = createClient(baseUrl(supabaseUrl), serviceRoleKey)

  const now = new Date()
  const from = new Date(now); from.setDate(from.getDate() + 6)
  const to = new Date(now); to.setDate(to.getDate() + 8)

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, closes_at, company_id, companies(name, email)')
    .eq('active', true)
    .eq('expiry_reminder_sent', false)
    .gte('closes_at', from.toISOString())
    .lte('closes_at', to.toISOString())

  if (error) {
    console.error('[job-expiry] Query error:', error)
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
  }

  const typedJobs = (jobs ?? []) as Job[]
  let sent = 0

  for (const job of typedJobs) {
    try {
      const companyRaw = job.companies
      const company: Company | null = Array.isArray(companyRaw)
        ? (companyRaw[0] ?? null)
        : (companyRaw ?? null)

      if (!company?.email || !company?.name) {
        console.warn(`[job-expiry] Job ${job.id} missing company email/name, skipping`)
        continue
      }

      const firstName = company.name.split(' ')[0]

      const notifyRes = await fetch(`${BASE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expiry_reminder',
          to: company.email,
          name: firstName,
          extra: {
            jobTitle: job.title,
            closesAt: formatDate(job.closes_at),
            jobId: job.id,
            renewUrl: (() => {
                const tok = createHmac('sha256', process.env.CRON_SECRET || '').update(job.id).digest('hex').slice(0, 16)
                return `${BASE_URL}/app/renovar?job=${job.id}&tok=${tok}`
              })(),
          },
        }),
      })

      if (!notifyRes.ok) {
        console.error(`[job-expiry] Notify failed for job ${job.id}:`, await notifyRes.text())
        continue
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update({ expiry_reminder_sent: true })
        .eq('id', job.id)

      if (updateError) {
        console.error(`[job-expiry] Update failed for job ${job.id}:`, updateError)
        continue
      }

      sent++
    } catch (err) {
      console.error(`[job-expiry] Unexpected error for job ${job.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent })
}
