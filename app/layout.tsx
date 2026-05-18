import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Sora } from 'next/font/google'
import './globals.css'

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
  title: 'Candidato® — Creando conexiones',
  description:
    'Candidato conecta el mejor talento colombiano con las empresas que más crecen. Matching inteligente, sin ruido, sin spam.',
  openGraph: {
    title: 'Candidato® — Creando conexiones',
    description:
      'La infraestructura de talento para empresas que crecen. Gratis para candidatos.',
    url: 'https://candidato.com.co',
    type: 'website',
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
      <body>{children}</body>
    </html>
  )
}
