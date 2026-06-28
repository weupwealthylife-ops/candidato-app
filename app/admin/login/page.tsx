'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const needsSecret = process.env.NEXT_PUBLIC_ADMIN_NEEDS_SECRET === 'true'

  async function login() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError('Acceso no autorizado')
      }
    } catch {
      setError('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#f4f7f7' }}>
      <div style={{ background: 'white', border: '1px solid #e8eded', borderRadius: 14, padding: '2rem 2.2rem', width: 320 }}>
        <div style={{ fontFamily: 'var(--head)', fontSize: '1.1rem', fontWeight: 700, color: '#1B3B3E', marginBottom: '.3rem' }}>Candidato® Admin</div>
        <div style={{ fontSize: '.8rem', color: '#9aacac', marginBottom: '1.4rem' }}>Sólo acceso autorizado</div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="tu@email.com"
          style={{ width: '100%', border: '1.5px solid #e8eded', borderRadius: 8, padding: '9px 11px', fontSize: '.83rem', outline: 'none', boxSizing: 'border-box', marginBottom: '.6rem' }}
        />
        {needsSecret && (
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Clave secreta"
            style={{ width: '100%', border: '1.5px solid #e8eded', borderRadius: 8, padding: '9px 11px', fontSize: '.83rem', outline: 'none', boxSizing: 'border-box', marginBottom: '.6rem' }}
          />
        )}
        {error && <div style={{ fontSize: '.78rem', color: '#c0392b', marginBottom: '.6rem' }}>{error}</div>}
        <button
          onClick={login}
          disabled={loading}
          style={{ width: '100%', background: '#1B3B3E', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.85rem', opacity: loading ? .7 : 1 }}
        >
          {loading ? 'Verificando…' : 'Ingresar →'}
        </button>
      </div>
      <a href="/" style={{ fontSize: '.75rem', color: '#9aacac', textDecoration: 'none' }}>← Volver al sitio</a>
    </div>
  )
}
