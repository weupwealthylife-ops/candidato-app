import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Candidato® — Matching inteligente',
    short_name: 'Candidato',
    description: 'Conectamos talento colombiano con las mejores empresas.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#F5F4F0',
    theme_color: '#1B3B3E',
    orientation: 'portrait',
    icons: [
      { src: '/bird-logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/bird-logo.png', sizes: '512x512', type: 'image/png' },
    ],
    screenshots: [
      { src: '/bird-logo.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
