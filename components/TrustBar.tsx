const CHIPS = [
  { i: 'DS', n: 'Daniela Salcedo', bg: '#EA6440' },
  { i: 'HP', n: 'helppeople', bg: '#1B3B3E' },
  { i: 'EPI', n: 'EPI', bg: '#2D6B70' },
  { i: 'AG', n: 'Agroup', bg: '#264D51' },
  { i: 'OH', n: 'Oh Honey', bg: '#F0A070' },
  { i: 'AS', n: 'Asecoemg', bg: '#3A6B6E' },
  { i: 'PP', n: 'Panela Palestina', bg: '#8B5E3C' },
  { i: 'AF', n: 'Antojos Frutales', bg: '#6B8E44' },
  { i: 'FR', n: 'Frat', bg: '#1B3B3E' },
]

export default function TrustBar() {
  const all = [...CHIPS, ...CHIPS]
  return (
    <>
      <div className="trust-bar">
        <span className="trust-lbl">
          Confían en
          <br />
          nosotros
        </span>
        <div className="trust-sep"></div>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {all.map((c, idx) => (
              <div className="logo-chip" key={idx}>
                <div className="logo-init" style={{ background: c.bg }}>
                  {c.i}
                </div>
                <span className="logo-name">{c.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6,
          background: 'linear-gradient(to bottom,var(--white),#1a4a4d)',
          display: 'block',
          margin: 0,
          padding: 0,
          lineHeight: 0,
        }}
      ></div>
    </>
  )
}
