'use client'

import { useLang } from '@/lib/LangContext'

export default function Process() {
  const { t } = useLang()

  const STEPS = [
    {
      n: '01',
      t: t('Registrá tu perfil', 'Create your profile'),
      d: t(
        'Tus datos, habilidades y preferencias. Solo 3 minutos. Gratis.',
        'Your info, skills and preferences. Only 3 minutes. Free.',
      ),
    },
    {
      n: '02',
      t: t('El algoritmo analiza tu perfil', 'The algorithm analyses your profile'),
      d: t(
        'Nuestro algoritmo cruza tu información con cientos de vacantes activas en tiempo real.',
        'Our algorithm matches your data against hundreds of active job listings in real time.',
      ),
    },
    {
      n: '03',
      t: t('Encontramos tus matches', 'We find your matches'),
      d: t(
        'Seleccionamos las ofertas con mayor compatibilidad: habilidades, ubicación y expectativas.',
        'We select the most compatible opportunities based on skills, location and expectations.',
      ),
    },
    {
      n: '04',
      t: t('Recibís tu match por email', 'You receive your match by email'),
      d: t(
        'Un email personalizado con tus mejores oportunidades. Sin spam. Solo lo que importa.',
        'A personalised email with your best opportunities. No spam. Only what matters.',
      ),
    },
  ]

  return (
    <section id="process">
      <div className="process-inner">
        <div className="process-hd">
          <span className="sec-eye">{t('El proceso', 'The process')}</span>
          <h2 className="sec-h2 wh">{t('De cero a match en 4 pasos.', 'From zero to match in 4 steps.')}</h2>
          <p className="sec-sub wh" style={{ margin: '.6rem auto 0', textAlign: 'center' }}>
            {t(
              'Diseñado para ser ágil, preciso y completamente humano.',
              'Designed to be fast, precise and completely human.',
            )}
          </p>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step in" key={s.n}>
              <div className="step-n">{s.n}</div>
              <div className="step-t">{s.t}</div>
              <div className="step-d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
