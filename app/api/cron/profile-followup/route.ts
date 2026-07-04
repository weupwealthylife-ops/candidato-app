import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const sb = createClient(url, key)

  // Find candidates who registered 3 days ago (72h ± 2h window) with incomplete profiles
  const now = new Date()
  const from = new Date(now.getTime() - 74 * 3600000).toISOString()
  const to   = new Date(now.getTime() - 70 * 3600000).toISOString()

  const { data: candidates, error } = await sb
    .from('candidates')
    .select('id, name, email, whatsapp, area, city, modality, experience, linkedin, skills, cv_url, followup_sent')
    .gte('created_at', from)
    .lte('created_at', to)
    .eq('notify_matches', true)
    .eq('followup_sent', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  // Include skills and cv_url in completion calculation
  const profileFields = ['whatsapp', 'area', 'city', 'modality', 'experience', 'linkedin', 'skills', 'cv_url']

  for (const c of candidates ?? []) {
    const missing: string[] = []
    if (!c.whatsapp) missing.push('WhatsApp / Teléfono')
    if (!c.area) missing.push('Área profesional')
    if (!c.city) missing.push('Ciudad')
    if (!c.modality) missing.push('Modalidad de trabajo')
    if (!c.experience) missing.push('Años de experiencia')
    if (!c.linkedin) missing.push('LinkedIn')
    if (!(c.skills as string[] | null)?.length) missing.push('Habilidades')
    if (!c.cv_url) missing.push('CV / Hoja de vida')

    const filled = profileFields.filter(f => {
      const v = c[f as keyof typeof c]
      return Array.isArray(v) ? (v as unknown[]).length > 0 : Boolean(v)
    }).length
    const pct = Math.round((filled / profileFields.length) * 100)

    // Only send if profile is less than 80% complete
    if (pct >= 80) continue

    const firstName = (c.name as string)?.split(' ')[0] || 'candidato'

    const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://candidato.com.co'}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'profile_incomplete',
        to: c.email,
        name: firstName,
        extra: {
          profilePct: String(pct),
          missingFields: missing.join(', '),
        },
      }),
    }).catch(() => null)

    // Only mark as sent if the notification succeeded
    if (!notifyRes?.ok) {
      console.error(`[profile-followup] notify failed for candidate ${c.id}`)
      continue
    }

    await sb.from('candidates').update({ followup_sent: true }).eq('id', c.id)
    sent++
  }

  return NextResponse.json({ ok: true, sent, checked: candidates?.length ?? 0 })
}
