import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/jobs', '/jobs/'],
        disallow: ['/app', '/admin', '/api/'],
      },
    ],
    sitemap: 'https://candidato.com.co/sitemap.xml',
  }
}
