import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const sb = await createClient()
  const { data } = await sb
    .from('jobs')
    .select('title, area, city, modality, companies(company_name)')
    .eq('id', id)
    .maybeSingle()
  if (!data) return { title: 'Vacante — Candidato®' }
  const co = (data.companies as { company_name?: string })?.company_name || ''
  return {
    title: `${data.title}${co ? ` en ${co}` : ''} — Candidato®`,
    description: `${data.title}${co ? ` en ${co}` : ''}. ${[data.city, data.modality, data.area].filter(Boolean).join(' · ')}. Postulate en Candidato®.`,
    openGraph: { title: `${data.title} — Candidato®`, description: `Vacante en ${co || 'Candidato®'}` },
  }
}

export default async function PublicJobPage({ params }: Props) {
  const { id } = await params
  const sb = await createClient()
  const { data: job } = await sb
    .from('jobs')
    .select('*, companies(company_name)')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle()

  if (!job) notFound()

  const co = (job.companies as { company_name?: string })?.company_name || ''
  const tags = [job.modality, job.city, job.salary_range].filter(Boolean) as string[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} en ${co}`,
    hiringOrganization: { '@type': 'Organization', name: co || 'Empresa en Candidato®' },
    jobLocation: job.city ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city, addressCountry: 'CO' } } : undefined,
    employmentType: job.modality === 'Remoto' ? 'TELECOMMUTE' : job.modality === 'Híbrido' ? 'MIXED' : 'FULL_TIME',
    datePosted: job.created_at ? job.created_at.split('T')[0] : undefined,
    validThrough: job.closes_at ? job.closes_at.split('T')[0] : undefined,
    baseSalary: job.salary_range ? { '@type': 'MonetaryAmount', currency: 'COP', value: { '@type': 'QuantitativeValue', description: job.salary_range } } : undefined,
    experienceRequirements: job.required_experience || undefined,
    skills: (job.skills as string[] | null)?.join(', ') || undefined,
    url: `https://candidato.com.co/jobs/${job.id}`,
    directApply: true,
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: 'var(--body, system-ui)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        :root{--forest:#1B3B3E;--ink:#0E1E20;--ink-70:rgba(14,30,32,.7);--ink-45:rgba(14,30,32,.45);--line:rgba(14,30,32,.1);--pale:#E4F0F1;--off:#F5F4F0}
        .jb-card{background:white;border-radius:16px;border:1px solid var(--line);padding:2rem;max-width:600px;width:100%}
        .jb-tag{background:var(--pale);color:var(--forest);border-radius:6px;padding:3px 10px;font-size:.78rem;font-weight:600}
        .jb-btn{display:inline-block;background:#1B3B3E;color:white;border-radius:10px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;text-decoration:none;text-align:center;width:100%;box-sizing:border-box}
        .jb-btn:hover{background:#2A5558}
      `}</style>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <a href="/" style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--forest)', textDecoration: 'none', letterSpacing: '-.01em' }}>
          Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
        </a>
        <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '2px' }}>Matching inteligente · Colombia</div>
      </div>

      <div className="jb-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
            {co ? co[0].toUpperCase() : '?'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink)', lineHeight: 1.25 }}>{job.title}</h1>
            <div style={{ fontSize: '.83rem', color: 'var(--ink-70)', marginTop: '.15rem' }}>{co || 'Empresa en Candidato®'}{job.area ? ` · ${job.area}` : ''}</div>
          </div>
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.2rem' }}>
            {tags.map(tag => <span key={tag} className="jb-tag">{tag}</span>)}
          </div>
        )}

        {job.required_experience && (
          <div style={{ marginBottom: '1rem', padding: '.65rem .9rem', background: 'var(--pale)', borderRadius: 8, fontSize: '.82rem', color: 'var(--forest)' }}>
            <strong>Experiencia requerida:</strong> {job.required_experience}
          </div>
        )}

        {job.description && (
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.5rem' }}>Descripción</div>
            <p style={{ fontSize: '.85rem', color: 'var(--ink-70)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{job.description}</p>
          </div>
        )}

        {job.skills && (job.skills as string[]).length > 0 && (
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.5rem' }}>Habilidades</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
              {(job.skills as string[]).map((s: string) => (
                <span key={s} style={{ background: '#f0f4f5', color: 'var(--forest)', fontSize: '.76rem', borderRadius: 6, padding: '3px 9px', border: '1px solid var(--line)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1rem', padding: '.6rem .9rem', background: 'var(--off)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.75rem', color: 'var(--ink-45)' }}>
          <span>🔗 Compartir:</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Mirá esta vacante de ${job.title} en Candidato®: https://candidato.com.co/jobs/${job.id}`)}`} target="_blank" rel="noopener" style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://candidato.com.co/jobs/${job.id}`)}`} target="_blank" rel="noopener" style={{ color: '#0077B5', fontWeight: 600, textDecoration: 'none' }}>LinkedIn</a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${job.title}${co ? ` en ${co}` : ''} — Postulate en Candidato®`)}&url=${encodeURIComponent(`https://candidato.com.co/jobs/${job.id}`)}`} target="_blank" rel="noopener" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>X</a>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.3rem', marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
          <a href={`/app?job=${job.id}`} className="jb-btn">Postularme a esta vacante →</a>
          <a href="/app" style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--ink-45)', textDecoration: 'none' }}>
            Ver todos los empleos en Candidato® →
          </a>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '.72rem', color: 'var(--ink-45)', textAlign: 'center' }}>
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Candidato® · Matching inteligente para Colombia</a>
      </div>
    </main>
  )
}
