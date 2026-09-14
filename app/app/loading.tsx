export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bird-logo.png"
          alt="Cargando…"
          width={36}
          height={36}
          style={{ objectFit: 'contain', opacity: .4, animation: 'pulse 1.4s ease-in-out infinite' }}
        />
        <style>{`@keyframes pulse{0%,100%{opacity:.25}50%{opacity:.6}}`}</style>
        <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'rgba(14,30,32,.3)', letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>
          Cargando…
        </p>
      </div>
    </div>
  )
}
