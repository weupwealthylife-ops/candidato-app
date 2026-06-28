import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Vacante en Candidato®'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await createClient()
  const { data: job } = await sb
    .from('jobs')
    .select('title, area, city, modality, salary_range, companies(company_name)')
    .eq('id', id)
    .maybeSingle()

  const title = job?.title || 'Oportunidades laborales en Colombia'
  const co = (job?.companies as { company_name?: string })?.company_name || ''
  const tags = [job?.modality, job?.city, job?.salary_range].filter(Boolean) as string[]

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#1B3B3E',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top: Candidato brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ color: '#E4F0F1', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Candidato®
          </div>
          <div style={{ width: 1, height: 18, background: 'rgba(228,240,241,0.3)' }} />
          <div style={{ color: 'rgba(228,240,241,0.6)', fontSize: 16, fontWeight: 400 }}>
            Matching inteligente · Colombia
          </div>
        </div>

        {/* Center: Job title + company */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {co && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: '#EA6440',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {co[0].toUpperCase()}
              </div>
              <div style={{ color: 'rgba(228,240,241,0.8)', fontSize: 22, fontWeight: 600 }}>{co}</div>
            </div>
          )}
          <div
            style={{
              color: '#FAFAF8',
              fontSize: title.length > 40 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {tags.map(tag => (
                <div
                  key={tag}
                  style={{
                    background: 'rgba(228,240,241,0.12)',
                    border: '1px solid rgba(228,240,241,0.2)',
                    borderRadius: 8,
                    padding: '8px 18px',
                    color: '#E4F0F1',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'rgba(228,240,241,0.5)', fontSize: 16 }}>candidato.com.co</div>
          <div
            style={{
              background: '#EA6440',
              borderRadius: 10,
              padding: '14px 28px',
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Postularme →
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
