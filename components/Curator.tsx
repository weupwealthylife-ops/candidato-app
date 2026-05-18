const JOBS = [
  {
    bg: '#e8f5ff',
    ico: '🏢',
    title: 'Senior UX Designer',
    meta: 'Rappi · Bogotá · Remoto',
    tags: ['Figma', 'Design Systems', '$8–12M'],
    match: '96% match',
    time: 'Hace 2h',
    top: true,
  },
  {
    bg: '#fff3e0',
    ico: '🏦',
    title: 'Product Manager',
    meta: 'Bancolombia · Medellín · Híbrido',
    tags: ['Roadmaps', 'Agile', '$10–15M'],
    match: '88% match',
    time: 'Hace 5h',
    top: false,
  },
  {
    bg: '#f3e8ff',
    ico: '🎨',
    title: 'Brand Designer',
    meta: 'Mango · Cali · Presencial',
    tags: ['Branding', 'Motion', '$6–9M'],
    match: '81% match',
    time: 'Ayer',
    top: false,
  },
]

export default function Curator() {
  return (
    <section id="curator">
      <div className="curator-inner">
        <div className="curator-split">
          <div className="curator-copy">
            <span className="sec-eye">Talento curado · Acceso exclusivo</span>
            <h2 className="sec-h2">
              El top 1%
              <br />
              de esta semana.
            </h2>
            <p className="sec-sub">
              Cada semana curámos los perfiles de mayor compatibilidad. Las
              empresas Pro acceden antes que nadie.
            </p>
            <div className="curator-gate" style={{ marginTop: '1.5rem' }}>
              <div className="gate-badge">
                <span>Solo empresas Pro</span>
              </div>
              <div className="gate-title">
                Accedé al top 1% antes que la competencia.
              </div>
              <div className="gate-sub">
                Los mejores perfiles se mueven rápido. Acceso prioritario cada
                lunes.
              </div>
              <a
                href="https://wa.me/573205046723"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-forest btn-lg"
                style={{ marginTop: '.8rem' }}
              >
                Hablar con asesor →
              </a>
            </div>
          </div>
          <div className="mac-wrap">
            <div className="mac-outer">
              <div className="mac-topbar">
                <div className="mac-dot red"></div>
                <div className="mac-dot yel"></div>
                <div className="mac-dot grn"></div>
                <div className="mac-addr">
                  candidato.com.co/dashboard/talent
                </div>
              </div>
              <div className="mac-screen">
                <div className="mac-app-header">
                  <div className="mac-app-logo">
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background:
                          'linear-gradient(135deg,var(--forest),var(--coral))',
                        display: 'inline-block',
                      }}
                    />
                    <span>Candidato®</span>
                  </div>
                  <div className="mac-nav-tabs">
                    <span className="mac-tab active">Buscar trabajo</span>
                    <span className="mac-tab">Mis matches</span>
                    <span className="mac-tab">Mi perfil</span>
                  </div>
                  <div className="mac-avatar">AN</div>
                </div>
                <div className="mac-search-section">
                  <div className="mac-search-bar">
                    <span className="mac-search-ico">🔍</span>
                    <div className="mac-search-input">
                      <span className="mac-search-hint">
                        Cargo, habilidad o empresa…
                      </span>
                      <span className="mac-search-cursor"></span>
                    </div>
                    <div className="mac-search-filters">
                      <span className="mac-filter-chip">Cali ×</span>
                      <span className="mac-filter-chip">Remoto ×</span>
                      <span className="mac-filter-chip">UX ×</span>
                    </div>
                    <button className="mac-search-btn">Buscar</button>
                  </div>
                  <div className="mac-search-meta">
                    247 vacantes activas · Ordenadas por compatibilidad IA
                  </div>
                </div>
                <div className="mac-jobs-list">
                  {JOBS.map((j, idx) => (
                    <div
                      key={idx}
                      className={`mac-job-card${j.top ? ' mac-job-featured' : ''}`}
                    >
                      <div className="mac-job-left">
                        <div
                          className="mac-co-logo"
                          style={{ background: j.bg }}
                        >
                          {j.ico}
                        </div>
                        <div>
                          <div className="mac-job-title">{j.title}</div>
                          <div className="mac-job-meta">{j.meta}</div>
                          <div className="mac-job-tags">
                            {j.tags.map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mac-job-right">
                        <div
                          className={`mac-match-pill${j.top ? ' mac-match-top' : ''}`}
                        >
                          {j.match}
                        </div>
                        <div className="mac-job-time">{j.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mac-status-bar">
                  <span>
                    ✅{' '}
                    <span>
                      Tu perfil está activo · Recibirás matches por email
                    </span>
                  </span>
                  <span className="mac-status-ai">
                    ⚡ <span>IA analizando 12 nuevas vacantes…</span>
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
