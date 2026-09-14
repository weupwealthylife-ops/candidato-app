import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Sora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

// Set your LinkedIn partner ID in NEXT_PUBLIC_LINKEDIN_PARTNER_ID Vercel env var
const LI_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || ''

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://candidato.com.co'),
  title: 'Candidato® — Matching inteligente de talento en Colombia',
  description:
    'Candidato conecta el mejor talento colombiano con las empresas que más crecen. Matching inteligente, sin ruido, sin spam. 100% gratis para candidatos.',
  keywords: ['empleo colombia', 'trabajo remoto colombia', 'matching empleo', 'ofertas trabajo cali bogota medellin', 'headhunting colombia', 'talento tecnologia'],
  authors: [{ name: 'Candidato', url: 'https://candidato.com.co' }],
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Candidato' },
  openGraph: {
    title: 'Candidato® — La conexión que estaba destinada',
    description: 'Matching inteligente entre talento y empresas en Colombia. Gratis para candidatos. Sin spam, solo oportunidades que importan.',
    url: 'https://candidato.com.co',
    type: 'website',
    siteName: 'Candidato',
    images: [{ url: '/bird-logo.png', width: 400, height: 400, alt: 'Candidato' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Candidato® — Matching inteligente de talento',
    description: 'Conectamos el talento correcto con la empresa correcta en Colombia.',
  },
}

export const viewport: Viewport = {
  themeColor: '#1B3B3E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${sora.variable} ${instrumentSans.variable}`}>
      <body>
        {children}
        <Analytics />
        {/* LinkedIn Insight Tag — set NEXT_PUBLIC_LINKEDIN_PARTNER_ID in Vercel */}
        {LI_PARTNER_ID && (
          <Script id="li-insight" strategy="afterInteractive">{`
            _linkedin_partner_id="${LI_PARTNER_ID}";
            window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
            var s=document.getElementsByTagName("script")[0];
            var b=document.createElement("script");
            b.type="text/javascript";b.async=true;
            b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b,s)})(window.lintrk);
          `}</Script>
        )}
      </body>
    </html>
  )
}
