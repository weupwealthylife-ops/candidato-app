'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

type ServiceTab = 'matching' | 'preseleccion'

const MATCHING_PLANS = [
  {
    qty: 1,
    price: '300.000',
    label: { es: '1 vacante', en: '1 listing' },
    badge: null,
    features: {
      es: ['Matching inteligente', 'Candidatos preseleccionados', 'Score de compatibilidad', 'Activa por 1 mes', 'Soporte por WhatsApp'],
      en: ['Smart matching', 'Pre-screened candidates', 'Compatibility score', 'Active for 1 month', 'WhatsApp support'],
    },
    featured: false,
    cta: { es: 'Publicar vacante', en: 'Post a listing' },
    href: '/app',
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
    cta: { es: 'Publicar 2 vacantes', en: 'Post 2 listings' },
    href: '/app',
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
    cta: { es: 'Publicar 3 vacantes', en: 'Post 3 listings' },
    href: '/app',
  },
]

const PRESELECCION_PLANS = [
  {
    qty: 1,
    price: '800.000',
    priceSuffix: { es: '/mes', en: '/mo' },
    label: { es: '1 vacante · por mes', en: '1 listing · per month' },
    badge: null,
    features: {
      es: [
        'Validación completa de perfil',
        'Verificación de experiencia laboral',
        'Evaluación de conocimientos del área',
        'Verificación de entorno y referencias',
        'Top 5 candidatos ideales entregados',
        'Soporte dedicado por WhatsApp',
      ],
      en: [
        'Full profile validation',
        'Work experience verification',
        'Area knowledge assessment',
        'Background & reference check',
        'Top 5 ideal candidates delivered',
        'Dedicated WhatsApp support',
      ],
    },
    featured: false,
    cta: { es: 'Contratar servicio', en: 'Get started' },
    href: 'https://wa.me/573205046723?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20Preselección%20y%20Validación%20para%201%20vacante%20en%20candidato.com.co',
  },
  {
    qty: 2,
    price: '1.400.000',
    priceSuffix: { es: '/mes', en: '/mo' },
    label: { es: '2 vacantes · por mes', en: '2 listings · per month' },
    badge: { es: 'Más popular', en: 'Most popular' },
    features: {
      es: [
        'Todo lo de 1 vacante',
        'Segunda vacante con descuento',
        'Top 5 candidatos por vacante',
        'Informe comparativo de perfiles',
        'Entrega en 48 h hábiles',
        'Ahorrás $200.000 COP',
      ],
      en: [
        'Everything in 1 listing',
        'Second listing at a discount',
        'Top 5 candidates per listing',
        'Comparative profile report',
        'Delivery in 48 business hours',
        'Save $200,000 COP',
      ],
    },
    featured: true,
    cta: { es: 'Contratar 2 vacantes', en: 'Get 2 listings' },
    href: 'https://wa.me/573205046723?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20Preselección%20y%20Validación%20para%202%20vacantes%20en%20candidato.com.co',
  },
  {
    qty: 3,
    price: '2.400.000',
    priceSuffix: { es: '/mes', en: '/mo' },
    label: { es: '3 vacantes · por mes', en: '3 listings · per month' },
    badge: null,
    features: {
      es: [
        'Todo lo de 2 vacantes',
        'Tercera vacante incluida',
        'Prioridad en entrega',
        'Acceso a candidatos Top 1%',
        'Reemplazo gratuito si no hay match',
        'Ahorrás $600.000 COP',
      ],
      en: [
        'Everything in 2 listings',
        'Third listing included',
        'Priority delivery',
        'Access to Top 1% candidates',
        'Free replacement if no match',
        'Save $600,000 COP',
      ],
    },
    featured: false,
    cta: { es: 'Contratar 3 vacantes', en: 'Get 3 listings' },
    href: 'https://wa.me/573205046723?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20Preselección%20y%20Validación%20para%203%20vacantes%20en%20candidato.com.co',
  },
]

export default function Pricing() {
  const { t, lang } = useLang()
  const [tab, setTab] = useState<ServiceTab>('matching')

  const plans = tab === 'matching' ? MATCHING_PLANS : PRESELECCION_PLANS

  return (
    <section id="pricing">
      <div className="pricing-head">
        <span className="sec-eye">{t('Para empresas', 'For companies')}</span>
        <h2 className="sec-h2">{t('Empezá gratis. Escalá cuando estés listo.', 'Start free. Scale when you\'re ready.')}</h2>
        <p className="sec-sub" style={{ margin: '.5rem auto 0' }}>
          {t(
            'Publicá una vacante gratuita, activá el matching o delegá la preselección completa a nuestro equipo.',
            'Post a free listing, activate matching, or delegate full candidate screening to our team.',
          )}
        </p>
      </div>

      {/* Service toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(27,59,62,.06)', borderRadius: 14, padding: 5, gap: 4 }}>
          <button
            onClick={() => setTab('matching')}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 10,
              padding: '10px 24px', fontSize: '.84rem', fontWeight: 700,
              fontFamily: 'inherit', transition: 'all .18s',
              background: tab === 'matching' ? 'var(--forest)' : 'transparent',
              color: tab === 'matching' ? 'white' : 'var(--ink-70)',
              boxShadow: tab === 'matching' ? '0 2px 8px rgba(27,59,62,.25)' : 'none',
            }}
          >
            {t('✦ Matching', '✦ Matching')}
          </button>
          <button
            onClick={() => setTab('preseleccion')}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 10,
              padding: '10px 24px', fontSize: '.84rem', fontWeight: 700,
              fontFamily: 'inherit', transition: 'all .18s',
              background: tab === 'preseleccion' ? 'var(--forest)' : 'transparent',
              color: tab === 'preseleccion' ? 'white' : 'var(--ink-70)',
              boxShadow: tab === 'preseleccion' ? '0 2px 8px rgba(27,59,62,.25)' : 'none',
            }}
          >
            {t('⬡ Preselección & Validación', '⬡ Screening & Validation')}
          </button>
        </div>
      </div>

      {/* Contextual info card — consistent structure for both tabs */}
      <div style={{ maxWidth: 900, margin: '0 auto 2rem' }}>
        {tab === 'matching' ? (
          /* Free tier card */
          <div style={{
            borderRadius: 18, padding: '1.6rem 2rem',
            background: 'linear-gradient(135deg, rgba(27,59,62,.04) 0%, rgba(27,59,62,.08) 100%)',
            border: '1.5px solid rgba(27,59,62,.18)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.55rem' }}>
                <span style={{ fontSize: '.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'white', background: 'var(--forest)', borderRadius: 20, padding: '3px 10px' }}>
                  {t('Gratis', 'Free')}
                </span>
                <span style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--forest)', letterSpacing: '-.02em' }}>
                  {t('Vacante gratuita', 'Free listing')}
                </span>
              </div>
              <p style={{ fontSize: '.84rem', color: 'var(--ink-70)', margin: '0 0 .75rem', lineHeight: 1.6, maxWidth: 500 }}>
                {t(
                  'Publicá tu vacante en el feed público sin costo. Los candidatos pueden verla y postularse directamente.',
                  'Post your listing in the public feed at no cost. Candidates can view and apply directly.',
                )}
              </p>
              <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap' }}>
                {[
                  t('✓ Feed público', '✓ Public feed'),
                  t('✓ Postulaciones directas', '✓ Direct applications'),
                  t('✓ Sin tarjeta', '✓ No card needed'),
                  t('✓ Sin límite de tiempo', '✓ No time limit'),
                ].map(f => (
                  <span key={f} style={{ fontSize: '.77rem', color: 'var(--forest)', fontWeight: 700 }}>{f}</span>
                ))}
              </div>
            </div>
            <a href="/app" style={{
              whiteSpace: 'nowrap', fontWeight: 700, fontSize: '.84rem',
              background: 'var(--forest)', color: 'white',
              borderRadius: 10, padding: '11px 22px', textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(27,59,62,.2)',
              transition: 'opacity .15s',
            }}>
              {t('Publicar vacante gratis', 'Post free listing')}
            </a>
          </div>
        ) : (
          /* Preselección info card — forest colors */
          <div style={{
            borderRadius: 18, padding: '1.6rem 2rem',
            background: 'linear-gradient(135deg, rgba(27,59,62,.04) 0%, rgba(27,59,62,.09) 100%)',
            border: '1.5px solid rgba(27,59,62,.18)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', justifyContent: 'space-between',
          }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', marginBottom: '.55rem' }}>
                <span style={{ fontSize: '.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'white', background: 'var(--forest)', borderRadius: 20, padding: '3px 10px' }}>
                  {t('Servicio premium', 'Premium')}
                </span>
                <span style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--forest)', letterSpacing: '-.02em' }}>
                  {t('Nosotros validamos, vos decidís.', 'We validate, you decide.')}
                </span>
              </div>
              <p style={{ fontSize: '.84rem', color: 'var(--ink-70)', margin: '0 0 .75rem', lineHeight: 1.6, maxWidth: 500 }}>
                {t(
                  'Nuestro equipo valida candidatos: perfil, experiencia, conocimientos y entorno. Te entregamos los top 5 listos para entrevistar — con su Match Graph personalizado.',
                  'Our team validates candidates: profile, experience, knowledge, and background. We deliver the top 5 ready to interview — with their personalized Match Graph.',
                )}
              </p>
              <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap', marginBottom: '.7rem' }}>
                {[
                  t('✓ Validación completa', '✓ Full validation'),
                  t('✓ Top 5 candidatos', '✓ Top 5 candidates'),
                  t('✓ Entrega en 48h', '✓ 48h delivery'),
                  t('✓ Reemplazo sin costo', '✓ Free replacement'),
                ].map(f => (
                  <span key={f} style={{ fontSize: '.77rem', color: 'var(--forest)', fontWeight: 700 }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', flexShrink: 0 }}>
              <a
                href="https://wa.me/573205046723?text=Hola%2C%20me%20interesa%20el%20servicio%20de%20Preselección%20y%20Validación%20de%20candidato.com.co"
                target="_blank" rel="noopener noreferrer"
                style={{
                  whiteSpace: 'nowrap', fontWeight: 700, fontSize: '.84rem',
                  background: 'var(--forest)', color: 'white',
                  borderRadius: 10, padding: '11px 22px', textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(27,59,62,.2)',
                  transition: 'opacity .15s', textAlign: 'center',
                }}
              >
                {t('Consultar servicio', 'Inquire about service')}
              </a>
              <a
                href="/app/matchgraph"
                style={{
                  whiteSpace: 'nowrap', fontWeight: 700, fontSize: '.82rem',
                  background: 'transparent', color: 'var(--forest)',
                  borderRadius: 10, padding: '10px 22px', textDecoration: 'none',
                  border: '1.5px solid rgba(27,59,62,.3)',
                  transition: 'all .15s', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
                }}
              >
                <span style={{ fontSize: '.85rem' }}>⬡</span>
                {t('Ver Match Graph', 'View Match Graph')}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="pgrid">
        {plans.map(plan => (
          <div key={plan.qty} className={`pc${plan.featured ? ' feat' : ''}`}>
            {plan.badge && (
              <div className="pce">{t(plan.badge.es, plan.badge.en)}</div>
            )}
            {!plan.badge && <div style={{ height: '1.1rem' }} />}
            <div className="pcn">{t(plan.label.es, plan.label.en)}</div>
            <div className="pca">
              <sup>$</sup>{plan.price}
              {(() => {
                const suffix = 'priceSuffix' in plan ? (plan.priceSuffix as { es: string; en: string }) : null
                return suffix ? (
                  <span style={{ fontSize: '.9rem', fontWeight: 600, opacity: .7, marginLeft: 2 }}>
                    {lang === 'es' ? suffix.es : suffix.en}
                  </span>
                ) : null
              })()}
              <span> COP</span>
            </div>
            <div className="pcd" />
            <ul className="pcf">
              {(lang === 'es' ? plan.features.es : plan.features.en).map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={plan.featured ? 'btn btn-coral' : 'btn btn-outline'}
              style={{ width: '100%', justifyContent: 'center' }}
              {...(plan.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {t(plan.cta.es, plan.cta.en)}
            </a>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.8rem', color: 'var(--ink-45)' }}>
        {tab === 'matching' ? (
          <>
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
              {t('Hablemos por WhatsApp', 'Let\'s talk on WhatsApp')}
            </a>
          </>
        ) : (
          <>
            {t(
              '¿Tenés más de 3 vacantes o querés una demo? ',
              'More than 3 roles or want a demo? ',
            )}
            <a
              href="https://wa.me/573205046723?text=Hola%2C%20me%20interesa%20una%20demo%20del%20servicio%20de%20Preselección%20de%20candidato.com.co"
              style={{ color: 'var(--forest)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Solicitá una demo', 'Request a demo')}
            </a>
          </>
        )}
      </p>
    </section>
  )
}
