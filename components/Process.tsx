const STEPS = [
  {
    n: '01',
    t: 'Registrá tu perfil',
    d: 'Tus datos, habilidades y preferencias. Solo 3 minutos. Gratis.',
  },
  {
    n: '02',
    t: 'La IA analiza tu perfil',
    d: 'Nuestro algoritmo cruza tu información con cientos de vacantes activas en tiempo real.',
  },
  {
    n: '03',
    t: 'Encontramos tus matches',
    d: 'Seleccionamos las ofertas con mayor compatibilidad: habilidades, ubicación y expectativas.',
  },
  {
    n: '04',
    t: 'Recibís tu match por email',
    d: 'Un email personalizado con tus mejores oportunidades. Sin spam. Solo lo que importa.',
  },
]

export default function Process() {
  return (
    <section id="process">
      <div className="process-inner">
        <div className="process-hd">
          <span className="sec-eye">El proceso</span>
          <h2 className="sec-h2 wh">De cero a match en 4 pasos.</h2>
          <p
            className="sec-sub wh"
            style={{ margin: '.6rem auto 0', textAlign: 'center' }}
          >
            Diseñado para ser ágil, preciso y completamente humano.
          </p>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step in" key={s.n}>
              <div className="step-n">{s.n}</div>
              <div className="step-t">{s.t}</div>
              <div className="step-d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
