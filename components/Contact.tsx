'use client'

import { useLang } from '@/lib/LangContext'

export default function Contact() {
  const { t } = useLang()

  return (
    <section id="contact">
      <div className="contact-inner">
        <span className="sec-eye">{t('Contacto', 'Contact')}</span>
        <h2 className="sec-h2 wh" style={{ marginBottom: '.7rem' }}>
          {t(
            'Creamos conexiones que estaban destinadas a suceder.',
            'We create connections that were always meant to happen.',
          )}
        </h2>
        <p className="sec-sub wh">{t('Agendemos una asesoría personalizada.', "Let's schedule a personalised consultation.")}</p>
        <div className="contact-row">
          <div className="cc-btn-wrap">
            <a href="https://wa.me/573205046723?text=Hola%2C%20vengo%20de%20candidato.com.co%20y%20quisiera%20m%C3%A1s%20informaci%C3%B3n" className="cc-btn" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg viewBox="0 0 48 48" fill="none">
                <defs>
                  <radialGradient id="wg" cx="38%" cy="32%" r="68%">
                    <stop offset="0%" stopColor="#3de07a" />
                    <stop offset="100%" stopColor="#1aab55" />
                  </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#wg)" />
                <path d="M34 28.4c-.45-.23-2.7-1.34-3.12-1.5-.42-.15-.72-.22-1.02.23-.3.45-1.17 1.5-1.44 1.8-.27.3-.54.34-.99.11a12.4 12.4 0 01-3.67-2.27 13.8 13.8 0 01-2.54-3.14c-.26-.45-.03-.7.19-.92.2-.2.45-.52.68-.78.22-.26.3-.45.44-.75.15-.3.07-.56-.04-.78-.12-.23-1.05-2.55-1.44-3.48-.37-.9-.75-.78-1.04-.8h-.89c-.3 0-.77.11-1.18.56-.4.45-1.56 1.52-1.56 3.72s1.6 4.32 1.82 4.62c.22.3 3.15 4.82 7.63 6.76 1.07.46 1.9.73 2.55.94.73.26 1.4.22 1.92-.13.59-.4 1.35-1.36 1.54-2.74.2-.8.2-1.47.14-1.61-.05-.15-.3-.22-.64-.38z" fill="white" />
              </svg>
            </a>
            <span className="cc-label">WhatsApp</span>
          </div>
          <div className="cc-btn-wrap">
            <a href="mailto:hola@candidato.com.co" className="cc-btn" aria-label="Email">
              <svg viewBox="0 0 48 48" fill="none">
                <defs>
                  <radialGradient id="eg" cx="38%" cy="32%" r="68%">
                    <stop offset="0%" stopColor="#f5896a" />
                    <stop offset="100%" stopColor="#c44e2c" />
                  </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#eg)" />
                <path d="M12 17a2 2 0 012-2h20a2 2 0 012 2v14a2 2 0 01-2 2H14a2 2 0 01-2-2V17zm2 0l10 7.5L34 17H14zm20 2.5L24 27 14 19.5V31h20V19.5z" fill="white" />
              </svg>
            </a>
            <span className="cc-label">Email</span>
          </div>
          <div className="cc-btn-wrap">
            <a href="https://www.linkedin.com/company/candidato/" className="cc-btn" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 48 48" fill="none">
                <defs>
                  <radialGradient id="lg" cx="38%" cy="32%" r="68%">
                    <stop offset="0%" stopColor="#4098e8" />
                    <stop offset="100%" stopColor="#0a66c2" />
                  </radialGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#lg)" />
                <path d="M17 20h-4v12h4V20zm-2-5.4a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zM33 20c-2.4 0-3.9 1.2-4.5 2.4V20h-4v12h4V26c0-2 .8-3.5 2.5-3.5 1.8 0 2.5 1.5 2.5 3.5v6h4v-6.5c0-4.5-2.3-5.5-4.5-5.5z" fill="white" />
              </svg>
            </a>
            <span className="cc-label">LinkedIn</span>
          </div>
        </div>
      </div>
    </section>
  )
}
