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
  const { data } = await sb
    .from('candidates')
    .select('name, area, city, modality, experience')
    .eq('id', id)
    .eq('profile_visible', true)
    .maybeSingle()
  if (!data) return { title: 'Candidato — Candidato®' }
  return {
    title: `${data.name}${data.area ? ` · ${data.area}` : ''} — Candidato®`,
    description: `${data.name}. ${[data.area, data.city, data.modality, data.experience].filter(Boolean).join(' · ')}. Talento disponible en Candidato®.`,
    openGraph: {
      title: `${data.name} — Candidato®`,
      description: `Perfil disponible en Candidato® · ${[data.city, data.area].filter(Boolean).join(', ')}`,
    },
  }
}

export default async function CandidateProfilePage({ params }: Props) {
  const { id } = await params
  const sb = await createClient()
  const { data: candidate } = await sb
    .from('candidates')
    .select('id, name, area, city, modality, experience, skills, formation')
    .eq('id', id)
    .eq('profile_visible', true)
    .maybeSingle()

  if (!candidate) notFound()

  const initials = candidate.name
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  const tags = [candidate.modality, candidate.city, candidate.experience].filter(Boolean) as string[]

  return (
    <main style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: 'var(--body, system-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>
      <style>{`
        :root{--forest:#1B3B3E;--ink:#0E1E20;--ink-70:rgba(14,30,32,.7);--ink-45:rgba(14,30,32,.45);--line:rgba(14,30,32,.1);--pale:#E4F0F1;--off:#F5F4F0}
        .cp-card{background:white;border-radius:16px;border:1px solid var(--line);padding:2rem;max-width:600px;width:100%}
        .cp-tag{background:var(--pale);color:var(--forest);border-radius:6px;padding:3px 10px;font-size:.78rem;font-weight:600}
        .cp-skill{background:#f0f4f5;color:var(--forest);font-size:.76rem;border-radius:6px;padding:3px 9px;border:1px solid var(--line)}
        .cp-btn{display:inline-block;background:#1B3B3E;color:white;border-radius:10px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;text-decoration:none;text-align:center;width:100%;box-sizing:border-box}
        .cp-btn:hover{background:#2A5558}
      `}</style>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <Link href="/" style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--forest)', textDecoration: 'none', letterSpacing: '-.01em' }}>
          Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
        </Link>
        <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '2px' }}>Matching inteligente · Colombia</div>
      </div>

      <div className="cp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink)', lineHeight: 1.25 }}>{candidate.name}</h1>
            {candidate.area && (
              <div style={{ fontSize: '.83rem', color: 'var(--ink-70)', marginTop: '.15rem' }}>{candidate.area}</div>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.2rem' }}>
            {tags.map(tag => <span key={tag} className="cp-tag">{tag}</span>)}
          </div>
        )}

        {candidate.formation && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.45rem' }}>Formación</div>
            <div style={{ fontSize: '.84rem', color: 'var(--ink-70)', lineHeight: 1.7, background: 'var(--pale)', borderRadius: 8, padding: '.65rem .9rem' }}>{candidate.formation}</div>
          </div>
        )}

        {candidate.skills && (candidate.skills as string[]).length > 0 && (
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.5rem' }}>Habilidades</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
              {(candidate.skills as string[]).map((s: string) => (
                <span key={s} className="cp-skill">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.3rem', marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-45)', textAlign: 'center', marginBottom: '.2rem' }}>
            ¿Interesado en este perfil? Contactá al candidato a través de la plataforma.
          </div>
          <a href="/app" className="cp-btn">Contactar a este candidato →</a>
          <Link href="/candidatos" style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--ink-45)', textDecoration: 'none' }}>
            Ver todo el talento disponible →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '.72rem', color: 'var(--ink-45)', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Candidato® · Matching inteligente para Colombia</Link>
      </div>
    </main>
  )
}
