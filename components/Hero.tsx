'use client'

import { useLang } from '@/lib/LangContext'

export default function Hero() {
  const { t } = useLang()

  return (
    <section className="hero" id="hero">
      <div className="hero-l">
        <span className="hero-eyebrow">
          {t('Matching inteligente · Colombia', 'Intelligent matching · Colombia')}
        </span>
        <h1 className="hero-h1">
          <span>{t('La conexión', 'The connection')}</span>
          <br />
          <span className="accent">{t('que estaba', 'that was always')}</span>
          <br />
          <span>{t('destinada.', 'meant to be.')}</span>
        </h1>
        <p className="hero-sub">
          {t(
            'Candidato conecta el perfil correcto con la vacante correcta. Solo las oportunidades que realmente importan — directo a tu email.',
            'Candidato connects the right profile with the right role. Only the opportunities that truly matter — straight to your inbox.',
          )}
        </p>
        <div className="hero-actions">
          <a href="/app" className="btn btn-forest btn-xl">
            {t('Crear mi perfil gratis', 'Create my free profile')}
          </a>
          <a href="#process" className="btn btn-outline btn-xl">
            {t('Cómo funciona', 'How it works')}
          </a>
        </div>
        <div className="hero-stats" id="heroStats">
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">+2.400</div>
            <div className="stat-l">{t('CVs procesados', 'CVs processed')}</div>
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
