import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Candidato®',
  description: 'Términos y condiciones de uso de la plataforma Candidato Colombia.',
}

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p style={{ fontSize: '.85rem', color: 'rgba(14,30,32,.45)' }}>Última actualización: 14 de septiembre de 2026</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '2.5rem', boxShadow: '0 1px 3px rgba(14,30,32,.06)' }}>
          <Legal />
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/privacidad" style={{ fontSize: '.8rem', color: '#1B3B3E', fontWeight: 600 }}>Política de Privacidad</Link>
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
        Al acceder y usar la plataforma <strong style={{ color: forest }}>Candidato</strong> (candidato.com.co), aceptás los presentes Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, por favor no uses la plataforma.
      </p>

      <Section title="1. Descripción del servicio">
        <p>Candidato es una plataforma de matching de talento que conecta candidatos en búsqueda laboral con empresas que buscan cubrir posiciones. El servicio es <strong>gratuito para candidatos</strong>. Las empresas acceden a través de planes de servicio contratados directamente con Candidato.</p>
      </Section>

      <Section title="2. Registro y cuenta">
        <ul style={{ paddingLeft: '1.2rem' }}>
          <li>Debés proveer información veraz, completa y actualizada al registrarte.</li>
          <li>Sos responsable de mantener la confidencialidad de tu acceso.</li>
          <li>Candidato se reserva el derecho de suspender cuentas con información falsa o que violen estos términos.</li>
          <li>Podés solicitar la eliminación de tu cuenta en cualquier momento escribiendo a <a href="mailto:hola@candidato.com.co" style={{ color: forest, fontWeight: 600 }}>hola@candidato.com.co</a>.</li>
        </ul>
      </Section>

      <Section title="3. Uso aceptable">
        <p>Al usar Candidato, aceptás no:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li>Publicar información falsa, engañosa o que infrinja derechos de terceros.</li>
          <li>Usar la plataforma para fines distintos a la búsqueda o publicación de oportunidades laborales legítimas.</li>
          <li>Realizar scraping, acceso automatizado no autorizado, o intentar vulnerar la seguridad de la plataforma.</li>
          <li>Enviar comunicaciones no solicitadas (spam) a otros usuarios.</li>
        </ul>
      </Section>

      <Section title="4. Propiedad intelectual">
        <p>Todo el contenido de la plataforma (diseño, código, textos, logotipos, algoritmos de matching) es propiedad de Candidato Colombia SAS y está protegido por las leyes de propiedad intelectual colombianas e internacionales. No podés reproducirlo sin autorización expresa por escrito.</p>
        <p style={{ marginTop: '.75rem' }}>Los CVs y perfiles cargados por los usuarios son de propiedad de cada usuario. Al cargarlos, otorgás a Candidato una licencia limitada para mostrarlos a empresas clientes con el propósito del servicio de matching.</p>
      </Section>

      <Section title="5. Limitación de responsabilidad">
        <p>Candidato actúa como intermediario entre candidatos y empresas. No garantizamos:</p>
        <ul style={{ paddingLeft: '1.2rem', marginTop: '.5rem' }}>
          <li>Que un proceso de selección resulte en contratación.</li>
          <li>La veracidad de la información publicada por empresas o candidatos.</li>
          <li>La disponibilidad ininterrumpida del servicio (puede haber mantenimientos programados).</li>
        </ul>
        <p style={{ marginTop: '.75rem' }}>En ningún caso la responsabilidad total de Candidato frente a un usuario superará el monto que ese usuario haya pagado por el servicio en los 12 meses anteriores al evento que genera la reclamación.</p>
      </Section>

      <Section title="6. Privacidad">
        <p>El tratamiento de tus datos personales se rige por nuestra <Link href="/privacidad" style={{ color: forest, fontWeight: 600 }}>Política de Privacidad</Link>, que forma parte integral de estos Términos.</p>
      </Section>

      <Section title="7. Modificaciones">
        <p>Candidato puede modificar estos Términos en cualquier momento. Los cambios materiales serán notificados por email con al menos 15 días de anticipación. El uso continuado de la plataforma después de esa fecha implica la aceptación de los nuevos términos.</p>
      </Section>

      <Section title="8. Ley aplicable y resolución de disputas">
        <p>Estos Términos se rigen por la legislación de la República de Colombia. Cualquier disputa que no pueda resolverse directamente entre las partes se someterá a la jurisdicción de los jueces competentes de la ciudad de Cali, Colombia.</p>
      </Section>

      <Section title="9. Contacto">
        <p>
          <strong>Candidato Colombia SAS</strong><br />
          <a href="mailto:hola@candidato.com.co" style={{ color: forest, fontWeight: 600 }}>hola@candidato.com.co</a><br />
          Cali, Colombia
        </p>
      </Section>
    </div>
  )
}
