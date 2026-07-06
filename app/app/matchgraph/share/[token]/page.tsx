import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

/* ── Design tokens ────────────────────────────────────────── */
const FOREST = '#1B3B3E'
const CORAL = '#EA6440'
const PALE = '#E4F0F1'
const INK = '#0E1E20'
const OFF = '#F5F4F0'

/* ── Score keys & labels ──────────────────────────────────── */
const SCORE_LABELS = [
  'Profesión',
  'Años de experiencia',
  'Experiencia en el sector',
  'Requer. del cargo',
  'Disponibilidad',
]
const SCORE_KEYS = [
  'score_profession',
  'score_experience',
  'score_sector',
  'score_requirements',
  'score_availability',
] as const

/* ── Types ────────────────────────────────────────────────── */
interface Engagement {
  id: string
  title: string
  company_name: string
  client_email: string
  status: 'open' | 'closed'
  job_area?: string
  city?: string
  created_at: string
}

interface Candidate {
  id: string
  engagement_id: string
  sort_order: number
  name: string
  photo_url?: string
  score_profession: number
  score_experience: number
  score_sector: number
  score_requirements: number
  score_availability: number
  is_top: boolean
  formation?: string
  relevant_experience?: string
  technical_strengths?: string
  pipeline_status?: string
}

/* ── Helpers ──────────────────────────────────────────────── */
function avgScore(c: Candidate) {
  const vals = SCORE_KEYS.map(k => Number(c[k]) || 0)
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 20)
}

function baseUrl(raw: string) {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw
  }
}

function sb() {
  return createClient(
    baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/* ── Metadata ─────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const client = sb()
  const { data: eng } = await client
    .from('matchgraph_engagements')
    .select('title, company_name')
    .eq('share_token', token)
    .maybeSingle()
  const title = eng
    ? `${eng.title} · ${eng.company_name} · Candidato®`
    : 'Match Graph · Candidato®'
  return { title, robots: { index: false, follow: false } }
}

/* ── Radar chart (server-rendered SVG) ────────────────────── */
function RadarChart({ scores, size = 220 }: { scores: number[]; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.33
  const labelR = size * 0.46
  const n = 5
  const ang = (i: number) => -Math.PI / 2 + (i * (2 * Math.PI)) / n
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(ang(i)),
    y: cy + radius * Math.sin(ang(i)),
  })
  const poly = (points: { x: number; y: number }[]) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ') + 'Z'
  const scorePoints = scores.map((s, i) => pt(i, (Math.max(1, Math.min(5, s)) / 5) * r))
  const shortLabels = ['Profesión', 'Experiencia', 'Sector', 'Requisitos', 'Disponibilidad']

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 2, 3, 4, 5].map(level => (
        <path
          key={level}
          d={poly(Array.from({ length: n }, (_, i) => pt(i, (level / 5) * r)))}
          fill="none"
          stroke={level === 5 ? '#c8d8d9' : '#e2eced'}
          strokeWidth={level === 5 ? 1 : 0.6}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const e = pt(i, r)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={e.x.toFixed(1)}
            y2={e.y.toFixed(1)}
            stroke="#c8d8d9"
            strokeWidth={0.7}
          />
        )
      })}
      <path d={poly(scorePoints)} fill={`${PALE}bb`} stroke={FOREST} strokeWidth={2} />
      {scorePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={FOREST} />
      ))}
      {shortLabels.map((label, i) => {
        const p = pt(i, labelR)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9.5}
            fill="#4a6a6a"
            fontFamily="Sora, system-ui, sans-serif"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Score bar (static) ───────────────────────────────────── */
function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = ((score - 1) / 4) * 100
  const color = score >= 4 ? FOREST : score >= 3 ? '#e6a817' : CORAL
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <span style={{ fontSize: 11.5, color: '#4a6a6a', fontFamily: 'var(--body)' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}</span>
      </div>
      <div
        style={{
          height: 5,
          background: '#e2eced',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  )
}

/* ── Initials avatar ──────────────────────────────────────── */
function InitialsAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${FOREST}22`,
        border: `2px solid ${FOREST}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--head)',
        fontWeight: 700,
        fontSize: size * 0.3,
        color: FOREST,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

/* ── Text section ─────────────────────────────────────────── */
function InfoSection({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: '#6a8a8a',
          fontFamily: 'var(--body)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: INK,
          lineHeight: 1.6,
          fontFamily: 'var(--body)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const client = sb()

  /* Fetch engagement */
  const { data: eng } = await client
    .from('matchgraph_engagements')
    .select('*')
    .eq('share_token', token)
    .maybeSingle()

  if (!eng) notFound()

  /* Fetch candidates */
  const { data: candidates } = await client
    .from('matchgraph_candidates')
    .select(
      'id, name, photo_url, score_profession, score_experience, score_sector, score_requirements, score_availability, is_top, formation, relevant_experience, technical_strengths, pipeline_status'
    )
    .eq('engagement_id', eng.id)
    .order('sort_order')

  const cands: Candidate[] = (candidates || []) as Candidate[]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: OFF,
        fontFamily: 'var(--body)',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: FOREST,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bird-logo.png"
            alt="Candidato®"
            width={34}
            height={34}
            style={{ borderRadius: 8, objectFit: 'contain' }}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              Candidato® Match Graph
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}>
              {eng.company_name}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--head)',
              fontWeight: 700,
              fontSize: '1rem',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            {eng.title}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 5,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 20,
              padding: '2px 12px',
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'var(--body)',
              fontWeight: 600,
            }}
          >
            Vista compartida — solo lectura
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Engagement info strip */}
        <div
          style={{
            background: PALE,
            borderRadius: 12,
            padding: '0.85rem 1.2rem',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: INK, fontFamily: 'var(--body)' }}>
            <strong>{cands.length}</strong> candidato{cands.length !== 1 ? 's' : ''} evaluado
            {cands.length !== 1 ? 's' : ''}
          </div>
          {eng.city && (
            <div style={{ fontSize: 13, color: '#4a6a6a' }}>📍 {eng.city}</div>
          )}
          {eng.job_area && (
            <div style={{ fontSize: 13, color: '#4a6a6a' }}>🏷 {eng.job_area}</div>
          )}
        </div>

        {/* Candidate cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {cands.map(c => {
            const fit = avgScore(c)
            const scores = SCORE_KEYS.map(k => Number(c[k]) || 0)
            const fitColor = fit >= 75 ? FOREST : fit >= 55 ? '#e6a817' : CORAL

            return (
              <div
                key={c.id}
                style={{
                  background: 'white',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px rgba(14,30,32,0.08)',
                  overflow: 'hidden',
                  border: c.is_top ? `2px solid ${CORAL}` : '2px solid transparent',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: '1.2rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderBottom: `1px solid ${PALE}`,
                    flexWrap: 'wrap',
                  }}
                >
                  {c.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      width={56}
                      height={56}
                      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <InitialsAvatar name={c.name} size={56} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div
                        style={{
                          fontFamily: 'var(--head)',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: INK,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {c.name}
                      </div>
                      {c.is_top && (
                        <span
                          style={{
                            background: CORAL,
                            color: 'white',
                            fontSize: 10,
                            fontWeight: 800,
                            fontFamily: 'var(--head)',
                            padding: '2px 9px',
                            borderRadius: 20,
                            letterSpacing: '.04em',
                          }}
                        >
                          TOP
                        </span>
                      )}
                    </div>
                    {c.pipeline_status && (
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: '#6a8a8a',
                          fontFamily: 'var(--body)',
                        }}
                      >
                        Estado: {c.pipeline_status}
                      </div>
                    )}
                  </div>

                  {/* Fit score badge */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `${fitColor}18`,
                        border: `3px solid ${fitColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--head)',
                          fontWeight: 800,
                          fontSize: '1.05rem',
                          color: fitColor,
                          lineHeight: 1,
                        }}
                      >
                        {fit}
                      </span>
                      <span style={{ fontSize: 9, color: fitColor, fontWeight: 600 }}>%</span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#6a8a8a',
                        marginTop: 3,
                        fontFamily: 'var(--body)',
                      }}
                    >
                      Fit Score
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div
                  style={{
                    padding: '1.2rem 1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)',
                    gap: '1.5rem',
                  }}
                >
                  {/* Left: radar + score bars */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <RadarChart scores={scores} size={200} />
                    </div>
                    <div>
                      {SCORE_KEYS.map((k, i) => (
                        <ScoreBar
                          key={k}
                          label={SCORE_LABELS[i]}
                          score={Number(c[k as keyof Candidate]) || 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: text details */}
                  <div>
                    {c.formation && (
                      <InfoSection label="Formación" value={c.formation} />
                    )}
                    {c.relevant_experience && (
                      <InfoSection
                        label="Experiencia relevante"
                        value={c.relevant_experience}
                      />
                    )}
                    {c.technical_strengths && (
                      <InfoSection
                        label="Fortalezas técnicas"
                        value={c.technical_strengths}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {cands.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6a8a8a',
              fontFamily: 'var(--body)',
            }}
          >
            No hay candidatos disponibles en esta evaluación.
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem 1rem',
          color: '#8a9a9a',
          fontSize: 12,
          fontFamily: 'var(--body)',
          borderTop: `1px solid #d8e4e4`,
          marginTop: '2rem',
        }}
      >
        Generado por Candidato® · candidato.com.co
      </footer>
    </div>
  )
}
