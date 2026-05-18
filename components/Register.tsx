'use client'

import { useState, KeyboardEvent } from 'react'
import { useLang } from '@/lib/LangContext'
import { createClient } from '@/lib/supabase/client'

export default function Register() {
  const { t } = useLang()
  const [skills, setSkills] = useState<string[]>([])
  const [skInput, setSkInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [modality, setModality] = useState('')
  const [area, setArea] = useState('')
  const [experience, setExperience] = useState('')

  function addSk() {
    const v = skInput.trim()
    if (!v || skills.includes(v)) { setSkInput(''); return }
    setSkills([...skills, v])
    setSkInput('')
  }

  function rmSk(s: string) { setSkills(skills.filter((x) => x !== s)) }

  function onKeySk(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addSk() }
  }

  async function doSub() {
    if (!email || !firstName) {
      setError(t('Por favor ingresá tu nombre y email.', 'Please enter your name and email.'))
      return
    }
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: dbErr } = await supabase.from('candidates').insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city,
        modality,
        area,
        experience,
        skills,
      })
      if (dbErr && dbErr.code !== '42P01') throw dbErr
    } catch {
      // Proceed even if DB is not configured
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  const CITIES_ES = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Bucaramanga', 'Otra']
  const CITIES_EN = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Bucaramanga', 'Other']
  const MODALITIES_ES = ['Presencial', 'Remoto', 'Híbrido']
  const MODALITIES_EN = ['On-site', 'Remote', 'Hybrid']
  const AREAS_ES = ['Tecnología / IT', 'Diseño UX/UI', 'Marketing y Comunicaciones', 'Ventas y Comercial', 'Finanzas y Contabilidad', 'Recursos Humanos', 'Operaciones', 'Otro']
  const AREAS_EN = ['Technology / IT', 'UX/UI Design', 'Marketing & Communications', 'Sales & Business Dev', 'Finance & Accounting', 'Human Resources', 'Operations', 'Other']
  const EXP_ES = ['Sin experiencia', '1–2 años', '3–5 años', '5–10 años', '10+ años']
  const EXP_EN = ['No experience', '1–2 years', '3–5 years', '5–10 years', '10+ years']

  const cities = t('es', 'en') === 'es' ? CITIES_ES : CITIES_EN
  const modalities = t('es', 'en') === 'es' ? MODALITIES_ES : MODALITIES_EN
  const areas = t('es', 'en') === 'es' ? AREAS_ES : AREAS_EN
  const expOptions = t('es', 'en') === 'es' ? EXP_ES : EXP_EN

  return (
    <section id="register">
      <div className="register-split">
        <div className="reg-left">
          <span className="sec-eye">{t('Para candidatos · Gratis', 'For candidates · Free')}</span>
          <h2 className="sec-h2">
            {t('Registrate.', 'Sign up.')}
            <br />
            {t('La IA trabaja por vos.', 'AI works for you.')}
          </h2>
          <p className="sec-sub" style={{ marginBottom: 0 }}>
            {t(
              'Completá tu perfil una vez. El algoritmo analiza y te notifica las mejores oportunidades en 24 horas.',
              'Complete your profile once. The algorithm analyses and notifies you of the best opportunities within 24 hours.',
            )}
          </p>
          <div className="reg-proof">
            <div className="proof-item in">
              <span className="proof-ico">✓</span>
              <span className="proof-txt">
                <strong>{t('100% gratuito', '100% free')}</strong>{' '}
                <span>{t('para candidatos. Sin tarjeta de crédito.', 'for candidates. No credit card required.')}</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">⚡</span>
              <span className="proof-txt">
                <strong>{t('Match en 24h', 'Match in 24h')}</strong>{' '}
                <span>{t('— tus primeras oportunidades al día siguiente.', '— your first opportunities the next day.')}</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">🎯</span>
              <span className="proof-txt">
                <strong>{t('Solo lo relevante', 'Only what matters')}</strong>{' '}
                <span>{t('— sin spam, sin ofertas genéricas.', '— no spam, no generic offers.')}</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">🔒</span>
              <span className="proof-txt">
                <strong>{t('Perfil privado', 'Private profile')}</strong>{' '}
                <span>{t('— nunca compartimos tus datos sin permiso.', '— we never share your data without permission.')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="form-box" id="rformwrap">
          {!submitted ? (
            <div id="formbody">
              <div className="form-hd">
                <h3>{t('Crear mi perfil', 'Create my profile')}</h3>
                <p>{t('Gratis · Sin compromiso · 3 minutos', 'Free · No commitment · 3 minutes')}</p>
              </div>
              <div className="frow">
                <div className="fg">
                  <label>{t('Nombre', 'First name')}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('Daniela', 'Jane')}
                  />
                </div>
                <div className="fg">
                  <label>{t('Apellido', 'Last name')}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('Martínez', 'Smith')}
                  />
                </div>
              </div>
              <div className="fg">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('daniela@email.com', 'jane@email.com')}
                />
              </div>
              <div className="fg">
                <label>{t('WhatsApp (opcional)', 'WhatsApp (optional)')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="frow">
                <div className="fg">
                  <label>{t('Ciudad', 'City')}</label>
                  <select value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                    {cities.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>{t('Modalidad', 'Work mode')}</label>
                  <select value={modality} onChange={(e) => setModality(e.target.value)}>
                    <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                    {modalities.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg">
                <label>{t('Área profesional', 'Professional area')}</label>
                <select value={area} onChange={(e) => setArea(e.target.value)}>
                  <option value="" disabled>{t('Seleccioná tu área', 'Select your area')}</option>
                  {areas.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>{t('Años de experiencia', 'Years of experience')}</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                  {expOptions.map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>{t('Habilidades clave', 'Key skills')}</label>
                <div className="skrow">
                  <input
                    type="text"
                    value={skInput}
                    onChange={(e) => setSkInput(e.target.value)}
                    onKeyDown={onKeySk}
                    placeholder={t('React, Excel, Photoshop…', 'React, Excel, Photoshop…')}
                  />
                  <button type="button" className="add-btn" onClick={addSk} aria-label="Add skill">+</button>
                </div>
                <div className="sk-tags">
                  {skills.map((s) => (
                    <span key={s} className="sk-tag" onClick={() => rmSk(s)} role="button" tabIndex={0}>
                      {s} ×
                    </span>
                  ))}
                </div>
              </div>
              {error && (
                <p style={{ color: 'var(--coral)', fontSize: '.8rem', marginBottom: '.5rem' }}>{error}</p>
              )}
              <button type="button" className="sub-btn" onClick={doSub} disabled={loading}>
                <span>{loading ? t('Enviando…', 'Sending…') : t('Encontrar mis matches →', 'Find my matches →')}</span>
              </button>
              <p className="form-note">
                {t(
                  'Al registrarte aceptás los términos. Nunca enviamos spam.',
                  'By signing up you accept the terms. We never send spam.',
                )}
              </p>
            </div>
          ) : (
            <div className="success-box" style={{ display: 'block' }}>
              <div className="success-ico">🎉</div>
              <div className="success-title">{t('¡Perfil creado!', 'Profile created!')}</div>
              <p className="success-sub">
                {t(
                  'Nuestro algoritmo ya está analizando tu perfil. En las próximas 24 horas recibirás tus primeros matches por email.',
                  'Our algorithm is already analysing your profile. Within the next 24 hours you will receive your first matches by email.',
                )}
              </p>
              <div className="success-note">
                📧 <span>{t('Revisá tu bandeja de entrada — también el spam.', 'Check your inbox — including spam.')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
