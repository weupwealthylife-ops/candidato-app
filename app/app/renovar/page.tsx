'use client'

import { useState, useEffect } from 'react'

interface JobInfo {
  id: string
  title: string
  company_name: string
  closes_at: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function RenovarPage() {
  const [job, setJob] = useState<JobInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const [jobId, setJobId] = useState<string>('')
  const [tok, setTok] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const jid = params.get('job') || ''
    const t = params.get('tok') || ''
    const payment = params.get('payment') || null
    setJobId(jid)
    setTok(t)
    setPaymentStatus(payment)

    if (!jid || !t) {
      setError('Enlace inválido. Revisá el email que recibiste.')
      setLoading(false)
      return
    }

    fetch(`/api/renew-job?job=${encodeURIComponent(jid)}&tok=${encodeURIComponent(t)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'No se pudo cargar la vacante.')
        }
        return res.json()
      })
      .then((data) => {
        setJob(data.job)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  async function handleRenewWithPayment() {
    if (!jobId || !tok || !job) return
    setRedirecting(true)
    try {
      const res = await fetch('/api/mp-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, tok, title: job.title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear pago')
      window.location.href = data.url
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      setError(message)
      setRedirecting(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem 1rem',
    }}>
      <style>{`
        :root {
          --forest: #1B3B3E;
          --coral: #EA6440;
          --off: #F5F4F0;
          --pale: #E4F0F1;
          --ink: #0E1E20;
          --ink-70: rgba(14,30,32,.7);
          --ink-45: rgba(14,30,32,.45);
          --line: rgba(14,30,32,.1);
        }
        .rv-card {
          background: white;
          border-radius: 16px;
          border: 1px solid var(--line);
          padding: 2rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 2px 16px rgba(14,30,32,.06);
        }
        .rv-btn {
          display: block;
          width: 100%;
          background: var(--forest);
          color: white;
          border: none;
          border-radius: 10px;
          padding: .9rem 1.5rem;
          font-size: .95rem;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          font-family: Inter, system-ui, sans-serif;
          transition: background .15s;
        }
        .rv-btn:hover:not(:disabled) { background: #163032; }
        .rv-btn:disabled { opacity: .6; cursor: not-allowed; }
        .rv-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: .55rem 0;
          border-bottom: 1px solid var(--line);
          font-size: .84rem;
        }
        .rv-row:last-child { border-bottom: none; }
        .rv-label { color: var(--ink-45); font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
        .rv-value { color: var(--ink); font-weight: 600; }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--forest)', letterSpacing: '-.01em' }}>
          Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '2px' }}>
          Matching inteligente · Colombia
        </div>
      </div>

      <div className="rv-card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--ink-45)', fontSize: '.9rem' }}>
            Cargando vacante…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>⚠️</div>
            <p style={{ color: 'var(--ink-70)', fontSize: '.9rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Payment success */}
        {!loading && !error && paymentStatus === 'success' && job && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--pale)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1rem', border: '2px solid var(--forest)' }}>
              ✓
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--forest)', margin: '0 0 .4rem' }}>
              Pago confirmado
            </h2>
            <p style={{ fontSize: '.88rem', color: 'var(--ink-70)', margin: '0 0 .3rem' }}>
              <strong>{job.title}</strong>
            </p>
            <p style={{ fontSize: '.83rem', color: 'var(--ink-45)', margin: 0, lineHeight: 1.6 }}>
              Tu vacante fue renovada por 30 días adicionales.<br />
              Recibirás confirmación por email.
            </p>
          </div>
        )}

        {/* Payment pending */}
        {!loading && !error && paymentStatus === 'pending' && job && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>⏳</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.2rem', color: '#e6a817', margin: '0 0 .5rem' }}>Pago en proceso</h2>
            <p style={{ fontSize: '.83rem', color: 'var(--ink-45)', margin: 0, lineHeight: 1.6 }}>
              Estamos verificando tu pago. La renovación se activará automáticamente en minutos.
            </p>
          </div>
        )}

        {/* Payment failure */}
        {!loading && !error && paymentStatus === 'failure' && job && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>❌</div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.2rem', color: 'var(--coral)', margin: '0 0 .5rem' }}>Pago rechazado</h2>
            <p style={{ fontSize: '.83rem', color: 'var(--ink-70)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              El pago no pudo procesarse. Podés intentarlo nuevamente.
            </p>
            <button className="rv-btn" onClick={handleRenewWithPayment} disabled={redirecting}>
              {redirecting ? 'Redirigiendo…' : 'Intentar de nuevo →'}
            </button>
          </div>
        )}

        {/* Normal state — show renewal CTA */}
        {!loading && !error && job && !paymentStatus && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--forest)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                {job.company_name ? job.company_name[0].toUpperCase() : '?'}
              </div>
              <div>
                <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink)', lineHeight: 1.25 }}>
                  {job.title}
                </h1>
                <div style={{ fontSize: '.8rem', color: 'var(--ink-70)', marginTop: '.1rem' }}>
                  {job.company_name || 'Empresa en Candidato®'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="rv-row">
                <span className="rv-label">Cierre actual</span>
                <span className="rv-value" style={{ color: 'var(--coral)' }}>
                  {job.closes_at ? formatDate(job.closes_at) : '—'}
                </span>
              </div>
              <div className="rv-row">
                <span className="rv-label">Renovación</span>
                <span className="rv-value">30 días adicionales</span>
              </div>
              <div className="rv-row">
                <span className="rv-label">Precio</span>
                <span className="rv-value" style={{ color: 'var(--forest)', fontSize: '1rem' }}>$150.000 COP</span>
              </div>
            </div>

            <button className="rv-btn" onClick={handleRenewWithPayment} disabled={redirecting}>
              {redirecting ? 'Redirigiendo a pago…' : 'Renovar con MercadoPago →'}
            </button>

            <p style={{ fontSize: '.74rem', color: 'var(--ink-45)', textAlign: 'center', marginTop: '.9rem', marginBottom: 0, lineHeight: 1.5 }}>
              Pago seguro vía MercadoPago · La vigencia se extiende automáticamente al confirmar.
            </p>
          </>
        )}
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '.72rem', color: 'var(--ink-45)', textAlign: 'center' }}>
        <a href="/app" style={{ color: 'inherit', textDecoration: 'none' }}>
          Candidato® · Ir al panel →
        </a>
      </div>
    </main>
  )
}
