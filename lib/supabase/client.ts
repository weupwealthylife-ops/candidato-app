import { createBrowserClient } from '@supabase/ssr'

// Strip any path segments (e.g. "/rest/v1") that may have been accidentally
// included in the env var — the SDK always appends its own path prefixes.
function baseUrl(raw: string): string {
  if (!raw) return ''
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw
  }
}

export function createClient() {
  return createBrowserClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )
}
