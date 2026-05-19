'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

const CHIPS = [
  { i: 'DS', n: 'Daniela Salcedo', bg: '#EA6440', logo: '/logos/daniela-salcedo.png' },
  { i: 'HP', n: 'helppeople',      bg: '#1B3B3E', logo: '/logos/helppeople.png' },
  { i: 'EPI', n: 'EPI',            bg: '#2D6B70', logo: '/logos/epi.png' },
  { i: 'AG', n: 'Agroup',          bg: '#264D51', logo: '/logos/agroup.png' },
  { i: 'OH', n: 'Oh Honey',        bg: '#F0A070', logo: '/logos/oh-honey.png' },
  { i: 'AS', n: 'Asecoemg',        bg: '#3A6B6E', logo: '/logos/asecoemg.png' },
  { i: 'PP', n: 'Panela Palestina',bg: '#8B5E3C', logo: '/logos/panela-palestina.png' },
  { i: 'AF', n: 'Antojo Frutal',   bg: '#6B8E44', logo: '/logos/antojo-frutal.png' },
  { i: 'FR', n: 'Frat',            bg: '#1B3B3E', logo: '/logos/frat.png' },
  { i: 'AV', n: 'Acevalco',        bg: '#2D4A6E', logo: '/logos/acevalco.png' },
]

function LogoChip({ chip }: { chip: typeof CHIPS[number] }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div className="logo-chip">
      {!imgFailed ? (
        <div className="logo-img-wrap">
          <Image
            src={chip.logo}
            alt={chip.n}
            width={120}
            height={40}
            style={{ objectFit: 'contain', width: 'auto', height: 36, filter: 'grayscale(100%) brightness(0.3)' }}
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div className="logo-init" style={{ background: chip.bg }}>
          {chip.i}
        </div>
      )}
      {imgFailed && <span className="logo-name">{chip.n}</span>}
    </div>
  )
}

export default function TrustBar() {
  const { t } = useLang()
  const all = [...CHIPS, ...CHIPS]
  return (
    <>
      <div className="trust-bar">
        <span className="trust-lbl">
          {t('Confían en', 'Trusted by')}
          <br />
          {t('nosotros', 'our clients')}
        </span>
        <div className="trust-sep"></div>
        <div className="marquee-wrap">
          <div className="marquee-track">
            {all.map((c, idx) => (
              <LogoChip key={idx} chip={c} />
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 6,
          background: 'linear-gradient(to bottom,var(--white),#1a4a4d)',
          display: 'block',
          margin: 0,
          padding: 0,
          lineHeight: 0,
        }}
      ></div>
    </>
  )
}
