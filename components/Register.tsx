'use client'

import { useState, KeyboardEvent } from 'react'
import { useLang } from '@/lib/LangContext'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/analytics'

const AREAS_ES = ['Tecnología / IT', 'Diseño UX/UI', 'Marketing y Comunicaciones', 'Ventas y Comercial', 'Finanzas y Contabilidad', 'Recursos Humanos', 'Operaciones', 'Otro']
const AREAS_EN = ['Technology / IT', 'UX/UI Design', 'Marketing & Communications', 'Sales & Business Dev', 'Finance & Accounting', 'Human Resources', 'Operations', 'Other']
const CITIES_ES = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Bucaramanga', 'Otra']
const CITIES_EN = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Bucaramanga', 'Other']
const MODALITIES_ES = ['Presencial', 'Remoto', 'Híbrido']
const MODALITIES_EN = ['On-site', 'Remote', 'Hybrid']
const EXP_ES = ['Sin experiencia', '1–2 años', '3–5 años', '5–10 años', '10+ años']
const EXP_EN = ['No experience', '1–2 years', '3–5 years', '5–10 years', '10+ years']

export default function Register() {
  const { t } = useLang()
  const lang = t('es', 'en') as 'es' | 'en'

  // Step 1 — required
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')

  // Step 2 — optional enrichment
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [modality, setModality] = useState('')
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skInput, setSkInput] = useState('')

  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const areas = lang === 'es' ? AREAS_ES : AREAS_EN
  const cities = lang === 'es' ? CITIES_ES : CITIES_EN
  const modalities = lang === 'es' ? MODALITIES_ES : MODALITIES_EN
  const expOptions = lang === 'es' ? EXP_ES : EXP_EN

  function addSk() {
    const v = skInput.trim()
    if (!v || skills.includes(v)) { setSkInput(''); return }
    setSkills([...skills, v])
    setSkInput('')
  }

  function rmSk(s: string) { setSkills(skills.filter(x => x !== s)) }

  function onKeySk(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addSk() }
  }

  async function saveProfile(full = false) {
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const payload: Record<string, unknown> = {
        first_name: firstName,
        email,
        area,
        ...(full && {
          last_name: lastName,
          phone,
          city,
          modality,
          experience,
          skills,
        }),
      }
      const { error: dbErr } = await supabase.from('candidates').insert(payload)
      if (dbErr && dbErr.code !== '42P01') throw dbErr

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome_candidate', to: email, name: firstName, extra: { area, city } }),
      }).catch(() => {})

      track('candidate_registered', { area, city: city || undefined, full_profile: full })
    } catch {
      // Proceed even if DB is not configured
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  async function doStep1() {
    if (!email || !firstName || !area) {
      setError(t('Por favor completá nombre, email y área.', 'Please fill in name, email, and area.'))
      return
    }
    if (!email.includes('@')) {
      setError(t('Por favor ingresá un email válido.', 'Please enter a valid email.'))
      return
    }
    setError('')
    setStep(2)
  }

  async function doStep2(skip = false) {
    if (skip) {
      await saveProfile(false)
      return
    }
    await saveProfile(true)
  }

  return (
    <section id="register">
      <div className="register-split">
        <div className="reg-left">
          <span className="sec-eye">{t('Para candidatos · Gratis', 'For candidates · Free')}</span>
          <h2 className="sec-h2">
            {t('Registrate.', 'Sign up.')}
            <br />
            {t('El algoritmo trabaja por vos.', 'The algorithm works for you.')}
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
              <span className="proof-ico">✓</span>
              <span className="proof-txt">
                <strong>{t('Match en 24h', 'Match in 24h')}</strong>{' '}
                <span>{t('— tus primeras oportunidades al día siguiente.', '— your first opportunities the next day.')}</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">✓</span>
              <span className="proof-txt">
                <strong>{t('Solo lo relevante', 'Only what matters')}</strong>{' '}
                <span>{t('— sin spam, sin ofertas genéricas.', '— no spam, no generic offers.')}</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">✓</span>
              <span className="proof-txt">
                <strong>{t('Perfil privado', 'Private profile')}</strong>{' '}
                <span>{t('— nunca compartimos tus datos sin permiso.', '— we never share your data without permission.')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="form-box" id="rformwrap">
          {submitted ? (
            <div className="success-box" style={{ display: 'block' }}>
              <div className="success-ico" style={{ background: 'var(--pale)', color: 'var(--forest)', fontSize: '1.6rem', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>✓</div>
              <div className="success-title">{t('¡Perfil creado!', 'Profile created!')}</div>
              <p className="success-sub">
                {t(
                  'Nuestro algoritmo ya está analizando tu perfil. En las próximas 24 horas recibirás tus primeros matches por email.',
                  'Our algorithm is already analysing your profile. Within the next 24 hours you will receive your first matches by email.',
                )}
              </p>
              <div className="success-note">
                <span>{t('Revisá tu bandeja de entrada — también el spam.', 'Check your inbox — including spam.')}</span>
              </div>
            </div>
          ) : step === 1 ? (
            <div id="formbody">
              <div className="form-hd">
                <h3>{t('Crear mi perfil', 'Create my profile')}</h3>
                <p>{t('Gratis · Sin compromiso · 1 minuto', 'Free · No commitment · 1 minute')}</p>
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--forest)' }} />
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--line)' }} />
              </div>

              <div className="fg">
                <label>{t('Nombre', 'First name')}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder={t('Daniela', 'Jane')}
                />
              </div>
              <div className="fg">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('daniela@email.com', 'jane@email.com')}
                />
              </div>
              <div className="fg">
                <label>{t('Área profesional', 'Professional area')}</label>
                <select value={area} onChange={e => setArea(e.target.value)}>
                  <option value="" disabled>{t('Seleccioná tu área', 'Select your area')}</option>
                  {areas.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>

              {error && (
                <p style={{ color: 'var(--coral)', fontSize: '.8rem', marginBottom: '.5rem' }}>{error}</p>
              )}
              <button type="button" className="sub-btn" onClick={doStep1}>
                <span>{t('Continuar', 'Continue')}</span>
              </button>
              <p className="form-note">
                {t(
                  'Al registrarte aceptás los términos. Nunca enviamos spam.',
                  'By signing up you accept the terms. We never send spam.',
                )}
              </p>
            </div>
          ) : (
            <div id="formbody">
              <div className="form-hd">
                <h3>{t('Completá tu perfil', 'Complete your profile')}</h3>
                <p>{t('Opcional · Mejores matches con más info', 'Optional · Better matches with more info')}</p>
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--forest)' }} />
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--forest)' }} />
              </div>

              <div className="fg">
                <label>{t('Apellido (opcional)', 'Last name (optional)')}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder={t('Martínez', 'Smith')}
                />
              </div>
              <div className="frow">
                <div className="fg">
                  <label>{t('Ciudad', 'City')}</label>
                  <select value={city} onChange={e => setCity(e.target.value)}>
                    <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                    {cities.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>{t('Modalidad', 'Work mode')}</label>
                  <select value={modality} onChange={e => setModality(e.target.value)}>
                    <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                    {modalities.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="fg">
                <label>{t('Años de experiencia', 'Years of experience')}</label>
                <select value={experience} onChange={e => setExperience(e.target.value)}>
                  <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                  {expOptions.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>{t('WhatsApp (opcional)', 'WhatsApp (optional)')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="fg">
                <label>{t('Habilidades clave', 'Key skills')}</label>
                <div className="skrow">
                  <input
                    type="text"
                    value={skInput}
                    onChange={e => setSkInput(e.target.value)}
                    onKeyDown={onKeySk}
                    placeholder={t('React, Excel, Photoshop…', 'React, Excel, Photoshop…')}
                  />
                  <button type="button" className="add-btn" onClick={addSk} aria-label="Add skill">+</button>
                </div>
                <div className="sk-tags">
                  {skills.map(s => (
                    <span key={s} className="sk-tag" onClick={() => rmSk(s)} role="button" tabIndex={0}>
                      {s} ×
                    </span>
                  ))}
                </div>
              </div>

              <button type="button" className="sub-btn" onClick={() => doStep2(false)} disabled={loading}>
                <span>{loading ? t('Enviando…', 'Sending…') : t('Crear mi perfil completo', 'Create my full profile')}</span>
              </button>
              <button
                type="button"
                onClick={() => doStep2(true)}
                disabled={loading}
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--ink-45)', fontSize: '.8rem', cursor: 'pointer', padding: '.5rem', marginTop: '.25rem', fontFamily: 'var(--body)' }}
              >
                {t('Omitir por ahora', 'Skip for now')}
              </button>
              <p className="form-note">
                {t(
                  'Al registrarte aceptás los términos. Nunca enviamos spam.',
                  'By signing up you accept the terms. We never send spam.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
