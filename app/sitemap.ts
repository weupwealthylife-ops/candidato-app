import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

const BASE = 'https://candidato.com.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient()
  const { data: jobs } = await sb
    .from('jobs')
    .select('id, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(500)

  const jobUrls: MetadataRoute.Sitemap = (jobs || []).map(j => ({
    url: `${BASE}/jobs/${j.id}`,
    lastModified: j.created_at ? new Date(j.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/app`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...jobUrls,
  ]
}
