'use client'

import { useLang } from '@/lib/LangContext'

const PLANS = [
  {
    qty: 1,
    price: '300.000',
    label: { es: '1 vacante', en: '1 listing' },
    badge: null,
    features: {
      es: ['Matching inteligente con IA', 'Candidatos preseleccionados', 'Score de compatibilidad', 'Activa por 1 mes', 'Soporte por WhatsApp'],
      en: ['AI-powered smart matching', 'Pre-screened candidates', 'Compatibility score', 'Active for 1 month', 'WhatsApp support'],
    },
    featured: false,
    cta: { es: 'Publicar vacante →', en: 'Post a listing →' },
  },
  {
    qty: 2,
    price: '500.000',
    label: { es: '2 vacantes', en: '2 listings' },
    badge: { es: 'Más popular', en: 'Most popular' },
    features: {
      es: ['Todo lo de 1 vacante', 'Segunda vacante con descuento', '2 × matching automático', 'Resultados en 24 h', 'Ahorrás $100.000 COP'],
      en: ['Everything in 1 listing', 'Second listing at a discount', '2× automatic matching', 'Results in 24 h', 'Save $100,000 COP'],
    },
    featured: true,
    cta: { es: 'Publicar 2 vacantes →', en: 'Post 2 listings →' },
  },
  {
    qty: 3,
    price: '700.000',
    label: { es: '3 vacantes', en: '3 listings' },
    badge: null,
    features: {
      es: ['Todo lo de 2 vacantes', 'Tercera vacante incluida', 'Prioridad en soporte', 'Acceso a candidatos Top 1%', 'Ahorrás $200.000 COP'],
      en: ['Everything in 2 listings', 'Third listing included', 'Priority support', 'Access to Top 1% candidates', 'Save $200,000 COP'],
    },
    featured: false,
    cta: { es: 'Publicar 3 vacantes →', en: 'Post 3 listings →' },
  },
]

export default function Pricing() {
  const { t, lang } = useLang()

  return (
    <section id="pricing">
      <div className="pricing-head">
        <span className="sec-eye">{t('Para empresas', 'For companies')}</span>
        <h2 className="sec-h2">{t('Empezá gratis. Escalá cuando estés listo.', 'Start free. Scale when you\'re ready.')}</h2>
        <p className="sec-sub" style={{ margin: '.5rem auto 0' }}>
          {t(
            'Publicá una señal gratuita o activá el matching automático con IA para encontrar los candidatos más compatibles.',
            'Post a free signal or activate AI automatic matching to find the most compatible candidates.',
          )}
        </p>
      </div>

      {/* Free tier banner */}
      <div style={{ maxWidth: 900, margin: '0 auto 2rem', border: '2px dashed var(--forest)', borderRadius: 16, padding: '1.6rem 2rem', background: 'rgba(27,59,62,.03)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--forest)', background: 'rgba(27,59,62,.08)', borderRadius: 20, padding: '2px 10px' }}>
              {t('Gratis', 'Free')}
            </span>
            <span style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>
              {t('Señal gratuita', 'Free signal')}
            </span>
          </div>
          <p style={{ fontSize: '.84rem', color: 'var(--ink-70)', margin: 0, lineHeight: 1.55, maxWidth: 480 }}>
            {t(
              'Publicá tu vacante en el feed público sin costo. Los candidatos pueden verla y postularse. Sin matching automático por IA.',
              'Post your listing in the public feed at no cost. Candidates can view and apply. No automatic AI matching.',
            )}
          </p>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', marginTop: '.7rem' }}>
            {[
              t('✓ Aparece en el feed público', '✓ Appears in the public feed'),
              t('✓ Candidatos pueden postularse', '✓ Candidates can apply'),
              t('✓ Sin tarjeta de crédito', '✓ No credit card'),
            ].map(f => (
              <span key={f} style={{ fontSize: '.78rem', color: 'var(--forest)', fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
        <a href="/app" className="btn btn-outline" style={{ whiteSpace: 'nowrap', fontWeight: 700, borderColor: 'var(--forest)', color: 'var(--forest)' }}>
          {t('Publicar señal gratis →', 'Post free signal →')}
        </a>
      </div>

      <div className="pgrid">
        {PLANS.map(plan => (
          <div key={plan.qty} className={`pc${plan.featured ? ' feat' : ''}`}>
            {plan.badge && (
              <div className="pce">{t(plan.badge.es, plan.badge.en)}</div>
            )}
            {!plan.badge && <div style={{ height: '1.1rem' }} />}
            <div className="pcn">{t(plan.label.es, plan.label.en)}</div>
            <div className="pca">
              <sup>$</sup>{plan.price}
              <span> COP</span>
            </div>
            <div className="pcd" />
            <ul className="pcf">
              {(lang === 'es' ? plan.features.es : plan.features.en).map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a
              href="/app"
              className={plan.featured ? 'btn btn-coral' : 'btn btn-outline'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {t(plan.cta.es, plan.cta.en)}
            </a>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.8rem', color: 'var(--ink-45)' }}>
        {t(
          '¿Más de 3 vacantes o necesitás un plan enterprise? ',
          'More than 3 listings or need an enterprise plan? ',
        )}
        <a
          href="https://wa.me/573205046723?text=Hola%2C%20vengo%20de%20candidato.com.co%20y%20me%20interesa%20un%20plan%20enterprise"
          style={{ color: 'var(--forest)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Hablemos por WhatsApp →', 'Let\'s talk on WhatsApp →')}
        </a>
      </p>
    </section>
  )
}
