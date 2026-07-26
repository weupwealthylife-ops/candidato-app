'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'rgba(234,100,64,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', color: 'var(--coral)', fontWeight: 700, marginBottom: '1.25rem',
          }}>!</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 .5rem' }}>
            Algo salió mal
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-60)', margin: '0 0 1.5rem', maxWidth: 360 }}>
            Ocurrió un error inesperado. Intentá recargar la página.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            style={{
              background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 8,
              padding: '.65rem 1.4rem', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
