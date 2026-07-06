'use client'

import { useEffect, useState } from 'react'

const FOREST = '#1B3B3E'
const CORAL = '#EA6440'
const PALE = '#E4F0F1'
const INK = '#0E1E20'
const OFF = '#F5F4F0'
const ADMIN_EMAIL = 'candidatojobs@gmail.com'

interface Engagement {
  id: string
  title: string
  company_name: string
  status?: string
  created_at: string
}

interface Candidate {
  id: string
  engagement_id: string
  score_profession?: number
  score_experience?: number
  score_sector?: number
  score_requirements?: number
  score_availability?: number
  is_top?: boolean
  pipeline_status?: string
  client_feedback?: string
}

interface Stats {
  totalEngagements: number
  openEngagements: number
  closedEngagements: number
  totalCandidates: number
  avgFitScore: number
  topCount: number
  pipeline: {
    sent: number
    interview: number
    finalist: number
    hired: number
    rejected: number
  }
  feedback: {
    interested: number
    maybe: number
    no: number
    none: number
  }
}

interface AnalyticsData {
  engagements: Engagement[]
  candidates: Candidate[]
  stats: Stats
}

function fitScore(c: Candidate) {
  return Math.round(
    ((c.score_profession ?? 0) + (c.score_experience ?? 0) + (c.score_sector ?? 0) +
      (c.score_requirements ?? 0) + (c.score_availability ?? 0)) / 5 * 20
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/matchgraph-auth')
        const auth = await authRes.json()
        if (!auth.email || auth.email !== ADMIN_EMAIL) {
          window.location.href = '/app/matchgraph'
          return
        }
        const res = await fetch('/api/matchgraph?action=analytics')
        if (!res.ok) throw new Error('Failed to load analytics')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--body)', color: FOREST }}>Cargando…</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: OFF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--body)', color: CORAL }}>{error}</p>
    </div>
  )

  if (!data) return null

  const { engagements, candidates, stats } = data

  // Pipeline stages config
  const pipelineStages = [
    { key: 'sent', label: 'Enviado', color: '#9aacac', count: stats.pipeline.sent },
    { key: 'interview', label: 'Entrevista', color: '#e6a817', count: stats.pipeline.interview },
    { key: 'finalist', label: 'Finalista', color: FOREST, count: stats.pipeline.finalist },
    { key: 'hired', label: 'Contratado', color: '#2A7E4E', count: stats.pipeline.hired },
    { key: 'rejected', label: 'Descartado', color: CORAL, count: stats.pipeline.rejected },
  ]

  const totalCands = stats.totalCandidates || 1

  // KPI cards
  const kpis = [
    { label: 'Total evaluaciones', value: stats.totalEngagements },
    { label: 'Activas / Cerradas', value: `${stats.openEngagements} / ${stats.closedEngagements}` },
    { label: 'Total candidatos', value: stats.totalCandidates },
    { label: 'Avg Fit Score', value: `${stats.avgFitScore}%` },
    { label: 'Top Picks', value: stats.topCount },
    { label: 'Contratados', value: stats.pipeline.hired },
  ]

  return (
    <div style={{ minHeight: '100vh', background: OFF, fontFamily: 'var(--body)', color: INK }}>
      {/* TopBar */}
      <div style={{
        height: 60,
        background: FOREST,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '0.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <img src="/bird-logo.png" width={28} height={28} style={{ borderRadius: 8, objectFit: 'contain' }} alt="logo" />
        <span style={{
          fontFamily: 'var(--head)',
          color: PALE,
          fontWeight: 700,
          fontSize: '1rem',
          flex: 1,
        }}>
          Candidato® Match Graph · Admin
        </span>
        <a
          href="/app/matchgraph"
          style={{
            color: PALE,
            textDecoration: 'none',
            fontSize: '0.85rem',
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          ← Volver
        </a>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Section 1 – KPI row */}
        <h2 style={{ fontFamily: 'var(--head)', color: FOREST, fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', marginTop: 0 }}>
          Resumen
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
          className="kpi-grid"
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e0eaea',
                padding: '1rem 1.2rem',
              }}
            >
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#6b8080', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: FOREST, lineHeight: 1.1 }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Section 2 – Pipeline funnel */}
        <h2 style={{ fontFamily: 'var(--head)', color: FOREST, fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Pipeline de candidatos
        </h2>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0eaea', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
          {pipelineStages.map((stage) => {
            const pct = Math.round((stage.count / totalCands) * 100)
            return (
              <div key={stage.key} style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.8rem', color: INK, width: 90, flexShrink: 0 }}>{stage.label}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: stage.color,
                    color: '#fff',
                    borderRadius: 999,
                    padding: '1px 8px',
                    minWidth: 24,
                    textAlign: 'center',
                  }}>{stage.count}</span>
                </div>
                <div style={{ height: 10, background: '#f0f4f4', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: stage.color,
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                    minWidth: stage.count > 0 ? 6 : 0,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Section 3 – Client feedback */}
        <h2 style={{ fontFamily: 'var(--head)', color: FOREST, fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Feedback del cliente
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {[
            { label: '👍 Interesado', count: stats.feedback.interested, bg: '#d4edda', color: '#155724' },
            { label: '🤔 Dudas', count: stats.feedback.maybe, bg: '#fff3cd', color: '#856404' },
            { label: '👎 No sigue', count: stats.feedback.no, bg: '#fde8e3', color: '#842029' },
          ].map((fb) => {
            const pct = totalCands > 0 ? Math.round((fb.count / totalCands) * 100) : 0
            return (
              <div
                key={fb.label}
                style={{
                  background: fb.bg,
                  color: fb.color,
                  borderRadius: 999,
                  padding: '0.5rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {fb.label}
                <span style={{ fontWeight: 700 }}>{fb.count}</span>
                <span style={{ opacity: 0.75, fontWeight: 400 }}>({pct}%)</span>
              </div>
            )
          })}
        </div>

        {/* Section 4 – Per-engagement table */}
        <h2 style={{ fontFamily: 'var(--head)', color: FOREST, fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Por evaluación
        </h2>
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e0eaea', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: FOREST, color: PALE }}>
                {['Empresa', 'Cargo', 'Candidatos', 'Avg Score', 'Top Pick', 'Contratados', 'Interesados', 'Acción'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 0.9rem', textAlign: 'left', fontFamily: 'var(--head)', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...engagements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((eng, idx) => {
                const engCands = candidates.filter((c) => c.engagement_id === eng.id)
                const count = engCands.length
                const scores = engCands.map(fitScore)
                const avgScore = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0
                const topCand = count > 0 ? engCands.reduce((best, c) => fitScore(c) > fitScore(best) ? c : best, engCands[0]) : null
                const hiredCount = engCands.filter((c) => c.pipeline_status === 'hired').length
                const interestedCount = engCands.filter((c) => c.client_feedback === 'interested').length

                return (
                  <tr
                    key={eng.id}
                    style={{
                      background: idx % 2 === 0 ? '#fff' : '#f9fbfb',
                      borderBottom: '1px solid #e8f0f0',
                    }}
                  >
                    <td style={{ padding: '0.7rem 0.9rem', fontWeight: 600, color: INK }}>{eng.company_name}</td>
                    <td style={{ padding: '0.7rem 0.9rem', color: '#3a5558' }}>{eng.title}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}>{count}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center', fontWeight: 600, color: FOREST }}>
                      {count > 0 ? `${avgScore}%` : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 0.9rem', color: '#3a5558', fontSize: '0.78rem' }}>
                      {topCand ? `${fitScore(topCand)}%` : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}>
                      {hiredCount > 0 ? (
                        <span style={{ background: '#d4edda', color: '#155724', borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {hiredCount}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}>
                      {interestedCount > 0 ? (
                        <span style={{ background: '#e8f5e9', color: '#2A7E4E', borderRadius: 999, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {interestedCount}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.7rem 0.9rem' }}>
                      <a
                        href="/app/matchgraph"
                        style={{ color: FOREST, textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', border: `1px solid ${FOREST}`, borderRadius: 6, padding: '3px 10px', display: 'inline-block' }}
                      >
                        Ver →
                      </a>
                    </td>
                  </tr>
                )
              })}
              {engagements.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b8080' }}>
                    Sin evaluaciones aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
