'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const FOREST = '#1B3B3E'
const CORAL = '#EA6440'
const OFF = '#F5F4F0'
const PALE = '#E4F0F1'
const INK = '#0E1E20'
const INK_70 = 'rgba(14,30,32,.7)'
const INK_45 = 'rgba(14,30,32,.45)'
const LINE = 'rgba(14,30,32,.1)'

interface Company {
  id: string
  company_name: string
  industry?: string
  city?: string
  job_credits: number
}

interface Job {
  id: string
  title: string
  area?: string
  city?: string
  modality?: string
  active: boolean
  plan?: string
  views: number
  closes_at?: string
  created_at: string
  expiry_reminder_sent?: boolean
}

interface Application {
  id: string
  status: string
  applied_at: string
  candidates: {
    name: string
    email: string
    area?: string
    city?: string
    cv_url?: string
  } | null
  job_id: string
}

type Tab = 'jobs' | 'applications' | 'credits'

function BirdLogo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <img
      src="/bird-logo.png"
      alt="Candidato®"
      width={size}
      height={size}
      style={{
        borderRadius: 8,
        objectFit: 'cover',
        filter: light ? 'brightness(0) invert(1)' : 'none',
        flexShrink: 0,
      }}
    />
  )
}

function Badge({ children, color = FOREST, bg }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{
      fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      background: bg ?? `${color}18`, color,
      textTransform: 'uppercase', letterSpacing: '.06em', display: 'inline-block',
    }}>
      {children}
    </span>
  )
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isExpiringSoon(closesAt?: string | null): boolean {
  if (!closesAt) return false
  const diff = new Date(closesAt).getTime() - Date.now()
  return diff <= 14 * 24 * 60 * 60 * 1000 // within 14 days or past
}

export default function EmpresasDashboard() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<{ email: string; company: Company } | null>(null)
  const [tab, setTab] = useState<Tab>('jobs')
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [appsLoading, setAppsLoading] = useState(false)
  const [renewLinks, setRenewLinks] = useState<Record<string, string>>({})

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Check session on mount
  useEffect(() => {
    fetch('/api/empresa-auth')
      .then(r => r.json())
      .then(d => {
        if (d.email && d.company) {
          setSession({ email: d.email, company: d.company })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadJobs = useCallback(async (companyId: string) => {
    setJobsLoading(true)
    try {
      const sb = createClient()
      const { data } = await sb
        .from('jobs')
        .select('id, title, area, city, modality, active, plan, views, closes_at, created_at, expiry_reminder_sent')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      setJobs((data ?? []) as Job[])
    } finally {
      setJobsLoading(false)
    }
  }, [])

  const loadApplications = useCallback(async (jobIds: string[]) => {
    if (jobIds.length === 0) { setApplications([]); return }
    setAppsLoading(true)
    try {
      const sb = createClient()
      const { data } = await sb
        .from('applications')
        .select('id, status, applied_at, job_id, candidates(name, email, area, city, cv_url)')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false })
      setApplications((data ?? []) as unknown as Application[])
    } finally {
      setAppsLoading(false)
    }
  }, [])

  // When session is set, load jobs
  useEffect(() => {
    if (session) {
      loadJobs(session.company.id)
    }
  }, [session, loadJobs])

  // When jobs load and tab switches to applications, load applications
  useEffect(() => {
    if (tab === 'applications' && jobs.length > 0 && applications.length === 0 && !appsLoading) {
      loadApplications(jobs.map(j => j.id))
    }
  }, [tab, jobs, applications.length, appsLoading, loadApplications])

  async function fetchRenewLink(jobId: string) {
    if (renewLinks[jobId]) return renewLinks[jobId]
    try {
      const res = await fetch(`/api/empresa-auth?action=renew_link&job_id=${jobId}`)
      const data = await res.json()
      if (data.url) {
        setRenewLinks(prev => ({ ...prev, [jobId]: data.url }))
        return data.url as string
      }
    } catch { /* */ }
    return null
  }

  async function handleRenew(jobId: string) {
    const url = await fetchRenewLink(jobId)
    if (url) window.location.href = url
  }

  async function handleLogin() {
    if (!loginEmail.trim()) return
    setLoginLoading(true)
    setLoginErr('')
    try {
      const res = await fetch('/api/empresa-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLoginErr(data.error || 'Error al verificar')
        setLoginLoading(false)
        return
      }
      setSession({ email: loginEmail.toLowerCase().trim(), company: data.company })
    } catch {
      setLoginErr('Error de conexión. Intentá de nuevo.')
    }
    setLoginLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/empresa-auth', { method: 'DELETE' })
    setSession(null)
    setJobs([])
    setApplications([])
    setRenewLinks({})
  }

  /* ── LOADING ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: FOREST }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/bird-logo.png" width={48} height={48} alt="" style={{ borderRadius: 12, filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem', marginTop: '1rem', letterSpacing: '.05em' }}>Cargando…</div>
      </div>
    </div>
  )

  /* ── LOGIN ───────────────────────────────────────────────── */
  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', background: FOREST }}>
      <style>{`
        .ep-left { display: flex; }
        @media (max-width: 820px) { .ep-left { display: none !important; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Left branding panel */}
      <div className="ep-left" style={{
        flex: '0 0 420px', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(228,240,241,.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
            <BirdLogo size={40} light />
            <div>
              <div style={{ color: 'white', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-.01em' }}>Candidato®</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>Panel Empresa</div>
            </div>
          </div>

          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.75rem' }}>
            Para empresas
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontSize: '1.85rem', fontWeight: 700, lineHeight: 1.25, margin: '0 0 .5rem', letterSpacing: '-.02em' }}>
            <span style={{ color: 'white' }}>Tu panel de</span><br />
            <span style={{ color: CORAL }}>empresa.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.84rem', lineHeight: 1.75, margin: '0 0 2.5rem' }}>
            Accedé con el email que usaste para registrar tu empresa en Candidato®.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[
              { icon: '📋', text: 'Gestioná tus vacantes activas' },
              { icon: '👥', text: 'Revisá las postulaciones recibidas' },
              { icon: '🔄', text: 'Renová tus publicaciones' },
              { icon: '💳', text: 'Controlá tus créditos disponibles' },
              { icon: '⚡', text: 'Publicá nuevas vacantes en un clic' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ fontSize: '.88rem', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,.65)', fontSize: '.81rem' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ fontSize: '.88rem' }}>🔒</span>
            <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.73rem', lineHeight: 1.5 }}>Acceso privado · Sin contraseña · Solo tu email</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <BirdLogo size={32} />
            <div>
              <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: FOREST }}>Candidato®</div>
              <div style={{ fontSize: '.6rem', color: INK_45, letterSpacing: '.12em', textTransform: 'uppercase' }}>Panel Empresa</div>
            </div>
          </div>

          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.55rem', color: INK, marginBottom: '.4rem', letterSpacing: '-.025em', lineHeight: 1.2 }}>
            Ingresá a tu panel
          </div>
          <p style={{ fontSize: '.83rem', color: INK_45, margin: '0 0 2rem', lineHeight: 1.65 }}>
            Usá el email con el que registraste tu empresa. No necesitás contraseña.
          </p>

          <label style={{ fontSize: '.7rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Email de la empresa
          </label>
          <input
            style={{
              width: '100%', border: '1.5px solid #d8e4e4', borderRadius: 8, padding: '12px 14px',
              fontSize: '.88rem', fontFamily: 'inherit', outline: 'none', background: '#fafcfc',
              color: INK, marginBottom: '.85rem', transition: 'border-color .15s',
            }}
            type="email"
            placeholder="empresa@ejemplo.com"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />

          {loginErr && (
            <div style={{ background: '#fff4f2', border: '1px solid #fcd0c8', borderRadius: 9, padding: '10px 14px', fontSize: '.8rem', color: '#c0392b', marginBottom: '.85rem', lineHeight: 1.55 }}>
              {loginErr}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loginLoading || !loginEmail.trim()}
            style={{
              width: '100%', background: loginLoading || !loginEmail.trim() ? '#b0c0c0' : FOREST,
              color: 'white', border: 'none', borderRadius: 10, padding: '14px',
              fontSize: '.92rem', fontWeight: 700, cursor: loginLoading || !loginEmail.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-.01em',
            }}
          >
            {loginLoading ? 'Verificando…' : 'Entrar al panel →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '.75rem', color: '#b0c4c4', margin: '1.2rem 0 0', lineHeight: 1.5 }}>
            ¿Aún no registraste tu empresa?{' '}
            <a href="/app" style={{ color: FOREST, fontWeight: 600, textDecoration: 'none' }}>
              Publicar vacante →
            </a>
          </p>
        </div>
      </div>
    </div>
  )

  /* ── DASHBOARD ───────────────────────────────────────────── */
  const { company } = session
  const jobIds = jobs.map(j => j.id)

  return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        .ep-tab { padding: 14px 20px; font-size: .8rem; font-weight: 500; color: ${INK_45}; background: none; border: none; border-bottom: 2.5px solid transparent; cursor: pointer; white-space: nowrap; transition: all .15s; }
        .ep-tab.active { font-weight: 700; color: ${FOREST}; border-bottom-color: ${FOREST}; }
        .ep-tab:hover:not(.active) { color: ${INK_70}; }
        .ep-job-card { background: white; border-radius: 14px; border: 1.5px solid ${LINE}; padding: 1.1rem 1.3rem; margin-bottom: .75rem; }
        .ep-app-card { background: white; border-radius: 12px; border: 1px solid ${LINE}; padding: .9rem 1.1rem; margin-bottom: .6rem; }
        .ep-btn { display: inline-block; border: none; border-radius: 8px; padding: 6px 14px; font-size: .75rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .15s; text-decoration: none; }
        @media (max-width: 600px) { .ep-job-row { flex-direction: column !important; align-items: flex-start !important; gap: .5rem !important; } }
      `}</style>

      {/* TopBar */}
      <div style={{
        background: FOREST, padding: '0 1.5rem', height: 54,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 0 rgba(255,255,255,.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BirdLogo size={26} light />
          <div style={{ color: 'white', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '-.01em' }}>Candidato®</div>
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.75rem', letterSpacing: '.04em' }}>· Panel Empresa</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>{company.company_name}</span>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: 'rgba(255,255,255,.75)', borderRadius: 7, padding: '4px 11px', cursor: 'pointer', fontSize: '.75rem', transition: 'background .15s', fontFamily: 'inherit' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Company header */}
      <div style={{ background: 'white', borderBottom: `1px solid ${LINE}`, padding: '1.25rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: FOREST, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
            {company.company_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.1rem', color: INK, lineHeight: 1.2 }}>{company.company_name}</div>
            <div style={{ fontSize: '.78rem', color: INK_45, marginTop: '.15rem' }}>
              {[company.industry, company.city].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '.75rem', color: INK_45 }}>
              <strong style={{ color: FOREST, fontSize: '1rem' }}>{company.job_credits}</strong> créditos
            </span>
            <a href="/app" className="ep-btn" style={{ background: CORAL, color: 'white' }}>
              + Publicar vacante
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: `1px solid ${LINE}`, padding: '0 1.5rem', display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', width: '100%' }}>
          {([
            { key: 'jobs', label: `Mis Vacantes${jobs.length > 0 ? ` (${jobs.length})` : ''}` },
            { key: 'applications', label: `Postulaciones${applications.length > 0 ? ` (${applications.length})` : ''}` },
            { key: 'credits', label: 'Créditos & Renovaciones' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              className={`ep-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '1.75rem 1.5rem', width: '100%' }}>

        {/* ── TAB 1: Mis Vacantes ─────────────────────────────── */}
        {tab === 'jobs' && (
          <div>
            {jobsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: INK_45, fontSize: '.85rem' }}>Cargando vacantes…</div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>📋</div>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: INK, marginBottom: '.4rem' }}>Sin vacantes publicadas</div>
                <div style={{ fontSize: '.83rem', color: INK_45, marginBottom: '1.5rem' }}>Publicá tu primera vacante y recibí postulaciones.</div>
                <a href="/app" className="ep-btn" style={{ background: FOREST, color: 'white', padding: '10px 24px', fontSize: '.85rem' }}>
                  Publicar vacante →
                </a>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.25rem', color: INK, margin: '0 0 .2rem', letterSpacing: '-.02em' }}>Mis Vacantes</h2>
                    <p style={{ fontSize: '.8rem', color: INK_45, margin: 0 }}>{jobs.length} vacante{jobs.length !== 1 ? 's' : ''} publicada{jobs.length !== 1 ? 's' : ''}</p>
                  </div>
                  <a href="/app" className="ep-btn" style={{ background: CORAL, color: 'white' }}>+ Nueva vacante</a>
                </div>

                {jobs.map(job => {
                  const expiring = isExpiringSoon(job.closes_at)
                  const expired = job.closes_at ? new Date(job.closes_at) < new Date() : false

                  return (
                    <div key={job.id} className="ep-job-card">
                      <div className="ep-job-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                            {job.active ? (
                              <Badge color="#2A7E4E" bg="#e6f4ec">Activa</Badge>
                            ) : (
                              <Badge color="#888" bg="#f0f0f0">Inactiva</Badge>
                            )}
                            {job.plan === 'free' ? (
                              <Badge color="#666" bg="#f0f0f0">SEÑAL</Badge>
                            ) : (
                              <Badge color={FOREST} bg={PALE}>✦ DESTACADA</Badge>
                            )}
                            {expired && <Badge color="#c0392b" bg="#fff0ee">Vencida</Badge>}
                            {!expired && expiring && <Badge color="#e6a817" bg="#fffbea">Vence pronto</Badge>}
                          </div>

                          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: INK, lineHeight: 1.3, marginBottom: '.3rem' }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: '.78rem', color: INK_45, marginBottom: '.5rem' }}>
                            {[job.area, job.city, job.modality].filter(Boolean).join(' · ')}
                          </div>

                          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '.75rem', color: INK_45 }}>
                              <strong style={{ color: INK_70 }}>{job.views ?? 0}</strong> vistas
                            </span>
                            <span style={{ fontSize: '.75rem', color: INK_45 }}>
                              Cierra: <strong style={{ color: expired ? '#c0392b' : INK_70 }}>{formatDate(job.closes_at)}</strong>
                            </span>
                            <span style={{ fontSize: '.75rem', color: INK_45 }}>
                              Publicada: {formatDate(job.created_at)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <a
                            href={`/jobs/${job.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ep-btn"
                            style={{ background: PALE, color: FOREST, border: `1px solid ${LINE}` }}
                          >
                            Ver vacante →
                          </a>
                          {expiring && (
                            <button
                              onClick={() => handleRenew(job.id)}
                              className="ep-btn"
                              style={{ background: CORAL, color: 'white' }}
                            >
                              Renovar →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Postulaciones ────────────────────────────── */}
        {tab === 'applications' && (
          <div>
            {appsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: INK_45, fontSize: '.85rem' }}>Cargando postulaciones…</div>
            ) : jobIds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>👥</div>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: INK, marginBottom: '.4rem' }}>Sin postulaciones aún</div>
                <div style={{ fontSize: '.83rem', color: INK_45 }}>Las postulaciones aparecerán cuando publiques vacantes.</div>
              </div>
            ) : applications.length === 0 && !appsLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>📬</div>
                <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: INK, marginBottom: '.4rem' }}>Sin postulaciones aún</div>
                <div style={{ fontSize: '.83rem', color: INK_45 }}>Cuando un candidato se postule a tus vacantes, aparecerá aquí.</div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.25rem', color: INK, margin: '0 0 .2rem', letterSpacing: '-.02em' }}>Postulaciones</h2>
                  <p style={{ fontSize: '.8rem', color: INK_45, margin: 0 }}>{applications.length} postulacion{applications.length !== 1 ? 'es' : ''} recibida{applications.length !== 1 ? 's' : ''}</p>
                </div>

                {applications.map(app => {
                  const cand = app.candidates
                  const relatedJob = jobs.find(j => j.id === app.job_id)

                  const statusColors: Record<string, { color: string; bg: string }> = {
                    pending: { color: '#e6a817', bg: '#fffbea' },
                    reviewed: { color: FOREST, bg: PALE },
                    rejected: { color: '#c0392b', bg: '#fff0ee' },
                    accepted: { color: '#2A7E4E', bg: '#e6f4ec' },
                  }
                  const st = statusColors[app.status] ?? { color: INK_45, bg: '#f0f0f0' }

                  return (
                    <div key={app.id} className="ep-app-card">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 700, fontSize: '.92rem', color: INK }}>
                              {cand?.name ?? 'Candidato desconocido'}
                            </div>
                            <Badge color={st.color} bg={st.bg}>{app.status}</Badge>
                          </div>

                          {cand && (
                            <div style={{ fontSize: '.78rem', color: INK_45, marginBottom: '.3rem' }}>
                              {[cand.area, cand.city].filter(Boolean).join(' · ')}
                            </div>
                          )}

                          {relatedJob && (
                            <div style={{ fontSize: '.75rem', color: INK_45, marginBottom: '.3rem' }}>
                              Vacante: <span style={{ color: INK_70, fontWeight: 600 }}>{relatedJob.title}</span>
                            </div>
                          )}

                          <div style={{ fontSize: '.73rem', color: INK_45 }}>
                            {formatDate(app.applied_at)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                          {cand?.cv_url && (
                            <a
                              href={cand.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ep-btn"
                              style={{ background: PALE, color: FOREST, border: `1px solid ${LINE}` }}
                            >
                              Ver CV →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Créditos & Renovaciones ──────────────────── */}
        {tab === 'credits' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.25rem', color: INK, margin: '0 0 .2rem', letterSpacing: '-.02em' }}>Créditos & Renovaciones</h2>
              <p style={{ fontSize: '.8rem', color: INK_45, margin: 0 }}>Gestioná tus créditos y publicaciones</p>
            </div>

            {/* Credits card */}
            <div style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${LINE}`, padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Georgia,serif', fontWeight: 800, fontSize: '1.6rem', color: FOREST, lineHeight: 1 }}>{company.job_credits}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1rem', color: INK, marginBottom: '.2rem' }}>
                    {company.job_credits === 1 ? '1 crédito disponible' : `${company.job_credits} créditos disponibles`}
                  </div>
                  <div style={{ fontSize: '.8rem', color: INK_45, lineHeight: 1.6 }}>
                    Cada crédito te permite publicar una vacante <strong>Destacada</strong> (✦ DESTACADA).
                    Las vacantes destacadas tienen mayor visibilidad y aparecen primero en el listado.
                  </div>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div style={{ background: PALE, borderRadius: 12, border: `1px solid rgba(27,59,62,.12)`, padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '.8rem', color: FOREST, marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                ¿Cómo funcionan los créditos?
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 1.1rem', fontSize: '.82rem', color: INK_70, lineHeight: 2 }}>
                <li>1 crédito = 1 vacante <strong>Destacada</strong> por 30 días</li>
                <li>Las vacantes sin crédito se publican como <strong>Señal</strong> (menor visibilidad)</li>
                <li>Podés comprar créditos al publicar nuevas vacantes</li>
                <li>Los créditos no vencen</li>
              </ul>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="/app"
                className="ep-btn"
                style={{ background: CORAL, color: 'white', padding: '12px 24px', fontSize: '.88rem', borderRadius: 10 }}
              >
                Publicar nueva vacante →
              </a>
              <button
                onClick={() => setTab('jobs')}
                className="ep-btn"
                style={{ background: 'white', color: FOREST, border: `1.5px solid ${LINE}`, padding: '12px 24px', fontSize: '.88rem', borderRadius: 10 }}
              >
                Ver mis vacantes
              </button>
            </div>

            {/* Expiring jobs list */}
            {jobs.filter(j => isExpiringSoon(j.closes_at)).length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: INK_45, marginBottom: '.85rem' }}>
                  Vacantes que requieren renovación
                </div>
                {jobs.filter(j => isExpiringSoon(j.closes_at)).map(job => {
                  const expired = job.closes_at ? new Date(job.closes_at) < new Date() : false
                  return (
                    <div key={job.id} style={{ background: 'white', borderRadius: 12, border: `1.5px solid ${expired ? '#fcd0c8' : '#fde68a'}`, padding: '.9rem 1.1rem', marginBottom: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.88rem', color: INK, marginBottom: '.2rem' }}>{job.title}</div>
                        <div style={{ fontSize: '.75rem', color: INK_45 }}>
                          {expired ? 'Venció el' : 'Vence el'} {formatDate(job.closes_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRenew(job.id)}
                        className="ep-btn"
                        style={{ background: CORAL, color: 'white' }}
                      >
                        Renovar 30 días →
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${LINE}`, padding: '1rem 1.5rem', textAlign: 'center' }}>
        <a href="https://candidato.com.co" style={{ fontSize: '.72rem', color: INK_45, textDecoration: 'none' }}>
          Candidato® · Matching inteligente para Colombia
        </a>
      </div>
    </div>
  )
}
