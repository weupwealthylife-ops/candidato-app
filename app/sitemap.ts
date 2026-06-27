import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

const SITE = 'https://candidato.com.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_routes: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/jobs`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE}/app`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ]

  const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return static_routes

  const sb = createClient(url, key)
  const { data: jobs } = await sb
    .from('jobs')
    .select('id, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1000)

  const job_routes: MetadataRoute.Sitemap = (jobs ?? []).map((j: { id: string; created_at: string }) => ({
    url: `${SITE}/jobs/${j.id}`,
    lastModified: new Date(j.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...static_routes, ...job_routes]
}
