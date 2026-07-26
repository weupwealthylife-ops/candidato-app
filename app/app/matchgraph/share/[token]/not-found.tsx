export default function ShareNotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--body)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        background: '#1B3B3E',
        borderRadius: 12,
        padding: '22px 32px',
        marginBottom: '2.5rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bird-logo.png" alt="Candidato®" width={28} height={28} style={{ borderRadius: 5 }} />
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-.01em', fontFamily: 'var(--head)' }}>
          Candidato®
        </span>
      </div>

      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(234,100,64,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1.3rem', color: '#EA6440',
        marginBottom: '1.25rem',
      }}>!</div>

      <h1 style={{ fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.3rem', color: '#0E1E20', margin: '0 0 .5rem', letterSpacing: '-.02em' }}>
        Enlace no disponible
      </h1>
      <p style={{ fontSize: '.88rem', color: '#6a8a8a', margin: '0 0 2rem', maxWidth: 360, lineHeight: 1.6 }}>
        Este enlace no existe o ya venció. Si creés que es un error, contactá a tu consultor de Candidato®.
      </p>

      <a
        href={`mailto:candidatojobs@gmail.com?subject=Enlace de evaluación vencido`}
        style={{
          display: 'inline-block',
          background: '#1B3B3E',
          color: '#fff',
          borderRadius: 10,
          padding: '11px 24px',
          fontSize: '.85rem',
          fontWeight: 700,
          textDecoration: 'none',
          fontFamily: 'var(--body)',
        }}
      >
        Contactar al equipo
      </a>
    </div>
  )
}
