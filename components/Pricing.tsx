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
        <h2 className="sec-h2">{t('Pago único. Sin suscripción.', 'One-time payment. No subscription.')}</h2>
        <p className="sec-sub" style={{ margin: '.5rem auto 0' }}>
          {t(
            'Publicá una o varias vacantes y el algoritmo identificará los candidatos más compatibles automáticamente.',
            'Post one or more listings and our algorithm automatically identifies the most compatible candidates.',
          )}
        </p>
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
          href="https://wa.me/573205046723"
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
