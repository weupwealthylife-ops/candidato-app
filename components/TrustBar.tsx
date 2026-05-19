'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLang } from '@/lib/LangContext'

// filter: null = default grayscale, 'invert' = white logo on white bg, 'dark' = force very dark, 'washbg' = remove baked-in background
const CHIPS = [
  { i: 'DS', n: 'Daniela Salcedo', bg: '#EA6440', logo: '/daniela-salcedo.png', filter: 'invert'  },
  { i: 'HP', n: 'helppeople',      bg: '#1B3B3E', logo: '/helppeople.png',       filter: null      },
  { i: 'EPI', n: 'EPI',            bg: '#2D6B70', logo: '/epi.png',              filter: null      },
  { i: 'AG', n: 'Agroup',          bg: '#264D51', logo: '/agroup.png',           filter: null      },
  { i: 'OH', n: 'Oh Honey',        bg: '#F0A070', logo: '/oh-honey.png',         filter: 'washbg'  },
  { i: 'AS', n: 'Asecoemg',        bg: '#3A6B6E', logo: '/Asecoemg.jpg',         filter: 'washbg'  },
  { i: 'PP', n: 'Panela Palestina',bg: '#8B5E3C', logo: '/panela-palestina.png', filter: 'washbg'  },
  { i: 'AF', n: 'Antojo Frutal',   bg: '#6B8E44', logo: '/antojo-frutal.png',    filter: 'washbg'  },
  { i: 'FR', n: 'Frat',            bg: '#1B3B3E', logo: '/frat.png',             filter: 'washbg'  },
  { i: 'AV', n: 'Acevalco',        bg: '#2D4A6E', logo: '/acevalco.png',         filter: 'dark'    },
]

const FILTERS: Record<string, string> = {
  invert:  'grayscale(100%) invert(1) brightness(0.85)',
  dark:    'grayscale(100%) brightness(0.3) contrast(1.4)',
  washbg:  'grayscale(100%) brightness(3) contrast(4)',
  null:    'grayscale(100%) brightness(0.55)',
}

function LogoChip({ chip }: { chip: typeof CHIPS[number] }) {
  const [imgFailed, setImgFailed] = useState(false)
  const cssFilter = FILTERS[chip.filter ?? 'null']

  return (
    <div className="logo-chip">
      {!imgFailed ? (
        <div className="logo-img-wrap">
          <Image
            src={chip.logo}
            alt={chip.n}
            width={120}
            height={40}
            style={{ objectFit: 'contain', width: '100%', height: '100%', filter: cssFilter }}
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <>
          <div className="logo-init" style={{ background: chip.bg }}>{chip.i}</div>
          <span className="logo-name">{chip.n}</span>
        </>
      )}
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
