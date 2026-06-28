import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const sb = await createClient()
  const { data } = await sb.from('companies').select('company_name, industry, city, description').eq('id', id).maybeSingle()
  if (!data) return { title: 'Empresa — Candidato®' }
  return {
    title: `${data.company_name} — Candidato®`,
    description: data.description || `${data.company_name}. ${[data.industry, data.city].filter(Boolean).join(' · ')}. Conocé sus vacantes en Candidato®.`,
  }
}

export default async function CompanyPublicPage({ params }: Props) {
  const { id } = await params
  const sb = await createClient()
  const [{ data: co }, { data: jobs }] = await Promise.all([
    sb.from('companies').select('id, company_name, industry, size, city, description, mission, values, website, linkedin, looking_for_areas, looking_for_experience, looking_for_modality').eq('id', id).maybeSingle(),
    sb.from('jobs').select('id, title, modality, city, area, salary_range, created_at').eq('company_id', id).eq('active', true).order('created_at', { ascending: false }).limit(10),
  ])

  if (!co) notFound()

  const lookingFor = [
    co.looking_for_areas ? (co.looking_for_areas as string[]).join(', ') : null,
    co.looking_for_experience,
    co.looking_for_modality,
  ].filter(Boolean)

  return (
    <main style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: 'var(--body, system-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>
      <style>{`
        :root{--forest:#1B3B3E;--ink:#0E1E20;--ink-70:rgba(14,30,32,.7);--ink-45:rgba(14,30,32,.45);--line:rgba(14,30,32,.1);--pale:#E4F0F1;--off:#F5F4F0}
        .co-card{background:white;border-radius:16px;border:1px solid var(--line);padding:2rem;max-width:640px;width:100%;margin-bottom:1rem}
        .co-tag{background:var(--pale);color:var(--forest);border-radius:6px;padding:3px 10px;font-size:.78rem;font-weight:600;display:inline-block}
        .co-job{display:flex;align-items:center;gap:.75rem;padding:.65rem .5rem;border-bottom:1px solid var(--line);cursor:pointer;text-decoration:none;color:inherit}
        .co-job:last-child{border-bottom:none}
        .co-job:hover{background:var(--off);border-radius:8px}
        .co-btn{display:inline-block;background:#1B3B3E;color:white;border-radius:10px;padding:.75rem 1.8rem;font-size:.88rem;font-weight:700;text-decoration:none;text-align:center}
        .co-btn:hover{background:#2A5558}
      `}</style>

      {/* Brand bar */}
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <Link href="/" style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--forest)', textDecoration: 'none' }}>
          Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
        </Link>
        <div style={{ fontSize: '.7rem', color: 'var(--ink-45)', marginTop: '2px' }}>Matching inteligente · Colombia</div>
      </div>

      {/* Company header */}
      <div className="co-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', marginBottom: '1.3rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 }}>
            {co.company_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink)', lineHeight: 1.2 }}>{co.company_name}</h1>
            <div style={{ fontSize: '.82rem', color: 'var(--ink-45)', marginTop: '.2rem' }}>
              {[co.industry, co.city, co.size].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
            {co.website && <a href={co.website} target="_blank" rel="noopener" style={{ fontSize: '.73rem', color: 'var(--forest)', textDecoration: 'none', fontWeight: 600 }}>🌐 Web</a>}
            {co.linkedin && <a href={co.linkedin} target="_blank" rel="noopener" style={{ fontSize: '.73rem', color: '#0077B5', textDecoration: 'none', fontWeight: 600 }}>in</a>}
          </div>
        </div>

        {co.description && (
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.4rem' }}>Sobre la empresa</div>
            <p style={{ fontSize: '.84rem', color: 'var(--ink-70)', lineHeight: 1.7, margin: 0 }}>{co.description}</p>
          </div>
        )}

        {co.mission && (
          <div style={{ marginBottom: '1.1rem', padding: '.75rem 1rem', background: 'var(--pale)', borderRadius: 10, borderLeft: '3px solid var(--forest)' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--forest)', marginBottom: '.35rem' }}>Misión</div>
            <p style={{ fontSize: '.82rem', color: 'var(--ink-70)', lineHeight: 1.65, margin: 0 }}>{co.mission}</p>
          </div>
        )}

        {lookingFor.length > 0 && (
          <div style={{ marginBottom: '.5rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.5rem' }}>Buscamos</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
              {lookingFor.map(v => <span key={v} className="co-tag">{v}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* Open roles */}
      {jobs && jobs.length > 0 && (
        <div className="co-card">
          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '.95rem', color: 'var(--ink)', marginBottom: '.9rem' }}>
            Vacantes abiertas <span style={{ fontSize: '.75rem', background: 'var(--forest)', color: 'white', borderRadius: 5, padding: '2px 8px', marginLeft: '.4rem', fontFamily: 'inherit', fontWeight: 700 }}>{jobs.length}</span>
          </div>
          {jobs.map((j: { id: string; title: string; modality?: string; city?: string; area?: string; salary_range?: string; created_at: string }) => (
            <a key={j.id} href={`/jobs/${j.id}`} className="co-job">
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--pale)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 800, flexShrink: 0 }}>
                {j.area?.[0] || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '.84rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '2px' }}>
                  {[j.modality, j.city, j.salary_range].filter(Boolean).join(' · ')}
                </div>
              </div>
              <span style={{ fontSize: '.72rem', color: 'var(--forest)', fontWeight: 600, flexShrink: 0 }}>Ver →</span>
            </a>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ maxWidth: 640, width: '100%', textAlign: 'center', padding: '1rem' }}>
        <a href="/app" className="co-btn">Crear mi perfil en Candidato® →</a>
        <div style={{ marginTop: '.75rem', fontSize: '.75rem', color: 'var(--ink-45)' }}>
          Gratis para candidatos · Sin spam · Solo oportunidades reales
        </div>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '.7rem', color: 'var(--ink-45)' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Candidato® · Matching inteligente para Colombia</Link>
      </div>
    </main>
  )
}
