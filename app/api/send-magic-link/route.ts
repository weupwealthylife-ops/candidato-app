import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// In-memory rate limiter — per email, max 3 OTPs per 10 minutes per serverless instance
// For multi-instance production hardening, replace with Upstash Redis
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_PER_WINDOW = 3

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const entry = attempts.get(email)
  if (!entry || now > entry.resetAt) {
    attempts.set(email, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= MAX_PER_WINDOW) return true
  entry.count++
  return false
}

// Prune stale entries periodically to prevent memory growth
function pruneStale() {
  const now = Date.now()
  for (const [key, val] of attempts.entries()) {
    if (now > val.resetAt) attempts.delete(key)
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string; redirectTo?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const email = (body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  if (isRateLimited(email)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá 10 minutos antes de intentar de nuevo.' },
      { status: 429 }
    )
  }

  if (attempts.size > 500) pruneStale()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const sb = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { error } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: body.redirectTo || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://candidato.com.co'}/auth/callback?next=/app` },
  })

  if (error) {
    console.error('[send-magic-link]', error.message)
    return NextResponse.json({ error: 'Could not send link' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
