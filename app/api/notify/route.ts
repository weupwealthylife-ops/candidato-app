import { NextRequest, NextResponse } from 'next/server'

// Supported notification types
type NotifyType = 'application_submitted' | 'company_contacted' | 'match_found' | 'application_status_changed' | 'match_confirmed' | 'payment_confirmed'

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
      <div style="background:#1B3B3E;padding:24px 28px;display:flex;align-items:center;gap:10px">
        <span style="font-size:1.3rem">✦</span>
        <span style="color:white;font-weight:700;font-size:1rem;letter-spacing:-.01em">Candidato®</span>
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
    const subject = `${extra.companyName || 'Una empresa'} está interesada en tu perfil — Candidato®`
    const content = `
      <p style="color:#6b8f8f;font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px">Interés de empresa</p>
      <h2 style="color:#0E1E20;font-size:1.25rem;font-weight:800;margin:0 0 6px;line-height:1.3">Hola ${name}, tienes una oportunidad esperándote</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.7;margin:0 0 22px">
        El equipo de <strong style="color:#1B3B3E">${extra.companyName || 'una empresa'}</strong> revisó tu perfil en Candidato® y marcó tu perfil como candidato de interés. Quieren conocerte.
      </p>

      <div style="border:1.5px solid #d0e4e4;border-radius:10px;padding:18px 20px;margin-bottom:22px">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:42px;height:42px;border-radius:50%;background:#1B3B3E;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem">🏢</div>
          <div>
            <div style="font-weight:700;color:#0E1E20;font-size:.95rem;margin-bottom:2px">${extra.companyName || 'Empresa interesada'}</div>
            ${extra.companyIndustry ? `<div style="color:#6b8f8f;font-size:.8rem">${extra.companyIndustry}</div>` : ''}
            <div style="color:#6b8f8f;font-size:.78rem;margin-top:4px">Revisó tu perfil de <strong style="color:#1B3B3E">${extra.candidateArea || 'profesional'}</strong></div>
          </div>
        </div>
      </div>

      <div style="background:#f5fafa;border-left:3px solid #1B3B3E;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:22px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:700;margin:0 0 5px">¿Qué sigue?</p>
        <p style="color:#264D51;font-size:.82rem;line-height:1.65;margin:0">El equipo de <strong>${extra.companyName || 'la empresa'}</strong> se pondrá en contacto contigo directamente por email o WhatsApp. Mantén tu información de contacto actualizada.</p>
      </div>

      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:12px 26px;font-size:.88rem;font-weight:700;text-decoration:none;margin-bottom:20px">Ver mi perfil en Candidato® →</a>

      <p style="color:#9aacac;font-size:.75rem;line-height:1.6;margin:0;padding-top:16px;border-top:1px solid #f0f4f4">
        Recibiste este email porque tu perfil en Candidato® está activo y marcado como disponible.<br/>
        Si no quieres recibir más notificaciones, actualizá tus preferencias desde la app.
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
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver todos mis matches →</a>
      <p style="color:#9aacac;font-size:.73rem;margin-top:14px">Coordina la entrevista directamente — toda la información de contacto está arriba.</p>
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
