import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Candidato® — Matching inteligente de talento en Colombia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          background: '#1B3B3E',
          padding: '64px 72px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 520, height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(228,240,241,.06) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', top: 48, right: 80,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'rgba(228,240,241,.04)',
          display: 'flex',
        }} />

        {/* Coral accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 5,
          background: '#EA6440',
          display: 'flex',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'auto', paddingTop: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(228,240,241,.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 28, display: 'flex' }}>🦅</div>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(228,240,241,.7)', letterSpacing: '-.01em' }}>
            Candidato®
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontSize: 16, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
            color: '#EA6440', margin: '0 0 16px',
          }}>
            Matching inteligente de talento · Colombia
          </p>
          <h1 style={{
            fontSize: 72, fontWeight: 800, color: '#E4F0F1',
            margin: '0 0 24px', lineHeight: 1.0, letterSpacing: '-.03em',
            maxWidth: 760,
          }}>
            La conexión que estaba destinada
          </h1>
          <p style={{
            fontSize: 24, color: 'rgba(228,240,241,.55)', margin: '0 0 40px',
            lineHeight: 1.4, maxWidth: 600,
          }}>
            Conectamos el mejor talento colombiano con las empresas que más crecen. Sin spam, solo oportunidades que importan.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 48 }}>
            {[
              { n: '100%', label: 'Gratis para candidatos' },
              { n: 'Top 1%', label: 'Talento preseleccionado' },
              { n: '48h', label: 'Primer match promedio' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#E4F0F1' }}>{s.n}</span>
                <span style={{ fontSize: 14, color: 'rgba(228,240,241,.45)', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
