'use client'

import { useLang } from '@/lib/LangContext'

export default function ForCompanies() {
  const { t } = useLang()

  const BENEFITS = [
    {
      ico: '⚡',
      title: t('Candidatos en 2 horas', 'Candidates in 2 hours'),
      desc: t(
        'Publicás la vacante, el algoritmo identifica fits reales y los notifica automáticamente.',
        'Post the listing, the algorithm identifies real fits and notifies them automatically.',
      ),
    },
    {
      ico: '🎯',
      title: t('Solo entrevistás fits reales', 'Only interview real fits'),
      desc: t(
        'El motor de scoring filtra por área, modalidad, ciudad, experiencia y habilidades. Vos solo ves los que superan el 70% de compatibilidad.',
        'The scoring engine filters by area, mode, city, experience and skills. You only see candidates above 70% compatibility.',
      ),
    },
    {
      ico: '📧',
      title: t('Match = contacto directo', 'Match = direct contact'),
      desc: t(
        'Cuando un candidato confirma interés, recibís su CV, WhatsApp y LinkedIn en un email. Sin intermediarios.',
        "When a candidate confirms interest, you receive their CV, WhatsApp and LinkedIn in one email. No middlemen.",
      ),
    },
    {
      ico: '📉',
      title: t('−90% en costo de contratación', '−90% hiring cost'),
      desc: t(
        'Sin honorarios de agencia. Sin tiempo perdido en CVs irrelevantes. Solo el talento correcto.',
        'No agency fees. No time wasted on irrelevant CVs. Just the right talent.',
      ),
    },
  ]

  return (
    <section id="for-companies" style={{ background: 'var(--forest)', padding: '5rem max(5vw,24px)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative blob */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(234,100,64,.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--coral)', marginBottom: '.8rem', display: 'block' }}>
            {t('Para empresas', 'For companies')}
          </span>
          <h2 style={{ fontFamily: 'var(--head)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, color: 'white', lineHeight: 1.15, margin: '0 auto .9rem' }}>
            {t('De la vacante al candidato ideal', 'From listing to ideal candidate')}
            <br />
            <span style={{ color: 'var(--coral)' }}>{t('en días, no semanas.', 'in days, not weeks.')}</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.97rem', lineHeight: 1.75, maxWidth: 520, margin: '0 auto' }}>
            {t(
              'Candidato reduce de 3–4 semanas a 48 horas el tiempo para encontrar candidatos calificados. El algoritmo hace el filtrado — vos solo entrevistás.',
              'Candidato reduces the time to find qualified candidates from 3–4 weeks to 48 hours. The algorithm does the filtering — you just interview.',
            )}
          </p>
        </div>

        {/* Benefits grid */}
        <div className="for-co-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.2rem', marginBottom: '3rem' }}>
          {BENEFITS.map((b, i) => (
            <div key={i} className="for-co-card" style={{ background: 'rgba(255,255,255,.07)', borderRadius: 14, padding: '1.6rem 1.8rem', border: '1px solid rgba(255,255,255,.1)', backdropFilter: 'blur(4px)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '.6rem' }}>{b.ico}</div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, color: 'white', fontSize: '.95rem', marginBottom: '.4rem' }}>{b.title}</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.82rem', lineHeight: 1.65 }}>{b.desc}</div>
            </div>
          ))}
        </div>

        {/* How it works steps */}
        <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '1.8rem 2rem', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.45)', marginBottom: '1.2rem' }}>
            {t('El proceso — en 4 pasos', 'The process — in 4 steps')}
          </div>
          <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
            {[
              { n: '01', label: t('Publicás la vacante', 'Post the listing'), sub: t('Título, área, modalidad, skills requeridos.', 'Title, area, mode, required skills.') },
              { n: '02', label: t('El algoritmo busca', 'Algorithm searches'), sub: t('Encuentra candidatos con score ≥70% en 2h.', 'Finds candidates with score ≥70% in 2h.') },
              { n: '03', label: t('Candidatos confirman', 'Candidates confirm'), sub: t('Solo los interesados aparecen en tu panel.', 'Only interested ones appear in your dashboard.') },
              { n: '04', label: t('Recibís el match', 'You get the match'), sub: t('CV + WhatsApp + LinkedIn en un email.', 'CV + WhatsApp + LinkedIn in one email.') },
            ].map((s, i, arr) => (
              <div key={s.n} style={{ flex: '1', minWidth: 160, display: 'flex', alignItems: 'flex-start', gap: '.7rem', padding: '.6rem .8rem', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,.1)' : 'none' }}>
                <div style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--coral)', lineHeight: 1, flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '.83rem', marginBottom: '.2rem' }}>{s.label}</div>
                  <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.75rem', lineHeight: 1.5 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <a href="/app" className="btn btn-coral btn-xl" style={{ fontSize: '1rem', padding: '14px 36px' }}>
            {t('Publicar vacante gratis →', 'Post free listing →')}
          </a>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem' }}>✓ {t('Sin tarjeta de crédito', 'No credit card')}</span>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem' }}>✓ {t('Vacante gratuita para empezar', 'Free listing to start')}</span>
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem' }}>✓ {t('Soporte por WhatsApp', 'WhatsApp support')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
