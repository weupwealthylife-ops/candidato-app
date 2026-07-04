'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'candidatojobs@gmail.com'
const FOREST = '#1B3B3E'
const PALE = '#E4F0F1'
const INK = '#0E1E20'
const OFF = '#F5F4F0'
const CORAL = '#EA6440'

interface Engagement {
  id: string
  title: string
  company_name: string
  client_email: string
  status: 'open' | 'closed'
  job_area?: string
  city?: string
  notes?: string
  created_at: string
}

interface Candidate {
  id: string
  engagement_id: string
  sort_order: number
  name: string
  photo_url?: string
  cv_url?: string
  score_profession: number
  score_experience: number
  score_sector: number
  score_requirements: number
  score_availability: number
  is_top: boolean
  formation?: string
  relevant_experience?: string
  technical_strengths?: string
  qa_notes?: string
  salary_expectation?: string
  mobility?: string
  interview_date?: string
  client_notes?: string
}

const SCORE_LABELS = ['Profesión', 'Años de experiencia', 'Experiencia en el sector', 'Requer. del cargo', 'Disponibilidad']
const SCORE_KEYS: (keyof Candidate)[] = ['score_profession', 'score_experience', 'score_sector', 'score_requirements', 'score_availability']

function avgScore(c: Candidate) {
  const vals = SCORE_KEYS.map(k => Number(c[k]) || 0)
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 20)
}

/* ── Radar chart ──────────────────────────────────────────── */
function RadarChart({ scores, size = 240 }: { scores: number[]; size?: number }) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.33
  const labelR = size * 0.46
  const n = 5
  const ang = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n)
  const pt = (i: number, radius: number) => ({ x: cx + radius * Math.cos(ang(i)), y: cy + radius * Math.sin(ang(i)) })
  const poly = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'
  const scorePoints = scores.map((s, i) => pt(i, (Math.max(1, Math.min(5, s)) / 5) * r))
  const shortLabels = ['Profesión', 'Experiencia', 'Sector', 'Requisitos', 'Disponibilidad']
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 2, 3, 4, 5].map(level => (
        <path key={level} d={poly(Array.from({ length: n }, (_, i) => pt(i, (level / 5) * r)))}
          fill="none" stroke={level === 5 ? '#c8d8d9' : '#e2eced'} strokeWidth={level === 5 ? 1 : 0.6} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const e = pt(i, r)
        return <line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke="#c8d8d9" strokeWidth={0.7} />
      })}
      <path d={poly(scorePoints)} fill={`${PALE}99`} stroke={FOREST} strokeWidth={1.8} />
      {scorePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={FOREST} />)}
      {shortLabels.map((label, i) => {
        const p = pt(i, labelR)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={9.5} fill="#4a6a6a" fontFamily="system-ui,sans-serif">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Score bar ────────────────────────────────────────────── */
function ScoreBar({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100
  const color = score >= 4 ? FOREST : score >= 3 ? '#e6a817' : CORAL
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#e2eced', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, width: 14, textAlign: 'right' }}>{score}</span>
    </div>
  )
}

/* ── Modals ───────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,30,32,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(14,30,32,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: INK }}>{title}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#9aacac', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #d8e4e4', borderRadius: 8, padding: '9px 12px', fontSize: '.83rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fafcfc', color: INK }
const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.55 }

/* ── Main Page ────────────────────────────────────────────── */
export default function MatchGraphPage() {
  type View = 'login' | 'dashboard' | 'engagement'
  const [view, setView] = useState<View>('login')
  const [session, setSession] = useState<{ email: string; isAdmin: boolean } | null>(null)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [selEng, setSelEng] = useState<Engagement | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candIdx, setCandIdx] = useState(-1) // -1 = cover
  const [loading, setLoading] = useState(true)
  const [engLoading, setEngLoading] = useState(false)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Admin modals
  const [showCreateEng, setShowCreateEng] = useState(false)
  const [showEditEng, setShowEditEng] = useState(false)
  const [showEditCand, setShowEditCand] = useState(false)
  const [editingCand, setEditingCand] = useState<Candidate | null>(null)
  const [saving, setSaving] = useState(false)

  // Engagement form
  const [engForm, setEngForm] = useState({ title: '', company_name: '', client_email: '', job_area: '', city: '', notes: '', status: 'open' as 'open' | 'closed' })

  // Candidate form
  const [candForm, setCandForm] = useState<Partial<Candidate>>({})
  const [photoUploading, setPhotoUploading] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)

  // Client notes
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)

  const loadEngagements = useCallback(async () => {
    const res = await fetch('/api/matchgraph?action=list')
    const data = await res.json()
    setEngagements(data.engagements || [])
  }, [])

  useEffect(() => {
    fetch('/api/matchgraph-auth').then(r => r.json()).then(d => {
      if (d.email) {
        setSession({ email: d.email, isAdmin: d.email === ADMIN_EMAIL })
        setView('dashboard')
        loadEngagements()
      }
      setLoading(false)
    })
  }, [loadEngagements])

  async function handleLogin() {
    if (!loginEmail.trim()) return
    setLoginLoading(true); setLoginErr('')
    const res = await fetch('/api/matchgraph-auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setLoginErr(data.error || 'Error'); setLoginLoading(false); return }
    setSession({ email: loginEmail.toLowerCase().trim(), isAdmin: data.isAdmin })
    setView('dashboard')
    await loadEngagements()
    setLoginLoading(false)
  }

  async function openEngagement(eng: Engagement) {
    setEngLoading(true)
    const res = await fetch(`/api/matchgraph?action=detail&id=${eng.id}`)
    const data = await res.json()
    setSelEng(data.engagement)
    const cands = data.candidates || []
    setCandidates(cands)
    setClientNotes(Object.fromEntries(cands.map((c: Candidate) => [c.id, c.client_notes || ''])))
    setCandIdx(-1)
    setView('engagement')
    setEngLoading(false)
  }

  async function logout() {
    await fetch('/api/matchgraph-auth', { method: 'DELETE' })
    setSession(null); setView('login'); setEngagements([]); setSelEng(null); setCandidates([])
  }

  async function saveEngagement() {
    setSaving(true)
    const action = showEditEng ? 'update_engagement' : 'create_engagement'
    const body = showEditEng ? { action, id: selEng!.id, ...engForm } : { action, ...engForm }
    const res = await fetch('/api/matchgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setSaving(false)
    setShowCreateEng(false); setShowEditEng(false)
    await loadEngagements()
    if (data.engagement) openEngagement(data.engagement)
    else if (selEng) openEngagement({ ...selEng, ...engForm })
  }

  async function saveCandidate() {
    if (!selEng) return
    setSaving(true)
    const body = { action: 'upsert_candidate', ...candForm, engagement_id: selEng!.id, id: editingCand?.id }
    await fetch('/api/matchgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false); setShowEditCand(false); setEditingCand(null)
    // reload
    const res = await fetch(`/api/matchgraph?action=detail&id=${selEng!.id}`)
    const data = await res.json()
    setCandidates(data.candidates || [])
  }

  async function deleteCandidate(id: string) {
    if (!confirm('¿Eliminar este candidato?')) return
    await fetch('/api/matchgraph', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_candidate', id }) })
    setCandidates(prev => prev.filter(c => c.id !== id))
    if (candIdx >= candidates.length - 1) setCandIdx(Math.max(-1, candidates.length - 2))
  }

  async function uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const sb = createClient()
    await sb.storage.from(bucket).upload(path, file, { upsert: true })
    const { data } = sb.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoUploading(true)
    const url = await uploadFile(file, 'matchgraph-files', `photos/${Date.now()}-${file.name}`)
    setCandForm(f => ({ ...f, photo_url: url }))
    setPhotoUploading(false)
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setCvUploading(true)
    const url = await uploadFile(file, 'matchgraph-files', `cvs/${Date.now()}-${file.name}`)
    setCandForm(f => ({ ...f, cv_url: url }))
    setCvUploading(false)
  }

  async function saveClientNotes(candId: string) {
    setSavingNotes(candId)
    await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_client_notes', candidateId: candId, client_notes: clientNotes[candId] || '' }),
    })
    setSavingNotes(null)
  }

  function openAddCandidate() {
    setEditingCand(null)
    setCandForm({ sort_order: candidates.length + 1, score_profession: 3, score_experience: 3, score_sector: 3, score_requirements: 3, score_availability: 3 })
    setShowEditCand(true)
  }

  function openEditCandidate(c: Candidate) {
    setEditingCand(c)
    setCandForm({ ...c })
    setShowEditCand(true)
  }

  /* ── LOADING ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: OFF }}>
      <div style={{ color: '#9aacac', fontSize: '.85rem' }}>Cargando…</div>
    </div>
  )

  /* ── LOGIN ───────────────────────────────────────────────── */
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M14 2C8 2 3 8 3 14s5 12 11 12 11-6 11-12S20 2 14 2z" fill={PALE} />
            <path d="M14 7l-3 6h6l-3-6zM11 13v8M17 13v8" stroke={FOREST} strokeWidth={1.8} strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.2rem', color: FOREST, letterSpacing: '-.01em' }}>Candidato®</div>
            <div style={{ fontSize: '.68rem', color: '#9aacac', letterSpacing: '.1em', textTransform: 'uppercase' }}>Match Graph</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 18, padding: '2rem', border: '1px solid #e0eaea', boxShadow: '0 4px 24px rgba(14,30,32,.07)' }}>
          <div style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.3rem', color: INK, marginBottom: '.4rem' }}>
            Accedé a tu evaluación
          </div>
          <p style={{ fontSize: '.82rem', color: '#9aacac', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
            Ingresá el email corporativo con el que coordinaste el servicio de Preselección & Validación.
          </p>

          <label style={{ fontSize: '.74rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Email corporativo</label>
          <input
            style={{ ...inp, marginBottom: '.85rem' }}
            type="email"
            placeholder="empresa@corporativo.com"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />

          {loginErr && (
            <div style={{ background: '#fff4f2', border: '1px solid #fcd0c8', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem', color: '#c0392b', marginBottom: '.85rem', lineHeight: 1.5 }}>
              {loginErr}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loginLoading || !loginEmail.trim()}
            style={{ width: '100%', background: loginLoading || !loginEmail.trim() ? '#9aacac' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: '.88rem', fontWeight: 700, cursor: loginLoading || !loginEmail.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}
          >
            {loginLoading ? 'Verificando…' : 'Ingresar →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '.73rem', color: '#b0c4c4', margin: '1rem 0 0' }}>
            ¿Aún no tenés acceso? Contactá a tu consultor.
          </p>
        </div>
      </div>
    </div>
  )

  /* ── TOP BAR ─────────────────────────────────────────────── */
  const TopBar = ({ title, actions }: { title?: string; actions?: React.ReactNode }) => (
    <div style={{ background: FOREST, padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {view === 'engagement' && (
          <button onClick={() => setView('dashboard')} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '.78rem', marginRight: 4 }}>← Inicio</button>
        )}
        <div style={{ color: 'white', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '.95rem' }}>Candidato®</div>
        <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '.8rem' }}>Match Graph</span>
        {title && <><span style={{ color: 'rgba(255,255,255,.3)' }}>·</span><span style={{ color: 'rgba(255,255,255,.8)', fontSize: '.82rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span></>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        {actions}
        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginLeft: 8 }}>{session?.email}</div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem' }}>Salir</button>
      </div>
    </div>
  )

  /* ── DASHBOARD ───────────────────────────────────────────── */
  if (view === 'dashboard') {
    const open = engagements.filter(e => e.status === 'open')
    const closed = engagements.filter(e => e.status === 'closed')
    return (
      <div style={{ minHeight: '100vh', background: OFF, display: 'flex', flexDirection: 'column' }}>
        <TopBar actions={session?.isAdmin ? (
          <button onClick={() => { setEngForm({ title: '', company_name: '', client_email: '', job_area: '', city: '', notes: '', status: 'open' }); setShowCreateEng(true) }}
            style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 7, padding: '5px 13px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
            + Nueva evaluación
          </button>
        ) : undefined} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.4rem', color: INK, margin: '0 0 .3rem' }}>
              {session?.isAdmin ? 'Todas las evaluaciones' : 'Tus evaluaciones de Preselección'}
            </h1>
            <p style={{ fontSize: '.82rem', color: '#9aacac', margin: 0 }}>
              {session?.isAdmin ? `${engagements.length} evaluaciones en total` : `${engagements.length} evaluacion${engagements.length !== 1 ? 'es' : ''} disponible${engagements.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {engLoading && <div style={{ textAlign: 'center', padding: '3rem', color: '#9aacac', fontSize: '.85rem' }}>Cargando…</div>}

          {!engLoading && engagements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9aacac' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '.35rem' }}>Sin evaluaciones aún</div>
              {session?.isAdmin && <div style={{ fontSize: '.8rem' }}>Creá la primera evaluación con el botón de arriba.</div>}
            </div>
          )}

          {[{ label: 'Abiertas', items: open }, { label: 'Cerradas', items: closed }].map(({ label, items }) => items.length > 0 && (
            <div key={label} style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.75rem' }}>{label} ({items.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                {items.map(eng => (
                  <button key={eng.id} onClick={() => openEngagement(eng)}
                    style={{ background: 'white', border: `1.5px solid ${eng.status === 'open' ? 'rgba(27,59,62,.15)' : '#e0e0e0'}`, borderRadius: 14, padding: '1.1rem 1.3rem', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', boxShadow: '0 2px 8px rgba(14,30,32,.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: eng.status === 'open' ? PALE : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '.9rem', color: eng.status === 'open' ? FOREST : '#888' }}>
                        {eng.company_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: eng.status === 'open' ? '#e6f4ec' : '#e8e8e8', color: eng.status === 'open' ? '#2A7E4E' : '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {eng.status === 'open' ? 'Activa' : 'Cerrada'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: INK, marginBottom: '.2rem' }}>{eng.title}</div>
                    <div style={{ fontSize: '.78rem', color: '#4a6a6a', marginBottom: '.2rem' }}>{eng.company_name}</div>
                    {(eng.job_area || eng.city) && (
                      <div style={{ fontSize: '.72rem', color: '#9aacac' }}>{[eng.job_area, eng.city].filter(Boolean).join(' · ')}</div>
                    )}
                    {session?.isAdmin && <div style={{ fontSize: '.68rem', color: '#b0c4c4', marginTop: '.3rem' }}>{eng.client_email}</div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create engagement modal */}
        {showCreateEng && (
          <Modal title="Nueva evaluación" onClose={() => setShowCreateEng(false)}>
            {[
              { label: 'Cargo / Vacante', key: 'title', placeholder: 'Ej: Analista de Calidad' },
              { label: 'Empresa cliente', key: 'company_name', placeholder: 'Nombre de la empresa' },
              { label: 'Email del cliente', key: 'client_email', placeholder: 'contacto@empresa.com' },
              { label: 'Área', key: 'job_area', placeholder: 'Ej: Tecnología / IT' },
              { label: 'Ciudad', key: 'city', placeholder: 'Ej: Cali' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '.75rem' }}>
                <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{f.label}</label>
                <input style={inp} placeholder={f.placeholder} value={(engForm as Record<string, string>)[f.key] || ''} onChange={e => setEngForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Notas internas</label>
              <textarea style={ta} placeholder="Notas sobre la evaluación…" value={engForm.notes} onChange={e => setEngForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button onClick={saveEngagement} disabled={saving || !engForm.title || !engForm.client_email}
              style={{ width: '100%', background: !engForm.title || !engForm.client_email ? '#9aacac' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando…' : 'Crear evaluación →'}
            </button>
          </Modal>
        )}
      </div>
    )
  }

  /* ── ENGAGEMENT VIEW ─────────────────────────────────────── */
  if (!selEng) return null
  const currentCand = candidates[candIdx] ?? null

  /* Cover summary view */
  function CoverView() {
    const overallAvgs = candidates.map(c => ({ name: c.name.split(' ')[0], score: avgScore(c), isTop: c.is_top }))
    return (
      <div style={{ padding: '3rem 2rem', maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#9aacac', marginBottom: '.6rem' }}>
            Preselección & Validación
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '2rem', color: INK, margin: '0 0 .3rem', letterSpacing: '-.02em' }}>{selEng!.title}</h1>
          <div style={{ fontSize: '.9rem', color: '#4a6a6a' }}>{selEng!.company_name}{selEng!.city ? ` · ${selEng!.city}` : ''}{selEng!.job_area ? ` · ${selEng!.job_area}` : ''}</div>
        </div>

        {/* Candidate summary grid */}
        {candidates.length > 0 ? (
          <>
            <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '1rem' }}>
              {candidates.length} candidato{candidates.length !== 1 ? 's' : ''} evaluado{candidates.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '.75rem', marginBottom: '2rem' }}>
              {overallAvgs.map((c, i) => (
                <button key={i} onClick={() => setCandIdx(i)}
                  style={{ background: 'white', border: `1.5px solid ${c.isTop ? `${FOREST}55` : '#e0eaea'}`, borderRadius: 12, padding: '1rem .75rem', cursor: 'pointer', textAlign: 'center', transition: 'all .15s', position: 'relative' }}>
                  {c.isTop && (
                    <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: FOREST, color: 'white', fontSize: '.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>⭐ TOP</div>
                  )}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '.85rem', color: FOREST, margin: '0 auto .6rem' }}>
                    C{i + 1}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.78rem', color: INK, marginBottom: '.25rem' }}>{c.name}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c.score >= 80 ? FOREST : c.score >= 60 ? '#e6a817' : CORAL }}>{c.score}%</div>
                  <div style={{ fontSize: '.65rem', color: '#9aacac' }}>fit score</div>
                </button>
              ))}
            </div>

            {/* Comparison radar */}
            {candidates.length > 1 && (
              <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 14, padding: '1.2rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.75rem' }}>Comparación de scores</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                    <thead>
                      <tr style={{ background: OFF }}>
                        <th style={{ padding: '7px 10px', textAlign: 'left', color: '#9aacac', fontWeight: 700, fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Dimensión</th>
                        {candidates.map((c, i) => (
                          <th key={c.id} style={{ padding: '7px 10px', textAlign: 'center', color: FOREST, fontWeight: 700, fontSize: '.72rem' }}>C{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SCORE_LABELS.map((label, si) => (
                        <tr key={label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '7px 10px', color: '#4a6a6a' }}>{label}</td>
                          {candidates.map(c => {
                            const val = Number(c[SCORE_KEYS[si]]) || 0
                            return <td key={c.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 700, color: val >= 4 ? FOREST : val >= 3 ? '#e6a817' : CORAL }}>{val}</td>
                          })}
                        </tr>
                      ))}
                      <tr style={{ background: OFF }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: INK, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Fit Score</td>
                        {candidates.map((c, i) => (
                          <td key={c.id} style={{ padding: '7px 10px', textAlign: 'center', fontWeight: 800, color: FOREST }}>{avgScore(c)}%</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9aacac', border: '1.5px dashed #d8e4e4', borderRadius: 14 }}>
            {session?.isAdmin ? 'Agregá candidatos con el botón de arriba.' : 'Los candidatos estarán disponibles pronto.'}
          </div>
        )}

        {selEng!.notes && (
          <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem 1.2rem', fontSize: '.8rem', color: '#92400e', lineHeight: 1.6 }}>
            <strong>Nota:</strong> {selEng!.notes}
          </div>
        )}
      </div>
    )
  }

  /* Candidate detail view */
  function CandidateView({ c }: { c: Candidate }) {
    const scores = SCORE_KEYS.map(k => Number(c[k]) || 0)
    const fit = avgScore(c)
    return (
      <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        {/* Admin controls */}
        {session?.isAdmin && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <button onClick={() => openEditCandidate(c)}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${FOREST}`, background: 'white', color: FOREST, cursor: 'pointer' }}>
              ✏️ Editar candidato
            </button>
            <button onClick={async () => {
              await fetch('/api/matchgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsert_candidate', id: c.id, is_top: !c.is_top }) })
              setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, is_top: !x.is_top } : x))
            }}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: '1.5px solid #e0eaea', background: c.is_top ? PALE : 'white', color: c.is_top ? FOREST : '#9aacac', cursor: 'pointer' }}>
              {c.is_top ? '⭐ Top candidato' : '☆ Marcar como top'}
            </button>
            <button onClick={() => deleteCandidate(c.id)}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: 7, border: '1.5px solid #fcd0c8', background: 'white', color: '#c0392b', cursor: 'pointer', marginLeft: 'auto' }}>
              Eliminar
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          {/* LEFT COLUMN */}
          <div>
            {/* Name + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '2px solid #e0eaea', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 12, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.4rem', color: FOREST, flexShrink: 0 }}>
                  C{candIdx + 1}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.25rem' }}>
                  <h2 style={{ fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.3rem', color: INK, margin: 0 }}>{c.name}</h2>
                  {c.is_top && <span style={{ fontSize: '.65rem', fontWeight: 700, background: FOREST, color: 'white', borderRadius: 8, padding: '2px 9px' }}>⭐ TOP</span>}
                </div>
                {c.salary_expectation && <div style={{ fontSize: '.78rem', color: '#4a6a6a' }}>Aspiración salarial: <strong>{c.salary_expectation}</strong></div>}
                {c.mobility && <div style={{ fontSize: '.78rem', color: '#4a6a6a' }}>Movilidad: <strong>{c.mobility}</strong></div>}
              </div>
            </div>

            {/* Scores table */}
            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 12, overflow: 'hidden', marginBottom: '1.2rem' }}>
              <div style={{ padding: '10px 14px', background: OFF, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0eaea' }}>
                <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9aacac' }}>Evaluación de dimensiones</span>
                <span style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9aacac' }}>Puntaje (1–5)</span>
              </div>
              {SCORE_LABELS.map((label, i) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '1rem', alignItems: 'center', padding: '10px 14px', borderBottom: i < 4 ? '1px solid #f4f8f8' : 'none' }}>
                  <span style={{ fontSize: '.82rem', color: INK, fontWeight: 600 }}>{label}</span>
                  <ScoreBar score={scores[i]} />
                </div>
              ))}
            </div>

            {/* Profile sections */}
            {[
              { title: 'Formación', value: c.formation },
              { title: 'Experiencia relevante', value: c.relevant_experience },
              { title: 'Fortalezas técnicas', value: c.technical_strengths },
            ].map(s => s.value && (
              <div key={s.title} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.4rem' }}>{s.title}</div>
                <div style={{ fontSize: '.83rem', color: '#4a6a6a', lineHeight: 1.75, background: 'white', border: '1px solid #e0eaea', borderRadius: 10, padding: '.75rem 1rem', whiteSpace: 'pre-wrap' }}>{s.value}</div>
              </div>
            ))}

            {/* Q&A */}
            {c.qa_notes && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.4rem' }}>Preguntas y validaciones</div>
                <div style={{ fontSize: '.83rem', color: '#4a6a6a', lineHeight: 1.75, background: '#fffbea', border: '1px solid #fde68a', borderRadius: 10, padding: '.75rem 1rem', whiteSpace: 'pre-wrap' }}>{c.qa_notes}</div>
              </div>
            )}

            {/* CV section */}
            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 12, padding: '1rem 1.2rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.6rem' }}>📄 Hoja de vida (CV)</div>
              {c.cv_url ? (
                <a href={c.cv_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: FOREST, color: 'white', borderRadius: 8, padding: '8px 16px', textDecoration: 'none', fontSize: '.82rem', fontWeight: 600 }}>
                  Descargar CV →
                </a>
              ) : (
                <div style={{ fontSize: '.8rem', color: '#b0c4c4' }}>CV no disponible aún</div>
              )}
            </div>

            {/* Client notes */}
            <div style={{ marginTop: '1rem', background: '#f9fbfc', border: '1.5px solid #e0eaea', borderRadius: 12, padding: '1rem 1.2rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.5rem' }}>📝 Tus notas</div>
              <textarea
                style={{ ...ta, minHeight: 80, background: 'white' }}
                placeholder="Tus observaciones sobre este candidato…"
                value={clientNotes[c.id] || ''}
                onChange={e => setClientNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
              />
              <button onClick={() => saveClientNotes(c.id)} disabled={savingNotes === c.id}
                style={{ marginTop: '.5rem', fontSize: '.75rem', fontWeight: 600, padding: '6px 14px', borderRadius: 7, border: 'none', background: FOREST, color: 'white', cursor: 'pointer' }}>
                {savingNotes === c.id ? 'Guardando…' : 'Guardar nota'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ position: 'sticky', top: 68 }}>
            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 14, padding: '1.2rem', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.5rem' }}>Match Graph</div>
              <RadarChart scores={scores} size={220} />
              <div style={{ marginTop: '.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: fit >= 80 ? FOREST : fit >= 60 ? '#e6a817' : CORAL, lineHeight: 1 }}>{fit}%</div>
                <div style={{ fontSize: '.72rem', color: '#9aacac', marginTop: '.15rem' }}>Fit score general</div>
              </div>
            </div>

            {/* Observation */}
            <div style={{ background: OFF, borderRadius: 10, padding: '.75rem 1rem', fontSize: '.73rem', color: '#9aacac', lineHeight: 1.6 }}>
              <strong style={{ color: '#4a6a6a' }}>Escala:</strong> 1 = más bajo · 5 = más alto
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title={selEng!.title}
        actions={session?.isAdmin ? (
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <button onClick={() => { setEngForm({ title: selEng!.title, company_name: selEng!.company_name, client_email: selEng!.client_email, job_area: selEng!.job_area || '', city: selEng!.city || '', notes: selEng!.notes || '', status: selEng!.status }); setShowEditEng(true) }}
              style={{ background: 'rgba(255,255,255,.12)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem' }}>
              Editar
            </button>
            <button onClick={openAddCandidate}
              style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 }}>
              + Candidato
            </button>
          </div>
        ) : undefined}
      />

      {/* Tab navigation */}
      <div style={{ background: 'white', borderBottom: '1px solid #e0eaea', padding: '0 1.5rem', display: 'flex', gap: '2px', overflowX: 'auto' }}>
        <button onClick={() => setCandIdx(-1)}
          style={{ padding: '12px 16px', fontSize: '.8rem', fontWeight: candIdx === -1 ? 700 : 500, color: candIdx === -1 ? FOREST : '#9aacac', background: 'none', border: 'none', borderBottom: candIdx === -1 ? `2px solid ${FOREST}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}>
          Inicio
        </button>
        {candidates.map((c, i) => (
          <button key={c.id} onClick={() => setCandIdx(i)}
            style={{ padding: '12px 16px', fontSize: '.8rem', fontWeight: candIdx === i ? 700 : 500, color: candIdx === i ? FOREST : '#9aacac', background: 'none', border: 'none', borderBottom: candIdx === i ? `2px solid ${FOREST}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
            {c.is_top && <span style={{ fontSize: '.6rem' }}>⭐</span>}
            C{i + 1}: {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {candIdx === -1 ? <CoverView /> : currentCand ? <CandidateView c={currentCand} /> : null}
      </div>

      {/* Edit engagement modal */}
      {showEditEng && (
        <Modal title="Editar evaluación" onClose={() => setShowEditEng(false)}>
          {[
            { label: 'Cargo / Vacante', key: 'title' },
            { label: 'Empresa cliente', key: 'company_name' },
            { label: 'Email del cliente', key: 'client_email' },
            { label: 'Área', key: 'job_area' },
            { label: 'Ciudad', key: 'city' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{f.label}</label>
              <input style={inp} value={(engForm as Record<string, string>)[f.key] || ''} onChange={e => setEngForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Estado</label>
            <select style={inp} value={engForm.status} onChange={e => setEngForm(p => ({ ...p, status: e.target.value as 'open' | 'closed' }))}>
              <option value="open">Activa</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Notas</label>
            <textarea style={ta} value={engForm.notes} onChange={e => setEngForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <button onClick={saveEngagement} disabled={saving}
            style={{ width: '100%', background: saving ? '#9aacac' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </Modal>
      )}

      {/* Edit / add candidate modal */}
      {showEditCand && (
        <Modal title={editingCand ? 'Editar candidato' : 'Agregar candidato'} onClose={() => { setShowEditCand(false); setEditingCand(null) }}>
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nombre completo *</label>
            <input style={inp} placeholder="Nombre del candidato" value={candForm.name || ''} onChange={e => setCandForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Orden</label>
              <input style={inp} type="number" min={1} max={5} value={candForm.sort_order || 1} onChange={e => setCandForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Aspiración salarial</label>
              <input style={inp} placeholder="Ej: $3.500.000" value={candForm.salary_expectation || ''} onChange={e => setCandForm(p => ({ ...p, salary_expectation: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Movilidad</label>
            <input style={inp} placeholder="Ej: Cuenta con transporte propio" value={candForm.mobility || ''} onChange={e => setCandForm(p => ({ ...p, mobility: e.target.value }))} />
          </div>

          {/* Scores */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Puntajes (1–5)</div>
            {SCORE_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.4rem' }}>
                <span style={{ fontSize: '.78rem', color: '#4a6a6a', flex: 1 }}>{label}</span>
                <div style={{ display: 'flex', gap: '.2rem' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setCandForm(p => ({ ...p, [SCORE_KEYS[i]]: n }))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, background: (candForm[SCORE_KEYS[i]] || 3) === n ? FOREST : '#e0eaea', color: (candForm[SCORE_KEYS[i]] || 3) === n ? 'white' : '#4a6a6a', transition: 'all .1s' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Profile text fields */}
          {[
            { label: 'Formación', key: 'formation', placeholder: 'Universidad, carrera, posgrado…' },
            { label: 'Experiencia relevante', key: 'relevant_experience', placeholder: 'Empresas, roles, años de experiencia…' },
            { label: 'Fortalezas técnicas', key: 'technical_strengths', placeholder: 'Herramientas, habilidades, certificaciones…' },
            { label: 'Preguntas y validaciones', key: 'qa_notes', placeholder: 'Observaciones de la entrevista, puntos destacados…' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '.65rem' }}>
              <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{f.label}</label>
              <textarea style={ta} placeholder={f.placeholder} value={(candForm as Record<string, string>)[f.key] || ''} onChange={e => setCandForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          {/* Photo upload */}
          <div style={{ marginBottom: '.65rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Foto del candidato</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              {candForm.photo_url && <img src={candForm.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e0eaea' }} />}
              <label style={{ background: OFF, border: '1.5px dashed #d8e4e4', borderRadius: 8, padding: '8px 14px', fontSize: '.78rem', color: '#4a6a6a', cursor: 'pointer', fontWeight: 600 }}>
                {photoUploading ? 'Subiendo…' : candForm.photo_url ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={photoUploading} />
              </label>
              {candForm.photo_url && <span style={{ fontSize: '.7rem', color: '#9aacac' }}>✓ Foto cargada</span>}
            </div>
          </div>

          {/* CV upload */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '.73rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>CV / Hoja de vida</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <label style={{ background: OFF, border: '1.5px dashed #d8e4e4', borderRadius: 8, padding: '8px 14px', fontSize: '.78rem', color: '#4a6a6a', cursor: 'pointer', fontWeight: 600 }}>
                {cvUploading ? 'Subiendo…' : candForm.cv_url ? 'Cambiar CV' : 'Subir CV (PDF)'}
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCvUpload} disabled={cvUploading} />
              </label>
              {candForm.cv_url && <a href={candForm.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: FOREST, fontWeight: 600 }}>Ver CV →</a>}
            </div>
          </div>

          <button onClick={saveCandidate} disabled={saving || !candForm.name}
            style={{ width: '100%', background: saving || !candForm.name ? '#9aacac' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '11px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : editingCand ? 'Guardar cambios' : 'Agregar candidato'}
          </button>
        </Modal>
      )}
    </div>
  )
}
