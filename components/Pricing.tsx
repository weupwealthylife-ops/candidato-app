'use client'

import { useLang } from '@/lib/LangContext'

export default function Pricing() {
  const { t } = useLang()

  return (
    <section id="pricing">
      <div className="pricing-head">
        <span className="sec-eye">{t('Para empresas', 'For companies')}</span>
        <h2 className="sec-h2">{t('Planes que crecen con vos.', 'Plans that grow with you.')}</h2>
        <p className="sec-sub" style={{ margin: '.5rem auto 0' }}>
          {t(
            'Accedé al talento más compatible con nuestra tecnología de matching inteligente.',
            'Access the most compatible talent with our intelligent matching technology.',
          )}
        </p>
      </div>
      <div className="pgrid">
        <div className="pc in">
          <div className="pce">Starter</div>
          <div className="pcn">{t('Básico', 'Basic')}</div>
          <div className="pca"><sup>$</sup>300K <span>/ {t('mes', 'month')}</span></div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>{t('1 vacante al mes', '1 job listing per month')}</li>
            <li>{t('Publicación del cargo', 'Job posting')}</li>
            <li>{t('Envío de hojas de vida', 'CV delivery')}</li>
            <li>{t('Soporte por WhatsApp', 'WhatsApp support')}</li>
          </ul>
          <a href="https://wa.me/573205046723" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            {t('Comenzar', 'Get started')}
          </a>
        </div>
        <div className="pc feat in">
          <div className="pce">Pro ✦</div>
          <div className="pcn">{t('Profesional', 'Professional')}</div>
          <div className="pca"><sup>$</sup>1M <span>/ {t('mes', 'month')}</span></div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>{t('2 vacantes al mes', '2 job listings per month')}</li>
            <li>{t('Acceso al Top 1% semanal', 'Weekly Top 1% access')}</li>
            <li>{t('Preselección con IA', 'AI pre-screening')}</li>
            <li>{t('Matching inteligente', 'Intelligent matching')}</li>
            <li>{t('Reporte de compatibilidad', 'Compatibility report')}</li>
            <li>{t('Asesoría personalizada', 'Personalised advisory')}</li>
          </ul>
          <a href="https://wa.me/573205046723" className="btn btn-coral" style={{ width: '100%', justifyContent: 'center' }}>
            {t('Comenzar', 'Get started')}
          </a>
        </div>
        <div className="pc in">
          <div className="pce">Enterprise</div>
          <div className="pcn">{t('A medida', 'Custom')}</div>
          <div className="pca" style={{ fontSize: '1.4rem' }}>{t('A consultar', 'Contact us')}</div>
          <div className="pcd"></div>
          <ul className="pcf">
            <li>{t('Vacantes ilimitadas', 'Unlimited job listings')}</li>
            <li>{t('Dashboard dedicado', 'Dedicated dashboard')}</li>
            <li>{t('API de integración', 'Integration API')}</li>
            <li>{t('SLA garantizado', 'Guaranteed SLA')}</li>
            <li>{t('Account manager', 'Account manager')}</li>
          </ul>
          <a href="https://wa.me/573205046723" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            {t('Hablemos', "Let's talk")}
          </a>
        </div>
      </div>
    </section>
  )
}
