'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/LangContext'

export default function Hero() {
  const { t } = useLang()
  const [activeJobs, setActiveJobs] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setActiveJobs(d.activeJobs ?? null))
      .catch(() => {})
  }, [])

  return (
    <section className="hero" id="hero">
      <div className="hero-l">
        <span className="hero-eyebrow">
          {t('Matching inteligente · Colombia', 'Intelligent matching · Colombia')}
        </span>
        <h1 className="hero-h1">
          <span>{t('El trabajo que', 'The job your')}</span>
          <br />
          <span className="accent">{t('merece', 'talent')}</span>
          <br />
          <span>{t('tu talento.', 'deserves.')}</span>
        </h1>
        <p className="hero-sub">
          {t(
            'El algoritmo analiza tu perfil, cruza con cientos de vacantes y te notifica solo cuando hay un match real. Sin spam. Sin CVs irrelevantes.',
            'The algorithm analyses your profile, cross-references hundreds of listings, and only notifies you when there\'s a real match. No spam. No irrelevant CVs.',
          )}
        </p>
        <div className="hero-badge-row">
          <span className="hero-badge">{t('⚡ Match en 2h', '⚡ Match in 2h')}</span>
          <span className="hero-badge">{t('🎯 Solo fits reales', '🎯 Only real fits')}</span>
          <span className="hero-badge">{t('🇨🇴 Hecho en Colombia', '🇨🇴 Made in Colombia')}</span>
        </div>
        <div className="hero-actions hero-dual-cta">
          <div className="hero-cta-group">
            <div className="hero-cta-label">{t('Soy candidato', "I'm a candidate")}</div>
            <a href="/app" className="btn btn-forest btn-xl">
              {t('Crear mi perfil gratis →', 'Create my free profile →')}
            </a>
          </div>
          <div className="hero-cta-divider">{t('o', 'or')}</div>
          <div className="hero-cta-group">
            <div className="hero-cta-label">{t('Soy empresa', "I'm a company")}</div>
            <a href="/app" className="btn btn-outline btn-xl">
              {t('Publicar vacante gratis →', 'Post free listing →')}
            </a>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['👩‍💼','👨‍💻','👩‍🎨','👨‍🔬'].map((e, i) => (
              <span key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', marginLeft: i > 0 ? -8 : 0, border: '2px solid white', zIndex: 4 - i, position: 'relative' }}>{e}</span>
            ))}
          </div>
          <span style={{ fontSize: '.78rem', color: 'var(--ink-70)', lineHeight: 1.4 }}>
            <strong style={{ color: 'var(--forest)' }}>{t('+500 candidatos', '+500 candidates')}</strong> {t('ya encontraron su match', 'already found their match')}
          </span>
        </div>
        <div className="hero-stats" id="heroStats">
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">{activeJobs ? `+${activeJobs.toLocaleString('es-CO')}` : '+2.400'}</div>
            <div className="stat-l">{t('Vacantes activas', 'Active listings')}</div>
          </div>
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">80%</div>
            <div className="stat-l">{t('Tasa de match', 'Match rate')}</div>
          </div>
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">−90%</div>
            <div className="stat-l">{t('Costo de contratar', 'Cost to hire')}</div>
          </div>
        </div>

        {/* Mobile-only match preview — hidden above 900px, shown below */}
        <div className="hero-mobile-visual">
          <div className="hmv-label">
            {t('✦ Tus matches de hoy', '✦ Your matches today')}
          </div>
          <div className="hmv-card">
            {[
              { ico: '💻', job: 'Senior UX Designer', co: 'Rappi · Bogotá', pct: '96%' },
              { ico: '📊', job: 'Product Manager', co: 'Bancolombia · Medellín', pct: '88%' },
            ].map((m, i) => (
              <div key={i} className={`hmv-row${i > 0 ? ' hmv-row-sep' : ''}`}>
                <span className="hmv-ico">{m.ico}</span>
                <div className="hmv-body">
                  <div className="hmv-job">{m.job}</div>
                  <div className="hmv-co">{m.co}</div>
                </div>
                <span className="hmv-pct">{m.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-r">
        <div className="hero-r-fade"></div>
        <div className="phone-pill top">✅ <span>{t('Match encontrado', 'Match found')}</span></div>
        <div className="iphone-wrap">
          <div className="iphone">
            <div className="iphone-notch"></div>
            <div className="iphone-screen">
              <div className="iphone-status">
                <span>9:41</span>
                <span>●●●</span>
              </div>
              <div className="iphone-app">
                <div className="app-greeting">{t('Buenos días,', 'Good morning,')}</div>
                <div className="app-name">Ana ✦</div>
                <div className="phone-card">
                  <div className="phone-card-head">
                    <span className="phone-card-title">{t('Tus mejores matches', 'Your best matches')}</span>
                    <span className="phone-badge">{t('3 nuevos', '3 new')}</span>
                  </div>
                  <div className="phone-row top">
                    <div className="phone-ico">💻</div>
                    <div className="phone-body">
                      <div className="phone-job">Senior UX Designer</div>
                      <div className="phone-co">Rappi · Bogotá</div>
                    </div>
                    <span className="phone-pct">96%</span>
                  </div>
                  <div className="phone-row">
                    <div className="phone-ico">📊</div>
                    <div className="phone-body">
                      <div className="phone-job">Product Manager</div>
                      <div className="phone-co">Bancolombia · Medellín</div>
                    </div>
                    <span className="phone-pct">88%</span>
                  </div>
                  <div className="phone-row">
                    <div className="phone-ico">🎨</div>
                    <div className="phone-body">
                      <div className="phone-job">Brand Designer</div>
                      <div className="phone-co">Mango · {t('Remoto', 'Remote')}</div>
                    </div>
                    <span className="phone-pct">81%</span>
                  </div>
                  <div className="phone-email">
                    <span className="phone-email-ico">📧</span>
                    <div>
                      <div className="phone-email-title">{t('Email enviado', 'Email sent')}</div>
                      <div className="phone-email-sub">{t('Revisá tu bandeja', 'Check your inbox')}</div>
                    </div>
                  </div>
                </div>
                <div className="phone-insight">
                  <div className="insight-label">IA INSIGHT</div>
                  <div className="insight-text">
                    <span>{t('Salvaste ', 'You saved ')}</span>
                    <strong>{t('34% esta semana', '34% this week')}</strong>
                    <span>{t(' — por encima del promedio!', ' — above average!')}</span>
                  </div>
                  <div className="insight-bar">
                    <div className="insight-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
