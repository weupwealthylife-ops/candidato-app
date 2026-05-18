'use client'

import Image from 'next/image'
import { useLang } from '@/lib/LangContext'

export default function Footer() {
  const { t } = useLang()

  return (
    <footer>
      <div className="f-brand" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Image src="/bird-logo.png" alt="Candidato" width={20} height={20} style={{ objectFit: 'contain' }} />
        Candidato®
      </div>
      <span className="f-copy">© 2026 Candidato® · Cali, Colombia</span>
      <div className="f-links">
        <a href="#process">{t('Proceso', 'Process')}</a>
        <a href="/app">{t('Candidatos', 'Candidates')}</a>
        <a href="#pricing">{t('Empresas', 'Companies')}</a>
        <a href="#contact">{t('Contacto', 'Contact')}</a>
      </div>
    </footer>
  )
}
