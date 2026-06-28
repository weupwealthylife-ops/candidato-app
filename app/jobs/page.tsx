import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vacantes — Candidato®',
  description: 'Todas las vacantes activas en Candidato®. Encuentra tu próximo trabajo en Colombia.',
  openGraph: {
    title: 'Vacantes — Candidato®',
    description: 'Todas las vacantes activas en Candidato®. Encuentra tu próximo trabajo en Colombia.',
    url: 'https://candidato.com.co/jobs',
    images: [{ url: 'https://candidato.com.co/bird-logo.png', width: 512, height: 512 }],
    type: 'website',
  },
}

function baseUrl(raw: string) {
  try { const u = new URL(raw); return `${u.protocol}//${u.host}` } catch { return raw }
}

interface JobRow {
  id: string
  title: string
  area?: string
  city?: string
  modality?: string
  salary_range?: string
  description?: string
  closes_at?: string
  created_at: string
  companies?: { company_name: string } | null
}

async function fetchJobs(q?: string): Promise<JobRow[]> {
  const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return []

  const sb = createClient(url, key)
  let query = sb
    .from('jobs')
    .select('id, title, area, city, modality, salary_range, description, closes_at, created_at, companies(company_name)')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`title.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data } = await query
  return (data ?? []) as unknown as JobRow[]
}

const forest = '#1B3B3E'
const coral = '#EA6440'
const offWhite = '#FAFAF8'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: rawQ } = await searchParams
  const q = rawQ?.trim() || undefined
  const jobs = await fetchJobs(q)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: offWhite, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <div style={{ background: forest, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="https://candidato.com.co" style={{ color: 'white', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Candidato® ✦
        </a>
        <a href="/app" style={{ background: coral, color: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          Postularme gratis →
        </a>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: forest, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Vacantes activas
          </h1>
          <p style={{ fontSize: '15px', color: '#666', margin: '0 0 20px' }}>
            {jobs.length > 0
              ? `${jobs.length} ${jobs.length === 1 ? 'vacante disponible' : 'vacantes disponibles'} en Colombia`
              : 'Nuevas vacantes se publican regularmente'}
          </p>

          {/* Search */}
          <form method="GET" action="/jobs">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por cargo, área o ciudad…"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #ddd',
                  fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'white',
                }}
              />
              <button
                type="submit"
                style={{ background: forest, color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                Buscar
              </button>
              {q && (
                <Link href="/jobs" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '14px', color: '#666', textDecoration: 'none', background: 'white', display: 'flex', alignItems: 'center' }}>
                  ✕
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Job list */}
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: forest }}>No se encontraron vacantes</p>
            {q && <p style={{ fontSize: '14px' }}>Intentá con otro término de búsqueda</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.map(job => {
              const company = job.companies && typeof job.companies === 'object' && 'company_name' in job.companies
                ? (job.companies as { company_name: string }).company_name
                : null
              const tags = [job.modality, job.city, job.area, job.salary_range].filter(Boolean) as string[]

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '14px', padding: '20px 24px',
                    boxShadow: '0 1px 8px rgba(27,59,62,0.07)', border: '1.5px solid transparent',
                    transition: 'all .15s', cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        {company && (
                          <div style={{ fontSize: '12px', color: coral, fontWeight: 600, marginBottom: '4px', letterSpacing: '0.02em' }}>
                            {company}
                          </div>
                        )}
                        <div style={{ fontSize: '17px', fontWeight: 700, color: forest, lineHeight: 1.3 }}>
                          {job.title}
                        </div>
                      </div>
                      <div style={{
                        flexShrink: 0, background: forest, color: 'white', borderRadius: '8px',
                        padding: '6px 12px', fontSize: '12px', fontWeight: 700,
                      }}>
                        Ver →
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: job.description ? '10px' : '0' }}>
                        {tags.map(tag => (
                          <span key={tag} style={{
                            background: '#f0f4f4', color: forest, borderRadius: '20px',
                            padding: '3px 10px', fontSize: '12px', fontWeight: 600,
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {job.description && (
                      <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, margin: '0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {job.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '48px', textAlign: 'center', background: forest, borderRadius: '16px', padding: '32px 24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
            ¿Buscás trabajo? Postulate gratis.
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            El algoritmo te matchea con las mejores vacantes automáticamente.
          </p>
          <a href="/app" style={{ background: coral, color: 'white', borderRadius: '10px', padding: '12px 28px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>
            Crear mi perfil gratis →
          </a>
        </div>
      </div>
    </div>
  )
}
