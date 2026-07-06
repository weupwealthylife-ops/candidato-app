import { NextRequest, NextResponse } from 'next/server'

// Supported notification types
type NotifyType = 'application_submitted' | 'company_contacted' | 'match_found' | 'application_status_changed' | 'match_confirmed' | 'payment_confirmed' | 'expiry_reminder' | 'welcome_candidate' | 'welcome_company' | 'profile_incomplete' | 'free_job_upsell' | 'free_job_published' | 'matchgraph_engagement_opened' | 'matchgraph_client_feedback'

interface NotifyPayload {
  type: NotifyType
  to: string       // recipient email
  name: string     // recipient first name
  extra?: Record<string, string>
}

const FROM = 'Candidato® <hola@candidato.com.co>'
const RESEND_API = 'https://api.resend.com/emails'

function buildHtml(type: NotifyType, name: string, extra: Record<string, string> = {}): { subject: string; html: string } {
  const base = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8eded;border-radius:12px;overflow:hidden">
      <div style="background:#2A5558;padding:20px 28px">
        <img src="https://candidato.com.co/bird-logo.png" width="32" height="32" alt="" style="display:inline-block;vertical-align:middle;margin-right:10px;border-radius:6px">
        <span style="color:white;font-weight:700;font-size:1.05rem;letter-spacing:-.01em;vertical-align:middle">Candidato®</span>
      </div>
      <div style="padding:28px 28px 24px">
        CONTENT
      </div>
      <div style="padding:16px 28px;border-top:1px solid #f0f4f4;font-size:.75rem;color:#9aacac;text-align:center">
        Candidato® · Colombia · <a href="https://candidato.com.co" style="color:#1B3B3E">candidato.com.co</a>
      </div>
    </div>
  `

  if (type === 'application_submitted') {
    const subject = `✅ Postulaste a ${extra.jobTitle || 'una vacante'}`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Postulación enviada, ${name}! 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Tu postulación a <strong style="color:#1B3B3E">${extra.jobTitle || 'esta vacante'}</strong>
        ${extra.companyName ? ` en <strong>${extra.companyName}</strong>` : ''} fue registrada correctamente.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 6px">¿Qué sigue?</p>
        <ol style="color:#264D51;font-size:.82rem;line-height:1.7;margin:0;padding-left:18px">
          <li>La empresa revisará tu perfil en los próximos días.</li>
          <li>Si encajás, se pondrán en contacto directo.</li>
          <li>Seguí explorando — encontrar el match ideal lleva tiempo.</li>
        </ol>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver mis postulaciones →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'company_contacted') {
    const subject = `${extra.companyName || 'Una empresa'} quiere conocerte — Candidato®`
    const lookingSection = (extra.lookingForAreas || extra.lookingForExperience || extra.lookingForModality) ? `
      <div style="background:#f0f7f7;border-radius:10px;padding:16px 20px;margin-bottom:22px">
        <p style="color:#1B3B3E;font-size:.78rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin:0 0 12px">Lo que busca la empresa</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:.83rem;line-height:1.8">
          ${extra.jobTitle ? `<tr><td style="color:#9aacac;font-weight:600;width:120px;vertical-align:top;padding-right:8px">Vacante</td><td style="color:#1B3B3E;font-weight:700">${extra.jobTitle}</td></tr>` : ''}
          ${extra.lookingForAreas ? `<tr><td style="color:#9aacac;font-weight:600;vertical-align:top;padding-right:8px">Áreas</td><td style="color:#1B3B3E;font-weight:600">${extra.lookingForAreas}</td></tr>` : ''}
          ${extra.lookingForExperience ? `<tr><td style="color:#9aacac;font-weight:600;vertical-align:top;padding-right:8px">Experiencia</td><td style="color:#1B3B3E;font-weight:600">${extra.lookingForExperience}</td></tr>` : ''}
          ${extra.lookingForModality ? `<tr><td style="color:#9aacac;font-weight:600;vertical-align:top;padding-right:8px">Modalidad</td><td style="color:#1B3B3E;font-weight:600">${extra.lookingForModality}</td></tr>` : ''}
        </table>
      </div>
    ` : ''
    const content = `
      <p style="color:#6b8f8f;font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px">Interés de empresa</p>
      <h2 style="color:#0E1E20;font-size:1.2rem;font-weight:800;margin:0 0 8px;line-height:1.3">Hola ${name}, una empresa quiere conocerte</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.7;margin:0 0 20px">
        El equipo de <strong style="color:#1B3B3E">${extra.companyName || 'una empresa'}</strong> revisó tu perfil${extra.jobTitle ? ` para la vacante <strong style="color:#1B3B3E">${extra.jobTitle}</strong>` : ''} y te marcó como candidato de interés. Tu área de <strong style="color:#1B3B3E">${extra.candidateArea || 'trabajo'}</strong> encaja con lo que buscan.
      </p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:22px">
        <tr>
          <td style="background:#1B3B3E;width:44px;height:44px;border-radius:50%;text-align:center;vertical-align:middle;font-size:1.1rem">🏢</td>
          <td style="padding-left:14px;vertical-align:middle">
            <div style="font-weight:700;color:#0E1E20;font-size:.95rem">${extra.companyName || 'Empresa interesada'}</div>
            ${extra.companyIndustry ? `<div style="color:#6b8f8f;font-size:.8rem;margin-top:2px">${extra.companyIndustry}</div>` : ''}
          </td>
        </tr>
      </table>

      ${lookingSection}

      <div style="background:#f5fafa;border-left:3px solid #1B3B3E;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:700;margin:0 0 4px">¿Qué sigue?</p>
        <p style="color:#264D51;font-size:.82rem;line-height:1.65;margin:0">El equipo de <strong>${extra.companyName || 'la empresa'}</strong> se pondrá en contacto directamente por email o WhatsApp. Manteé tu información actualizada.</p>
      </div>

      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:13px 28px;font-size:.9rem;font-weight:700;text-decoration:none;margin-bottom:22px">Ver mi perfil en Candidato® →</a>

      <p style="color:#9aacac;font-size:.75rem;line-height:1.6;margin:0;padding-top:16px;border-top:1px solid #f0f4f4">
        Recibiste este email porque tu perfil en Candidato® está activo y marcado como disponible.<br/>
        Para dejar de recibir notificaciones, actualizá tus preferencias desde la app.
      </p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'application_status_changed') {
    const isContacted = extra.status === 'contacted'
    const subject = isContacted
      ? `📩 Avance en tu postulación — ${extra.jobTitle || 'una vacante'}`
      : `Actualización de tu postulación — ${extra.jobTitle || 'una vacante'}`
    const content = isContacted ? `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Buenas noticias, ${name}! 🚀</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        <strong style="color:#1B3B3E">${extra.companyName || 'Una empresa'}</strong> revisó tu postulación a
        <strong> ${extra.jobTitle || 'la vacante'}</strong> y quiere avanzar con vos.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 4px">¿Qué sigue?</p>
        <p style="color:#264D51;font-size:.82rem;line-height:1.6;margin:0">Revisá tu WhatsApp o email — te contactarán directamente para coordinar una charla.</p>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver mis postulaciones →</a>
    ` : `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">Actualización en tu postulación, ${name}</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Tu postulación a <strong style="color:#1B3B3E">${extra.jobTitle || 'la vacante'}</strong>
        ${extra.companyName ? ` en <strong>${extra.companyName}</strong>` : ''} fue marcada como <strong>descartada</strong> en esta oportunidad.
      </p>
      <div style="background:#f9f0f0;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#7a3030;font-size:.82rem;line-height:1.6;margin:0">No te desanimés — cada proceso suma experiencia. Seguí explorando otras oportunidades en la plataforma.</p>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Buscar más vacantes →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'match_confirmed') {
    const subject = `🤝 Match confirmado — ${extra.candidateName || 'Un candidato'} para ${extra.jobTitle || 'tu vacante'}`
    const waPhone = extra.candidateWhatsapp ? extra.candidateWhatsapp.replace(/\D/g,'') : ''
    const waMsg = extra.candidateWhatsapp ? `Hola ${extra.candidateName || ''}, te escribo de ${name} por la vacante de ${extra.jobTitle || ''} — encontré tu perfil en Candidato® y me gustaría conectar contigo.` : ''
    const waBtn = waPhone ? `<a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}" style="display:inline-block;background:#25D366;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none;margin-bottom:12px">WhatsApp → Contactar</a><br/>` : ''
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Match confirmado! 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        <strong style="color:#1B3B3E">${extra.candidateName || 'Un candidato'}</strong> es un match fuerte para tu vacante
        <strong> ${extra.jobTitle || ''}</strong>${extra.matchScore ? ` <span style="background:#E4F0F1;color:#1B3B3E;border-radius:4px;padding:1px 7px;font-size:.8rem;font-weight:700">${extra.matchScore}% fit</span>` : ''}.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px;font-size:.83rem;line-height:1.8">
        ${extra.candidateArea ? `<div><span style="color:#9aacac;font-weight:600">Área:</span> <strong style="color:#1B3B3E">${extra.candidateArea}</strong></div>` : ''}
        ${extra.candidateExp ? `<div><span style="color:#9aacac;font-weight:600">Experiencia:</span> <strong style="color:#1B3B3E">${extra.candidateExp}</strong></div>` : ''}
        ${extra.candidateCity ? `<div><span style="color:#9aacac;font-weight:600">Ciudad:</span> <strong style="color:#1B3B3E">${extra.candidateCity}</strong></div>` : ''}
        ${extra.candidateWhatsapp ? `<div><span style="color:#9aacac;font-weight:600">WhatsApp:</span> <a href="https://wa.me/${extra.candidateWhatsapp.replace(/\D/g,'')}" style="color:#1B3B3E;font-weight:600">${extra.candidateWhatsapp}</a></div>` : ''}
        ${extra.candidateEmail ? `<div><span style="color:#9aacac;font-weight:600">Email:</span> <a href="mailto:${extra.candidateEmail}" style="color:#1B3B3E;font-weight:600">${extra.candidateEmail}</a></div>` : ''}
        ${extra.candidateLinkedin ? `<div><span style="color:#9aacac;font-weight:600">LinkedIn:</span> <a href="${extra.candidateLinkedin}" style="color:#1B3B3E;font-weight:600">Ver perfil →</a></div>` : ''}
      </div>
      ${extra.cvUrl ? `<a href="${extra.cvUrl}" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none;margin-bottom:12px">Descargar CV →</a><br/>` : ''}
      ${waBtn}
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver todos mis matches →</a>
      <p style="color:#9aacac;font-size:.73rem;margin-top:14px">Coordina la entrevista directamente — toda la información de contacto está arriba.</p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'welcome_candidate') {
    const subject = `¡Bienvenido/a a Candidato®, ${name}! 🎉`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Hola ${name}, ya sos parte de Candidato®! 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Tu perfil fue creado exitosamente. El algoritmo ya está analizando las vacantes disponibles para encontrar tu match ideal.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 8px">3 pasos para conseguir tu próximo trabajo:</p>
        <ol style="color:#264D51;font-size:.82rem;line-height:1.8;margin:0;padding-left:18px">
          <li><strong>Completá tu perfil</strong> — cuanto más completo, mejores matches.</li>
          <li><strong>Revisá tus sugerencias</strong> — el algoritmo te notifica cuando hay un match real.</li>
          <li><strong>Postulate en 1 clic</strong> — sin CV genérico, sin carta de presentación.</li>
        </ol>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none">Ir a mi perfil →</a>
      <p style="color:#9aacac;font-size:.75rem;margin-top:16px">Solo te contactamos cuando hay matches reales. Sin spam.</p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'welcome_company') {
    const subject = `Bienvenido/a a Candidato® — Tu primera vacante en minutos`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Hola ${name}, gracias por unirte a Candidato®!</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Candidato® conecta empresas con el top 1% del talento colombiano mediante matching inteligente. Sin CV genéricos ni pérdida de tiempo.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 8px">Publicar tu primera vacante es simple:</p>
        <ol style="color:#264D51;font-size:.82rem;line-height:1.8;margin:0;padding-left:18px">
          <li>Describí el perfil que buscás (2 minutos).</li>
          <li>El algoritmo analiza +2.400 candidatos automáticamente.</li>
          <li>Recibís solo los perfiles que realmente encajan.</li>
        </ol>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none">Publicar mi primera vacante →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'profile_incomplete') {
    const pct = extra.profilePct || '50'
    const missing = extra.missingFields || 'algunos campos'
    const subject = `${name}, tu perfil está al ${pct}% — completalo para mejores matches`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">Tu perfil necesita un poco más, ${name} 💪</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Tu perfil en Candidato® está al <strong style="color:#EA6440">${pct}%</strong>. Los perfiles completos reciben <strong>3× más matches</strong> que los incompletos.
      </p>
      <div style="background:#FFF8E1;border:1px solid #FDE68A;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#B45309;font-size:.83rem;font-weight:600;margin:0 0 6px">Falta completar:</p>
        <p style="color:#92400e;font-size:.82rem;line-height:1.6;margin:0">${missing}</p>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none">Completar mi perfil ahora →</a>
      <p style="color:#9aacac;font-size:.75rem;margin-top:16px">Solo te enviamos este recordatorio una vez. Sin spam.</p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'free_job_published') {
    const jobTitle = extra.jobTitle || 'tu vacante'
    const subject = `✅ Vacante publicada — "${jobTitle}" ya está activa`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Tu vacante está publicada! 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Hola <strong style="color:#1B3B3E">${name}</strong>, tu vacante gratuita
        <strong style="color:#1B3B3E"> "${jobTitle}"</strong> ya está visible en el feed público de Candidato®.
        Los candidatos ya pueden verla y postularse.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 8px">¿Qué pasa ahora?</p>
        <ol style="color:#264D51;font-size:.82rem;line-height:1.8;margin:0;padding-left:18px">
          <li>Los candidatos pueden ver tu vacante y postularse en 1 clic.</li>
          <li>Recibís notificaciones cuando alguien se postula.</li>
          <li>Revisás los perfiles y contactás directamente a quien te interese.</li>
        </ol>
      </div>
      <div style="background:#FFF8E1;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:16px">
        <p style="color:#B45309;font-size:.82rem;font-weight:600;margin:0 0 4px">💡 ¿Querés llegar a más candidatos?</p>
        <p style="color:#92400e;font-size:.8rem;line-height:1.6;margin:0">
          Activá el matching inteligente ($300.000 COP · único pago) y el algoritmo identifica y notifica
          proactivamente a los candidatos con mayor compatibilidad con tu vacante.
        </p>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver mi vacante →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'matchgraph_engagement_opened') {
    const jobTitle = extra.jobTitle || 'tu proceso de selección'
    const subject = `⬡ Tu Match Graph está listo — "${jobTitle}"`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Tu evaluación de candidatos está lista! 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Hola <strong style="color:#1B3B3E">${name}</strong>, el equipo de Candidato® abrió una evaluación de Preselección & Validación para
        <strong style="color:#1B3B3E"> "${jobTitle}"</strong>. Ya podés acceder al panel con los perfiles preseleccionados y validados.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 8px">¿Qué encontrás en el Match Graph?</p>
        <ul style="color:#264D51;font-size:.82rem;line-height:1.8;margin:0;padding-left:18px">
          <li>Perfiles validados con scores de compatibilidad</li>
          <li>Radar chart comparativo por candidato</li>
          <li>CVs descargables + fortalezas técnicas</li>
          <li>Espacio para tus notas privadas por perfil</li>
        </ul>
      </div>
      <a href="https://candidato.com.co/app/matchgraph" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none">Acceder al Match Graph →</a>
      <p style="color:#9aacac;font-size:.75rem;margin-top:14px">Ingresá con el email con el que coordinaste el servicio: <strong>${extra.to || name}</strong></p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'free_job_upsell') {
    const jobTitle = extra.jobTitle || 'tu vacante'
    const views = extra.views || '5'
    const subject = `Tu señal "${jobTitle}" tiene ${views} visitas — activá el matching con IA`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Tu señal está generando interés, ${name}! 🚀</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Tu publicación gratuita <strong style="color:#1B3B3E">${jobTitle}</strong> ya tiene
        <strong style="color:#EA6440"> ${views} visitas</strong>. Hay candidatos mirándola.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:700;margin:0 0 8px">¿Qué ganás activando el matching automático?</p>
        <ul style="color:#264D51;font-size:.82rem;line-height:1.9;margin:0;padding-left:18px">
          <li>El algoritmo identifica candidatos con score ≥70% de compatibilidad</li>
          <li>Los candidatos reciben una notificación personalizada de tu vacante</li>
          <li>Recibís el CV + WhatsApp + LinkedIn de cada match directo en tu email</li>
          <li>Resultados en menos de 24 horas</li>
        </ul>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none">Activar matching por $300.000 COP →</a>
      <p style="color:#9aacac;font-size:.75rem;margin-top:16px">Pago único. Sin suscripción. Se activa al instante.</p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'expiry_reminder') {
    const subject = `⏰ Tu vacante "${extra.jobTitle || 'tu vacante'}" cierra el ${extra.closesAt || 'pronto'}`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">Hola ${name}, tu vacante está por vencer 👋</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        La publicación de <strong style="color:#1B3B3E">${extra.jobTitle || 'tu vacante'}</strong> cierra el
        <strong style="color:#EA6440"> ${extra.closesAt || 'próximamente'}</strong>.
        Si aún buscás candidatos, podés renovarla en un solo clic.
      </p>
      <div style="background:#FFF8E1;border:1px solid #FDE68A;border-radius:8px;padding:14px 18px;margin-bottom:20px">
        <p style="color:#B45309;font-size:.83rem;font-weight:600;margin:0 0 4px">¿Qué pasa si no renovás?</p>
        <p style="color:#92400e;font-size:.82rem;line-height:1.6;margin:0">La vacante se desactiva automáticamente y los candidatos ya no podrán postularse. Los postulantes actuales seguirán visibles en tu panel.</p>
      </div>
      <a href="${extra.renewUrl || 'https://candidato.com.co/app'}" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none;margin-bottom:8px">Renovar vacante →</a>
      <p style="color:#9aacac;font-size:.75rem;margin-top:14px">Si ya encontraste al candidato ideal, ¡felicitaciones! No tenés que hacer nada.</p>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }


  if (type === 'payment_confirmed') {
    const subject = `✅ Vacante publicada — ${extra.jobTitle || 'Tu vacante'} ya está activa`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Pago recibido! Tu vacante está activa. 🎉</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        Hola <strong style="color:#1B3B3E">${name}</strong>, confirmamos el pago de tu publicación en Candidato®.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px;font-size:.83rem;line-height:1.8">
        <div><span style="color:#9aacac;font-weight:600">Vacante:</span> <strong style="color:#1B3B3E">${extra.jobTitle || '—'}</strong></div>
        <div><span style="color:#9aacac;font-weight:600">Monto:</span> <strong style="color:#1B3B3E">${extra.amount || '—'}</strong></div>
        ${extra.credits ? `<div><span style="color:#9aacac;font-weight:600">Créditos adicionales:</span> <strong style="color:#1B3B3E">${extra.credits} vacante${parseInt(extra.credits)>1?'s':''} disponible${parseInt(extra.credits)>1?'s':''}</strong></div>` : ''}
      </div>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        El algoritmo de matching ya está buscando los candidatos más compatibles. Te avisaremos cuando haya resultados.
      </p>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver mi vacante →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  if (type === 'matchgraph_client_feedback') {
    const feedbackMap: Record<string, string> = { interested: '👍 Interesado', maybe: '🤔 Dudas', no: '👎 No sigue' }
    const feedbackLabel = feedbackMap[extra.feedback || ''] || extra.feedback || '—'
    const subject = `💬 Nuevo feedback — ${extra.candidateName || 'Candidato'} · ${extra.jobTitle || 'Evaluación'}`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.05rem;margin:0 0 12px">Nuevo feedback del cliente</h2>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px;font-size:.85rem;line-height:1.8">
        <div><span style="color:#9aacac;font-weight:600">Evaluación:</span> <strong style="color:#1B3B3E">${extra.jobTitle || '—'}</strong></div>
        <div><span style="color:#9aacac;font-weight:600">Empresa:</span> <strong style="color:#1B3B3E">${extra.companyName || '—'}</strong></div>
        <div><span style="color:#9aacac;font-weight:600">Candidato:</span> <strong style="color:#1B3B3E">${extra.candidateName || '—'}</strong></div>
        <div><span style="color:#9aacac;font-weight:600">Feedback:</span> <strong style="color:#1B3B3E;font-size:1rem">${feedbackLabel}</strong></div>
      </div>
      <a href="https://candidato.com.co/app/matchgraph" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver evaluación →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  // match_found — sent to candidate when proactively suggested for a job
  const matchScore = extra.matchCount // reused field: matchCount carries the score % in push context
  const subject = extra.jobTitle
    ? `✦ Match encontrado — ${extra.companyName || 'Una empresa'} busca tu perfil`
    : `✨ Nuevos matches para vos`
  const content = extra.jobTitle ? `
    <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Sos un match, ${name}! ✦</h2>
    <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
      El algoritmo de Candidato® identificó que tu perfil encaja con la vacante
      <strong style="color:#1B3B3E"> ${extra.jobTitle}</strong>
      ${extra.companyName ? ` en <strong>${extra.companyName}</strong>` : ''}.
      ${matchScore ? `<span style="background:#E4F0F1;color:#1B3B3E;border-radius:4px;padding:1px 7px;font-size:.8rem;font-weight:700;margin-left:4px">${matchScore}% fit</span>` : ''}
    </p>
    <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
      <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 4px">¿Qué tenés que hacer?</p>
      <p style="color:#264D51;font-size:.82rem;line-height:1.6;margin:0">Entrá al app y confirmá tu interés. Si aceptás, la empresa recibirá tu perfil completo y se pondrá en contacto.</p>
    </div>
    <a href="https://candidato.com.co/app" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:12px 24px;font-size:.88rem;font-weight:700;text-decoration:none">Ver mi sugerencia →</a>
    <p style="color:#9aacac;font-size:.75rem;margin-top:16px">Solo recibís este email cuando hay un match real con tu perfil.</p>
  ` : `
    <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">Tus matches de esta semana, ${name} ✦</h2>
    <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
      Encontramos <strong style="color:#1B3B3E">${matchScore || 'nuevas'} oportunidades</strong> que encajan con tu perfil. Entrate al app para ver los detalles y postularte.
    </p>
    <a href="https://candidato.com.co/app" style="display:inline-block;background:#EA6440;color:white;border-radius:8px;padding:12px 24px;font-size:.88rem;font-weight:700;text-decoration:none">Ver mis matches →</a>
    <p style="color:#9aacac;font-size:.75rem;margin-top:16px">Solo recibirás este email cuando haya matches reales para vos.</p>
  `
  return { subject, html: base.replace('CONTENT', content) }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Gracefully no-op when email is not configured — don't break the app
    return NextResponse.json({ ok: true, skipped: true })
  }

  let body: NotifyPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, to, name, extra = {} } = body
  if (!type || !to || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { subject, html } = buildHtml(type, name, extra)

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[notify] Resend error:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
