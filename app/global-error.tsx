'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error boundary]', error)
  }, [error])

  return (
    <html lang="es">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        background: '#F5F4F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#EA6440', marginBottom: '.5rem' }}>
          Error crítico
        </p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0E1E20', margin: '0 0 .75rem' }}>
          La app no pudo cargar
        </h1>
        <p style={{ fontSize: '.875rem', color: 'rgba(14,30,32,.5)', maxWidth: 360, lineHeight: 1.6, margin: '0 0 2rem' }}>
          Ocurrió un error grave. Podés intentar recargar la página.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#1B3B3E', color: 'white', borderRadius: 10,
            padding: '11px 24px', fontSize: '.875rem', fontWeight: 700,
            border: 'none', cursor: 'pointer', minHeight: 44,
          }}
        >
          Recargar
        </button>
      </body>
    </html>
  )
}
