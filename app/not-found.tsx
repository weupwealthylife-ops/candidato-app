import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada — Candidato®',
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem max(5vw,24px)',
      fontFamily: 'var(--font-instrument, system-ui)',
      textAlign: 'center',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bird-logo.png" alt="Candidato" width={48} height={48} style={{ objectFit: 'contain', opacity: .35, marginBottom: '1.5rem' }} />

      <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#EA6440', marginBottom: '.5rem' }}>
        Error 404
      </p>
      <h1 style={{
        fontFamily: 'var(--font-sora, system-ui)',
        fontSize: 'clamp(1.8rem,5vw,2.6rem)',
        fontWeight: 800,
        color: '#0E1E20',
        margin: '0 0 .75rem',
        letterSpacing: '-.03em',
        lineHeight: 1.1,
      }}>
        Esta página no existe
      </h1>
      <p style={{ fontSize: '.9rem', color: 'rgba(14,30,32,.5)', maxWidth: 380, lineHeight: 1.6, margin: '0 0 2rem' }}>
        La URL que buscás no existe o fue movida. Podés volver al inicio o revisar si el enlace está bien escrito.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          background: '#1B3B3E', color: 'white', borderRadius: 10,
          padding: '11px 24px', fontSize: '.875rem', fontWeight: 700,
          textDecoration: 'none', minHeight: 44,
        }}>
          Ir al inicio
        </Link>
        <Link href="/app" style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          background: 'white', color: '#1B3B3E', borderRadius: 10,
          padding: '11px 24px', fontSize: '.875rem', fontWeight: 600,
          textDecoration: 'none', border: '1.5px solid rgba(14,30,32,.12)', minHeight: 44,
        }}>
          Abrir la app
        </Link>
      </div>
    </div>
  )
}
