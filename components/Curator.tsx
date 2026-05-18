'use client'

import { useLang } from '@/lib/LangContext'

export default function Curator() {
  const { t } = useLang()

  const JOBS = [
    {
      bg: '#e8f5ff',
      ico: '🏢',
      title: 'Senior UX Designer',
      meta: `Rappi · Bogotá · ${t('Remoto', 'Remote')}`,
      tags: ['Figma', 'Design Systems', '$8–12M'],
      match: `96% ${t('match', 'match')}`,
      time: t('Hace 2h', '2h ago'),
      top: true,
    },
    {
      bg: '#fff3e0',
      ico: '🏦',
      title: 'Product Manager',
      meta: `Bancolombia · Medellín · ${t('Híbrido', 'Hybrid')}`,
      tags: ['Roadmaps', 'Agile', '$10–15M'],
      match: `88% ${t('match', 'match')}`,
      time: t('Hace 5h', '5h ago'),
      top: false,
    },
    {
      bg: '#f3e8ff',
      ico: '🎨',
      title: 'Brand Designer',
      meta: `Mango · Cali · ${t('Presencial', 'On-site')}`,
      tags: ['Branding', 'Motion', '$6–9M'],
      match: `81% ${t('match', 'match')}`,
      time: t('Ayer', 'Yesterday'),
      top: false,
    },
  ]

  return (
    <section id="curator">
      <div className="curator-inner">
        <div className="curator-split">
          <div className="curator-copy">
            <span className="sec-eye">
              {t('Talento curado · Acceso exclusivo', 'Curated talent · Exclusive access')}
            </span>
            <h2 className="sec-h2">
              {t('El top 1%', 'The top 1%')}
              <br />
              {t('de esta semana.', 'of this week.')}
            </h2>
            <p className="sec-sub">
              {t(
                'Cada semana curámos los perfiles de mayor compatibilidad. Las empresas Pro acceden antes que nadie.',
                'Every week we curate the highest-compatibility profiles. Pro companies get access before anyone else.',
              )}
            </p>
            <div className="curator-gate" style={{ marginTop: '1.5rem' }}>
              <div className="gate-badge">
                <span>{t('Solo empresas Pro', 'Pro companies only')}</span>
              </div>
              <div className="gate-title">
                {t(
                  'Accedé al top 1% antes que la competencia.',
                  'Access the top 1% before the competition.',
                )}
              </div>
              <div className="gate-sub">
                {t(
                  'Los mejores perfiles se mueven rápido. Acceso prioritario cada lunes.',
                  'The best profiles move fast. Priority access every Monday.',
                )}
              </div>
              <a
                href="https://wa.me/573205046723"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-forest btn-lg"
                style={{ marginTop: '.8rem' }}
              >
                {t('Hablar con asesor →', 'Talk to an advisor →')}
              </a>
            </div>
          </div>

          {/* Mac mockup */}
          <div className="mac-wrap">
            <div className="mac-outer">
              <div className="mac-topbar">
                <div className="mac-dot red"></div>
                <div className="mac-dot yel"></div>
                <div className="mac-dot grn"></div>
                <div className="mac-addr">candidato.com.co/dashboard/talent</div>
              </div>
              <div className="mac-screen">
                <div className="mac-app-header">
                  <div className="mac-app-logo">
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg,var(--forest),var(--coral))',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span>Candidato®</span>
                  </div>
                  <div className="mac-nav-tabs">
                    <span className="mac-tab active">{t('Buscar trabajo', 'Find jobs')}</span>
                    <span className="mac-tab">{t('Mis matches', 'My matches')}</span>
                    <span className="mac-tab">{t('Mi perfil', 'My profile')}</span>
                  </div>
                  <div className="mac-avatar">AN</div>
                </div>
                <div className="mac-search-section">
                  <div className="mac-search-bar">
                    <span className="mac-search-ico">🔍</span>
                    <div className="mac-search-input">
                      <span className="mac-search-hint">
                        {t('Cargo, habilidad o empresa…', 'Role, skill or company…')}
                      </span>
                      <span className="mac-search-cursor"></span>
                    </div>
                    <div className="mac-search-filters">
                      <span className="mac-filter-chip">Cali ×</span>
                      <span className="mac-filter-chip">{t('Remoto', 'Remote')} ×</span>
                      <span className="mac-filter-chip">UX ×</span>
                    </div>
                    <button className="mac-search-btn">{t('Buscar', 'Search')}</button>
                  </div>
                  <div className="mac-search-meta">
                    {t(
                      '247 vacantes activas · Ordenadas por compatibilidad IA',
                      '247 active jobs · Sorted by AI compatibility',
                    )}
                  </div>
                </div>
                <div className="mac-jobs-list">
                  {JOBS.map((j, idx) => (
                    <div key={idx} className={`mac-job-card${j.top ? ' mac-job-featured' : ''}`}>
                      <div className="mac-job-left">
                        <div className="mac-co-logo" style={{ background: j.bg }}>{j.ico}</div>
                        <div>
                          <div className="mac-job-title">{j.title}</div>
                          <div className="mac-job-meta">{j.meta}</div>
                          <div className="mac-job-tags">
                            {j.tags.map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                        </div>
                      </div>
                      <div className="mac-job-right">
                        <div className={`mac-match-pill${j.top ? ' mac-match-top' : ''}`}>
                          {j.match}
                        </div>
                        <div className="mac-job-time">{j.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mac-status-bar">
                  <span>
                    ✅ <span>{t('Tu perfil está activo · Recibirás matches por email', 'Your profile is active · You will receive matches by email')}</span>
                  </span>
                  <span className="mac-status-ai">
                    ⚡ <span>{t('IA analizando 12 nuevas vacantes…', 'AI analysing 12 new jobs…')}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mac-stand"></div>
            <div className="mac-base"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
