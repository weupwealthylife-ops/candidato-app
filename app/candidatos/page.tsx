import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Talento disponible en Colombia · Candidato®',
  description: 'Explorá perfiles de candidatos disponibles en Colombia. Talento validado por Candidato®.',
  openGraph: {
    title: 'Talento disponible en Colombia · Candidato®',
    description: 'Explorá perfiles de candidatos disponibles en Colombia. Talento validado por Candidato®.',
    url: 'https://candidato.com.co/candidatos',
    type: 'website',
  },
}

interface CandidateRow {
  id: string
  name: string
  area?: string
  city?: string
  modality?: string
  experience?: string
  skills?: string[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

async function fetchCandidates(q?: string): Promise<CandidateRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return []

  const sb = createClient(url, key)
  let query = sb
    .from('candidates')
    .select('id, name, area, city, modality, experience, skills')
    .eq('profile_visible', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data } = await query
  return (data ?? []) as CandidateRow[]
}

const forest = '#1B3B3E'
const coral = '#EA6440'
const offWhite = '#FAFAF8'

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: rawQ } = await searchParams
  const q = rawQ?.trim() || undefined
  const candidates = await fetchCandidates(q)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: offWhite, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <div style={{ background: forest, padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="https://candidato.com.co" style={{ color: 'white', fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
          Candidato® ✦
        </a>
        <a href="/app" style={{ background: coral, color: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          Soy empresa →
        </a>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: forest, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Talento disponible en Colombia
          </h1>
          <p style={{ fontSize: '15px', color: '#666', margin: '0 0 20px' }}>
            {candidates.length > 0
              ? `${candidates.length} ${candidates.length === 1 ? 'candidato disponible' : 'candidatos disponibles'}`
              : 'Nuevos candidatos se registran regularmente'}
          </p>

          {/* Search */}
          <form method="GET" action="/candidatos">
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre, área o ciudad…"
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
                <Link href="/candidatos" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #ddd', fontSize: '14px', color: '#666', textDecoration: 'none', background: 'white', display: 'flex', alignItems: 'center' }}>
                  ✕
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Candidate grid */}
        {candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#888' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: forest }}>No se encontraron candidatos</p>
            {q && <p style={{ fontSize: '14px' }}>Intentá con otro término de búsqueda</p>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {candidates.map(candidate => {
              const tags = [candidate.modality, candidate.city, candidate.experience].filter(Boolean) as string[]
              return (
                <Link
                  key={candidate.id}
                  href={`/candidatos/${candidate.id}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '14px', padding: '20px',
                    boxShadow: '0 1px 8px rgba(27,59,62,0.07)', border: '1.5px solid transparent',
                    transition: 'all .15s', cursor: 'pointer', height: '100%', boxSizing: 'border-box',
                  }}>
                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: forest, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '14px', flexShrink: 0,
                      }}>
                        {getInitials(candidate.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: forest, lineHeight: 1.3 }}>
                          {candidate.name}
                        </div>
                        {candidate.area && (
                          <div style={{ fontSize: '12px', color: coral, fontWeight: 600, marginTop: '2px' }}>
                            {candidate.area}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                        {tags.map(tag => (
                          <span key={tag} style={{
                            background: '#f0f4f4', color: forest, borderRadius: '20px',
                            padding: '2px 9px', fontSize: '11px', fontWeight: 600,
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {candidate.skills.slice(0, 4).map((s: string) => (
                          <span key={s} style={{
                            background: '#f0f4f5', color: '#4a6a6a', fontSize: '11px', borderRadius: '5px',
                            padding: '2px 7px', border: '1px solid #e0eaea',
                          }}>
                            {s}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span style={{ fontSize: '11px', color: '#9aacac', padding: '2px 4px' }}>
                            +{candidate.skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: forest }}>
                      Ver perfil →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '48px', textAlign: 'center', background: forest, borderRadius: '16px', padding: '32px 24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
            ¿Buscás talento? Encontralo en Candidato®.
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
            El algoritmo te matchea con los mejores perfiles automáticamente.
          </p>
          <a href="/app" style={{ background: coral, color: 'white', borderRadius: '10px', padding: '12px 28px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block' }}>
            Contratar talento →
          </a>
        </div>
      </div>
    </div>
  )
}
