'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLang } from '@/lib/LangContext'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, setLang, t } = useLang()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route/hash change
  const close = () => setMenuOpen(false)

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
        <a href="#hero" className="nav-logo" onClick={close}>
          <Image src="/bird-logo.png" alt="Candidato" width={34} height={34} className="nav-bird" priority />
          Candidato®
        </a>
        <ul className="nav-links">
          <li><a href="#process">{t('Proceso', 'Process')}</a></li>
          <li><a href="#metrics">{t('Resultados', 'Results')}</a></li>
          <li><a href="#for-companies">{t('Empresas', 'Companies')}</a></li>
          <li><a href="/app">{t('Candidatos', 'Candidates')}</a></li>
          <li><a href="#pricing">{t('Planes', 'Pricing')}</a></li>
        </ul>
        <div className="nav-right">
          <div className="lang-pill">
            <button id="btn-es" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
            <button id="btn-en" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <a href="/app" className="btn btn-coral">{t('Comenzar gratis', 'Get started free')}</a>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-mobile-drawer" onClick={close}>
          <div className="nav-mobile-inner" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--head)', fontWeight: 700, color: 'var(--forest)', fontSize: '1rem' }}>Candidato®</span>
              <button onClick={close} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--ink-45)', lineHeight: 1 }}>✕</button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
              {[
                { href: '#process', es: 'Proceso', en: 'Process' },
                { href: '#metrics', es: 'Resultados', en: 'Results' },
                { href: '#for-companies', es: 'Para empresas', en: 'For companies' },
                { href: '/app', es: 'Candidatos', en: 'Candidates' },
                { href: '#pricing', es: 'Planes y precios', en: 'Pricing' },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={close} style={{ padding: '.75rem .5rem', fontWeight: 600, fontSize: '.92rem', color: 'var(--ink)', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}>
                  {t(l.es, l.en)}
                </a>
              ))}
            </nav>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <a href="/app" className="btn btn-forest" style={{ width: '100%', justifyContent: 'center' }} onClick={close}>
                {t('Crear mi perfil gratis', 'Create my free profile')}
              </a>
              <a href="#for-companies" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={close}>
                {t('Soy una empresa', "I'm a company")}
              </a>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.2rem', justifyContent: 'center' }}>
              <button style={{ background: lang === 'es' ? 'var(--forest)' : 'var(--off)', color: lang === 'es' ? 'white' : 'var(--ink-45)', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }} onClick={() => setLang('es')}>ES</button>
              <button style={{ background: lang === 'en' ? 'var(--forest)' : 'var(--off)', color: lang === 'en' ? 'white' : 'var(--ink-45)', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
