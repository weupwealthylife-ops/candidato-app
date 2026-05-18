'use client'

import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<'es' | 'en'>('es')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const t = (es: string, en: string) => (lang === 'es' ? es : en)

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
      <a href="#hero" className="nav-logo">
        <div
          className="nav-bird"
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background:
              'linear-gradient(135deg,var(--forest) 0%,var(--forest-lt) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--white)',
            fontFamily: 'var(--head)',
            fontSize: '.85rem',
            fontWeight: 800,
            letterSpacing: '-.02em',
          }}
        >
          C
        </div>
        Candidato®
      </a>
      <ul className="nav-links">
        <li>
          <a href="#process">{t('Proceso', 'Process')}</a>
        </li>
        <li>
          <a href="#metrics">{t('Resultados', 'Results')}</a>
        </li>
        <li>
          <a href="#curator">{t('Talento', 'Talent')}</a>
        </li>
        <li>
          <a href="/app">{t('Candidatos', 'Candidates')}</a>
        </li>
        <li>
          <a href="#pricing">{t('Empresas', 'Companies')}</a>
        </li>
      </ul>
      <div className="nav-right">
        <div className="lang-pill">
          <button
            id="btn-es"
            className={lang === 'es' ? 'on' : ''}
            onClick={() => setLang('es')}
          >
            ES
          </button>
          <button
            id="btn-en"
            className={lang === 'en' ? 'on' : ''}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
        <a href="/app" className="btn btn-coral">
          {t('Comenzar gratis', 'Get started free')}
        </a>
      </div>
    </nav>
  )
}
