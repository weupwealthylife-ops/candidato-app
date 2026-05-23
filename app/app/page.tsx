'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type UserType = 'candidate' | 'company'

interface CurrentUser {
  name: string
  email: string
  type: UserType
  companyName?: string
}

const SAMPLE_JOBS = [
  {
    ico: '🏢',
    bg: '#e8f5ff',
    title: 'Senior UX Designer',
    co: 'Rappi',
    loc: 'Bogotá · Remoto',
    tags: ['Figma', 'Design Systems', '$8–12M'],
    match: 96,
    time: 'Hace 2h',
    top: true,
  },
  {
    ico: '🏦',
    bg: '#fff3e0',
    title: 'Product Manager',
    co: 'Bancolombia',
    loc: 'Medellín · Híbrido',
    tags: ['Roadmaps', 'Agile', '$10–15M'],
    match: 88,
    time: 'Hace 5h',
    top: false,
  },
  {
    ico: '🎨',
    bg: '#f3e8ff',
    title: 'Brand Designer',
    co: 'Mango',
    loc: 'Cali · Presencial',
    tags: ['Branding', 'Motion', '$6–9M'],
    match: 81,
    time: 'Ayer',
    top: false,
  },
  {
    ico: '💼',
    bg: '#e8f5e9',
    title: 'Tech Lead Frontend',
    co: 'Rappi',
    loc: 'Medellín · Remoto',
    tags: ['React', 'TypeScript', '$15–20M'],
    match: 77,
    time: 'Hace 2d',
    top: false,
  },
  {
    ico: '📊',
    bg: '#fce4ec',
    title: 'Data Analyst',
    co: 'EPI',
    loc: 'Cali · Híbrido',
    tags: ['Python', 'SQL', '$5–8M'],
    match: 72,
    time: 'Hace 3d',
    top: false,
  },
]

const SAMPLE_CANDS = [
  {
    ico: '🧑‍💻',
    bg: '#e8f2f3',
    name: 'A. M.',
    role: 'Senior UX · 6 años',
    tags: ['Figma', 'Systems', 'Bogotá'],
    match: 96,
  },
  {
    ico: '👩‍💼',
    bg: '#fef3ee',
    name: 'C. R.',
    role: 'Product Mgr · 4 años',
    tags: ['Roadmaps', 'Agile', 'Remoto'],
    match: 91,
  },
  {
    ico: '🧑‍🎨',
    bg: '#f0fdf4',
    name: 'D. L.',
    role: 'Brand Design · 5 años',
    tags: ['Branding', 'Motion', 'Cali'],
    match: 88,
  },
]

type CandView = 'dashboard' | 'jobs' | 'matches' | 'profile'
type CompView = 'codashboard' | 'matches' | 'post' | 'talent'

export default function AppPage() {
  const [appLang, setAppLang] = useState<'es' | 'en'>('es')
  const t = (es: string, en: string) => appLang === 'es' ? es : en
  const [userType, setUserType] = useState<UserType>('candidate')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [view, setView] = useState<'onboard' | 'app'>('onboard')

  // Onboarding state
  const [cStep, setCStep] = useState(1)
  const [coStep, setCoStep] = useState(1)
  const [cSkills, setCSkills] = useState<string[]>([])
  const [coSkills, setCoSkills] = useState<string[]>([])
  const [cSkInput, setCSkInput] = useState('')
  const [coSkInput, setCoSkInput] = useState('')

  // Candidate fields
  const [cfn, setCfn] = useState('')
  const [cln, setCln] = useState('')
  const [cem, setCem] = useState('')
  const [cph, setCph] = useState('')
  const [ccy, setCcy] = useState('')
  const [cmo, setCmo] = useState('')
  const [car, setCar] = useState('')
  const [cex, setCex] = useState('')
  const [csal, setCsal] = useState('')
  const [cli, setCli] = useState('')
  const [cnote, setCnote] = useState('')

  // Company fields
  const [cofn, setCofn] = useState('')
  const [coln, setColn] = useState('')
  const [coem, setCoem] = useState('')
  const [coname, setConame] = useState('')
  const [coind, setCoind] = useState('')
  const [cosize, setCosize] = useState('')
  const [cocity, setCocity] = useState('')
  const [cowp, setCowp] = useState('')
  const [jobtitle, setJobtitle] = useState('')
  const [jobmod, setJobmod] = useState('')
  const [jobcity, setJobcity] = useState('')
  const [jobarea, setJobarea] = useState('')
  const [jobsal, setJobsal] = useState('')
  const [jobdesc, setJobdesc] = useState('')

  // App view
  const [candView, setCandView] = useState<CandView>('dashboard')
  const [compView, setCompView] = useState<CompView>('codashboard')

  // Modal / toast
  const [modal, setModal] = useState<{
    ico: string
    title: string
    sub: string
    note: string
  } | null>(null)
  const [toast, setToast] = useState<{ ico: string; title: string; sub: string } | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const urlType = new URLSearchParams(window.location.search).get('type')
    if (urlType === 'company') setUserType('company')
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3800)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (title: string, sub: string, ico = '✅') =>
    setToast({ ico, title, sub })

  const addSkill = (form: 'c' | 'co') => {
    const v = (form === 'c' ? cSkInput : coSkInput).trim()
    if (!v) return
    if (form === 'c') {
      if (cSkills.includes(v)) return setCSkInput('')
      setCSkills([...cSkills, v])
      setCSkInput('')
    } else {
      if (coSkills.includes(v)) return setCoSkInput('')
      setCoSkills([...coSkills, v])
      setCoSkInput('')
    }
  }

  const removeSkill = (form: 'c' | 'co', s: string) => {
    if (form === 'c') setCSkills(cSkills.filter((x) => x !== s))
    else setCoSkills(coSkills.filter((x) => x !== s))
  }

  const nextCStep = (n: number) => {
    if (n > 1) {
      if (!cfn.trim())
        return showToast('Campo requerido', 'Ingresá tu nombre', '⚠️')
      if (!cem.trim())
        return showToast('Campo requerido', 'Ingresá tu email', '⚠️')
    }
    setCStep(n)
  }

  const nextCoStep = (n: number) => {
    if (n > 1) {
      if (!cofn.trim())
        return showToast('Campo requerido', 'Ingresá tu nombre', '⚠️')
      if (!coem.trim())
        return showToast(
          'Campo requerido',
          'Ingresá tu email corporativo',
          '⚠️'
        )
      if (!coname.trim())
        return showToast(
          'Campo requerido',
          'Ingresá el nombre de tu empresa',
          '⚠️'
        )
    }
    setCoStep(n)
  }

  const supabaseEnabled = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function submitCandidate() {
    if (!cem.trim()) {
      showToast('Email requerido', 'Ingresá tu email', '⚠️')
      return
    }
    setSubmitting(true)
    const payload = {
      name: `${cfn} ${cln}`.trim(),
      email: cem.trim(),
      whatsapp: cph.trim(),
      city: ccy,
      modality: cmo,
      area: car,
      experience: cex,
      salary_range: csal,
      linkedin: cli.trim(),
      skills: [...cSkills],
      note: cnote.trim(),
    }
    try {
      if (supabaseEnabled) {
        const sb = createClient()
        const { error } = await sb.from('candidates').insert([payload])
        if (error) console.warn('[Supabase] candidates insert:', error.message)
      }
    } catch (e) {
      console.warn('[Supabase] unexpected:', e)
    }
    setCurrentUser({ name: payload.name, email: payload.email, type: 'candidate' })
    setModal({
      ico: '🎉',
      title: '¡Perfil creado!',
      sub: 'Nuestro algoritmo ya está analizando tu perfil. En las próximas 24 horas recibirás tus primeros matches por email.',
      note: '📧 Revisá tu bandeja de entrada — también el spam.',
    })
    setSubmitting(false)
  }

  async function submitCompany() {
    if (!coem.trim()) {
      showToast('Email requerido', 'Ingresá tu email', '⚠️')
      return
    }
    setSubmitting(true)
    const compPayload = {
      name: `${cofn} ${coln}`.trim(),
      email: coem.trim(),
      company_name: coname.trim(),
      industry: coind,
      size: cosize,
      city: cocity,
      whatsapp: cowp.trim(),
    }
    try {
      if (supabaseEnabled) {
        const sb = createClient()
        const { data, error } = await sb
          .from('companies')
          .insert([compPayload])
          .select()
        if (error) {
          console.warn('[Supabase] companies insert:', error.message)
        } else {
          const compId = data?.[0]?.id
          if (jobtitle.trim() && compId) {
            const jobPayload = {
              company_id: compId,
              title: jobtitle.trim(),
              modality: jobmod,
              city: jobcity,
              area: jobarea,
              salary_range: jobsal,
              description: jobdesc.trim(),
              skills: [...coSkills],
              active: true,
            }
            const { error: jobErr } = await sb.from('jobs').insert([jobPayload])
            if (jobErr) console.warn('[Supabase] jobs insert:', jobErr.message)
          }
        }
      }
    } catch (e) {
      console.warn('[Supabase] unexpected:', e)
    }
    setCurrentUser({
      name: compPayload.name,
      email: compPayload.email,
      type: 'company',
      companyName: compPayload.company_name,
    })
    setModal({
      ico: '🏢',
      title: '¡Empresa registrada!',
      sub: 'Tu vacante está activa. El algoritmo ya está identificando los candidatos más compatibles. Recibirás los primeros matches en las próximas horas.',
      note: '📊 Podés ver los resultados en tu panel de empresa.',
    })
    setSubmitting(false)
  }

  const goToApp = () => {
    setModal(null)
    setView('app')
  }

  const logout = () => {
    setCurrentUser(null)
    setView('onboard')
  }

  const onSkKey =
    (form: 'c' | 'co') => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSkill(form)
      }
    }

  // ── RENDER ONBOARD ──
  if (view === 'onboard') {
    const isC = userType === 'candidate'
    const total = isC ? 3 : 2
    const current = isC ? cStep : coStep
    return (
      <>
        <div id="viewOnboard" className="view active">
          <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 300 }}>
            <div className="lang-pill">
              <button className={appLang === 'es' ? 'on' : ''} onClick={() => setAppLang('es')}>ES</button>
              <button className={appLang === 'en' ? 'on' : ''} onClick={() => setAppLang('en')}>EN</button>
            </div>
          </div>
          <div className="onboard-wrap">
            <div className="onboard-card">
              <div className="onboard-left">
                <div className="ol-content">
                  <Image
                    src="/bird-logo.png"
                    alt="Candidato"
                    width={52}
                    height={52}
                    style={{ objectFit: 'contain', marginBottom: '.4rem' }}
                  />
                  <div
                    style={{
                      fontFamily: 'var(--head)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.92)',
                      letterSpacing: '-.01em',
                      marginBottom: '1.2rem',
                    }}
                  >
                    Candidato<sup style={{ fontSize: '.55em' }}>®</sup>
                  </div>
                  <div className="ol-eyebrow">Candidato® — {t('Plataforma', 'Platform')}</div>
                  <h1 className="ol-title">
                    {isC ? (
                      <>
                        {t('El talento que', 'The talent that')}
                        <br />
                        <span>{t('estaba destinado.', 'was meant to be.')}</span>
                      </>
                    ) : (
                      <>
                        {t('Encontrá el talento', 'Find the talent')}
                        <br />
                        <span>{t('que necesitás.', 'you need.')}</span>
                      </>
                    )}
                  </h1>
                  <p className="ol-sub">
                    {isC
                      ? t(
                          'Tu próxima oportunidad ya existe — solo falta que te encuentre. Nuestra IA analiza tu perfil y te conecta con las empresas que realmente encajan.',
                          'Your next opportunity already exists — it just needs to find you. Our AI analyses your profile and connects you with companies that truly fit.',
                        )
                      : t(
                          'El talento que necesitás ya está aquí. Nuestra IA filtra, analiza y te entrega solo los perfiles que realmente encajan con tu vacante — sin ruido, sin pérdida de tiempo.',
                          'The talent you need is already here. Our AI filters, analyses and delivers only the profiles that truly fit your role — no noise, no wasted time.',
                        )}
                  </p>
                </div>
                <div className="ol-proof">
                  <div className="ol-proof-item">⚡ {t('Match inteligente en 24 horas', 'Intelligent match in 24 hours')}</div>
                  <div className="ol-proof-item">🔒 {t('Perfil 100% privado y seguro', '100% private and secure profile')}</div>
                  <div className="ol-proof-item">🎯 {t('Solo oportunidades relevantes', 'Only relevant opportunities')}</div>
                  <div className="ol-proof-item">✓ {t('Gratis para candidatos', 'Free for candidates')}</div>
                </div>
              </div>

              <div className="onboard-right">
                <div className="ob-type-switch">
                  <button
                    className={`ob-type-btn${isC ? ' active' : ''}`}
                    onClick={() => {
                      setUserType('candidate')
                      setCStep(1)
                    }}
                  >
                    👤 <span>{t('Soy candidato', "I'm a candidate")}</span>
                  </button>
                  <button
                    className={`ob-type-btn${!isC ? ' active' : ''}`}
                    onClick={() => {
                      setUserType('company')
                      setCoStep(1)
                    }}
                  >
                    🏢 <span>{t('Soy empresa', "I'm a company")}</span>
                  </button>
                </div>

                <div className="ob-steps">
                  {(isC
                    ? [t('Datos', 'Info'), t('Experiencia', 'Experience'), t('Habilidades', 'Skills')]
                    : [t('Empresa', 'Company'), t('Vacante', 'Listing')]
                  ).map((label, i) => (
                    <div
                      key={i}
                      className={`ob-step ${i + 1 < current ? 'done' : i + 1 === current ? 'active' : ''}`}
                    >
                      <div className="ob-step-bar"></div>
                      <span className="ob-step-lbl">{i + 1 < current ? '✓' : `${i + 1}`} {label}</span>
                    </div>
                  ))}
                </div>

                {isC ? (
                  <div>
                    {cStep === 1 && (
                      <div>
                        <div className="ob-form-title">{t('Crear mi perfil', 'Create my profile')}</div>
                        <div className="ob-form-sub">{t('Gratis · Sin compromiso · 3 minutos', 'Free · No commitment · 3 minutes')}</div>
                        <div className="form-grid">
                          <div className="fg">
                            <label>{t('Nombre *', 'First name *')}</label>
                            <input type="text" value={cfn} onChange={(e) => setCfn(e.target.value)} placeholder={t('Daniela', 'Jane')} />
                          </div>
                          <div className="fg">
                            <label>{t('Apellido *', 'Last name *')}</label>
                            <input type="text" value={cln} onChange={(e) => setCln(e.target.value)} placeholder={t('Martínez', 'Smith')} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Email *', 'Email *')}</label>
                            <input type="email" value={cem} onChange={(e) => setCem(e.target.value)} placeholder={t('daniela@email.com', 'jane@email.com')} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('WhatsApp', 'WhatsApp')}</label>
                            <input type="tel" value={cph} onChange={(e) => setCph(e.target.value)} placeholder="+57 300 000 0000" />
                          </div>
                          <div className="fg">
                            <label>{t('Ciudad', 'City')}</label>
                            <select value={ccy} onChange={(e) => setCcy(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>Cali</option><option>Bogotá</option><option>Medellín</option>
                              <option>Barranquilla</option><option>Bucaramanga</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Modalidad', 'Work mode')}</label>
                            <select value={cmo} onChange={(e) => setCmo(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Presencial', 'On-site')}</option>
                              <option>{t('Remoto', 'Remote')}</option>
                              <option>{t('Híbrido', 'Hybrid')}</option>
                            </select>
                          </div>
                          <div className="fg fg-full" style={{ marginTop: '.3rem' }}>
                            <button className="submit-btn" onClick={() => nextCStep(2)}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {cStep === 2 && (
                      <div>
                        <div className="ob-form-title">{t('Experiencia profesional', 'Professional experience')}</div>
                        <div className="ob-form-sub">{t('Paso 2 de 3', 'Step 2 of 3')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Área profesional', 'Professional area')}</label>
                            <select value={car} onChange={(e) => setCar(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Tecnología / IT', 'Technology / IT')}</option>
                              <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
                              <option>{t('Marketing y Comunicaciones', 'Marketing & Comms')}</option>
                              <option>{t('Ventas y Comercial', 'Sales & Business Dev')}</option>
                              <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
                              <option>{t('Recursos Humanos', 'Human Resources')}</option>
                              <option>{t('Operaciones', 'Operations')}</option>
                              <option>{t('Otro', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Años de experiencia', 'Years of experience')}</label>
                            <select value={cex} onChange={(e) => setCex(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Sin experiencia', 'No experience')}</option>
                              <option>{t('1–2 años', '1–2 years')}</option>
                              <option>{t('3–5 años', '3–5 years')}</option>
                              <option>{t('5–10 años', '5–10 years')}</option>
                              <option>{t('10+ años', '10+ years')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Pretensión salarial', 'Salary expectation')}</label>
                            <select value={csal} onChange={(e) => setCsal(e.target.value)}>
                              <option value="" disabled>{t('Rango mensual', 'Monthly range')}</option>
                              <option>Hasta $2M</option><option>$2M–$4M</option>
                              <option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
                            </select>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('LinkedIn (opcional)', 'LinkedIn (optional)')}</label>
                            <input type="url" value={cli} onChange={(e) => setCli(e.target.value)} placeholder="linkedin.com/in/your-profile" />
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.5rem', marginTop: '.3rem' }}>
                            <button className="btn btn-outline" onClick={() => nextCStep(1)} style={{ flex: 1, padding: 11 }}>
                              {t('← Atrás', '← Back')}
                            </button>
                            <button className="submit-btn" onClick={() => nextCStep(3)} style={{ flex: 2, marginTop: 0 }}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {cStep === 3 && (
                      <div>
                        <div className="ob-form-title">{t('Habilidades clave', 'Key skills')}</div>
                        <div className="ob-form-sub">{t('Paso 3 de 3 · ¡Casi listo!', 'Step 3 of 3 · Almost done!')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Habilidades', 'Skills')}</label>
                            <div className="skill-row">
                              <input type="text" value={cSkInput} onChange={(e) => setCSkInput(e.target.value)} onKeyDown={onSkKey('c')} placeholder="React, Excel, Photoshop…" />
                              <button className="add-sk-btn" onClick={() => addSkill('c')}>+</button>
                            </div>
                            <div className="sk-tags">
                              {cSkills.map((s) => (
                                <span key={s} className="sk-tag" onClick={() => removeSkill('c', s)}>{s} ×</span>
                              ))}
                            </div>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Nota adicional (opcional)', 'Additional note (optional)')}</label>
                            <textarea value={cnote} onChange={(e) => setCnote(e.target.value)} placeholder={t('¿Qué tipo de empresa buscás?', 'What type of company are you looking for?')} />
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.5rem', marginTop: '.3rem' }}>
                            <button className="btn btn-outline" onClick={() => nextCStep(2)} style={{ flex: 1, padding: 11 }}>
                              {t('← Atrás', '← Back')}
                            </button>
                            <button className="submit-btn" disabled={submitting} onClick={submitCandidate} style={{ flex: 2, marginTop: 0 }}>
                              {submitting ? t('Guardando…', 'Saving…') : t('Encontrar mis matches →', 'Find my matches →')}
                            </button>
                          </div>
                          <div className="fg fg-full">
                            <p style={{ fontSize: '.64rem', color: 'var(--ink-45)', textAlign: 'center' }}>
                              {t('Al registrarte aceptás los términos. Nunca enviamos spam.', 'By signing up you accept the terms. We never send spam.')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {coStep === 1 && (
                      <div>
                        <div className="ob-form-title">{t('Registrar mi empresa', 'Register my company')}</div>
                        <div className="ob-form-sub">{t('Accede al top 1% del talento colombiano', 'Access the top 1% of Colombian talent')}</div>
                        <div className="form-grid">
                          <div className="fg">
                            <label>{t('Nombre *', 'First name *')}</label>
                            <input type="text" value={cofn} onChange={(e) => setCofn(e.target.value)} placeholder={t('Ana', 'Ana')} />
                          </div>
                          <div className="fg">
                            <label>{t('Apellido *', 'Last name *')}</label>
                            <input type="text" value={coln} onChange={(e) => setColn(e.target.value)} placeholder={t('García', 'Garcia')} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Email corporativo *', 'Corporate email *')}</label>
                            <input type="email" value={coem} onChange={(e) => setCoem(e.target.value)} placeholder={t('ana@empresa.com', 'ana@company.com')} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Empresa *', 'Company *')}</label>
                            <input type="text" value={coname} onChange={(e) => setConame(e.target.value)} placeholder="Acme Corp" />
                          </div>
                          <div className="fg">
                            <label>{t('Industria', 'Industry')}</label>
                            <select value={coind} onChange={(e) => setCoind(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Tecnología', 'Technology')}</option>
                              <option>{t('Finanzas', 'Finance')}</option>
                              <option>Retail</option>
                              <option>{t('Salud', 'Healthcare')}</option>
                              <option>{t('Educación', 'Education')}</option>
                              <option>{t('Manufactura', 'Manufacturing')}</option>
                              <option>{t('Servicios', 'Services')}</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Tamaño', 'Company size')}</label>
                            <select value={cosize} onChange={(e) => setCosize(e.target.value)}>
                              <option value="" disabled>{t('Empleados', 'Employees')}</option>
                              <option>1–10</option><option>11–50</option>
                              <option>51–200</option><option>200–500</option><option>500+</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Ciudad', 'City')}</label>
                            <select value={cocity} onChange={(e) => setCocity(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>Cali</option><option>Bogotá</option>
                              <option>Medellín</option><option>Barranquilla</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('WhatsApp', 'WhatsApp')}</label>
                            <input type="tel" value={cowp} onChange={(e) => setCowp(e.target.value)} placeholder="+57 300 000 0000" />
                          </div>
                          <div className="fg fg-full" style={{ marginTop: '.3rem' }}>
                            <button className="submit-btn" onClick={() => nextCoStep(2)}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {coStep === 2 && (
                      <div>
                        <div className="ob-form-title">{t('Tu primera vacante', 'Your first job listing')}</div>
                        <div className="ob-form-sub">{t('Paso 2 de 2 · Publicá tu oferta', 'Step 2 of 2 · Post your role')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Cargo *', 'Job title *')}</label>
                            <input type="text" value={jobtitle} onChange={(e) => setJobtitle(e.target.value)} placeholder="Senior UX Designer" />
                          </div>
                          <div className="fg">
                            <label>{t('Modalidad', 'Work mode')}</label>
                            <select value={jobmod} onChange={(e) => setJobmod(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Presencial', 'On-site')}</option>
                              <option>{t('Remoto', 'Remote')}</option>
                              <option>{t('Híbrido', 'Hybrid')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Ciudad', 'City')}</label>
                            <select value={jobcity} onChange={(e) => setJobcity(e.target.value)}>
                              <option value="" disabled>{t('Ciudad', 'City')}</option>
                              <option>Cali</option><option>Bogotá</option>
                              <option>Medellín</option><option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Área', 'Area')}</label>
                            <select value={jobarea} onChange={(e) => setJobarea(e.target.value)}>
                              <option value="" disabled>{t('Área', 'Area')}</option>
                              <option>{t('Tecnología', 'Technology')}</option>
                              <option>{t('Diseño', 'Design')}</option>
                              <option>Marketing</option>
                              <option>{t('Ventas', 'Sales')}</option>
                              <option>{t('Finanzas', 'Finance')}</option>
                              <option>{t('RRHH', 'HR')}</option>
                              <option>{t('Operaciones', 'Operations')}</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Salario mensual', 'Monthly salary')}</label>
                            <select value={jobsal} onChange={(e) => setJobsal(e.target.value)}>
                              <option value="" disabled>{t('Rango', 'Range')}</option>
                              <option>Hasta $2M</option><option>$2M–$4M</option>
                              <option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
                            </select>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Descripción', 'Description')}</label>
                            <textarea value={jobdesc} onChange={(e) => setJobdesc(e.target.value)} placeholder={t('¿Qué hace este rol? ¿Qué buscás en el candidato ideal?', 'What does this role do? What are you looking for in the ideal candidate?')} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Habilidades requeridas', 'Required skills')}</label>
                            <div className="skill-row">
                              <input type="text" value={coSkInput} onChange={(e) => setCoSkInput(e.target.value)} onKeyDown={onSkKey('co')} placeholder="Figma, React, Python…" />
                              <button className="add-sk-btn" onClick={() => addSkill('co')}>+</button>
                            </div>
                            <div className="sk-tags">
                              {coSkills.map((s) => (
                                <span key={s} className="sk-tag" onClick={() => removeSkill('co', s)}>{s} ×</span>
                              ))}
                            </div>
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.5rem', marginTop: '.3rem' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => nextCoStep(1)}
                              style={{ flex: 1, padding: 11 }}
                            >
                              {t('← Atrás', '← Back')}
                            </button>
                            <button
                              className="submit-btn"
                              disabled={submitting}
                              onClick={submitCompany}
                              style={{ flex: 2, marginTop: 0 }}
                            >
                              {submitting ? t('Guardando…', 'Saving…') : t('Publicar y buscar matches →', 'Post and find matches →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {modal && (
          <div className="modal-overlay open">
            <div className="modal">
              <button className="modal-close" onClick={() => setModal(null)}>
                ✕
              </button>
              <div className="modal-ico">{modal.ico}</div>
              <div className="modal-title">{modal.title}</div>
              <p className="modal-sub">{modal.sub}</p>
              <div className="modal-note">{modal.note}</div>
              <button
                className="submit-btn"
                style={{ marginTop: '1.1rem' }}
                onClick={goToApp}
              >
                Ir a mi panel →
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div className="toast show">
            <div className="toast-title">
              {toast.ico} {toast.title}
            </div>
            <div className="toast-sub">{toast.sub}</div>
          </div>
        )}
      </>
    )
  }

  // ── RENDER APP ──
  const isC = userType === 'candidate'
  const name = currentUser?.name || (isC ? 'Ana' : 'CO')
  const firstName = currentUser?.name?.split(' ')[0] || 'Ana'
  const coName = currentUser?.companyName || 'tu empresa'

  return (
    <>
      <div id="viewApp" className="view active">
        <nav className="topbar">
          <div className="topbar-logo">
            <a
              href="/"
              style={{
                fontSize: '.72rem',
                color: 'var(--ink-45)',
                marginRight: '.5rem',
                textDecoration: 'none',
              }}
            >
              {t('← Inicio', '← Home')}
            </a>
            <Image
              src="/bird-logo.png"
              alt="Candidato"
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 700,
                fontSize: '.95rem',
                color: 'var(--forest)',
                letterSpacing: '-.02em',
              }}
            >
              Candidato<sup style={{ fontSize: '.55em', fontWeight: 600 }}>®</sup>
            </span>
          </div>
          <div className="topbar-div"></div>
          <div className="topbar-tabs">
            {isC ? (
              <>
                <button
                  className={`tab-btn${candView === 'dashboard' ? ' active' : ''}`}
                  onClick={() => setCandView('dashboard')}
                >
                  🏠 Inicio
                </button>
                <button
                  className={`tab-btn${candView === 'jobs' ? ' active' : ''}`}
                  onClick={() => setCandView('jobs')}
                >
                  🔍 Buscar trabajo
                </button>
                <button
                  className={`tab-btn${candView === 'matches' ? ' active' : ''}`}
                  onClick={() => setCandView('matches')}
                >
                  ⭐ Matches <span className="tab-badge">3</span>
                </button>
                <button
                  className={`tab-btn${candView === 'profile' ? ' active' : ''}`}
                  onClick={() => setCandView('profile')}
                >
                  👤 Mi perfil
                </button>
              </>
            ) : (
              <>
                <button
                  className={`tab-btn${compView === 'matches' ? ' active' : ''}`}
                  onClick={() => setCompView('matches')}
                >
                  ⭐ Matches
                </button>
                <button
                  className={`tab-btn${compView === 'post' ? ' active' : ''}`}
                  onClick={() => setCompView('post')}
                >
                  ➕ Nueva vacante
                </button>
                <button
                  className={`tab-btn${compView === 'talent' ? ' active' : ''}`}
                  onClick={() => setCompView('talent')}
                >
                  🔍 Buscar talento
                </button>
              </>
            )}
          </div>
          <div className="topbar-right">
            <div className="lang-pill">
              <button className={appLang === 'es' ? 'on' : ''} onClick={() => setAppLang('es')}>ES</button>
              <button className={appLang === 'en' ? 'on' : ''} onClick={() => setAppLang('en')}>EN</button>
            </div>
            <button className="btn btn-outline btn-sm" onClick={logout}>
              {t('Salir', 'Log out')}
            </button>
            <div className="user-ava">{name.substring(0, 2).toUpperCase()}</div>
          </div>
        </nav>

        <div className="app-shell">
          <aside className="sidebar">
            {isC ? (
              <>
                <span className="sidebar-lbl">Mi espacio</span>
                <button
                  className={`nav-item${candView === 'dashboard' ? ' active' : ''}`}
                  onClick={() => setCandView('dashboard')}
                >
                  <span className="ni-ico">🏠</span> Inicio
                </button>
                <button
                  className={`nav-item${candView === 'jobs' ? ' active' : ''}`}
                  onClick={() => setCandView('jobs')}
                >
                  <span className="ni-ico">🔍</span> Buscar trabajo
                </button>
                <button
                  className={`nav-item${candView === 'matches' ? ' active' : ''}`}
                  onClick={() => setCandView('matches')}
                >
                  <span className="ni-ico">⭐</span> Mis matches{' '}
                  <span className="ni-badge">3</span>
                </button>
                <button
                  className={`nav-item${candView === 'profile' ? ' active' : ''}`}
                  onClick={() => setCandView('profile')}
                >
                  <span className="ni-ico">👤</span> Mi perfil
                </button>
                <span className="sidebar-lbl" style={{ marginTop: '1rem' }}>
                  Cuenta
                </span>
                <button className="nav-item" onClick={logout}>
                  <span className="ni-ico">←</span> {t('Salir', 'Log out')}
                </button>
              </>
            ) : (
              <>
                <span className="sidebar-lbl">Mi empresa</span>
                <button
                  className={`nav-item${compView === 'codashboard' ? ' active' : ''}`}
                  onClick={() => setCompView('codashboard')}
                >
                  <span className="ni-ico">🏠</span> Inicio
                </button>
                <button
                  className={`nav-item${compView === 'matches' ? ' active' : ''}`}
                  onClick={() => setCompView('matches')}
                >
                  <span className="ni-ico">⭐</span> Matches{' '}
                  <span className="ni-badge">3</span>
                </button>
                <button
                  className={`nav-item${compView === 'post' ? ' active' : ''}`}
                  onClick={() => setCompView('post')}
                >
                  <span className="ni-ico">➕</span> Nueva vacante
                </button>
                <button
                  className={`nav-item${compView === 'talent' ? ' active' : ''}`}
                  onClick={() => setCompView('talent')}
                >
                  <span className="ni-ico">🔍</span> Buscar talento
                </button>
                <span className="sidebar-lbl" style={{ marginTop: '1rem' }}>
                  Cuenta
                </span>
                <button className="nav-item">
                  <span className="ni-ico">💳</span> Plan Pro
                </button>
                <button className="nav-item" onClick={logout}>
                  <span className="ni-ico">←</span> {t('Salir', 'Log out')}
                </button>
              </>
            )}
          </aside>

          <main className="main">
            {isC ? (
              <CandidateView view={candView} firstName={firstName} skills={cSkills} user={currentUser} setView={setCandView} />
            ) : (
              <CompanyView view={compView} coName={coName} setView={setCompView} />
            )}
          </main>
        </div>

        <div className="status-bar">
          <span>
            {isC
              ? '✅ Tu perfil está activo · Recibirás matches por email'
              : `✅ ${coName} verificada · Vacante activa`}
          </span>
          <span className="sb-ai">
            {isC ? '⚡ IA analizando 247 vacantes…' : '⚡ IA analizando 47 candidatos…'}
          </span>
        </div>
      </div>

      {toast && (
        <div className="toast show">
          <div className="toast-title">
            {toast.ico} {toast.title}
          </div>
          <div className="toast-sub">{toast.sub}</div>
        </div>
      )}
    </>
  )
}

function CandidateView({
  view,
  firstName,
  skills,
  user,
  setView,
}: {
  view: CandView
  firstName: string
  skills: string[]
  user: CurrentUser | null
  setView: (v: CandView) => void
}) {
  if (view === 'dashboard')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Buenos días, {firstName} 👋</div>
          <div className="page-sub">Aquí está tu resumen de hoy</div>
        </div>
        <div
          className="stats-row"
          style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.5rem' }}
        >
          <div className="stat-card highlight">
            <div className="stat-tag">Nuevos matches</div>
            <div className="stat-num">3</div>
            <div className="stat-label">Esta semana</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Mejor compatibilidad</div>
            <div className="stat-num coral">96%</div>
            <div className="stat-label">Senior UX Designer</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Vacantes activas</div>
            <div className="stat-num">247</div>
            <div className="stat-label">Para tu perfil</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div
              style={{
                fontFamily: 'var(--head)',
                fontSize: '.9rem',
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              Tus mejores matches
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setView('matches')}
              >
                Ver todos →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {SAMPLE_JOBS.slice(0, 3).map((j, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.75rem',
                    padding: '.6rem',
                    borderRadius: 8,
                    background: 'var(--off)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: j.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {j.ico}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{j.title}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--ink-45)' }}>
                      {j.co} · {j.loc.split('·')[0].trim()}
                    </div>
                  </div>
                  <span
                    className={`match-pill ${j.match >= 85 ? 'top' : 'mid'}`}
                    style={{ fontSize: '.7rem' }}
                  >
                    {j.match}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div
              style={{
                fontFamily: 'var(--head)',
                fontSize: '.9rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              Tu perfil
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '.4rem',
                }}
              >
                <span style={{ fontSize: '.78rem', color: 'var(--ink-70)' }}>
                  Completud del perfil
                </span>
                <span
                  style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--forest)' }}
                >
                  75%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--pale)',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: '75%',
                    background: 'var(--forest)',
                    borderRadius: 10,
                  }}
                ></div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '.5rem',
                fontSize: '.78rem',
              }}
            >
              <div style={{ color: 'var(--forest)' }}>✅ Información básica completa</div>
              <div style={{ color: 'var(--forest)' }}>✅ Área profesional definida</div>
              <div style={{ color: 'var(--ink-45)' }}>○ Añadir habilidades clave</div>
              <div style={{ color: 'var(--ink-45)' }}>○ Agregar LinkedIn</div>
            </div>
            <button
              className="btn btn-forest btn-sm"
              style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
              onClick={() => setView('profile')}
            >
              Completar perfil →
            </button>
          </div>
        </div>
      </>
    )

  if (view === 'jobs')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Buscar trabajo</div>
          <div className="page-sub">
            Vacantes ordenadas por compatibilidad con tu perfil
          </div>
        </div>
        <div className="search-wrap">
          <span className="search-ico">🔍</span>
          <input className="search-input" placeholder="Cargo, habilidad o empresa…" />
          <span className="filter-chip">Cali ×</span>
          <span className="filter-chip">Remoto ×</span>
          <span className="filter-chip">UX ×</span>
          <button className="btn btn-forest btn-sm">Buscar</button>
        </div>
        <div
          style={{
            fontSize: '.72rem',
            color: 'var(--ink-45)',
            marginBottom: '.85rem',
          }}
        >
          247 vacantes activas · Ordenadas por compatibilidad IA
        </div>
        <div className="jobs-list">
          {SAMPLE_JOBS.map((j, idx) => (
            <div key={idx} className={`job-card${j.top ? ' featured' : ''}`}>
              {j.top && <span className="new-badge">⭐ Top match</span>}
              <div className="jc-logo" style={{ background: j.bg }}>
                {j.ico}
              </div>
              <div className="jc-body">
                <div className="jc-title">{j.title}</div>
                <div className="jc-meta">
                  {j.co} · {j.loc}
                </div>
                <div className="jc-tags">
                  {j.tags.map((t) => (
                    <span key={t} className="jc-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="jc-right">
                <span className={`match-pill ${j.match >= 85 ? 'top' : 'mid'}`}>
                  {j.match}% match
                </span>
                <span className="jc-time">{j.time}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    )

  if (view === 'matches')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Mis matches</div>
          <div className="page-sub">
            Oportunidades seleccionadas por el algoritmo para vos
          </div>
        </div>
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="stat-card highlight">
            <div className="stat-tag">Matches</div>
            <div className="stat-num">3</div>
            <div className="stat-label">Esta semana</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Mejor match</div>
            <div className="stat-num coral">96%</div>
            <div className="stat-label">Senior UX Designer</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Sin revisar</div>
            <div className="stat-num">2</div>
            <div className="stat-label">Nuevos hoy</div>
          </div>
        </div>
        <div className="jobs-list">
          {SAMPLE_JOBS.slice(0, 3).map((j, idx) => (
            <div key={idx} className={`job-card${j.top ? ' featured' : ''}`}>
              <div className="jc-logo" style={{ background: j.bg }}>
                {j.ico}
              </div>
              <div className="jc-body">
                <div className="jc-title">{j.title}</div>
                <div className="jc-meta">
                  {j.co} · {j.loc}
                </div>
                <div className="jc-tags">
                  {j.tags.map((t) => (
                    <span key={t} className="jc-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="jc-right">
                <span className={`match-pill ${j.match >= 85 ? 'top' : 'mid'}`}>
                  {j.match}%
                </span>
                <button className="btn btn-outline btn-sm">Ver oferta</button>
              </div>
            </div>
          ))}
        </div>
      </>
    )

  // profile
  return (
    <>
      <div className="page-head">
        <div className="page-title">Mi perfil</div>
        <div className="page-sub">Mantenelo actualizado para mejorar tus matches</div>
        <div className="page-actions">
          <button className="btn btn-forest btn-sm">✏️ Editar</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <div
            style={{
              fontFamily: 'var(--head)',
              fontSize: '.85rem',
              fontWeight: 700,
              marginBottom: '.9rem',
            }}
          >
            Información personal
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '.55rem',
              fontSize: '.8rem',
              color: 'var(--ink-70)',
            }}
          >
            <div>
              <strong>Nombre:</strong> {user?.name || '—'}
            </div>
            <div>
              <strong>Email:</strong> {user?.email || '—'}
            </div>
          </div>
        </div>
        <div className="card">
          <div
            style={{
              fontFamily: 'var(--head)',
              fontSize: '.85rem',
              fontWeight: 700,
              marginBottom: '.9rem',
            }}
          >
            Habilidades
          </div>
          <div className="sk-tags">
            {skills.length === 0 ? (
              <span style={{ fontSize: '.75rem', color: 'var(--ink-45)' }}>
                Sin habilidades añadidas
              </span>
            ) : (
              skills.map((s) => (
                <span key={s} className="sk-tag">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function CompanyView({
  view,
  coName,
  setView,
}: {
  view: CompView
  coName: string
  setView: (v: CompView) => void
}) {
  if (view === 'codashboard')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Panel de {coName}</div>
          <div className="page-sub">Resumen de reclutamiento</div>
          <div className="page-actions">
            <button
              className="btn btn-forest btn-sm"
              onClick={() => setView('post')}
            >
              ➕ Nueva vacante
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setView('matches')}
            >
              Ver matches →
            </button>
          </div>
        </div>
        <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card highlight">
            <div className="stat-tag">Candidatos analizados</div>
            <div className="stat-num">247</div>
            <div className="stat-label">Esta semana</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Matches top</div>
            <div className="stat-num coral">3</div>
            <div className="stat-label">+80% compatibilidad</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Tiempo medio</div>
            <div className="stat-num">24h</div>
            <div className="stat-label">Primer match</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Tasa de éxito</div>
            <div className="stat-num">80%</div>
            <div className="stat-label">Contrataciones</div>
          </div>
        </div>
      </>
    )

  if (view === 'matches')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Matches de esta semana</div>
          <div className="page-sub">
            Candidatos preseleccionados por IA para tu vacante activa
          </div>
        </div>
        <div className="stats-row">
          <div className="stat-card highlight">
            <div className="stat-tag">Analizados</div>
            <div className="stat-num">247</div>
            <div className="stat-label">Esta semana</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Top matches</div>
            <div className="stat-num coral">3</div>
            <div className="stat-label">+80% compatibilidad</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Tiempo</div>
            <div className="stat-num">24h</div>
            <div className="stat-label">Primer match</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">Éxito</div>
            <div className="stat-num">80%</div>
            <div className="stat-label">Contrataciones</div>
          </div>
        </div>
        <div className="card" style={{ marginBottom: '1rem', overflowX: 'auto' }}>
          <div
            style={{
              fontFamily: 'var(--head)',
              fontSize: '.85rem',
              fontWeight: 700,
              marginBottom: '.85rem',
            }}
          >
            Candidatos compatibles
          </div>
          <table className="match-table">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Habilidad</th>
                <th>Match</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CANDS.map((c) => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          background: c.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '.85rem',
                        }}
                      >
                        {c.ico}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{c.name}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--ink-45)' }}>
                          {c.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{c.tags[0]}</td>
                  <td>
                    <span className={`match-pill ${c.match >= 85 ? 'top' : 'mid'}`}>
                      {c.match}%
                    </span>
                  </td>
                  <td>
                    <span className="status-pill new">Nuevo</span>
                  </td>
                  <td>
                    <button className="btn btn-forest btn-sm">Ver perfil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )

  if (view === 'talent')
    return (
      <>
        <div className="page-head">
          <div className="page-title">Buscar talento</div>
          <div className="page-sub">Pool de candidatos verificados por Candidato®</div>
        </div>
        <div className="search-wrap">
          <span className="search-ico">🔍</span>
          <input className="search-input" placeholder="Cargo, habilidad, ciudad…" />
          <button className="btn btn-forest btn-sm">Buscar</button>
        </div>
        <div className="candidates-grid">
          {SAMPLE_CANDS.map((c) => (
            <div className="cand-card" key={c.name}>
              <div className="cand-top">
                <div className="cand-ava" style={{ background: c.bg }}>
                  {c.ico}
                </div>
                <div>
                  <div className="cand-name">{c.name}</div>
                  <div className="cand-role">{c.role}</div>
                </div>
              </div>
              <div className="cand-tags">
                {c.tags.map((t) => (
                  <span key={t} className="cand-tag">
                    {t}
                  </span>
                ))}
              </div>
              <div className="cand-foot">
                <div>
                  <div className="cand-match-lbl">Match</div>
                  <div className="cand-match">{c.match}%</div>
                </div>
                <button className="btn btn-outline btn-sm">Ver perfil</button>
              </div>
            </div>
          ))}
        </div>
      </>
    )

  // post job
  return (
    <>
      <div className="page-head">
        <div className="page-title">Nueva vacante</div>
        <div className="page-sub">
          El algoritmo buscará los candidatos más compatibles automáticamente
        </div>
      </div>
      <div className="card" style={{ maxWidth: 660 }}>
        <div className="form-grid">
          <div className="fg fg-full">
            <label>Cargo *</label>
            <input type="text" placeholder="Senior UX Designer" />
          </div>
          <div className="fg">
            <label>Modalidad</label>
            <select defaultValue="">
              <option value="" disabled>
                Seleccioná
              </option>
              <option>Presencial</option>
              <option>Remoto</option>
              <option>Híbrido</option>
            </select>
          </div>
          <div className="fg">
            <label>Ciudad</label>
            <select defaultValue="">
              <option value="" disabled>
                Ciudad
              </option>
              <option>Cali</option>
              <option>Bogotá</option>
              <option>Medellín</option>
              <option>Otra</option>
            </select>
          </div>
          <div className="fg fg-full">
            <label>Descripción</label>
            <textarea placeholder="¿Qué hace este rol? ¿Qué buscás en el candidato ideal?" />
          </div>
          <div className="fg fg-full">
            <button className="submit-btn">🚀 Publicar vacante →</button>
          </div>
        </div>
      </div>
    </>
  )
}
