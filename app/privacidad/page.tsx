import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Candidato®',
  description: 'Política de privacidad y tratamiento de datos personales de Candidato Colombia, conforme a la Ley 1581 de 2012.',
}

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F0', fontFamily: 'var(--font-instrument, system-ui)' }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 64, background: 'rgba(245,244,240,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(14,30,32,.07)', display: 'flex', alignItems: 'center', padding: '0 max(5vw,24px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/bird-logo.png" alt="Candidato" width={26} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-sora, system-ui)', fontWeight: 700, fontSize: '.95rem', color: '#1B3B3E' }}>Candidato®</span>
        </Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '3rem max(5vw,24px) 5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#EA6440' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--font-sora, system-ui)', fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: '#0E1E20', margin: '.4rem 0 .6rem', letterSpacing: '-.03em', lineHeight: 1.1 }}>
            Política de Privacidad
          </h1>
          <p style={{ fontSize: '.85rem', color: 'rgba(14,30,32,.45)' }}>Última actualización: 14 de septiembre de 2026</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', boxShadow: '0 1px 3px rgba(14,30,32,.06)' }}>
          <Legal />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/terminos" style={{ fontSize: '.8rem', color: '#1B3B3E', fontWeight: 600 }}>Términos y Condiciones</Link>
          <Link href="/" style={{ fontSize: '.8rem', color: 'rgba(14,30,32,.45)' }}>← Volver al inicio</Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-sora, system-ui)', fontSize: '1.05rem', fontWeight: 700, color: '#0E1E20', marginBottom: '.75rem', paddingBottom: '.4rem', borderBottom: '1px solid rgba(14,30,32,.07)' }}>
        {title}
      </h2>
      <div style={{ fontSize: '.9375rem', color: 'rgba(14,30,32,.7)', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function Legal() {
  const ink45 = 'rgba(14,30,32,.45)'
  const forest = '#1B3B3E'
  return (
    <div>
      <p style={{ fontSize: '.875rem', color: ink45, marginBottom: '1.8rem', lineHeight: 1.75 }}>
        Candidato Colombia SAS (en adelante <strong style={{ color: forest }}>"Candidato"</strong>) es responsable del tratamiento de los datos personales que recopila a través de su plataforma digital disponible en <strong style={{ color: forest }}>candidato.com.co</strong>. Esta política se rige por la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013 de la República de Colombia.
      </p>

      <Section title="1. Datos que recopilamos">
        <p>Recopilamos únicamente los datos necesarios para prestarte el servicio:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li><strong>Candidatos:</strong> nombre completo, dirección de email, número de WhatsApp, perfil de LinkedIn, expectativa salarial, área de trabajo y currículum vitae (CV).</li>
          <li><strong>Empresas:</strong> nombre de la empresa, nombre del contacto, email corporativo y descripción de vacantes.</li>
          <li><strong>Uso de la plataforma:</strong> páginas visitadas, dispositivo y país (sin identificación personal).</li>
        </ul>
        <p style={{ marginTop: '.75rem' }}>No recopilamos datos sensibles (origen racial, creencias religiosas, datos de salud, orientación sexual) conforme al artículo 5 de la Ley 1581 de 2012.</p>
      </Section>

      <Section title="2. Finalidades del tratamiento">
        <p>Tus datos se usan exclusivamente para:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li>Conectarte con oportunidades laborales o de talento relevantes.</li>
          <li>Gestionar tu cuenta y el acceso a la plataforma.</li>
          <li>Enviarte notificaciones sobre el estado de tu proceso (matches, actualizaciones de perfil).</li>
          <li>Mejorar los algoritmos de matching internos (de forma anonimizada).</li>
          <li>Cumplir obligaciones legales y regulatorias aplicables en Colombia.</li>
        </ul>
        <p style={{ marginTop: '.75rem' }}>No vendemos, arrendamos ni cedemos tus datos a terceros con fines comerciales.</p>
      </Section>

      <Section title="3. Compartición de datos">
        <p>Tus datos pueden ser compartidos únicamente con:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li><strong>Empresas clientes de Candidato</strong> (solo perfil + CV, con tu consentimiento al registrarte).</li>
          <li><strong>Proveedores tecnológicos</strong> que procesan datos bajo acuerdo de confidencialidad: Supabase Inc. (base de datos, autenticación), Vercel Inc. (infraestructura web), Resend Inc. (envío de emails).</li>
          <li><strong>Autoridades competentes</strong> cuando exista obligación legal.</li>
        </ul>
      </Section>

      <Section title="4. Derechos del titular">
        <p>Conforme a la Ley 1581 de 2012, tienes derecho a:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li><strong>Conocer</strong> qué datos tenemos sobre ti.</li>
          <li><strong>Actualizar o corregir</strong> información inexacta.</li>
          <li><strong>Suprimir</strong> tus datos cuando no sean necesarios para el servicio.</li>
          <li><strong>Revocar</strong> el consentimiento para el tratamiento.</li>
          <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC).</li>
        </ul>
        <p style={{ marginTop: '.75rem' }}>Para ejercer estos derechos, escríbenos a <a href="mailto:hola@candidato.com.co" style={{ color: forest, fontWeight: 600 }}>hola@candidato.com.co</a>. Responderemos dentro de los 10 días hábiles siguientes a la recepción de la solicitud.</p>
      </Section>

      <Section title="5. Seguridad de los datos">
        <p>Implementamos medidas técnicas y organizativas para proteger tus datos:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li>Comunicaciones cifradas con TLS/HTTPS en toda la plataforma.</li>
          <li>Autenticación por enlace mágico (magic link) sin contraseñas almacenadas.</li>
          <li>Acceso a la base de datos restringido con Row Level Security (RLS).</li>
          <li>Archivos de CV almacenados en buckets privados con acceso controlado.</li>
        </ul>
      </Section>

      <Section title="6. Retención de datos">
        <p>Conservamos tus datos mientras mantengas una cuenta activa en Candidato. Si solicitas la eliminación de tu cuenta, tus datos serán suprimidos en un plazo máximo de 30 días calendario, salvo obligación legal de conservarlos por un período mayor.</p>
      </Section>

      <Section title="7. Cookies y tecnologías similares">
        <p>Candidato usa cookies de sesión estrictamente necesarias para el funcionamiento de la plataforma (autenticación, preferencia de idioma). No usamos cookies de seguimiento publicitario ni de terceros con fines de marketing sin tu consentimiento explícito.</p>
      </Section>

      <Section title="8. Cambios a esta política">
        <p>Podemos actualizar esta política cuando sea necesario. Te notificaremos por email si los cambios son materiales. La versión vigente siempre estará disponible en <strong>candidato.com.co/privacidad</strong>.</p>
      </Section>

      <Section title="9. Contacto y responsable del tratamiento">
        <p>
          <strong>Responsable:</strong> Candidato Colombia SAS<br />
          <strong>Email:</strong> <a href="mailto:hola@candidato.com.co" style={{ color: forest, fontWeight: 600 }}>hola@candidato.com.co</a><br />
          <strong>Ciudad:</strong> Cali, Colombia
        </p>
      </Section>
    </div>
  )
}
