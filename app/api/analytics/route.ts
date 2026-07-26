import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

function sb() {
  return createSupabaseClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: { event?: string; properties?: Record<string, unknown>; session_id?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { event, properties, session_id } = body
  if (!event || typeof event !== 'string') {
    return NextResponse.json({ error: 'Missing event' }, { status: 400 })
  }

  try {
    await sb().from('analytics_events').insert({ event, properties: properties ?? null, session_id: session_id ?? null })
  } catch {
    // Non-blocking — don't fail the caller if analytics table doesn't exist yet
  }

  return NextResponse.json({ ok: true })
}
