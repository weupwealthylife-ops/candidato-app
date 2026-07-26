'use client'

import { useState, KeyboardEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type UserType = 'candidate' | 'company'
type Phase = 'gate' | 'sent' | 'new-user'

const FOREST = '#1B3B3E'
const CORAL = '#EA6440'
const PALE = '#E4F0F1'
const INK = '#0E1E20'
const OFF = '#F5F4F0'

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('candidate')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('gate')
  const [error, setError] = useState('')

  const label = userType === 'candidate'
    ? { es: 'candidato', en: 'candidate' }
    : { es: 'empresa', en: 'company' }

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Ingresá un email válido')
      return
    }
    setError('')
    setLoading(true)

    try {
      const sb = createClient()

      // Check if user already exists
      const table = userType === 'candidate' ? 'candidates' : 'companies'
      const { data: existing } = await sb.from(table).select('name').ilike('email', trimmed).maybeSingle()

      if (existing?.name) {
        // Existing user → send magic link
        await sb.auth.signInWithOtp({
          email: trimmed,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
        })
        setPhase('sent')
      } else {
        // New user → redirect to /app with email pre-filled
        const url = `/app?email=${encodeURIComponent(trimmed)}&type=${userType}`
        window.location.href = url
      }
    } catch {
      setError('Error al procesar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="signup-wrap" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '420px 1fr', background: OFF }}>
      {/* Left panel — forest */}
      <div className="signup-panel-left" style={{
        background: `linear-gradient(160deg, #0d3235, #1a4a4d 40%, ${FOREST} 70%, #0f3235)`,
        padding: '3.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div>
          <Image src="/bird-logo.png" alt="Candidato" width={44} height={44} style={{ objectFit: 'contain', marginBottom: '.5rem' }} />
          <div style={{ fontFamily: 'var(--head)', fontSize: '1.1rem', fontWeight: 700, color: 'rgba(255,255,255,.9)', letterSpacing: '-.01em', marginBottom: '3rem' }}>
            Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
          </div>
          <div style={{ fontFamily: 'var(--head)', fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: '1rem' }}>
            Tu próximo paso<br />empieza aquí.
          </div>
          <p style={{ fontFamily: 'var(--body)', fontSize: '.88rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Matching inteligente entre talento y empresas en Colombia. Sin spam, solo fits reales.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
            {[
              ['⚡', 'Match en menos de 2 horas'],
              ['🎯', 'Solo vacantes que encajan con tu perfil'],
              ['🇨🇴', 'Las mejores empresas de Colombia'],
            ].map(([ico, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{ico}</span>
                <span style={{ fontFamily: 'var(--body)', fontSize: '.84rem', color: 'rgba(255,255,255,.75)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['Laura M.', 'Andrés P.', 'María F.'].map((name, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? CORAL : i === 1 ? `${FOREST}cc` : '#264D51', border: '2px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, color: '#fff', marginLeft: i > 0 ? -10 : 0, position: 'relative', zIndex: 3 - i }}>
                {name.split(' ').map(w => w[0]).join('')}
              </div>
            ))}
            <span style={{ fontFamily: 'var(--body)', fontSize: '.78rem', color: 'rgba(255,255,255,.55)', alignSelf: 'center', paddingLeft: '.25rem' }}>+500 ya encontraron su match</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {phase === 'gate' && (
            <>
              <h1 style={{ fontFamily: 'var(--head)', fontSize: '1.7rem', fontWeight: 700, color: INK, marginBottom: '.5rem', lineHeight: 1.2 }}>
                Entrá a Candidato<sup style={{ fontSize: '.5em' }}>®</sup>
              </h1>
              <p style={{ fontFamily: 'var(--body)', fontSize: '.9rem', color: '#6a8a8a', marginBottom: '2rem', lineHeight: 1.6 }}>
                ¿Primera vez? Te registramos al instante. ¿Ya tenés cuenta? Te mandamos un link mágico.
              </p>

              {/* Type toggle */}
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6a8a8a', marginBottom: '.6rem', fontFamily: 'var(--body)' }}>
                  Ingresá como
                </div>
                <div style={{ display: 'flex', background: '#f0f0ed', borderRadius: 10, padding: 4, gap: 4 }}>
                  {(['candidate', 'company'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setUserType(t)}
                      style={{
                        flex: 1, padding: '.75rem', borderRadius: 7, border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--body)', fontWeight: 600, fontSize: '.85rem', transition: 'all .15s',
                        background: userType === t ? '#fff' : 'transparent',
                        color: userType === t ? FOREST : '#6a8a8a',
                        boxShadow: userType === t ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                      }}
                    >
                      {t === 'candidate' ? '👤 Candidato' : '🏢 Empresa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6a8a8a', marginBottom: '.5rem', fontFamily: 'var(--body)' }}>
                  Tu email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={onKey}
                  placeholder={`tucorreo@ejemplo.com`}
                  autoFocus
                  style={{
                    width: '100%', padding: '.85rem 1rem', borderRadius: 10, border: `1.5px solid ${error ? CORAL : '#d8e0e1'}`,
                    fontFamily: 'var(--body)', fontSize: '.95rem', color: INK, background: '#fff', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color .15s',
                  }}
                />
                {error && <p style={{ fontFamily: 'var(--body)', fontSize: '.78rem', color: CORAL, marginTop: '.4rem', marginBottom: 0 }}>{error}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '.9rem', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: FOREST, color: '#fff', fontFamily: 'var(--body)', fontWeight: 700, fontSize: '1rem',
                  opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
                }}
              >
                {loading ? 'Verificando…' : `Continuar como ${label.es} →`}
              </button>

              <p style={{ textAlign: 'center', fontFamily: 'var(--body)', fontSize: '.78rem', color: '#9aacac', marginTop: '1.25rem', lineHeight: 1.6 }}>
                Al continuar, aceptás nuestros{' '}
                <a href="/terminos" style={{ color: FOREST }}>Términos</a> y{' '}
                <a href="/privacidad" style={{ color: FOREST }}>Política de privacidad</a>.
              </p>

              <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eaeae6' }}>
                <Link href="/" style={{ fontFamily: 'var(--body)', fontSize: '.83rem', color: '#6a8a8a', textDecoration: 'none' }}>
                  ← Volver al inicio
                </Link>
              </div>
            </>
          )}

          {phase === 'sent' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: 52, marginBottom: '1.25rem' }}>📧</div>
              <h2 style={{ fontFamily: 'var(--head)', fontSize: '1.5rem', fontWeight: 700, color: INK, marginBottom: '.75rem' }}>
                Revisá tu bandeja
              </h2>
              <p style={{ fontFamily: 'var(--body)', fontSize: '.9rem', color: '#6a8a8a', lineHeight: 1.7, marginBottom: '2rem' }}>
                Te enviamos un link mágico a <strong style={{ color: INK }}>{email}</strong>. Hacé click ahí y entrarás directo a tu cuenta.
              </p>
              <div style={{ background: PALE, borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: 'var(--body)', fontSize: '.83rem', color: FOREST, margin: 0, lineHeight: 1.6 }}>
                  💡 Si no ves el email, revisá tu carpeta de spam o esperá unos segundos.
                </p>
              </div>
              <button
                onClick={() => { setPhase('gate'); setEmail('') }}
                style={{ background: 'none', border: `1.5px solid #d8e0e1`, borderRadius: 10, padding: '.7rem 1.5rem', cursor: 'pointer', fontFamily: 'var(--body)', fontSize: '.88rem', color: FOREST, fontWeight: 600 }}
              >
                ← Intentar con otro email
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .signup-wrap { grid-template-columns: 1fr !important; }
          .signup-panel-left { display: none !important; }
        }
      `}</style>
    </div>
  )
}
