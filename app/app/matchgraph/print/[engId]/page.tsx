import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

/* ── Design tokens ────────────────────────────────────────── */
const FOREST = '#1B3B3E'
const CORAL = '#EA6440'
const PALE = '#E4F0F1'
const INK = '#0E1E20'

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
  qa_notes?: string
  salary_expectation?: string
  mobility?: string
  interview_date?: string
  client_feedback?: string
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function feedbackLabel(val: string) {
  const map: Record<string, string> = {
    interested: 'Interesado',
    maybe: 'Dudas',
    doubts: 'Dudas',
    no: 'No sigue',
  }
  return map[val] || val
}

function pipelineLabel(val: string) {
  const map: Record<string, string> = {
    sent: 'Enviado',
    interview: 'Entrevista',
    finalist: 'Finalista',
    hired: 'Contratado',
    rejected: 'Descartado',
    discarded: 'Descartado',
  }
  return map[val] || val
}

/* ── Radar chart (server-rendered SVG) ────────────────────── */
function RadarChart({ scores, size = 180 }: { scores: number[]; size?: number }) {
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
          stroke={level === 5 ? '#aaaaaa' : '#dddddd'}
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
            stroke="#cccccc"
            strokeWidth={0.7}
          />
        )
      })}
      <path d={poly(scorePoints)} fill={`${PALE}cc`} stroke={FOREST} strokeWidth={2} />
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
            fontSize={8}
            fill="#555555"
            fontFamily="Sora, system-ui, sans-serif"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function PrintPage({
  params,
}: {
  params: Promise<{ engId: string }>
}) {
  /* Auth check */
  const cookieStore = await cookies()
  const session = cookieStore.get('mg_session')

  if (!session?.value) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'var(--body)',
          color: INK,
          background: '#f8f8f8',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div
            style={{
              fontFamily: 'var(--head)',
              fontWeight: 800,
              fontSize: '1.3rem',
              marginBottom: '0.5rem',
            }}
          >
            Acceso requerido
          </div>
          <p style={{ color: '#6a8a8a', fontSize: '0.9rem' }}>
            Debes iniciar sesión en Candidato para ver este reporte.
          </p>
        </div>
      </div>
    )
  }

  /* Fetch data */
  const { engId } = await params
  const client = sb()

  const { data: eng } = await client
    .from('matchgraph_engagements')
    .select('*')
    .eq('id', engId)
    .maybeSingle()

  if (!eng) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'var(--body)',
          color: INK,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--head)',
              fontWeight: 800,
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            }}
          >
            Evaluación no encontrada
          </div>
          <p style={{ color: '#6a8a8a' }}>Verifica el enlace e intenta de nuevo.</p>
        </div>
      </div>
    )
  }

  const { data: candidates } = await client
    .from('matchgraph_candidates')
    .select('*')
    .eq('engagement_id', engId)
    .order('sort_order')

  const cands: Candidate[] = (candidates || []) as Candidate[]
  const today = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={{ fontFamily: 'var(--body)', color: INK, background: 'white' }}>
      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>

      {/* ── Print button ── */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            background: FOREST,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontFamily: 'var(--body)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          🖨 Imprimir / Guardar PDF
        </button>
      </div>

      {/* ── Cover page ── */}
      <div
        style={{
          minHeight: '26cm',
          display: 'flex',
          flexDirection: 'column',
          padding: '2.5cm 2cm 2cm',
          background: 'white',
        }}
      >
        {/* Cover header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: '3rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bird-logo.png"
            alt="Candidato®"
            width={48}
            height={48}
            style={{ borderRadius: 10, objectFit: 'contain' }}
          />
          <div>
            <div
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: FOREST,
                letterSpacing: '-0.02em',
              }}
            >
              Candidato®
            </div>
            <div style={{ fontSize: 12, color: '#6a8a8a' }}>Match Graph — Reporte de Evaluación</div>
          </div>
        </div>

        {/* Cover content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              borderLeft: `5px solid ${CORAL}`,
              paddingLeft: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: CORAL,
                fontFamily: 'var(--body)',
                marginBottom: 8,
              }}
            >
              Evaluación de candidatos
            </div>
            <h1
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 800,
                fontSize: '2.2rem',
                color: INK,
                margin: '0 0 0.5rem',
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              {eng.title}
            </h1>
            <div
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 700,
                fontSize: '1.15rem',
                color: FOREST,
              }}
            >
              {eng.company_name}
            </div>
          </div>

          {/* Meta grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {[
              { label: 'Candidatos evaluados', value: String(cands.length) },
              { label: 'Ciudad', value: eng.city || '—' },
              { label: 'Área', value: eng.job_area || '—' },
              { label: 'Fecha de generación', value: today },
              {
                label: 'Estado',
                value: eng.status === 'open' ? 'Abierta' : 'Cerrada',
              },
              {
                label: 'Top candidatos',
                value: String(cands.filter(c => c.is_top).length),
              },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  background: '#f8f9f9',
                  borderRadius: 10,
                  padding: '0.9rem 1rem',
                  borderTop: `3px solid ${FOREST}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    color: '#6a8a8a',
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--head)',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: INK,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cover footer */}
        <div
          style={{
            borderTop: '1px solid #e8e8e8',
            paddingTop: '1rem',
            fontSize: 11,
            color: '#9a9a9a',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--body)',
          }}
        >
          <span>Candidato® · candidato.com.co · Confidencial</span>
          <span>Generado el {today}</span>
        </div>
      </div>

      {/* ── Candidate pages ── */}
      {cands.map((c, idx) => {
        const fit = avgScore(c)
        const scores = SCORE_KEYS.map(k => Number(c[k]) || 0)
        const fitColor = fit >= 75 ? FOREST : fit >= 55 ? '#c08000' : CORAL
        const initials = c.name
          .split(' ')
          .slice(0, 2)
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()

        return (
          <div
            key={c.id}
            className="page-break"
            style={{
              minHeight: '26cm',
              padding: '1.5cm 2cm 1cm',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Page header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: `2px solid ${FOREST}`,
                marginBottom: '1.2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bird-logo.png"
                  alt="Candidato®"
                  width={28}
                  height={28}
                  style={{ borderRadius: 6, objectFit: 'contain' }}
                />
                <span
                  style={{
                    fontFamily: 'var(--head)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: FOREST,
                  }}
                >
                  Candidato® · Match Graph
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#9a9a9a', fontFamily: 'var(--body)' }}>
                {eng.title} · {eng.company_name}
              </span>
            </div>

            {/* Candidate header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.2rem',
                marginBottom: '1.2rem',
              }}
            >
              {/* Avatar */}
              {c.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photo_url}
                  alt={c.name}
                  width={72}
                  height={72}
                  style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `${FOREST}18`,
                    border: `2px solid ${FOREST}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--head)',
                    fontWeight: 700,
                    fontSize: '1.35rem',
                    color: FOREST,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Name & badges */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2
                    style={{
                      fontFamily: 'var(--head)',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      color: INK,
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {c.name}
                  </h2>
                  {c.is_top && (
                    <span
                      style={{
                        background: CORAL,
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 800,
                        fontFamily: 'var(--head)',
                        padding: '3px 10px',
                        borderRadius: 20,
                        letterSpacing: '.04em',
                      }}
                    >
                      TOP CANDIDATO
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    marginTop: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  {c.pipeline_status && (
                    <span
                      style={{
                        fontSize: 12,
                        color: FOREST,
                        fontWeight: 600,
                        fontFamily: 'var(--body)',
                      }}
                    >
                      Estado: {pipelineLabel(c.pipeline_status)}
                    </span>
                  )}
                  {c.client_feedback && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#6a6a6a',
                        fontFamily: 'var(--body)',
                      }}
                    >
                      Feedback del cliente: {feedbackLabel(c.client_feedback)}
                    </span>
                  )}
                  {c.interview_date && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#6a6a6a',
                        fontFamily: 'var(--body)',
                      }}
                    >
                      Entrevista: {formatDate(c.interview_date)}
                    </span>
                  )}
                </div>
              </div>

              {/* Fit score */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: `${fitColor}12`,
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
                      fontSize: '1.5rem',
                      color: fitColor,
                      lineHeight: 1,
                    }}
                  >
                    {fit}
                  </span>
                  <span
                    style={{ fontSize: 10, color: fitColor, fontWeight: 700 }}
                  >
                    %
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#9a9a9a',
                    marginTop: 3,
                    fontFamily: 'var(--body)',
                  }}
                >
                  Fit Score
                </div>
              </div>
            </div>

            {/* Main content grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '190px 1fr',
                gap: '1.5rem',
                flex: 1,
              }}
            >
              {/* Left column: radar + score table */}
              <div>
                <RadarChart scores={scores} size={180} />

                {/* Score table */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '0.5rem',
                    fontSize: 11,
                    fontFamily: 'var(--body)',
                  }}
                >
                  <tbody>
                    {SCORE_KEYS.map((k, i) => {
                      const val = Number(c[k as keyof Candidate]) || 0
                      const barColor =
                        val >= 4 ? FOREST : val >= 3 ? '#c08000' : CORAL
                      return (
                        <tr
                          key={k}
                          style={{
                            borderBottom: '1px solid #f0f0f0',
                          }}
                        >
                          <td
                            style={{
                              padding: '4px 0',
                              color: '#555',
                              fontSize: 10.5,
                            }}
                          >
                            {SCORE_LABELS[i]}
                          </td>
                          <td
                            style={{
                              padding: '4px 0 4px 8px',
                              width: 36,
                              textAlign: 'right',
                              fontWeight: 800,
                              color: barColor,
                              fontFamily: 'var(--head)',
                            }}
                          >
                            {val}/5
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right column: text sections */}
              <div>
                {c.formation && (
                  <PrintSection label="Formación" value={c.formation} />
                )}
                {c.relevant_experience && (
                  <PrintSection
                    label="Experiencia relevante"
                    value={c.relevant_experience}
                  />
                )}
                {c.technical_strengths && (
                  <PrintSection
                    label="Fortalezas técnicas"
                    value={c.technical_strengths}
                  />
                )}
                {c.qa_notes && (
                  <PrintSection label="Notas de evaluación" value={c.qa_notes} />
                )}

                {/* Logistics row */}
                {(c.salary_expectation || c.mobility) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      marginTop: 8,
                    }}
                  >
                    {c.salary_expectation && (
                      <PrintMeta label="Expectativa salarial" value={c.salary_expectation} />
                    )}
                    {c.mobility && (
                      <PrintMeta label="Movilidad" value={c.mobility} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Candidate page footer */}
            <div
              style={{
                borderTop: '1px solid #e8e8e8',
                paddingTop: '0.6rem',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: '#aaaaaa',
                fontFamily: 'var(--body)',
              }}
            >
              <span>Candidato® · candidato.com.co · Confidencial</span>
              <span>
                Candidato {idx + 1} de {cands.length}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Sub-components for print layout ─────────────────────── */
function PrintSection({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        marginBottom: '0.85rem',
        paddingBottom: '0.85rem',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          color: FOREST,
          fontFamily: 'var(--body)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          color: INK,
          lineHeight: 1.65,
          fontFamily: 'var(--body)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function PrintMeta({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#f5f5f5',
        borderRadius: 7,
        padding: '0.5rem 0.75rem',
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: '#888',
          marginBottom: 2,
          fontFamily: 'var(--body)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: INK,
          fontFamily: 'var(--body)',
        }}
      >
        {value}
      </div>
    </div>
  )
}
