export default function Pricing() {
  return (
    <section id="pricing">
      <div className="pricing-head">
        <span className="sec-eye">Para empresas</span>
        <h2 className="sec-h2">Planes que crecen con vos.</h2>
        <p className="sec-sub" style={{ margin: '.5rem auto 0' }}>
          Accedé al talento más compatible con nuestra tecnología de matching
          inteligente.
        </p>
      </div>
      <div className="pgrid">
        <div className="pc in">
          <div className="pce">Starter</div>
          <div className="pcn">Básico</div>
          <div className="pca">
            <sup>$</sup>250K <span>/ mes</span>
          </div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>1 vacante al mes</li>
            <li>Publicación del cargo</li>
            <li>Envío de hojas de vida</li>
            <li>Soporte por WhatsApp</li>
          </ul>
          <a
            href="https://wa.me/573205046723"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Comenzar
          </a>
        </div>
        <div className="pc feat in">
          <div className="pce">Pro ✦</div>
          <div className="pcn">Profesional</div>
          <div className="pca">
            <sup>$</sup>1M <span>/ mes</span>
          </div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>2 vacantes al mes</li>
            <li>Acceso al Top 1% semanal</li>
            <li>Preselección con IA</li>
            <li>Matching inteligente</li>
            <li>Reporte de compatibilidad</li>
            <li>Asesoría personalizada</li>
          </ul>
          <a
            href="https://wa.me/573205046723"
            className="btn btn-coral"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Comenzar
          </a>
        </div>
        <div className="pc in">
          <div className="pce">Enterprise</div>
          <div className="pcn">A medida</div>
          <div className="pca" style={{ fontSize: '1.4rem' }}>
            A consultar
          </div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>Vacantes ilimitadas</li>
            <li>Dashboard dedicado</li>
            <li>API de integración</li>
            <li>SLA garantizado</li>
            <li>Account manager</li>
          </ul>
          <a
            href="https://wa.me/573205046723"
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Hablemos
          </a>
        </div>
      </div>
    </section>
  )
}
