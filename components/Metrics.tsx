export default function Metrics() {
  return (
    <section className="sec" id="metrics" style={{ background: 'var(--cream)' }}>
      <div className="sec-inner">
        <div>
          <span className="sec-eye">Por qué Candidato</span>
          <h2 className="sec-h2">Resultados que hablan.</h2>
        </div>
        <div className="metrics-wrap">
          <div className="m-card dark in">
            <div className="m-tag">Velocidad</div>
            <div className="m-num">2–4</div>
            <div className="m-label">semanas menos de espera</div>
            <div className="m-desc">
              Reducimos el tiempo de contratación drásticamente. Menos tiempo
              buscando, más tiempo construyendo.
            </div>
          </div>
          <div className="m-card in">
            <div className="m-tag">Precisión</div>
            <div className="m-num coral">80%</div>
            <div className="m-label">tasa de match exitoso</div>
            <div className="m-desc">
              No es suerte — es tecnología. Nuestro algoritmo identifica
              compatibilidad real entre candidato y empresa.
            </div>
          </div>
          <div className="m-card in">
            <div className="m-tag">Ahorro</div>
            <div className="m-num" style={{ color: 'var(--forest)' }}>
              −90%
            </div>
            <div className="m-label">en costos de contratación</div>
            <div className="m-desc">
              Sin honorarios de agencia tradicional. Solo el talento correcto, al
              costo correcto.
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.2rem',
            padding: '1rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🇨🇴 → 🌎</span>
            <div>
              <div className="m-tag">Cobertura</div>
              <div className="m-label" style={{ marginBottom: 0 }}>
                Hecho en Colombia, para el mundo
              </div>
            </div>
          </div>
          <div className="m-wide-text">
            Nacimos en Cali con pasión. Operamos en todo el país conectando el
            mejor talento colombiano con las mejores empresas.
          </div>
          <a href="/app" className="btn btn-forest btn-lg">
            Unirme →
          </a>
        </div>
      </div>
    </section>
  )
}
