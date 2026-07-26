'use client'

import { useLang } from '@/lib/LangContext'

const TESTIMONIALS = [
  {
    quote_es: 'En 3 días recibí 2 propuestas reales. Nunca había tenido una respuesta tan rápida buscando trabajo.',
    quote_en: 'In 3 days I received 2 real offers. I had never had such a fast response while job searching.',
    name: 'Laura M.',
    role_es: 'Diseñadora UX/UI · Cali',
    role_en: 'UX/UI Designer · Cali',
    initial: 'LM',
    bg: '#EA6440',
  },
  {
    quote_es: 'Encontramos al candidato ideal en 10 días. El matching fue muy preciso — el perfil encajaba perfectamente con lo que necesitábamos.',
    quote_en: 'We found the ideal candidate in 10 days. The matching was spot-on — the profile fit exactly what we needed.',
    name: 'Andrés P.',
    role_es: 'CEO · helppeople',
    role_en: 'CEO · helppeople',
    initial: 'AP',
    bg: '#1B3B3E',
  },
  {
    quote_es: 'Antes gastábamos semanas revisando CVs. Ahora Candidato nos manda directamente los perfiles que encajan. Es otro nivel.',
    quote_en: 'We used to spend weeks reviewing CVs. Now Candidato sends us directly the profiles that fit. It\'s another level.',
    name: 'María F.',
    role_es: 'Gerente de RRHH · Empresa tecnología',
    role_en: 'HR Manager · Tech company',
    initial: 'MF',
    bg: '#264D51',
  },
]

export default function Testimonials() {
  const { t } = useLang()
  return (
    <section id="testimonials" style={{ background: 'var(--cream)', padding: '5rem 0' }}>
      <div className="sec-inner">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="sec-eye">{t('Testimonios', 'Testimonials')}</span>
          <h2 className="sec-h2">{t('Lo que dicen quienes ya lo vivieron.', 'What those who\'ve been through it say.')}</h2>
        </div>
        <div className="testimonials-grid" style={{ gap: '1.2rem' }}>
          {TESTIMONIALS.map((t2, i) => (
            <div key={i} className={`testimonial-card${i === 2 ? ' testimonial-card-3' : ''}`} style={{ background: 'var(--white)', borderRadius: 14, padding: '1.4rem 1.5rem', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1.4rem', color: 'var(--forest)', lineHeight: 1 }}>&ldquo;</div>
              <p style={{ fontSize: '.88rem', color: 'var(--ink-70)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                {t(t2.quote_es, t2.quote_en)}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', paddingTop: '.75rem', borderTop: '1px solid var(--line)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: t2.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.78rem', color: 'white', flexShrink: 0 }}>
                  {t2.initial}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.83rem', color: 'var(--ink)' }}>{t2.name}</div>
                  <div style={{ fontSize: '.73rem', color: 'var(--ink-45)' }}>{t(t2.role_es, t2.role_en)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <a href="/app" className="btn btn-forest btn-lg">
            {t('Unirme gratis', 'Join for free')}
          </a>
        </div>
      </div>
    </section>
  )
}
