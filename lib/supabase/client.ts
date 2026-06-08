import { createBrowserClient } from '@supabase/ssr'

function baseUrl(raw: string): string {
  if (!raw) return ''
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw
  }
}

const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const configured = !!(url && key)

// Stub that silently no-ops every Supabase call when env vars are missing.
// Returns a Thenable chain so await resolves to { data: null, error: null }.
const resolved = Promise.resolve({ data: null, error: null })
const noopChain: Record<string, unknown> = new Proxy(Object.assign(() => noopChain, resolved), {
  get(_t, prop) {
    // Propagate Promise protocol so `await noopChain` resolves to null result
    if (prop === 'then') return resolved.then.bind(resolved)
    if (prop === 'catch') return resolved.catch.bind(resolved)
    if (prop === 'finally') return resolved.finally.bind(resolved)
    return () => noopChain
  },
  apply: () => noopChain,
})

export function createClient() {
  if (!configured) return noopChain as unknown as ReturnType<typeof createBrowserClient>
  return createBrowserClient(url, key)
}
