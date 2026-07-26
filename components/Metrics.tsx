'use client'

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/LangContext'

function useCountUp(target: number, duration = 1400, trigger: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [trigger, target, duration])
  return val
}

function AnimatedStat({ target, suffix = '', prefix = '', label, sub }: { target: number; suffix?: string; prefix?: string; label: string; sub?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const val = useCountUp(target, 1400, visible)
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '1rem' }}>
      <div className="m-num" style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
        {prefix}{target < 100 ? val : val.toLocaleString('es-CO')}{suffix}
      </div>
      <div className="m-label" style={{ marginBottom: '.3rem' }}>{label}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--ink-45)' }}>{sub}</div>}
    </div>
  )
}

export default function Metrics() {
  const { t } = useLang()

  return (
    <section className="sec" id="metrics" style={{ background: 'var(--cream)' }}>
      <div className="sec-inner">
        <div>
          <span className="sec-eye">{t('Por qué Candidato', 'Why Candidato')}</span>
          <h2 className="sec-h2">{t('Resultados que hablan.', 'Results that speak.')}</h2>
        </div>

        {/* Live counters row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', margin: '1.2rem 0', background: 'white', borderRadius: 14, padding: '.5rem', border: '1px solid var(--line)' }}>
          <AnimatedStat target={500} prefix="+" suffix="" label={t('candidatos activos', 'active candidates')} />
          <AnimatedStat target={80} suffix="%" label={t('tasa de match', 'match rate')} sub={t('matches exitosos', 'successful matches')} />
          <AnimatedStat target={90} prefix="−" suffix="%" label={t('costo de contratar', 'cost to hire')} />
          <AnimatedStat target={24} suffix="h" label={t('tiempo al primer match', 'time to first match')} />
        </div>

        <div className="metrics-wrap">
          <div className="m-card dark in">
            <div className="m-tag">{t('Velocidad', 'Speed')}</div>
            <div className="m-num">2–4</div>
            <div className="m-label">{t('semanas menos de espera', 'fewer weeks of waiting')}</div>
            <div className="m-desc">
              {t(
                'Reducimos el tiempo de contratación drásticamente. Menos tiempo buscando, más tiempo construyendo.',
                'We drastically reduce hiring time. Less time searching, more time building.',
              )}
            </div>
          </div>
          <div className="m-card in">
            <div className="m-tag">{t('Precisión', 'Precision')}</div>
            <div className="m-num coral">80%</div>
            <div className="m-label">{t('tasa de match exitoso', 'successful match rate')}</div>
            <div className="m-desc">
              {t(
                'No es suerte — es tecnología. Nuestro algoritmo identifica compatibilidad real entre candidato y empresa.',
                "It's not luck — it's technology. Our algorithm identifies real compatibility between candidate and company.",
              )}
            </div>
          </div>
          <div className="m-card in">
            <div className="m-tag">{t('Ahorro', 'Savings')}</div>
            <div className="m-num" style={{ color: 'var(--forest)' }}>−90%</div>
            <div className="m-label">{t('en costos de contratación', 'in hiring costs')}</div>
            <div className="m-desc">
              {t(
                'Sin honorarios de agencia tradicional. Solo el talento correcto, al costo correcto.',
                'No traditional agency fees. Just the right talent, at the right cost.',
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.2rem',
            padding: '1rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--forest)', letterSpacing: '-.01em' }}>🇨🇴 · col</span>
            <div>
              <div className="m-tag">{t('Cobertura', 'Coverage')}</div>
              <div className="m-label" style={{ marginBottom: 0 }}>
                {t('Hecho en Colombia, para el mundo', 'Made in Colombia, for the world')}
              </div>
            </div>
          </div>
          <div className="m-wide-text">
            {t(
              'Nacimos en Cali con pasión. Operamos en todo el país conectando el mejor talento colombiano con las mejores empresas.',
              'Born in Cali with passion. We operate nationwide connecting the best Colombian talent with the best companies.',
            )}
          </div>
          <a href="/app" className="btn btn-forest btn-lg">
            {t('Unirme', 'Join us')}
          </a>
        </div>
      </div>
    </section>
  )
}
