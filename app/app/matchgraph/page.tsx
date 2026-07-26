'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, showToast } from '@/components/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { track } from '@/lib/analytics'

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
  share_token?: string
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
  client_feedback?: string
  pipeline_status?: string
}

interface ActivityEntry {
  id: string
  engagement_id: string
  candidate_id?: string
  actor_email: string
  action: string
  details?: string
  created_at: string
}

const SCORE_LABELS = ['Profesión', 'Años de experiencia', 'Experiencia en el sector', 'Requer. del cargo', 'Disponibilidad']
const SCORE_KEYS: (keyof Candidate)[] = ['score_profession', 'score_experience', 'score_sector', 'score_requirements', 'score_availability']

function avgScore(c: Candidate) {
  const vals = SCORE_KEYS.map(k => Number(c[k]) || 0)
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 20)
}

/* ── Mobile hook ─────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

/* ── Bird Logo ────────────────────────────────────────────── */
function BirdLogo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <img
      src="/bird-logo.png"
      alt="Candidato®"
      width={size}
      height={size}
      style={{
        borderRadius: 8,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  )
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
      <path d={poly(scorePoints)} fill={`${PALE}bb`} stroke={FOREST} strokeWidth={2} />
      {scorePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={FOREST} />)}
      {shortLabels.map((label, i) => {
        const p = pt(i, labelR)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={9.5} fill="#4a6a6a" fontFamily="Sora, system-ui, sans-serif">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Multi-candidate Radar chart ─────────────────────────── */
function MultiRadarChart({ cands, colors, size = 280 }: { cands: Candidate[]; colors: string[]; size?: number }) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.33
  const labelR = size * 0.47
  const n = 5
  const ang = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / n)
  const pt = (i: number, radius: number) => ({ x: cx + radius * Math.cos(ang(i)), y: cy + radius * Math.sin(ang(i)) })
  const poly = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'
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
      {cands.map((c, ci) => {
        const scores = SCORE_KEYS.map(k => Number(c[k]) || 0)
        const scorePoints = scores.map((s, i) => pt(i, (Math.max(1, Math.min(5, s)) / 5) * r))
        const color = colors[ci] || FOREST
        return (
          <g key={c.id}>
            <path d={poly(scorePoints)} fill={`${color}33`} stroke={color} strokeWidth={2} />
            {scorePoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />)}
          </g>
        )
      })}
      {shortLabels.map((label, i) => {
        const p = pt(i, labelR)
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={9.5} fill="#4a6a6a" fontFamily="Sora, system-ui, sans-serif">
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
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, width: 14, textAlign: 'right' }}>{score}</span>
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const isMobile = useIsMobile()
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,30,32,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: 'white', borderRadius: 18, padding: isMobile ? '1.2rem' : '1.6rem', width: isMobile ? '95vw' : '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(14,30,32,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.3rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: INK, fontFamily: 'var(--head)' }}>{title}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#9aacac', lineHeight: 1, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #d8e4e4', borderRadius: 9, padding: '10px 13px', fontSize: '.83rem', fontFamily: 'var(--body)', outline: 'none', boxSizing: 'border-box', background: '#fafcfc', color: INK, transition: 'border-color .15s' }
const ta: React.CSSProperties = { ...inp, resize: 'vertical', minHeight: 76, lineHeight: 1.6 }

/* ── Main Page ────────────────────────────────────────────── */
function MatchGraphInner() {
  type View = 'login' | 'dashboard' | 'engagement'
  const isMobile = useIsMobile()
  const [view, setView] = useState<View>('login')
  const [session, setSession] = useState<{ email: string; isAdmin: boolean } | null>(null)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [selEng, setSelEng] = useState<Engagement | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candIdx, setCandIdx] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [engLoading, setEngLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginModal, setLoginModal] = useState<{ type: 'error' | 'welcome'; companyName?: string } | null>(null)

  const [showCreateEng, setShowCreateEng] = useState(false)
  const [showEditEng, setShowEditEng] = useState(false)
  const [showEditCand, setShowEditCand] = useState(false)
  const [editingCand, setEditingCand] = useState<Candidate | null>(null)
  const [saving, setSaving] = useState(false)

  const [engForm, setEngForm] = useState({ title: '', company_name: '', client_email: '', job_area: '', city: '', notes: '', status: 'open' as 'open' | 'closed' })
  const [candForm, setCandForm] = useState<Partial<Candidate>>({})
  const [photoUploading, setPhotoUploading] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)

  const [clientNotes, setClientNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState<string | null>(null)

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)

  // Activity log
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  // Share token
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Feedback & pipeline saving state
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null)
  const [savingPipeline, setSavingPipeline] = useState<string | null>(null)
  const [notifying, setNotifying] = useState(false)

  // Dashboard admin controls
  const [dashView, setDashView] = useState<'byCompany' | 'byList'>('byCompany')
  const [searchQuery, setSearchQuery] = useState('')
  const [notifyingId, setNotifyingId] = useState<string | null>(null)
  const [notifiedAt, setNotifiedAt] = useState<Record<string, number>>({})

  // Share link expiry
  const [shareExpiryDays, setShareExpiryDays] = useState<number>(30)

  // Touch / swipe state for candidate navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // Drag-and-drop reorder (admin only)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
    const email = loginEmail.trim().toLowerCase()
    if (!email) return
    setLoginLoading(true)
    try {
      const res = await fetch('/api/matchgraph-auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setLoginLoading(false)
      if (!res.ok) {
        setLoginModal({ type: 'error' })
        return
      }
      const data = await res.json()
      // Show welcome modal for client users, skip for admin
      if (!data.isAdmin) {
        setLoginModal({ type: 'welcome', companyName: data.companyName })
      }
      track('matchgraph_login', { is_admin: data.isAdmin })
      setSession({ email, isAdmin: data.isAdmin })
      if (data.isAdmin) {
        setView('dashboard')
        await loadEngagements()
      }
    } catch {
      setLoginLoading(false)
      setLoginModal({ type: 'error' })
    }
  }

  async function openEngagement(eng: Engagement) {
    setEngLoading(true)
    const res = await fetch(`/api/matchgraph?action=detail&id=${eng.id}`)
    const data = await res.json()
    setSelEng(data.engagement)
    const cands = data.candidates || []
    setCandidates(cands)
    setClientNotes(Object.fromEntries(cands.map((c: Candidate) => [c.id, c.client_notes || ''])))
    setShareToken(data.engagement?.share_token || null)
    setCandIdx(-1); setShowActivity(false); setActivity([])
    setView('engagement')
    setEngLoading(false)
  }

  async function saveFeedback(candId: string, feedback: string) {
    setSavingFeedback(candId)
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_feedback', candidateId: candId, client_feedback: feedback }),
    })
    setSavingFeedback(null)
    if (res.ok) {
      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, client_feedback: feedback } : c))
      showToast('Feedback guardado', 'success')
      // Notify admin of client feedback
      const cand = candidates.find(c => c.id === candId)
      if (cand && selEng && session && !session.isAdmin) {
        fetch('/api/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'matchgraph_client_feedback',
            to: ADMIN_EMAIL,
            name: 'Equipo Candidato',
            extra: {
              jobTitle: selEng.title,
              companyName: selEng.company_name,
              candidateName: cand.name,
              feedback,
            },
          }),
        }).catch(() => {})
      }
    } else showToast('Error al guardar feedback', 'error')
  }

  async function updatePipelineStatus(candId: string, status: string) {
    setSavingPipeline(candId)
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_pipeline_status', candidateId: candId, pipeline_status: status }),
    })
    setSavingPipeline(null)
    if (res.ok) {
      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, pipeline_status: status } : c))
      showToast('Estado actualizado', 'success')
    } else showToast('Error al actualizar estado', 'error')
  }

  async function loadActivity() {
    if (!selEng) return
    setActivityLoading(true)
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_activity', engagement_id: selEng.id }),
    })
    const data = await res.json()
    setActivity(data.activity || [])
    setActivityLoading(false)
    setShowActivity(true)
  }

  async function generateShare() {
    if (!selEng) return
    setShareLoading(true)
    const expiresAt = shareExpiryDays
      ? new Date(Date.now() + shareExpiryDays * 864e5).toISOString()
      : null
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_share', engagement_id: selEng.id, expires_at: expiresAt }),
    })
    const data = await res.json()
    setShareLoading(false)
    if (res.ok && data.share_token) {
      setShareToken(data.share_token)
      setShowShareModal(true)
    } else showToast('Error al generar enlace', 'error')
  }

  async function notifyClient() {
    if (!selEng) return
    setNotifying(true)
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notify_client', engagement_id: selEng.id }),
    })
    setNotifying(false)
    if (res.ok) showToast(`Email enviado a ${selEng.client_email}`, 'success')
    else showToast('Error al enviar notificación', 'error')
  }

  async function notifyClientById(engId: string, clientEmail: string) {
    setNotifyingId(engId)
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notify_client', engagement_id: engId }),
    })
    setNotifyingId(null)
    if (res.ok) {
      setNotifiedAt(prev => ({ ...prev, [engId]: Date.now() }))
      showToast(`Notificación enviada a ${clientEmail}`, 'success')
    } else showToast('Error al enviar notificación', 'error')
  }

  function companyColor(str: string) {
    const palette = [FOREST, '#2A7E4E', '#4A6FA5', '#7C3AED', '#D97706', '#0891B2', '#BE185D']
    let h = 0
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
    return palette[Math.abs(h) % palette.length]
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 2) return 'Ahora'
    if (m < 60) return `Hace ${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `Hace ${h}h`
    const d = Math.floor(h / 24)
    if (d === 1) return 'Ayer'
    if (d < 30) return `Hace ${d}d`
    return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
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
    const engId = selEng.id
    const body = { action: 'upsert_candidate', ...candForm, engagement_id: engId, id: editingCand?.id }
    try {
      const saveRes = await fetch('/api/matchgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setSaving(false); setShowEditCand(false); setEditingCand(null)
      if (saveRes.ok) {
        showToast('Candidato guardado', 'success')
      } else {
        const errData = await saveRes.json().catch(() => ({}))
        console.error('[MG] saveCandidate error:', errData)
        showToast(errData.error ? `Error: ${errData.error}` : 'Error al guardar', 'error')
      }
    } catch (e) {
      setSaving(false); setShowEditCand(false); setEditingCand(null)
      console.error('[MG] saveCandidate exception:', e)
      showToast('Error de red al guardar', 'error')
    }
    const res = await fetch(`/api/matchgraph?action=detail&id=${engId}`)
    const data = await res.json()
    setCandidates(data.candidates || [])
    if (showActivity) loadActivity()
  }

  async function deleteCandidate(id: string) {
    if (!confirm('¿Eliminar este candidato?')) return
    await fetch('/api/matchgraph', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_candidate', id }) })
    setCandidates(prev => {
      const next = prev.filter(c => c.id !== id)
      if (candIdx >= next.length) setCandIdx(Math.max(-1, next.length - 1))
      return next
    })
  }

  async function handleReorder(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) { setDragIndex(null); setDragOverIndex(null); return }
    const newCands = [...candidates]
    const [moved] = newCands.splice(fromIdx, 1)
    newCands.splice(toIdx, 0, moved)
    const updated = newCands.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCandidates(updated)
    setDragIndex(null); setDragOverIndex(null)
    const results = await Promise.all(updated.map(c =>
      fetch('/api/matchgraph', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert_candidate', id: c.id, sort_order: c.sort_order }),
      })
    ))
    if (results.every(r => r.ok)) showToast('Reordenados correctamente', 'success')
    else showToast('Error al guardar', 'error')
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
    const res = await fetch('/api/matchgraph', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_client_notes', candidateId: candId, client_notes: clientNotes[candId] || '' }),
    })
    setSavingNotes(null)
    if (res.ok) showToast('Nota guardada', 'success')
    else showToast('Error al guardar', 'error')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: FOREST }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/bird-logo.png" width={48} height={48} alt="" style={{ borderRadius: 12, filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem', marginTop: '1rem', letterSpacing: '.05em' }}>Cargando…</div>
      </div>
    </div>
  )

  /* ── LOGIN ───────────────────────────────────────────────── */
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', display: 'flex', background: FOREST, fontFamily: 'var(--body)' }}>
      <style>{`
        .mg-panel { display: flex; }
        .mg-mobile-brand { display: none; }
        .mg-desktop-logo { display: flex; }
        @media (max-width: 820px) {
          .mg-panel { display: none !important; }
          .mg-mobile-brand { display: flex !important; }
          .mg-desktop-logo { display: none !important; }
        }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* Left branding panel */}
      <div className="mg-panel" style={{ flex: '0 0 420px', flexDirection: 'column', justifyContent: 'center', padding: '3rem 3.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(228,240,241,.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
            <BirdLogo size={40} light />
            <div>
              <div style={{ color: 'white', fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-.01em' }}>Candidato®</div>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.6rem', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>Candidato® — Match Graph</div>
            </div>
          </div>

          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.75rem' }}>
            Preselección &amp; Validación
          </div>
          <h1 style={{ fontFamily: 'var(--head)', fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.25, margin: '0 0 .5rem', letterSpacing: '-.02em' }}>
            <span style={{ color: 'white' }}>El talento que</span><br />
            <span style={{ color: CORAL }}>ya fue validado.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.84rem', lineHeight: 1.75, margin: '0 0 2.5rem' }}>
            Perfiles preseleccionados y validados por el equipo de Candidato® para tu proceso de selección.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[
              'Scores de compatibilidad por dimensión',
              'Match Graph radar comparativo',
              'Perfiles validados + CV descargable',
              'Notas privadas por candidato',
              'Entrevistas coordinadas en un clic',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ color: CORAL, fontWeight: 800, fontSize: '.85rem', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,.65)', fontSize: '.81rem' }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.73rem' }}>—</span>
            <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.73rem', lineHeight: 1.5 }}>Acceso privado por email · datos cifrados en tránsito</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 2rem', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile-only logo */}
          <div className="mg-mobile-brand" style={{ alignItems: 'center', gap: 10, marginBottom: '2rem', display: 'none' }}>
            <BirdLogo size={36} />
            <div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.05rem', color: FOREST }}>Candidato®</div>
              <div style={{ fontSize: '.6rem', color: '#9aacac', letterSpacing: '.12em', textTransform: 'uppercase' }}>Match Graph</div>
            </div>
          </div>

          <div className="mg-desktop-logo" style={{ alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <BirdLogo size={28} />
            <span style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.95rem', color: FOREST, letterSpacing: '-.01em' }}>Candidato®</span>
          </div>

          <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.55rem', color: INK, marginBottom: '.4rem', letterSpacing: '-.025em', lineHeight: 1.2 }}>
            Accedé a tu evaluación
          </div>
          <p style={{ fontSize: '.83rem', color: '#9aacac', margin: '0 0 2rem', lineHeight: 1.65 }}>
            Ingresá el email corporativo con el que coordinaste el servicio de Preselección &amp; Validación.
          </p>

          <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Tu email para continuar
          </label>
          <input
            style={{ ...inp, marginBottom: '.85rem', borderRadius: 8, padding: '12px 14px', fontSize: '.88rem' }}
            type="email"
            placeholder="empresa@corporativo.com"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />

          {/* Modals live outside the form; handled below */}

          <button
            onClick={handleLogin}
            disabled={loginLoading || !loginEmail.trim()}
            style={{ width: '100%', background: loginLoading || !loginEmail.trim() ? '#b0c0c0' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: '.92rem', fontWeight: 700, cursor: loginLoading || !loginEmail.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--body)', transition: 'all .15s', letterSpacing: '-.01em' }}
          >
            {loginLoading ? 'Verificando…' : 'Continuar'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '.75rem', color: '#b0c4c4', margin: '1.2rem 0 0', lineHeight: 1.5 }}>
            ¿Aún no tenés acceso?{' '}
            <a href="https://wa.me/573205046723" target="_blank" rel="noopener noreferrer" style={{ color: FOREST, fontWeight: 600, textDecoration: 'none', display: 'inline-block', padding: '.5rem 0' }}>
              Contactá a tu consultor
            </a>
          </p>
        </div>
      </div>

      {/* ── Error modal: email not registered ── */}
      {loginModal?.type === 'error' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,30,32,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2rem 2rem 1.75rem', maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(14,30,32,.25)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff4f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontWeight: 700, fontSize: '1.3rem', color: CORAL, fontFamily: 'var(--head)' }}>!</div>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.15rem', color: INK, marginBottom: '.6rem' }}>
              Empresa no encontrada
            </div>
            <p style={{ fontFamily: 'var(--body)', fontSize: '.87rem', color: '#6a8a8a', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              No encontramos ninguna empresa registrada con el email <strong style={{ color: INK }}>{loginEmail.trim().toLowerCase()}</strong>.<br /><br />
              Si ya contrataste el servicio de Preselección &amp; Validación, contactá a tu consultor para que active tu acceso.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <a
                href="https://wa.me/573205046723"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', background: '#25D366', color: 'white', borderRadius: 10, padding: '.8rem', fontSize: '.9rem', fontWeight: 700, fontFamily: 'var(--body)', textDecoration: 'none', textAlign: 'center' }}
              >
                Contactar por WhatsApp
              </a>
              <button
                onClick={() => setLoginModal(null)}
                style={{ background: 'none', border: '1.5px solid #d8e0e1', borderRadius: 10, padding: '.75rem', fontSize: '.87rem', color: FOREST, fontWeight: 600, fontFamily: 'var(--body)', cursor: 'pointer' }}
              >
                Intentar con otro email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome modal: client recognized ── */}
      {loginModal?.type === 'welcome' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,30,32,.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '2rem 2rem 1.75rem', maxWidth: 380, width: '100%', boxShadow: '0 24px 64px rgba(14,30,32,.25)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1.3rem', color: FOREST }}>✓</div>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.15rem', color: INK, marginBottom: '.5rem' }}>
              ¡Bienvenido de vuelta{loginModal.companyName ? `, ${loginModal.companyName}` : ''}!
            </div>
            <p style={{ fontFamily: 'var(--body)', fontSize: '.87rem', color: '#6a8a8a', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Accediste como <strong style={{ color: FOREST }}>{loginEmail.trim().toLowerCase()}</strong>. Tus evaluaciones de Preselección &amp; Validación están listas.
            </p>
            <button
              onClick={async () => {
                setLoginModal(null)
                setView('dashboard')
                await loadEngagements()
              }}
              style={{ width: '100%', background: FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '.85rem', fontSize: '.95rem', fontWeight: 700, fontFamily: 'var(--body)', cursor: 'pointer' }}
            >
              Ver mis evaluaciones
            </button>
          </div>
        </div>
      )}
    </div>
  )

  /* ── TOP BAR ─────────────────────────────────────────────── */
  const TopBar = ({ title, actions }: { title?: string; actions?: React.ReactNode }) => {
    const isAdmin = session?.isAdmin
    const userInitial = session?.email?.[0]?.toUpperCase() || '?'
    const shortEmail = session?.email ? (session.email.length > 26 ? session.email.slice(0, 24) + '…' : session.email) : ''
    return (
      <div className="no-print" style={{ background: FOREST, padding: '0 max(1.5rem, 2vw)', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 0 rgba(255,255,255,.07), 0 2px 12px rgba(0,0,0,.18)' }}>

        {/* Left: back nav + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 0 }}>
          {view === 'engagement' && (
            <button
              onClick={() => setView('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', borderRadius: 8, padding: '5px 10px 5px 2px', cursor: 'pointer', fontSize: '.76rem', fontWeight: 500, fontFamily: 'var(--body)', marginRight: 10, transition: 'color .15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>
              ← {isMobile ? '' : 'Evaluaciones'}
            </button>
          )}

          {/* Logo lockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <BirdLogo size={28} light />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: 'white', fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.97rem', letterSpacing: '-.02em' }}>
                Candidato®
              </span>
              {!isMobile && (
                <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)', fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', borderRadius: 5, padding: '2px 7px', fontFamily: 'var(--body)', border: '1px solid rgba(255,255,255,.08)' }}>
                  Match Graph
                </span>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          {title && !isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 18, paddingLeft: 18, borderLeft: '1px solid rgba(255,255,255,.1)', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.8rem', fontFamily: 'var(--body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{title}</span>
            </div>
          )}
        </div>

        {/* Right: actions + user chip + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Admin shortcut actions */}
          {isAdmin && view === 'dashboard' && !isMobile && (
            <a href="/app/matchgraph/admin" style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,.55)', textDecoration: 'none', fontSize: '.74rem', fontWeight: 600, fontFamily: 'var(--body)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '5px 10px', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,.55)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.06)' }}>
              Métricas
            </a>
          )}

          {/* Slot for page-specific actions (e.g. "+ Nueva evaluación") */}
          {actions}

          {/* User chip */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 6px', background: 'rgba(255,255,255,.07)', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', maxWidth: 220, overflow: 'hidden' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: isAdmin ? CORAL : 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 800, color: 'white', flexShrink: 0, letterSpacing: '-.01em' }}>
                {userInitial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.85)', fontFamily: 'var(--body)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{shortEmail}</div>
                {isAdmin && (
                  <div style={{ fontSize: '.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: CORAL, lineHeight: 1 }}>Super Admin</div>
                )}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, fontFamily: 'var(--body)', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.13)'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.6)' }}>
            {isMobile ? '→' : 'Salir'}
          </button>
        </div>
      </div>
    )
  }

  /* ── DASHBOARD ───────────────────────────────────────────── */
  if (view === 'dashboard') {
    const isAdmin = session?.isAdmin
    const open = engagements.filter(e => e.status === 'open')
    const closed = engagements.filter(e => e.status === 'closed')

    // Group by company/client for admin view
    type CompanyGroup = {
      email: string
      company_name: string
      color: string
      engagements: Engagement[]
      openCount: number
      closedCount: number
      latestAt: string
    }
    const groups: CompanyGroup[] = Object.values(
      engagements.reduce((acc: Record<string, CompanyGroup>, eng) => {
        const key = eng.client_email.toLowerCase()
        if (!acc[key]) acc[key] = {
          email: key,
          company_name: eng.company_name || key,
          color: companyColor(eng.company_name || key),
          engagements: [],
          openCount: 0,
          closedCount: 0,
          latestAt: eng.created_at,
        }
        acc[key].engagements.push(eng)
        if (eng.status === 'open') acc[key].openCount++
        else acc[key].closedCount++
        if (eng.created_at > acc[key].latestAt) acc[key].latestAt = eng.created_at
        return acc
      }, {})
    ).sort((a, b) => b.latestAt.localeCompare(a.latestAt))

    const q = searchQuery.trim().toLowerCase()
    const filteredGroups = q
      ? groups.filter(g => g.company_name.toLowerCase().includes(q) || g.email.includes(q))
      : groups
    const filteredFlat = q
      ? engagements.filter(e => e.company_name?.toLowerCase().includes(q) || e.client_email.includes(q) || e.title.toLowerCase().includes(q))
      : engagements

    // Reusable engagement card
    function EngCard({ eng, showCompany = false }: { eng: Engagement; showCompany?: boolean }) {
      const color = companyColor(eng.company_name || eng.client_email)
      const sent = notifiedAt[eng.id]
      const isSending = notifyingId === eng.id
      return (
        <div style={{ background: 'white', border: `1.5px solid ${eng.status === 'open' ? 'rgba(27,59,62,.1)' : '#eaeaea'}`, borderRadius: 14, overflow: 'hidden', transition: 'box-shadow .18s', boxShadow: '0 1px 6px rgba(14,30,32,.04)' }}>
          {/* Clickable main area */}
          <button
            onClick={() => openEngagement(eng)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '1.1rem 1.25rem .75rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.55rem' }}>
              {showCompany && (
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontWeight: 800, fontSize: '.85rem', color, flexShrink: 0 }}>
                  {eng.company_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span style={{ flex: 1, fontWeight: 700, fontSize: '.88rem', color: INK, lineHeight: 1.3 }}>{eng.title}</span>
              <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: eng.status === 'open' ? '#e6f4ec' : '#f0f0ef', color: eng.status === 'open' ? '#2A7E4E' : '#999', textTransform: 'uppercase', letterSpacing: '.07em', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {eng.status === 'open' ? 'Activa' : 'Cerrada'}
              </span>
            </div>
            {showCompany && <div style={{ fontSize: '.78rem', color: '#4a6a6a', marginBottom: '.15rem', fontWeight: 500 }}>{eng.company_name}</div>}
            {(eng.job_area || eng.city) && (
              <div style={{ fontSize: '.71rem', color: '#9aacac' }}>{[eng.job_area, eng.city].filter(Boolean).join(' · ')}</div>
            )}
            <div style={{ fontSize: '.66rem', color: '#b8caca', marginTop: '.4rem' }}>
              {timeAgo(eng.created_at)}
            </div>
          </button>
          {/* Admin footer: notify button */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid #f0f4f4', padding: '.55rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
              <span style={{ fontSize: '.67rem', color: '#9aacac', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eng.client_email}</span>
              <button
                onClick={(e) => { e.stopPropagation(); notifyClientById(eng.id, eng.client_email) }}
                disabled={isSending}
                style={{ background: sent ? '#e6f4ec' : PALE, color: sent ? '#2A7E4E' : FOREST, border: 'none', borderRadius: 7, padding: '4px 10px', cursor: isSending ? 'not-allowed' : 'pointer', fontSize: '.67rem', fontWeight: 700, fontFamily: 'var(--body)', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s', opacity: isSending ? 0.6 : 1 }}
              >
                {isSending ? '…' : sent ? `✓ Enviado ${timeAgo(new Date(sent).toISOString())}` : 'Notificar'}
              </button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div style={{ minHeight: '100vh', background: OFF, display: 'flex', flexDirection: 'column', fontFamily: 'var(--body)' }}>
        <TopBar actions={isAdmin ? (
          <button
            onClick={() => { setEngForm({ title: '', company_name: '', client_email: '', job_area: '', city: '', notes: '', status: 'open' }); setShowCreateEng(true) }}
            style={{ background: CORAL, border: 'none', color: 'white', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--body)', letterSpacing: '.01em', whiteSpace: 'nowrap' }}>
            + {isMobile ? 'Nueva' : 'Nueva evaluación'}
          </button>
        ) : undefined} />

        <div style={{ maxWidth: 1020, margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem', width: '100%' }}>

          {/* ── Page header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: isMobile ? '1.3rem' : '1.55rem', color: INK, margin: '0 0 .3rem', letterSpacing: '-.02em' }}>
                {isAdmin ? 'Clientes & Evaluaciones' : 'Tus evaluaciones de Preselección'}
              </h1>
              <p style={{ fontSize: '.8rem', color: '#9aacac', margin: 0 }}>
                {isAdmin
                  ? `${groups.length} cliente${groups.length !== 1 ? 's' : ''} · ${engagements.length} evaluacion${engagements.length !== 1 ? 'es' : ''}`
                  : `${engagements.length} evaluacion${engagements.length !== 1 ? 'es' : ''} disponible${engagements.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            {/* Admin: view toggle */}
            {isAdmin && engagements.length > 0 && !isMobile && (
              <div style={{ display: 'flex', background: '#eaeae6', borderRadius: 9, padding: 3, gap: 3, flexShrink: 0 }}>
                {([['byCompany', 'Empresas'], ['byList', 'Lista']] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setDashView(v)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--body)', background: dashView === v ? 'white' : 'transparent', color: dashView === v ? FOREST : '#9aacac', boxShadow: dashView === v ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Admin KPI row ── */}
          {isAdmin && engagements.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: '.65rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Clientes', value: groups.length, color: '#4A6FA5', icon: null },
                { label: 'Evaluaciones', value: engagements.length, color: FOREST, icon: null },
                { label: 'Activas', value: open.length, color: '#2A7E4E', icon: null },
                { label: 'Cerradas', value: closed.length, color: '#888', icon: null },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', border: '1px solid #e4eaea', borderRadius: 12, padding: '.85rem 1rem' }}>
                  <div style={{ fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#9aacac', marginBottom: '.25rem' }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: 'var(--head)', fontSize: '1.7rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Search bar (admin) ── */}
          {isAdmin && engagements.length > 0 && (
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9aacac', pointerEvents: 'none', display: 'flex' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></span>
              <input
                type="text"
                placeholder="Buscar empresa, email o cargo…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ ...inp, paddingLeft: 36, borderRadius: 10, fontSize: '.85rem' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aacac', fontSize: '1rem', lineHeight: 1, padding: 4 }}>×</button>
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {engLoading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9aacac', fontSize: '.85rem' }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${FOREST}22`, borderTopColor: FOREST, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              Cargando evaluaciones…
            </div>
          )}

          {/* ── Empty state ── */}
          {!engLoading && engagements.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'white', borderRadius: 16, border: '1px solid #e8eded' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1B3B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg></div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.05rem', color: INK, marginBottom: '.5rem' }}>Sin evaluaciones aún</div>
              {isAdmin
                ? <div style={{ fontSize: '.83rem', color: '#9aacac' }}>Creá la primera evaluación con el botón de arriba.</div>
                : <div style={{ fontSize: '.83rem', color: '#9aacac', lineHeight: 1.7 }}>Cuando tu consultor abra una evaluación para vos, aparecerá aquí.<br />¿Dudas? <a href="https://wa.me/573205046723" target="_blank" rel="noopener noreferrer" style={{ color: FOREST, fontWeight: 600, textDecoration: 'none' }}>Escribinos por WhatsApp →</a></div>
              }
            </div>
          )}

          {/* ── No search results ── */}
          {!engLoading && engagements.length > 0 && searchQuery && filteredGroups.length === 0 && filteredFlat.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: 14, border: '1px solid #e8eded' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B3B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, color: INK, marginBottom: '.4rem' }}>Sin resultados</div>
              <div style={{ fontSize: '.82rem', color: '#9aacac' }}>No encontramos nada para &ldquo;{searchQuery}&rdquo;</div>
            </div>
          )}

          {/* ── ADMIN: BY COMPANY VIEW ── */}
          {isAdmin && !engLoading && (dashView === 'byCompany' || isMobile) && filteredGroups.map(group => (
            <div key={group.email} style={{ marginBottom: '2rem' }}>
              {/* Company header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '.75rem', padding: '.9rem 1.1rem', background: 'white', borderRadius: 13, border: '1px solid #e8edf0', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${group.color}18`, border: `1.5px solid ${group.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontWeight: 800, fontSize: '1rem', color: group.color, flexShrink: 0 }}>
                  {group.company_name[0]?.toUpperCase() || '?'}
                </div>
                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.97rem', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.company_name}</div>
                  <div style={{ fontSize: '.72rem', color: '#9aacac', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.email}</div>
                </div>
                {/* Eval pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
                  {group.openCount > 0 && (
                    <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#e6f4ec', color: '#2A7E4E', whiteSpace: 'nowrap' }}>
                      {group.openCount} activa{group.openCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {group.closedCount > 0 && (
                    <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f0f0ef', color: '#888', whiteSpace: 'nowrap' }}>
                      {group.closedCount} cerrada{group.closedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {/* Last activity */}
                {!isMobile && (
                  <span style={{ fontSize: '.67rem', color: '#b8caca', flexShrink: 0 }}>{timeAgo(group.latestAt)}</span>
                )}
              </div>
              {/* Engagement cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: '.75rem', paddingLeft: isMobile ? 0 : '3.2rem' }}>
                {group.engagements.map(eng => <EngCard key={eng.id} eng={eng} />)}
              </div>
            </div>
          ))}

          {/* ── ADMIN: FLAT LIST VIEW ── */}
          {isAdmin && !engLoading && dashView === 'byList' && !isMobile && (
            <>
              {[{ label: 'Abiertas', items: filteredFlat.filter(e => e.status === 'open') }, { label: 'Cerradas', items: filteredFlat.filter(e => e.status === 'closed') }].map(({ label, items }) => items.length > 0 && (
                <div key={label} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac' }}>{label}</div>
                    <div style={{ height: 1, flex: 1, background: '#e8eded' }} />
                    <div style={{ fontSize: '.68rem', color: '#b8caca' }}>{items.length}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '.75rem' }}>
                    {items.map(eng => <EngCard key={eng.id} eng={eng} showCompany />)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── CLIENT VIEW ── */}
          {!isAdmin && !engLoading && engagements.length > 0 && (
            <>
              {[{ label: 'Abiertas', items: engagements.filter(e => e.status === 'open') }, { label: 'Cerradas', items: engagements.filter(e => e.status === 'closed') }].map(({ label, items }) => items.length > 0 && (
                <div key={label} style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac' }}>{label}</div>
                    <div style={{ height: 1, flex: 1, background: '#e8eded' }} />
                    <div style={{ fontSize: '.68rem', color: '#b8caca' }}>{items.length}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: '.75rem' }}>
                    {items.map(eng => <EngCard key={eng.id} eng={eng} showCompany />)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Create engagement modal ── */}
        {showCreateEng && (
          <Modal title="Nueva evaluación" onClose={() => setShowCreateEng(false)}>
            {[
              { label: 'Cargo / Vacante *', key: 'title', placeholder: 'Ej: Analista de Calidad' },
              { label: 'Empresa cliente *', key: 'company_name', placeholder: 'Nombre de la empresa' },
              { label: 'Email del cliente *', key: 'client_email', placeholder: 'contacto@empresa.com' },
              { label: 'Área', key: 'job_area', placeholder: 'Ej: Tecnología / IT' },
              { label: 'Ciudad', key: 'city', placeholder: 'Ej: Cali' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '.75rem' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
                <input style={inp} placeholder={f.placeholder} value={(engForm as Record<string, string>)[f.key] || ''} onChange={e => setEngForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Notas internas</label>
              <textarea style={ta} placeholder="Notas sobre la evaluación…" value={engForm.notes} onChange={e => setEngForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <button
              onClick={saveEngagement}
              disabled={saving || !engForm.title || !engForm.client_email || !engForm.company_name}
              style={{ width: '100%', background: !engForm.title || !engForm.client_email || !engForm.company_name ? '#b0c0c0' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)', transition: 'background .15s' }}>
              {saving ? 'Guardando…' : 'Crear evaluación'}
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
    const overallAvgs = candidates.map(c => ({ name: c.name.split(' ')[0], score: avgScore(c), isTop: c.is_top, photo_url: c.photo_url }))
    return (
      <div style={{ padding: '2.5rem 2rem', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.13em', color: '#9aacac', marginBottom: '.6rem' }}>
            Preselección & Validación
          </div>
          <h1 style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '2rem', color: INK, margin: '0 0 .35rem', letterSpacing: '-.02em', lineHeight: 1.2 }}>{selEng!.title}</h1>
          <div style={{ fontSize: '.88rem', color: '#4a6a6a' }}>
            {selEng!.company_name}{selEng!.city ? ` · ${selEng!.city}` : ''}{selEng!.job_area ? ` · ${selEng!.job_area}` : ''}
          </div>
        </div>

        {candidates.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac' }}>
                {candidates.length} candidato{candidates.length !== 1 ? 's' : ''} evaluado{candidates.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                {session?.isAdmin && candidates.length > 1 && !compareMode && (
                  <div style={{ fontSize: '.7rem', color: '#b0c4c4', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <span>⠿</span> Arrastrá para reordenar
                  </div>
                )}
                {candidates.length >= 2 && !compareMode && (
                  <button onClick={() => { setCompareMode(true); setCompareIds([]) }}
                    style={{ fontSize: '.72rem', fontWeight: 700, padding: '5px 13px', borderRadius: 8, border: `1.5px solid ${FOREST}`, background: 'white', color: FOREST, cursor: 'pointer', transition: 'all .15s' }}>
                    Comparar
                  </button>
                )}
                {compareMode && (
                  <>
                    <span style={{ fontSize: '.72rem', color: '#4a6a6a' }}>
                      {compareIds.length < 2 ? `Seleccioná ${2 - compareIds.length} más` : `${compareIds.length} seleccionados`}
                    </span>
                    {compareIds.length >= 2 && (
                      <button onClick={() => setShowCompare(true)}
                        style={{ fontSize: '.72rem', fontWeight: 700, padding: '5px 13px', borderRadius: 8, border: 'none', background: FOREST, color: 'white', cursor: 'pointer' }}>
                        Ver comparación
                      </button>
                    )}
                    <button onClick={() => { setCompareMode(false); setCompareIds([]) }}
                      style={{ fontSize: '.72rem', fontWeight: 600, padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e0eaea', background: 'white', color: '#9aacac', cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mg-cover-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: '.75rem', marginBottom: '2rem' }}>
              {overallAvgs.map((c, i) => {
                const cand = candidates[i]
                const isSelected = compareIds.includes(cand.id)
                const canSelect = compareIds.length < 3 || isSelected
                return (
                  <div
                    key={i}
                    draggable={session?.isAdmin && !compareMode}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={e => { e.preventDefault(); setDragOverIndex(i) }}
                    onDrop={() => { if (dragIndex !== null) handleReorder(dragIndex, i) }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                    onClick={() => {
                      if (compareMode) {
                        if (!canSelect && !isSelected) return
                        setCompareIds(prev => isSelected ? prev.filter(id => id !== cand.id) : [...prev, cand.id])
                      } else {
                        setCandIdx(i)
                      }
                    }}
                    style={{
                      background: compareMode && isSelected ? PALE : 'white',
                      border: `1.5px solid ${compareMode ? (isSelected ? FOREST : canSelect ? '#d0e4e4' : '#efefef') : dragOverIndex === i ? FOREST : c.isTop ? `${FOREST}55` : '#e0eaea'}`,
                      borderRadius: 13,
                      padding: '1.1rem .8rem',
                      cursor: compareMode ? (canSelect || isSelected ? 'pointer' : 'not-allowed') : session?.isAdmin ? 'grab' : 'pointer',
                      textAlign: 'center',
                      transition: 'all .15s',
                      position: 'relative',
                      opacity: dragIndex === i ? 0.45 : compareMode && !canSelect && !isSelected ? 0.4 : 1,
                      transform: dragOverIndex === i && dragIndex !== i ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: compareMode && isSelected ? `0 4px 16px rgba(27,59,62,.15)` : dragOverIndex === i ? `0 4px 16px rgba(27,59,62,.15)` : '0 2px 6px rgba(14,30,32,.04)',
                      userSelect: 'none',
                    }}
                  >
                    {compareMode && isSelected && (
                      <div style={{ position: 'absolute', top: 7, right: 7, width: 18, height: 18, borderRadius: '50%', background: FOREST, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', color: 'white', fontWeight: 700 }}>✓</div>
                    )}
                    {c.isTop && (
                      <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', background: FOREST, color: 'white', fontSize: '.58rem', fontWeight: 700, padding: '2px 9px', borderRadius: 10, whiteSpace: 'nowrap', letterSpacing: '.04em' }}>⭐ TOP</div>
                    )}
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${c.isTop ? FOREST : '#e0eaea'}`, margin: '0 auto .65rem', display: 'block' }} />
                    ) : (
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: FOREST, margin: '0 auto .65rem' }}>
                        C{i + 1}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '.79rem', color: INK, marginBottom: '.3rem', lineHeight: 1.2 }}>{c.name}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: c.score >= 80 ? FOREST : c.score >= 60 ? '#e6a817' : CORAL, lineHeight: 1 }}>{c.score}%</div>
                    <div style={{ fontSize: '.63rem', color: '#9aacac', marginTop: '.1rem' }}>fit score</div>
                    {(() => {
                      const cand = candidates[i]
                      const status = cand?.pipeline_status || 'sent'
                      if (status === 'sent') return null
                      const pMap: Record<string, { label: string; color: string; bg: string }> = {
                        interview: { label: 'Entrevista', color: '#e6a817', bg: '#fffbf0' },
                        finalist: { label: 'Finalista', color: FOREST, bg: PALE },
                        hired: { label: 'Contratado', color: '#2A7E4E', bg: '#e6f4ec' },
                        rejected: { label: 'Descartado', color: CORAL, bg: '#fff4f2' },
                      }
                      const p = pMap[status]
                      if (!p) return null
                      return (
                        <div style={{ marginTop: '.4rem', fontSize: '.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: p.bg, color: p.color, display: 'inline-block', lineHeight: 1.5 }}>
                          {p.label}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>

            {candidates.length > 1 && (
              <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 14, padding: '1.3rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.85rem' }}>Comparación de dimensiones</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
                    <thead>
                      <tr style={{ background: OFF }}>
                        <th style={{ padding: '7px 12px', textAlign: 'left', color: '#9aacac', fontWeight: 700, fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Dimensión</th>
                        {candidates.map((c, i) => (
                          <th key={c.id} style={{ padding: '7px 12px', textAlign: 'center', color: FOREST, fontWeight: 700, fontSize: '.75rem' }}>
                            C{i + 1}
                            {c.is_top && <span style={{ fontSize: '.55rem', marginLeft: 3 }}>⭐</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SCORE_LABELS.map((label, si) => (
                        <tr key={label} style={{ borderBottom: '1px solid #f0f4f4' }}>
                          <td style={{ padding: '7px 12px', color: '#4a6a6a', fontSize: '.8rem' }}>{label}</td>
                          {candidates.map(c => {
                            const val = Number(c[SCORE_KEYS[si]]) || 0
                            return <td key={c.id} style={{ padding: '7px 12px', textAlign: 'center', fontWeight: 700, color: val >= 4 ? FOREST : val >= 3 ? '#e6a817' : CORAL }}>{val}</td>
                          })}
                        </tr>
                      ))}
                      <tr style={{ background: OFF }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: INK, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fit Score</td>
                        {candidates.map(c => (
                          <td key={c.id} style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: FOREST, fontSize: '.9rem' }}>{avgScore(c)}%</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ border: '2px dashed #d8e4e4', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', background: 'white' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B3B3E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.05rem', color: INK, marginBottom: '.4rem' }}>Sin candidatos aún</div>
            {session?.isAdmin ? (
              <>
                <p style={{ fontSize: '.82rem', color: '#9aacac', margin: '0 0 1.3rem', lineHeight: 1.6 }}>
                  Agregá el primer candidato para comenzar la evaluación.
                </p>
                <button onClick={openAddCandidate}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)' }}>
                  + Agregar candidato
                </button>
              </>
            ) : (
              <p style={{ fontSize: '.82rem', color: '#9aacac', margin: 0, lineHeight: 1.6 }}>
                Los candidatos estarán disponibles pronto.<br />
                Tu consultor te notificará cuando estén listos.
              </p>
            )}
          </div>
        )}

        {selEng!.notes && (
          <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 11, padding: '1rem 1.25rem', fontSize: '.81rem', color: '#92400e', lineHeight: 1.65 }}>
            <strong>Nota:</strong> {selEng!.notes}
          </div>
        )}

        {/* Admin actions row */}
        {session?.isAdmin && (
          <div className="no-print" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <button onClick={generateShare} disabled={shareLoading}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${FOREST}`, background: shareToken ? PALE : 'white', color: FOREST, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              {shareLoading ? 'Generando…' : shareToken ? 'Ver enlace público' : 'Compartir evaluación'}
            </button>
            <button onClick={notifyClient} disabled={notifying}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0eaea', background: 'white', color: '#4a6a6a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              {notifying ? 'Enviando…' : 'Notificar cliente'}
            </button>
            <button onClick={() => { if (showActivity) { setShowActivity(false) } else { loadActivity() } }}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0eaea', background: showActivity ? PALE : 'white', color: '#4a6a6a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              {activityLoading ? 'Cargando…' : showActivity ? 'Ocultar actividad' : 'Ver actividad'}
            </button>
            {selEng && (
              <a href={`/app/matchgraph/print/${selEng.id}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0eaea', background: 'white', color: '#4a6a6a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.35rem', textDecoration: 'none' }}>
                PDF completo
              </a>
            )}
          </div>
        )}

        {/* Activity log */}
        {showActivity && (
          <div style={{ marginTop: '1.25rem', background: 'white', border: '1px solid #e0eaea', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: OFF, borderBottom: '1px solid #e0eaea', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac' }}>
              Actividad reciente
            </div>
            {activityLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9aacac', fontSize: '.82rem' }}>Cargando…</div>
            ) : activity.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#b0c4c4', fontSize: '.82rem' }}>Sin actividad registrada aún.</div>
            ) : (
              <div style={{ padding: '.5rem 0' }}>
                {activity.map((a, i) => {
                  const icons: Record<string, string> = { candidate_added: '·', engagement_created: '·', client_feedback: '·', pipeline_status: '·', client_notes: '·' }
                  const labels: Record<string, string> = { candidate_added: 'Candidato agregado', engagement_created: 'Evaluación creada', client_feedback: 'Feedback del cliente', pipeline_status: 'Estado actualizado', client_notes: 'Nota guardada' }
                  const d = new Date(a.created_at)
                  const timeStr = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.65rem 1rem', borderBottom: i < activity.length - 1 ? '1px solid #f4f8f8' : 'none' }}>
                      <span style={{ fontSize: '.9rem', flexShrink: 0, marginTop: 1 }}>{icons[a.action] || '•'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.8rem', fontWeight: 600, color: INK }}>{labels[a.action] || a.action}{a.details ? `: ${a.details}` : ''}</div>
                        <div style={{ fontSize: '.7rem', color: '#9aacac', marginTop: '.1rem' }}>{a.actor_email === ADMIN_EMAIL ? 'Candidato®' : 'Cliente'} · {timeStr}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  function calendarLink(c: Candidate, eng: Engagement | null) {
    if (!c.interview_date || !eng) return null
    const dt = new Date(c.interview_date)
    if (isNaN(dt.getTime())) return null
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    const end = new Date(dt.getTime() + 3600000)
    const text = encodeURIComponent(`Entrevista — ${c.name} para ${eng.title}`)
    const details = encodeURIComponent(`Candidato: ${c.name}\nEmpresa: ${eng.company_name}\nCargo: ${eng.title}`)
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(dt)}/${fmt(end)}&details=${details}`
  }

  /* Candidate detail view */
  function CandidateView({ c }: { c: Candidate }) {
    const scores = SCORE_KEYS.map(k => Number(c[k]) || 0)
    const fit = avgScore(c)
    return (
      <div style={{ padding: '2rem', maxWidth: 1040, margin: '0 auto' }}>
        {session?.isAdmin && (
          <div className="no-print" style={{ display: 'flex', gap: '.5rem', marginBottom: '1.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => openEditCandidate(c)}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: `1.5px solid ${FOREST}`, background: 'white', color: FOREST, cursor: 'pointer', transition: 'all .15s' }}>
              Editar candidato
            </button>
            <button onClick={async () => {
              await fetch('/api/matchgraph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsert_candidate', id: c.id, is_top: !c.is_top }) })
              setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, is_top: !x.is_top } : x))
            }}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: '1.5px solid #e0eaea', background: c.is_top ? PALE : 'white', color: c.is_top ? FOREST : '#9aacac', cursor: 'pointer', transition: 'all .15s' }}>
              {c.is_top ? '★ Top candidato' : '☆ Marcar como top'}
            </button>
            <button onClick={() => window.print()}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: '1.5px solid #e0eaea', background: 'white', color: '#4a6a6a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              Imprimir / PDF
            </button>
            <button onClick={() => deleteCandidate(c.id)}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: '1.5px solid #fcd0c8', background: 'white', color: '#c0392b', cursor: 'pointer', marginLeft: 'auto', transition: 'all .15s' }}>
              Eliminar
            </button>
          </div>
        )}

        {/* Print-only header */}
        <div className="print-only" style={{ display: 'none', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e0eaea' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.5rem' }}>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.1rem', color: FOREST }}>Candidato® Match Graph</div>
          </div>
          <div style={{ fontSize: '.8rem', color: '#4a6a6a' }}>{selEng!.title} · {selEng!.company_name}</div>
        </div>

        <div className="mg-cand-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.1rem', marginBottom: '1.5rem' }}>
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.name} style={{ width: isMobile ? 60 : 82, height: isMobile ? 60 : 82, borderRadius: 13, objectFit: 'cover', border: '2px solid #e0eaea', flexShrink: 0 }} />
              ) : (
                <div style={{ width: isMobile ? 60 : 82, height: isMobile ? 60 : 82, borderRadius: 13, background: PALE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontWeight: 700, fontSize: isMobile ? '1.1rem' : '1.4rem', color: FOREST, flexShrink: 0 }}>
                  C{candIdx + 1}
                </div>
              )}
              <div style={{ paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                  <h2 style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.35rem', color: INK, margin: 0, letterSpacing: '-.01em' }}>{c.name}</h2>
                  {c.is_top && <span style={{ fontSize: '.63rem', fontWeight: 700, background: FOREST, color: 'white', borderRadius: 8, padding: '2px 10px', letterSpacing: '.03em' }}>⭐ TOP</span>}
                </div>
                {c.salary_expectation && <div style={{ fontSize: '.79rem', color: '#4a6a6a', marginBottom: '.15rem' }}>Aspiración salarial: <strong>{c.salary_expectation}</strong></div>}
                {c.mobility && <div style={{ fontSize: '.79rem', color: '#4a6a6a', marginBottom: '.15rem' }}>Movilidad: <strong>{c.mobility}</strong></div>}
                {c.interview_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '.79rem', color: '#4a6a6a' }}>Entrevista: <strong style={{ color: FOREST }}>{c.interview_date}</strong></span>
                    {calendarLink(c, selEng) && (
                      <a href={calendarLink(c, selEng)!} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.68rem', fontWeight: 600, color: '#4a6a6a', textDecoration: 'none', padding: '2px 8px', borderRadius: 6, border: '1px solid #d8e4e4', background: '#f8fbfb' }}>
                        Google Calendar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline status */}
            {(() => {
              const PIPELINE = [
                { key: 'sent', label: 'Enviado', color: '#9aacac', bg: '#f4f8f8' },
                { key: 'interview', label: 'Entrevista', color: '#e6a817', bg: '#fffbf0' },
                { key: 'finalist', label: 'Finalista', color: FOREST, bg: PALE },
                { key: 'hired', label: 'Contratado', color: '#2A7E4E', bg: '#e6f4ec' },
                { key: 'rejected', label: 'Descartado', color: CORAL, bg: '#fff4f2' },
              ]
              const current = PIPELINE.find(p => p.key === (c.pipeline_status || 'sent')) || PIPELINE[0]
              return (
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9aacac' }}>Estado:</span>
                  {session?.isAdmin ? (
                    PIPELINE.map(p => (
                      <button key={p.key} disabled={savingPipeline === c.id} onClick={() => updatePipelineStatus(c.id, p.key)}
                        style={{ fontSize: '.72rem', fontWeight: 700, padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${p.key === (c.pipeline_status || 'sent') ? p.color : '#e0eaea'}`, background: p.key === (c.pipeline_status || 'sent') ? p.bg : 'white', color: p.key === (c.pipeline_status || 'sent') ? p.color : '#b0c4c4', cursor: 'pointer', transition: 'all .15s' }}>
                        {p.label}
                      </button>
                    ))
                  ) : (
                    <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: current.bg, color: current.color, border: `1.5px solid ${current.color}` }}>
                      {current.label}
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Client feedback */}
            <div className="no-print" style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 13, padding: '1rem 1.15rem', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.65rem' }}>
                {session?.isAdmin ? 'Feedback del cliente' : 'Tu evaluación'}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'interested', label: 'Interesado', color: '#2A7E4E', bg: '#e6f4ec', border: '#b6ddc6' },
                  { key: 'maybe', label: 'Dudas', color: '#e6a817', bg: '#fffbf0', border: '#f5dcb0' },
                  { key: 'no', label: 'No sigue', color: CORAL, bg: '#fff4f2', border: '#fcd0c8' },
                ].map(opt => (
                  <button key={opt.key} disabled={savingFeedback === c.id} onClick={() => !session?.isAdmin && saveFeedback(c.id, opt.key)}
                    style={{ fontSize: '.78rem', fontWeight: 700, padding: '7px 16px', borderRadius: 9, border: `1.5px solid ${c.client_feedback === opt.key ? opt.border : '#e0eaea'}`, background: c.client_feedback === opt.key ? opt.bg : '#fafafa', color: c.client_feedback === opt.key ? opt.color : '#b0c4c4', cursor: session?.isAdmin ? 'default' : 'pointer', transition: 'all .18s', transform: c.client_feedback === opt.key ? 'scale(1.03)' : 'scale(1)' }}>
                    {opt.label}
                  </button>
                ))}
                {!c.client_feedback && session?.isAdmin && (
                  <span style={{ fontSize: '.75rem', color: '#b0c4c4', alignSelf: 'center' }}>Sin feedback aún</span>
                )}
                {savingFeedback === c.id && <span style={{ fontSize: '.73rem', color: '#9aacac', alignSelf: 'center' }}>Guardando…</span>}
              </div>
            </div>

            {/* WhatsApp CTA */}
            {c.interview_date && (
              <div className="no-print" style={{ marginBottom: '1.1rem' }}>
                <a href={`https://wa.me/573205046723?text=${encodeURIComponent(`Hola! Te escribo sobre la entrevista de ${c.name} para el cargo ${selEng?.title} en ${selEng?.company_name}. Fecha coordinada: ${c.interview_date}. ¿Confirmamos los detalles?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', fontWeight: 700, padding: '8px 16px', borderRadius: 9, background: '#25D366', color: 'white', textDecoration: 'none', transition: 'opacity .15s' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Coordinar entrevista por WhatsApp
                </a>
              </div>
            )}

            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 13, overflow: 'hidden', marginBottom: '1.2rem' }}>
              <div style={{ padding: '10px 15px', background: OFF, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0eaea' }}>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#9aacac' }}>Evaluación de dimensiones</span>
                <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#9aacac' }}>Puntaje (1–5)</span>
              </div>
              {SCORE_LABELS.map((label, i) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: isMobile ? '.3rem' : '1rem', alignItems: 'center', padding: '10px 15px', borderBottom: i < 4 ? '1px solid #f4f8f8' : 'none' }}>
                  <span style={{ fontSize: '.83rem', color: INK, fontWeight: 600 }}>{label}</span>
                  <ScoreBar score={scores[i]} />
                </div>
              ))}
            </div>

            {[
              { title: 'Formación', value: c.formation },
              { title: 'Experiencia relevante', value: c.relevant_experience },
              { title: 'Fortalezas técnicas', value: c.technical_strengths },
            ].map(s => s.value && (
              <div key={s.title} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.45rem' }}>{s.title}</div>
                <div style={{ fontSize: '.84rem', color: '#4a6a6a', lineHeight: 1.8, background: 'white', border: '1px solid #e0eaea', borderRadius: 11, padding: '.8rem 1.05rem', whiteSpace: 'pre-wrap' }}>{s.value}</div>
              </div>
            ))}

            {c.qa_notes && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.45rem' }}>Preguntas y validaciones</div>
                <div style={{ fontSize: '.84rem', color: '#4a6a6a', lineHeight: 1.8, background: '#fffbea', border: '1px solid #fde68a', borderRadius: 11, padding: '.8rem 1.05rem', whiteSpace: 'pre-wrap' }}>{c.qa_notes}</div>
              </div>
            )}

            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 13, padding: '1.05rem 1.2rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.6rem' }}>Hoja de vida (CV)</div>
              {c.cv_url ? (
                <a href={c.cv_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: FOREST, color: 'white', borderRadius: 9, padding: '8px 18px', textDecoration: 'none', fontSize: '.83rem', fontWeight: 600, transition: 'opacity .15s' }}>
                  Descargar CV
                </a>
              ) : (
                <div style={{ fontSize: '.8rem', color: '#b0c4c4' }}>CV no disponible aún</div>
              )}
            </div>

            <div className="no-print" style={{ background: '#f9fbfc', border: '1.5px solid #e0eaea', borderRadius: 13, padding: '1.05rem 1.2rem' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.55rem' }}>Tus notas</div>
              <textarea
                style={{ ...ta, minHeight: 84, background: 'white' }}
                placeholder="Tus observaciones sobre este candidato…"
                value={clientNotes[c.id] || ''}
                onChange={e => setClientNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
              />
              <button onClick={() => saveClientNotes(c.id)} disabled={savingNotes === c.id}
                style={{ marginTop: '.55rem', fontSize: '.75rem', fontWeight: 600, padding: '7px 16px', borderRadius: 8, border: 'none', background: FOREST, color: 'white', cursor: 'pointer', transition: 'opacity .15s' }}>
                {savingNotes === c.id ? 'Guardando…' : 'Guardar nota'}
              </button>
            </div>
          </div>

          <div style={{ position: 'sticky', top: 70 }}>
            <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 15, padding: '1.3rem', textAlign: 'center', marginBottom: '1rem', boxShadow: '0 4px 16px rgba(14,30,32,.04)' }}>
              <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '.6rem' }}>Match Graph</div>
              <RadarChart scores={scores} size={220} />
              <div style={{ marginTop: '.65rem' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: fit >= 80 ? FOREST : fit >= 60 ? '#e6a817' : CORAL, lineHeight: 1, letterSpacing: '-.03em' }}>{fit}%</div>
                <div style={{ fontSize: '.72rem', color: '#9aacac', marginTop: '.2rem' }}>Fit score general</div>
              </div>
            </div>

            <div style={{ background: OFF, borderRadius: 11, padding: '.8rem 1.05rem', fontSize: '.72rem', color: '#9aacac', lineHeight: 1.65 }}>
              <strong style={{ color: '#4a6a6a' }}>Escala:</strong> 1 = más bajo · 5 = más alto
              <br />
              <strong style={{ color: '#4a6a6a' }}>Fit score:</strong> promedio × 20
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Compare View ───────────────────────────────────────── */
  function CompareView() {
    const COMP_COLORS = [FOREST, CORAL, '#e6a817']
    const comps = candidates.filter(c => compareIds.includes(c.id))
    return (
      <div style={{ padding: '2rem', maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.3rem', color: INK, margin: '0 0 .2rem', letterSpacing: '-.02em' }}>Comparación de candidatos</h2>
            <p style={{ fontSize: '.8rem', color: '#9aacac', margin: 0 }}>{comps.length} candidatos seleccionados · {selEng!.title}</p>
          </div>
          <button onClick={() => { setShowCompare(false); setCompareMode(false); setCompareIds([]) }}
            style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 15px', borderRadius: 9, border: '1.5px solid #e0eaea', background: 'white', color: '#4a6a6a', cursor: 'pointer' }}>
            ← Volver al resumen
          </button>
        </div>

        {/* Overlaid radar */}
        <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 15, padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac', marginBottom: '1rem' }}>Match Graph comparativo</div>
          <MultiRadarChart cands={comps} colors={COMP_COLORS} size={isMobile ? 240 : 300} />
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {comps.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: COMP_COLORS[i] }} />
                <span style={{ fontSize: '.75rem', color: INK, fontWeight: 600 }}>{c.name.split(' ')[0]} — {avgScore(c)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-side cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${comps.length}, 1fr)`, gap: '1rem', marginBottom: '1.5rem' }}>
          {comps.map((c, i) => {
            const fit = avgScore(c)
            const color = COMP_COLORS[i]
            return (
              <div key={c.id} style={{ background: 'white', border: `2px solid ${color}44`, borderRadius: 14, padding: '1.3rem', textAlign: 'center' }}>
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: color, marginBottom: '.9rem' }} />
                {c.photo_url ? (
                  <img src={c.photo_url} alt={c.name} style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, margin: '0 auto .7rem', display: 'block' }} />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.1rem', color, margin: '0 auto .7rem' }}>
                    {c.name.charAt(0)}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '.92rem', color: INK, marginBottom: '.2rem' }}>{c.name}</div>
                {c.is_top && <span style={{ fontSize: '.6rem', fontWeight: 700, background: FOREST, color: 'white', borderRadius: 6, padding: '2px 8px', letterSpacing: '.03em' }}>TOP</span>}
                <div style={{ fontSize: '2rem', fontWeight: 800, color, marginTop: '.6rem', lineHeight: 1 }}>{fit}%</div>
                <div style={{ fontSize: '.65rem', color: '#9aacac', marginBottom: '.6rem' }}>fit score</div>
                {c.salary_expectation && <div style={{ fontSize: '.75rem', color: '#4a6a6a' }}>{c.salary_expectation}</div>}
                {c.mobility && <div style={{ fontSize: '.72rem', color: '#9aacac', marginTop: '.2rem' }}>{c.mobility}</div>}
                <button onClick={() => { setShowCompare(false); setCompareMode(false); setCompareIds([]); setCandIdx(candidates.findIndex(x => x.id === c.id)) }}
                  style={{ marginTop: '.85rem', fontSize: '.72rem', fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${color}`, background: 'white', color, cursor: 'pointer', width: '100%' }}>
                  Ver perfil completo
                </button>
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div style={{ background: 'white', border: '1px solid #e0eaea', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 15px', background: OFF, borderBottom: '1px solid #e0eaea', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9aacac' }}>
            Detalle por dimensión
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead>
                <tr style={{ background: OFF }}>
                  <th style={{ padding: '8px 14px', textAlign: 'left', color: '#9aacac', fontWeight: 700, fontSize: '.64rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Dimensión</th>
                  {comps.map((c, i) => (
                    <th key={c.id} style={{ padding: '8px 14px', textAlign: 'center', color: COMP_COLORS[i], fontWeight: 700, fontSize: '.82rem' }}>
                      {c.name.split(' ')[0]}{c.is_top ? ' ⭐' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCORE_LABELS.map((label, si) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f0f4f4' }}>
                    <td style={{ padding: '8px 14px', color: '#4a6a6a', fontSize: '.82rem' }}>{label}</td>
                    {comps.map((c, ci) => {
                      const val = Number(c[SCORE_KEYS[si]]) || 0
                      const best = Math.max(...comps.map(x => Number(x[SCORE_KEYS[si]]) || 0))
                      return (
                        <td key={c.id} style={{ padding: '8px 14px', textAlign: 'center', fontWeight: val === best && comps.length > 1 ? 800 : 600, color: val >= 4 ? FOREST : val >= 3 ? '#e6a817' : CORAL }}>
                          {val}{val === best && comps.length > 1 ? ' ↑' : ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr style={{ background: OFF }}>
                  <td style={{ padding: '9px 14px', fontWeight: 700, color: INK, fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fit Score</td>
                  {comps.map((c, ci) => {
                    const fit = avgScore(c)
                    const bestFit = Math.max(...comps.map(avgScore))
                    return (
                      <td key={c.id} style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 800, color: COMP_COLORS[ci], fontSize: '.95rem' }}>
                        {fit}%{fit === bestFit && comps.length > 1 ? ' ★' : ''}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', flexDirection: 'column', fontFamily: 'var(--body)' }}>
      <ToastProvider />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          * { box-shadow: none !important; }
        }
        .print-only { display: none; }
        @media (max-width: 600px) {
          .mg-cover-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important; }
          .mg-cand-grid { grid-template-columns: 1fr !important; }
          .mg-compare-grid { grid-template-columns: 1fr !important; overflow-x: auto; }
          .mg-compare-cards { grid-template-columns: 1fr !important; }
          .mg-tab-bar { gap: 0 !important; }
          .mg-tab-bar button { padding: 12px 12px !important; font-size: .73rem !important; }
        }
        .mg-swipe-hint { display: none; }
        @media (max-width: 768px) and (hover: none) {
          .mg-swipe-hint { display: flex; }
        }
      `}</style>

      <TopBar
        title={selEng!.title}
        actions={session?.isAdmin ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setEngForm({ title: selEng!.title, company_name: selEng!.company_name, client_email: selEng!.client_email, job_area: selEng!.job_area || '', city: selEng!.city || '', notes: selEng!.notes || '', status: selEng!.status }); setShowEditEng(true) }}
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 600, fontFamily: 'var(--body)', transition: 'all .15s', letterSpacing: '.01em' }}>
              Editar
            </button>
            <button onClick={openAddCandidate}
              style={{ background: CORAL, border: '1px solid transparent', color: 'white', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '.74rem', fontWeight: 700, fontFamily: 'var(--body)', letterSpacing: '.01em', transition: 'opacity .15s' }}>
              + Candidato
            </button>
          </div>
        ) : undefined}
      />

      {/* Tab navigation */}
      <div className="no-print mg-tab-bar" style={{ background: 'white', borderBottom: '1px solid #e0eaea', padding: '0 1.5rem', display: 'flex', gap: 0, overflowX: 'auto', flexShrink: 0, fontFamily: 'var(--body)' }}>
        <button onClick={() => { setCandIdx(-1); setShowCompare(false); setCompareMode(false); setCompareIds([]) }}
          style={{ padding: '13px 18px', fontSize: '.79rem', fontWeight: !showCompare && candIdx === -1 ? 700 : 500, color: !showCompare && candIdx === -1 ? FOREST : '#9aacac', background: 'none', border: 'none', borderBottom: !showCompare && candIdx === -1 ? `2.5px solid ${FOREST}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}>
          Resumen
        </button>
        {candidates.map((c, i) => (
          <button key={c.id} onClick={() => { setCandIdx(i); setShowCompare(false); setCompareMode(false); setCompareIds([]) }}
            style={{ padding: '13px 18px', fontSize: '.79rem', fontWeight: candIdx === i ? 700 : 500, color: candIdx === i ? FOREST : '#9aacac', background: 'none', border: 'none', borderBottom: candIdx === i ? `2.5px solid ${FOREST}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            {c.is_top && <span style={{ fontSize: '.58rem' }}>⭐</span>}
            C{i + 1}: {c.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Swipe hint — touch devices only */}
      {candIdx >= 0 && (
        <div className="mg-swipe-hint no-print" style={{ alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '5px', background: '#f4f8f8', fontSize: '.68rem', color: '#b0c4c4', letterSpacing: '.03em' }}>
          ← deslizá para navegar →
        </div>
      )}

      {/* Prev / Next navigation — shown when viewing a candidate */}
      {candIdx >= 0 && (
        <div className="no-print" style={{ background: 'white', borderBottom: '1px solid #e0eaea', padding: '8px 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={() => setCandIdx(candIdx === 0 ? -1 : candIdx - 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, color: FOREST, padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '.3rem', transition: 'background .12s' }}
          >
            ← {candIdx === 0 ? 'Resumen' : 'Anterior'}
          </button>
          <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#4a6a6a' }}>
            C{candIdx + 1}: {currentCand?.name.split(' ')[0]} · {avgScore(currentCand!)}%
          </span>
          {candIdx < candidates.length - 1 ? (
            <button
              onClick={() => setCandIdx(candIdx + 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 700, color: FOREST, padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '.3rem', transition: 'background .12s' }}
            >
              Siguiente →
            </button>
          ) : (
            <span style={{ width: 80 }} />
          )}
        </div>
      )}

      <div style={{ flex: 1 }}
        onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touchStartX === null || candIdx < 0) return
          const dx = e.changedTouches[0].clientX - touchStartX
          if (Math.abs(dx) < 50) return
          if (dx < 0 && candIdx < candidates.length - 1) setCandIdx(candIdx + 1)
          else if (dx > 0) setCandIdx(candIdx === 0 ? -1 : candIdx - 1)
          setTouchStartX(null)
        }}
      >
        {showCompare ? <CompareView /> : candIdx === -1 ? <CoverView /> : currentCand ? <CandidateView c={currentCand} /> : null}
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
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
              <input style={inp} value={(engForm as Record<string, string>)[f.key] || ''} onChange={e => setEngForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Estado</label>
            <select style={inp} value={engForm.status} onChange={e => setEngForm(p => ({ ...p, status: e.target.value as 'open' | 'closed' }))}>
              <option value="open">Activa</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Notas</label>
            <textarea style={ta} value={engForm.notes} onChange={e => setEngForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <button onClick={saveEngagement} disabled={saving}
            style={{ width: '100%', background: saving ? '#b0c0c0' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)', transition: 'background .15s' }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </Modal>
      )}

      {/* Share modal */}
      {showShareModal && shareToken && (
        <Modal title="Enlace público" onClose={() => setShowShareModal(false)}>
          <p style={{ fontSize: '.83rem', color: '#4a6a6a', lineHeight: 1.65, margin: '0 0 1rem' }}>
            Cualquier persona con este enlace puede ver los candidatos sin iniciar sesión. No se muestran notas ni CVs.
          </p>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.85rem' }}>
            <input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/app/matchgraph/share/${shareToken}`}
              style={{ ...inp, fontSize: '.76rem', flex: 1, background: '#f4f8f8', cursor: 'text' }}
              onFocus={e => e.target.select()}
            />
            <button
              onClick={() => {
                const url = `${window.location.origin}/app/matchgraph/share/${shareToken}`
                navigator.clipboard.writeText(url).then(() => showToast('Enlace copiado', 'success'))
              }}
              style={{ padding: '10px 16px', background: FOREST, color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: '.8rem', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--body)' }}>
              Copiar
            </button>
          </div>
          <div style={{ background: OFF, borderRadius: 10, padding: '.85rem 1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9aacac', marginBottom: '.5rem' }}>Vigencia del enlace</div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {[{ label: '7 días', val: 7 }, { label: '30 días', val: 30 }, { label: '90 días', val: 90 }, { label: 'Sin vencimiento', val: 0 }].map(opt => (
                <button key={opt.val} onClick={() => setShareExpiryDays(opt.val)}
                  style={{ fontSize: '.73rem', fontWeight: 700, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${shareExpiryDays === opt.val ? FOREST : '#e0eaea'}`, background: shareExpiryDays === opt.val ? PALE : 'white', color: shareExpiryDays === opt.val ? FOREST : '#9aacac', cursor: 'pointer', transition: 'all .15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '.72rem', color: '#b0c4c4', margin: '.5rem 0 0' }}>
              {shareExpiryDays > 0
                ? `El enlace expira el ${new Date(Date.now() + shareExpiryDays * 864e5).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'El enlace no expira automáticamente'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={generateShare} disabled={shareLoading}
              style={{ fontSize: '.75rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${FOREST}`, background: 'white', color: FOREST, cursor: 'pointer' }}>
              {shareLoading ? 'Actualizando…' : 'Regenerar enlace'}
            </button>
            <a href={`/app/matchgraph/share/${shareToken}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '.78rem', fontWeight: 600, color: FOREST, textDecoration: 'none', padding: '7px 14px', border: `1.5px solid ${FOREST}`, borderRadius: 8 }}>
              Abrir enlace
            </a>
          </div>
        </Modal>
      )}

      {/* Edit / add candidate modal */}
      {showEditCand && (
        <Modal title={editingCand ? 'Editar candidato' : 'Agregar candidato'} onClose={() => { setShowEditCand(false); setEditingCand(null) }}>
          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Nombre completo *</label>
            <input style={inp} placeholder="Nombre del candidato" value={candForm.name || ''} onChange={e => setCandForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Orden</label>
              <input style={inp} type="number" min={1} max={10} value={candForm.sort_order || 1} onChange={e => setCandForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 1 }))} />
            </div>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Aspiración salarial</label>
              <input style={inp} placeholder="Ej: $3.500.000" value={candForm.salary_expectation || ''} onChange={e => setCandForm(p => ({ ...p, salary_expectation: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '.5rem', marginBottom: '.75rem' }}>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Movilidad</label>
              <input style={inp} placeholder="Ej: Transporte propio" value={candForm.mobility || ''} onChange={e => setCandForm(p => ({ ...p, mobility: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Fecha y hora entrevista</label>
              <input style={inp} type="datetime-local" value={candForm.interview_date || ''} onChange={e => setCandForm(p => ({ ...p, interview_date: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', marginBottom: '.55rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Puntajes (1–5)</div>
            {SCORE_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.45rem' }}>
                <span style={{ fontSize: '.79rem', color: '#4a6a6a', flex: 1 }}>{label}</span>
                <div style={{ display: 'flex', gap: '.2rem' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setCandForm(p => ({ ...p, [SCORE_KEYS[i]]: n }))}
                      style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '.79rem', fontWeight: 700, background: (candForm[SCORE_KEYS[i]] || 3) === n ? FOREST : '#e0eaea', color: (candForm[SCORE_KEYS[i]] || 3) === n ? 'white' : '#4a6a6a', transition: 'all .12s' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {[
            { label: 'Formación', key: 'formation', placeholder: 'Universidad, carrera, posgrado…' },
            { label: 'Experiencia relevante', key: 'relevant_experience', placeholder: 'Empresas, roles, años de experiencia…' },
            { label: 'Fortalezas técnicas', key: 'technical_strengths', placeholder: 'Herramientas, habilidades, certificaciones…' },
            { label: 'Preguntas y validaciones', key: 'qa_notes', placeholder: 'Observaciones de la entrevista, puntos destacados…' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '.65rem' }}>
              <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
              <textarea style={ta} placeholder={f.placeholder} value={(candForm as Record<string, string>)[f.key] || ''} onChange={e => setCandForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}

          <div style={{ marginBottom: '.65rem' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Foto del candidato</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              {candForm.photo_url && <img src={candForm.photo_url} alt="" style={{ width: 42, height: 42, borderRadius: 9, objectFit: 'cover', border: '1px solid #e0eaea' }} />}
              <label style={{ background: OFF, border: '1.5px dashed #d8e4e4', borderRadius: 9, padding: '8px 15px', fontSize: '.78rem', color: '#4a6a6a', cursor: 'pointer', fontWeight: 600 }}>
                {photoUploading ? 'Subiendo…' : candForm.photo_url ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} disabled={photoUploading} />
              </label>
              {candForm.photo_url && <span style={{ fontSize: '.7rem', color: '#9aacac' }}>✓ Foto cargada</span>}
            </div>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#4a6a6a', display: 'block', marginBottom: '.28rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>CV / Hoja de vida</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
              <label style={{ background: OFF, border: '1.5px dashed #d8e4e4', borderRadius: 9, padding: '8px 15px', fontSize: '.78rem', color: '#4a6a6a', cursor: 'pointer', fontWeight: 600 }}>
                {cvUploading ? 'Subiendo…' : candForm.cv_url ? 'Cambiar CV' : 'Subir CV (PDF)'}
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleCvUpload} disabled={cvUploading} />
              </label>
              {candForm.cv_url && <a href={candForm.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: '.75rem', color: FOREST, fontWeight: 600 }}>Ver CV →</a>}
            </div>
          </div>

          <button onClick={saveCandidate} disabled={saving || !candForm.name}
            style={{ width: '100%', background: saving || !candForm.name ? '#b0c0c0' : FOREST, color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: '.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--body)', transition: 'background .15s' }}>
            {saving ? 'Guardando…' : editingCand ? 'Guardar cambios' : 'Agregar candidato'}
          </button>
        </Modal>
      )}
    </div>
  )
}

export default function MatchGraphPage() {
  return (
    <ErrorBoundary>
      <MatchGraphInner />
    </ErrorBoundary>
  )
}
