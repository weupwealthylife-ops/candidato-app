export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-l">
        <span className="hero-eyebrow">Matching inteligente · Colombia</span>
        <h1 className="hero-h1">
          <span>La conexión</span>
          <br />
          <span className="accent">que estaba</span>
          <br />
          <span>destinada.</span>
        </h1>
        <p className="hero-sub">
          Candidato conecta el perfil correcto con la vacante correcta. Solo las
          oportunidades que realmente importan — directo a tu email.
        </p>
        <div className="hero-actions">
          <a href="/app" className="btn btn-forest btn-xl">
            Crear mi perfil gratis
          </a>
          <a href="#process" className="btn btn-outline btn-xl">
            Cómo funciona
          </a>
        </div>
        <div className="hero-stats" id="heroStats">
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">+2.400</div>
            <div className="stat-l">CVs procesados</div>
          </div>
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">80%</div>
            <div className="stat-l">Tasa de match</div>
          </div>
          <div className="stat-item in">
            <div className="stat-bar"></div>
            <div className="stat-n">−90%</div>
            <div className="stat-l">Costo de contratar</div>
          </div>
        </div>
      </div>

      <div className="hero-r">
        <div className="hero-r-fade"></div>
        <div className="phone-pill top">✅ <span>Match encontrado</span></div>
        <div className="iphone-wrap">
          <div className="iphone">
            <div className="iphone-notch"></div>
            <div className="iphone-screen">
              <div className="iphone-status">
                <span>9:41</span>
                <span>●●●</span>
              </div>
              <div className="iphone-app">
                <div className="app-greeting">Buenos días,</div>
                <div className="app-name">Ana ✦</div>
                <div className="phone-card">
                  <div className="phone-card-head">
                    <span className="phone-card-title">Tus mejores matches</span>
                    <span className="phone-badge">3 nuevos</span>
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
                      <div className="phone-co">Mango · Remoto</div>
                    </div>
                    <span className="phone-pct">81%</span>
                  </div>
                  <div className="phone-email">
                    <span className="phone-email-ico">📧</span>
                    <div>
                      <div className="phone-email-title">Email enviado</div>
                      <div className="phone-email-sub">Revisá tu bandeja</div>
                    </div>
                  </div>
                </div>
                <div className="phone-insight">
                  <div className="insight-label">IA INSIGHT</div>
                  <div className="insight-text">
                    <span>Salvaste </span>
                    <strong>34% esta semana</strong>
                    <span> — por encima del promedio!</span>
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
