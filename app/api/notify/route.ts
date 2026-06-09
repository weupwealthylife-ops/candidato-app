import { NextRequest, NextResponse } from 'next/server'

// Supported notification types
type NotifyType = 'application_submitted' | 'company_contacted' | 'match_found'

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
    const subject = `📩 Una empresa quiere contactarte — ${extra.companyName || 'Candidato'}`
    const content = `
      <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">¡Buenas noticias, ${name}! 🚀</h2>
      <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
        <strong style="color:#1B3B3E">${extra.companyName || 'Una empresa'}</strong> revisó tu perfil en Candidato® y quiere ponerse en contacto con vos.
      </p>
      <div style="background:#E4F0F1;border-radius:8px;padding:14px 18px;margin-bottom:16px">
        <p style="color:#1B3B3E;font-size:.83rem;font-weight:600;margin:0 0 4px">Próximo paso</p>
        <p style="color:#264D51;font-size:.82rem;line-height:1.6;margin:0">Revisá tu WhatsApp o email — te contactarán directamente para coordinar una charla.</p>
      </div>
      <a href="https://candidato.com.co/app" style="display:inline-block;background:#1B3B3E;color:white;border-radius:8px;padding:10px 22px;font-size:.85rem;font-weight:600;text-decoration:none">Ver mi perfil →</a>
    `
    return { subject, html: base.replace('CONTENT', content) }
  }

  // match_found
  const subject = `✨ Nuevos matches para vos — ${extra.matchCount || 'varios'} oportunidades`
  const content = `
    <h2 style="color:#0E1E20;font-size:1.15rem;margin:0 0 12px">Tus matches de esta semana, ${name} ✦</h2>
    <p style="color:#4a6a6a;font-size:.88rem;line-height:1.65;margin:0 0 16px">
      Encontramos <strong style="color:#1B3B3E">${extra.matchCount || 'nuevas'} oportunidades</strong> que encajan con tu perfil. Entrate al app para ver los detalles y postularte.
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
