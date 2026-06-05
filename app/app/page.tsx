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
  companyId?: string
}

interface Job {
  id: string
  title: string
  modality?: string
  city?: string
  area?: string
  salary_range?: string
  description?: string
  skills?: string[]
  created_at?: string
  companies?: { company_name: string }
}

interface Candidate {
  id: string
  name: string
  area?: string
  experience?: string
  city?: string
  modality?: string
  skills?: string[]
  linkedin?: string
  created_at?: string
}

function timeAgo(ts?: string) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Hace un momento'
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ayer'
  return `Hace ${d}d`
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

type CandView = 'dashboard' | 'jobs' | 'profile' | 'settings'
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

  // Real data
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [dataLoading, setDataLoading] = useState(false)

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

  // Email gate phase
  const [phase, setPhase] = useState<'gate' | 'register' | 'welcome' | 'verify'>('gate')
  const [gateEmail, setGateEmail] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [foundName, setFoundName] = useState('')

  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvName, setCvName] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

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

  async function loadJobs(query = '', area = '', city = '', mod = '') {
    setDataLoading(true)
    try {
      const sb = createClient()
      let q = sb.from('jobs').select('*, companies(company_name)').eq('active', true)
      if (query) q = q.ilike('title', `%${query}%`)
      if (area) q = q.eq('area', area)
      if (city) q = q.eq('city', city)
      if (mod) q = q.eq('modality', mod)
      const { data } = await q.order('created_at', { ascending: false }).limit(50)
      setJobs(data || [])
    } catch (e) { console.warn('[Supabase] loadJobs:', e) }
    setDataLoading(false)
  }

  async function loadCandidates(query = '', area = '') {
    try {
      const sb = createClient()
      let q = sb.from('candidates').select('id,name,area,experience,city,modality,skills,linkedin,created_at')
      if (query) q = q.ilike('name', `%${query}%`)
      if (area) q = q.eq('area', area)
      const { data } = await q.order('created_at', { ascending: false }).limit(50)
      setCandidates(data || [])
    } catch (e) { console.warn('[Supabase] loadCandidates:', e) }
  }

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
    }
    setCStep(n)
  }

  const nextCoStep = (n: number) => {
    if (n > 1) {
      if (!cofn.trim())
        return showToast('Campo requerido', 'Ingresá tu nombre', '⚠️')
      if (!coname.trim())
        return showToast('Campo requerido', 'Ingresá el nombre de tu empresa', '⚠️')
    }
    setCoStep(n)
  }

  const supabaseEnabled = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function submitCandidate() {
    if (!cem.trim()) {
      showToast('Campo requerido', 'Ingresá tu email', '⚠️')
      return
    }
    setSubmitting(true)
    const email = cem.trim().toLowerCase()
    const name = `${cfn} ${cln}`.trim()
    let cvUrl = ''
    let dbOk = false

    if (!supabaseEnabled) {
      showToast('Configuración', 'Supabase no está configurado', '⚠️')
      setSubmitting(false)
      return
    }

    try {
      const sb = createClient()

      // CV upload
      if (cvFile) {
        setCvUploading(true)
        const ext = cvFile.name.split('.').pop()
        const path = `cvs/${Date.now()}-${email.replace(/[@.]/g, '_')}.${ext}`
        const { data: upData } = await sb.storage.from('candidatos').upload(path, cvFile, { upsert: true })
        if (upData?.path) {
          const { data: urlData } = sb.storage.from('candidatos').getPublicUrl(upData.path)
          cvUrl = urlData?.publicUrl || ''
        }
        setCvUploading(false)
      }

      // Build payload dynamically — only include keys with actual values
      // so PostgREST never references a column that may not exist in the schema
      const payload: Record<string, unknown> = { name, email }
      if (cph.trim()) payload.whatsapp = cph.trim()
      if (ccy) payload.city = ccy
      if (cmo) payload.modality = cmo
      if (car) payload.area = car
      if (cex) payload.experience = cex
      if (csal) payload.salary_range = csal
      if (cli.trim()) payload.linkedin = cli.trim()
      if (cSkills.length > 0) payload.skills = cSkills
      if (cnote.trim()) payload.notes = cnote.trim()
      if (cvUrl) payload.cv_url = cvUrl

      const { error } = await sb.from('candidates').insert([payload])
      if (error) {
        console.error('[DB] candidates insert failed:', error.message, error.details)
        showToast('Error al guardar', error.message, '⚠️')
      } else {
        dbOk = true
      }

      // Trigger verification email (best-effort)
      try {
        await sb.auth.signUp({
          email,
          password: crypto.randomUUID(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
        })
      } catch {
        // Auth signup is non-blocking — profile saved regardless
      }
    } catch (e) {
      console.error('[submitCandidate] unexpected:', e)
    }

    setSubmitting(false)
    setCvUploading(false)

    if (dbOk) {
      setCurrentUser({ name, email, type: 'candidate' })
      setPhase('verify')
    }
  }

  async function submitCompany() {
    if (!coem.trim()) {
      showToast('Campo requerido', 'Ingresá tu email', '⚠️')
      return
    }
    setSubmitting(true)
    const email = coem.trim().toLowerCase()
    const name = `${cofn} ${coln}`.trim()
    let dbOk = false

    if (!supabaseEnabled) {
      showToast('Configuración', 'Supabase no está configurado', '⚠️')
      setSubmitting(false)
      return
    }

    try {
      const sb = createClient()
      const compPayload: Record<string, unknown> = { name, email, company_name: coname.trim() }
      if (coind) compPayload.industry = coind
      if (cosize) compPayload.size = cosize
      if (cocity) compPayload.city = cocity
      if (cowp.trim()) compPayload.whatsapp = cowp.trim()

      const { data, error } = await sb.from('companies').insert([compPayload]).select()
      if (error) {
        console.error('[DB] companies insert failed:', error.message, error.details)
        showToast('Error al guardar', error.message, '⚠️')
      } else {
        dbOk = true
        const compId = data?.[0]?.id
        if (jobtitle.trim() && compId) {
          const jobPayload: Record<string, unknown> = {
            company_id: compId,
            title: jobtitle.trim(),
            active: true,
          }
          if (jobmod) jobPayload.modality = jobmod
          if (jobcity) jobPayload.city = jobcity
          if (jobarea) jobPayload.area = jobarea
          if (jobsal) jobPayload.salary_range = jobsal
          if (jobdesc.trim()) jobPayload.description = jobdesc.trim()
          if (coSkills.length > 0) jobPayload.skills = coSkills
          const { error: jobErr } = await sb.from('jobs').insert([jobPayload])
          if (jobErr) console.error('[DB] jobs insert failed:', jobErr.message)
        }
      }

      try {
        await sb.auth.signUp({
          email,
          password: crypto.randomUUID(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
        })
      } catch {
        // non-blocking
      }
    } catch (e) {
      console.error('[submitCompany] unexpected:', e)
    }

    setSubmitting(false)

    if (dbOk) {
      setCurrentUser({ name, email, type: 'company', companyName: coname.trim() })
      setPhase('verify')
    }
  }

  const goToApp = () => {
    setModal(null)
    setView('app')
    loadJobs()
    loadCandidates()
  }

  const enterApp = (user: CurrentUser) => {
    setCurrentUser(user)
    setView('app')
    loadJobs()
    loadCandidates()
  }

  const logout = () => {
    setCurrentUser(null)
    setView('onboard')
    setPhase('gate')
    setGateEmail('')
    setFoundName('')
    setCStep(1)
    setCoStep(1)
  }

  const onSkKey =
    (form: 'c' | 'co') => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSkill(form)
      }
    }

  async function checkEmailExists() {
    const email = gateEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showToast(t('Email inválido', 'Invalid email'), t('Ingresá un email válido', 'Enter a valid email'), '⚠️')
      return
    }
    setGateLoading(true)
    try {
      const sb = createClient()

      // ilike = case-insensitive — handles emails stored with any casing
      const { data: cand } = await sb
        .from('candidates')
        .select('name,email')
        .ilike('email', email)
        .maybeSingle()
      if (cand?.name) {
        setGateLoading(false)
        // Returning candidate → go straight to dashboard
        enterApp({ name: cand.name, email: cand.email ?? email, type: 'candidate' })
        return
      }

      const { data: comp } = await sb
        .from('companies')
        .select('name,email,company_name')
        .ilike('email', email)
        .maybeSingle()
      if (comp?.name) {
        setGateLoading(false)
        // Returning company → go straight to dashboard
        enterApp({ name: comp.name, email: comp.email ?? email, type: 'company', companyName: comp.company_name })
        return
      }
    } catch (e) {
      console.error('[checkEmailExists]', e)
    }

    // Not found → new user, pre-fill email and go to registration
    if (userType === 'candidate') setCem(email)
    else setCoem(email)
    setGateLoading(false)
    setPhase('register')
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
              <div className="onboard-right-inner">
                {/* Mobile-only logo header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.6rem' }} className="ob-mobile-brand">
                  <Image src="/bird-logo.png" alt="Candidato" width={28} height={28} style={{ objectFit: 'contain' }} />
                  <span style={{ fontFamily: 'var(--head)', fontSize: '.95rem', fontWeight: 700, color: 'var(--forest)' }}>Candidato®</span>
                </div>

                {/* Small type switch — only shown during registration steps */}
                {phase === 'register' && (
                  <div className="ob-type-switch">
                    <button
                      className={`ob-type-btn${isC ? ' active' : ''}`}
                      onClick={() => { setUserType('candidate'); setCStep(1); setPhase('gate'); setGateEmail('') }}
                    >
                      👤 <span>{t('Soy candidato', "I'm a candidate")}</span>
                    </button>
                    <button
                      className={`ob-type-btn${!isC ? ' active' : ''}`}
                      onClick={() => { setUserType('company'); setCoStep(1); setPhase('gate'); setGateEmail('') }}
                    >
                      🏢 <span>{t('Soy empresa', "I'm a company")}</span>
                    </button>
                  </div>
                )}

                {/* ── GATE: role cards + email ── */}
                {phase === 'gate' && (
                  <div className="ob-gate">
                    <p className="ob-gate-eyebrow">Candidato®</p>
                    <h2 className="ob-gate-title">
                      {t('¿Cómo querés usar Candidato?', 'How do you want to use Candidato?')}
                    </h2>
                    <p className="ob-gate-sub">
                      {t('Elegí tu perfil para continuar.', 'Choose your profile to continue.')}
                    </p>

                    <div className="ob-role-cards-wrap">
                      <div className="ob-role-cards">
                        <button
                          className={`ob-role-card${isC ? ' active' : ''}`}
                          onClick={() => { setUserType('candidate'); setGateEmail('') }}
                        >
                          <div className="ob-role-ico-wrap">👤</div>
                          <div className="ob-role-body">
                            <div className="ob-role-title">{t('Soy candidato', "I'm a candidate")}</div>
                            <div className="ob-role-desc">{t('Encontrá trabajo con IA · Gratis', 'Find jobs with AI · Free')}</div>
                          </div>
                          <div className={`ob-role-dot${isC ? ' on' : ''}`}></div>
                        </button>
                        <button
                          className={`ob-role-card${!isC ? ' active' : ''}`}
                          onClick={() => { setUserType('company'); setGateEmail('') }}
                        >
                          <div className="ob-role-ico-wrap">🏢</div>
                          <div className="ob-role-body">
                            <div className="ob-role-title">{t('Soy empresa', "I'm a company")}</div>
                            <div className="ob-role-desc">{t('Top 1% del talento colombiano', 'Top 1% Colombian talent')}</div>
                          </div>
                          <div className={`ob-role-dot${!isC ? ' on' : ''}`}></div>
                        </button>
                      </div>
                    </div>

                    <div className="ob-gate-divider">
                      <span>{t('Tu email para continuar', 'Your email to continue')}</span>
                    </div>

                    <div className="form-grid">
                      <div className="fg fg-full">
                        <input
                          type="email"
                          value={gateEmail}
                          onChange={(e) => setGateEmail(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') checkEmailExists() }}
                          placeholder={isC ? t('daniela@email.com', 'jane@email.com') : t('ana@empresa.com', 'ana@company.com')}
                          className="ob-gate-input"
                        />
                      </div>
                      <div className="fg fg-full">
                        <button className="submit-btn" disabled={gateLoading} onClick={checkEmailExists}>
                          {gateLoading ? t('Verificando…', 'Checking…') : t('Continuar →', 'Continue →')}
                        </button>
                      </div>
                    </div>
                    <p className="ob-gate-hint">
                      {t('Si ya tenés cuenta accedés directo. Si no, te registramos en 3 minutos.', "Already have an account? You'll go straight in. New? We'll register you in 3 minutes.")}
                    </p>
                  </div>
                )}

                {/* ── WELCOME BACK ── */}
                {phase === 'welcome' && (
                  <div className="ob-gate ob-gate-center">
                    <div className="ob-welcome-avatar">{foundName?.[0]?.toUpperCase() || '?'}</div>
                    <div className="ob-welcome-label">{t('Bienvenido/a de vuelta', 'Welcome back')}</div>
                    <h2 className="ob-gate-title" style={{ textAlign: 'center', marginTop: '.2rem' }}>
                      {foundName.split(' ')[0]}
                    </h2>
                    <p className="ob-gate-sub" style={{ textAlign: 'center', marginBottom: '1.6rem' }}>{gateEmail}</p>
                    <button className="submit-btn" onClick={() => enterApp({ name: foundName, email: gateEmail, type: userType })}>
                      {t('Ir a mi panel →', 'Go to my dashboard →')}
                    </button>
                    <div className="ob-divider-thin"></div>
                    <p className="ob-gate-hint" style={{ marginTop: 0 }}>
                      {t('¿No sos vos?', 'Not you?')}
                    </p>
                    <button
                      onClick={() => { setCurrentUser(null); if (userType === 'candidate') setCem(gateEmail); else setCoem(gateEmail); setPhase('register') }}
                      className="ob-notme-btn"
                    >
                      {t('Crear cuenta nueva con este email', 'Create new account with this email')}
                    </button>
                    <button onClick={() => { setPhase('gate'); setGateEmail('') }} className="ob-notme-btn">
                      {t('← Usar otro email', '← Use a different email')}
                    </button>
                  </div>
                )}

                {/* ── VERIFY EMAIL ── */}
                {phase === 'verify' && (
                  <div className="ob-gate ob-gate-center">
                    <div className="ob-verify-ico">✉</div>
                    <h2 className="ob-gate-title" style={{ textAlign: 'center', marginTop: '.6rem' }}>
                      {t('Verificá tu email', 'Verify your email')}
                    </h2>
                    <p className="ob-gate-sub" style={{ textAlign: 'center' }}>
                      {t(`Enviamos un enlace de activación a`, `We sent an activation link to`)}
                      <br />
                      <strong>{currentUser?.email}</strong>
                    </p>
                    <div className="ob-verify-steps">
                      <div className="ob-verify-step">
                        <span className="ob-vstep-num">1</span>
                        <span>{t('Abrí tu bandeja de entrada', 'Open your inbox')}</span>
                      </div>
                      <div className="ob-verify-step">
                        <span className="ob-vstep-num">2</span>
                        <span>{t('Buscá el email de Candidato®', 'Look for the email from Candidato®')}</span>
                      </div>
                      <div className="ob-verify-step">
                        <span className="ob-vstep-num">3</span>
                        <span>{t('Hacé clic en "Activar cuenta"', 'Click "Activate account"')}</span>
                      </div>
                    </div>
                    <button className="submit-btn" style={{ marginTop: '1.4rem' }} onClick={() => { goToApp() }}>
                      {t('Ya verifiqué — ir a mi panel →', 'I verified — go to my dashboard →')}
                    </button>
                    <p className="ob-gate-hint">
                      {t('¿No llegó? Revisá la carpeta de spam.', "Didn't arrive? Check your spam folder.")}
                    </p>
                  </div>
                )}

                {/* ── REGISTER: multi-step form ── */}
                {phase === 'register' && <>

                <div className="ob-steps">
                  {(isC
                    ? [t('Tu perfil', 'Your profile'), t('Experiencia', 'Experience'), t('Habilidades', 'Skills')]
                    : [t('Tu empresa', 'Your company'), t('Tu vacante', 'Your listing')]
                  ).map((label, i) => (
                    <div key={i} className={`ob-step ${i + 1 < current ? 'done' : i + 1 === current ? 'active' : ''}`}>
                      <div className="ob-step-num">{i + 1 < current ? '✓' : i + 1}</div>
                      <span className="ob-step-lbl">{label}</span>
                    </div>
                  ))}
                </div>

                {isC ? (
                  <div>
                    {cStep === 1 && (
                      <div>
                        <div className="ob-form-title">{t('Sobre vos', 'About you')}</div>
                        <div className="ob-form-sub">{gateEmail} · {t('Gratis · 3 minutos', 'Free · 3 minutes')}</div>
                        <div className="form-grid">
                          <div className="fg">
                            <label>{t('Nombre *', 'First name *')}</label>
                            <input type="text" value={cfn} onChange={(e) => setCfn(e.target.value)} placeholder={t('Daniela', 'Jane')} autoFocus />
                          </div>
                          <div className="fg">
                            <label>{t('Apellido *', 'Last name *')}</label>
                            <input type="text" value={cln} onChange={(e) => setCln(e.target.value)} placeholder={t('Martínez', 'Smith')} />
                          </div>
                          <div className="fg">
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
                          <div className="fg fg-full">
                            <label>{t('Modalidad preferida', 'Preferred work mode')}</label>
                            <select value={cmo} onChange={(e) => setCmo(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
                              <option>{t('Presencial', 'On-site')}</option>
                              <option>{t('Remoto', 'Remote')}</option>
                              <option>{t('Híbrido', 'Hybrid')}</option>
                            </select>
                          </div>
                          <div className="fg fg-full" style={{ marginTop: '.4rem' }}>
                            <button className="submit-btn" onClick={() => nextCStep(2)}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {cStep === 2 && (
                      <div>
                        <div className="ob-form-title">{t('Tu experiencia', 'Your experience')}</div>
                        <div className="ob-form-sub">{t('Esto define qué matches te enviamos.', 'This defines which matches we send you.')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Área profesional *', 'Professional area *')}</label>
                            <select value={car} onChange={(e) => setCar(e.target.value)}>
                              <option value="" disabled>{t('Seleccioná tu área', 'Select your area')}</option>
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
                            <label>{t('Experiencia', 'Experience')}</label>
                            <select value={cex} onChange={(e) => setCex(e.target.value)}>
                              <option value="" disabled>{t('Años', 'Years')}</option>
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
                              <option value="" disabled>{t('Mensual', 'Monthly')}</option>
                              <option>Hasta $2M</option><option>$2M–$4M</option>
                              <option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
                            </select>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('LinkedIn', 'LinkedIn')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <input type="url" value={cli} onChange={(e) => setCli(e.target.value)} placeholder="linkedin.com/in/tu-perfil" />
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.6rem', marginTop: '.4rem', alignItems: 'center' }}>
                            <button className="ob-back-link" onClick={() => nextCStep(1)}>{t('← Atrás', '← Back')}</button>
                            <button className="submit-btn" onClick={() => nextCStep(3)} style={{ flex: 1, marginTop: 0 }}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {cStep === 3 && (
                      <div>
                        <div className="ob-form-title">{t('¿Qué sabés hacer?', 'What are you good at?')}</div>
                        <div className="ob-form-sub">{t('Agregá tus principales habilidades para mejorar tus matches.', 'Add your main skills to improve your matches.')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Habilidades', 'Skills')}</label>
                            <div className="skill-row">
                              <input type="text" value={cSkInput} onChange={(e) => setCSkInput(e.target.value)} onKeyDown={onSkKey('c')} placeholder="React, Excel, Photoshop…" />
                              <button className="add-sk-btn" onClick={() => addSkill('c')}>+</button>
                            </div>
                            {cSkills.length > 0 && (
                              <div className="sk-tags">
                                {cSkills.map((s) => (
                                  <span key={s} className="sk-tag" onClick={() => removeSkill('c', s)}>{s} ×</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Nota', 'Note')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <textarea value={cnote} onChange={(e) => setCnote(e.target.value)} placeholder={t('¿Qué tipo de empresa buscás? ¿Algún detalle importante sobre tu búsqueda?', 'What type of company are you looking for?')} rows={3} />
                          </div>
                          <div className="fg fg-full">
                            <label>{t('CV / Hoja de vida', 'CV / Resume')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <label className={`cv-upload-area${cvName ? ' has-file' : ''}`}>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) { setCvFile(f); setCvName(f.name) }
                                }}
                              />
                              {cvName ? (
                                <div className="cv-file-info">
                                  <span className="cv-file-ico">↑</span>
                                  <span className="cv-file-name">{cvName}</span>
                                  <button
                                    type="button"
                                    className="cv-file-remove"
                                    onClick={(e) => { e.preventDefault(); setCvFile(null); setCvName('') }}
                                  >×</button>
                                </div>
                              ) : (
                                <div className="cv-upload-inner">
                                  <span className="cv-upload-arrow">↑</span>
                                  <span className="cv-upload-text">{t('Adjuntar CV', 'Attach CV')}</span>
                                  <span className="cv-upload-hint">PDF, DOC · {t('Máx 5MB', 'Max 5MB')}</span>
                                </div>
                              )}
                            </label>
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.6rem', marginTop: '.4rem', alignItems: 'center' }}>
                            <button className="ob-back-link" onClick={() => nextCStep(2)}>{t('← Atrás', '← Back')}</button>
                            <button className="submit-btn" disabled={submitting || cvUploading} onClick={submitCandidate} style={{ flex: 1, marginTop: 0 }}>
                              {cvUploading ? t('Subiendo CV…', 'Uploading CV…') : submitting ? t('Guardando…', 'Saving…') : t('Crear mi perfil →', 'Create my profile →')}
                            </button>
                          </div>
                          <div className="fg fg-full">
                            <p style={{ fontSize: '.64rem', color: 'var(--ink-45)', textAlign: 'center' }}>
                              {t('Al registrarte aceptás los términos. Recibirás un email de verificación.', 'By signing up you accept the terms. You\'ll receive a verification email.')}
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
                        <div className="ob-form-title">{t('Tu empresa', 'Your company')}</div>
                        <div className="ob-form-sub">{gateEmail} · {t('Top 1% del talento colombiano', 'Top 1% Colombian talent')}</div>
                        <div className="form-grid">
                          <div className="fg">
                            <label>{t('Nombre *', 'First name *')}</label>
                            <input type="text" value={cofn} onChange={(e) => setCofn(e.target.value)} placeholder={t('Ana', 'Ana')} autoFocus />
                          </div>
                          <div className="fg">
                            <label>{t('Apellido *', 'Last name *')}</label>
                            <input type="text" value={coln} onChange={(e) => setColn(e.target.value)} placeholder={t('García', 'Garcia')} />
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
                          <div className="fg fg-full" style={{ marginTop: '.4rem' }}>
                            <button className="submit-btn" onClick={() => nextCoStep(2)}>
                              {t('Continuar →', 'Continue →')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {coStep === 2 && (
                      <div>
                        <div className="ob-form-title">{t('Tu primera vacante', 'Your first listing')}</div>
                        <div className="ob-form-sub">{t('El algoritmo buscará los mejores candidatos automáticamente.', 'The algorithm will find the best candidates automatically.')}</div>
                        <div className="form-grid">
                          <div className="fg fg-full">
                            <label>{t('Cargo *', 'Job title *')}</label>
                            <input type="text" value={jobtitle} onChange={(e) => setJobtitle(e.target.value)} placeholder="Senior UX Designer" autoFocus />
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
                          <div className="fg fg-full">
                            <label>{t('Salario mensual', 'Monthly salary')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <select value={jobsal} onChange={(e) => setJobsal(e.target.value)}>
                              <option value="" disabled>{t('Rango', 'Range')}</option>
                              <option>Hasta $2M</option><option>$2M–$4M</option>
                              <option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
                            </select>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Habilidades requeridas', 'Required skills')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <div className="skill-row">
                              <input type="text" value={coSkInput} onChange={(e) => setCoSkInput(e.target.value)} onKeyDown={onSkKey('co')} placeholder="Figma, React, Python…" />
                              <button className="add-sk-btn" onClick={() => addSkill('co')}>+</button>
                            </div>
                            {coSkills.length > 0 && (
                              <div className="sk-tags">
                                {coSkills.map((s) => (
                                  <span key={s} className="sk-tag" onClick={() => removeSkill('co', s)}>{s} ×</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Descripción', 'Description')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <textarea value={jobdesc} onChange={(e) => setJobdesc(e.target.value)} placeholder={t('¿Qué hace este rol? ¿Qué buscás en el candidato ideal?', 'What does this role do? What are you looking for in the ideal candidate?')} rows={3} />
                          </div>
                          <div className="fg fg-full" style={{ display: 'flex', gap: '.6rem', marginTop: '.4rem', alignItems: 'center' }}>
                            <button className="ob-back-link" onClick={() => nextCoStep(1)}>{t('← Atrás', '← Back')}</button>
                            <button
                              className="submit-btn"
                              disabled={submitting}
                              onClick={submitCompany}
                              style={{ flex: 1, marginTop: 0 }}
                            >
                              {submitting ? t('Guardando…', 'Saving…') : t('Publicar vacante →', 'Post listing →')}
                            </button>
                          </div>
                          <div className="fg fg-full">
                            <p style={{ fontSize: '.64rem', color: 'var(--ink-45)', textAlign: 'center' }}>
                              {t('Al registrarte aceptás los términos. Sin spam, sin compromisos.', 'By signing up you accept the terms. No spam, no commitments.')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                </>}
              </div>{/* onboard-right-inner */}
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
                <button className={`tab-btn${candView === 'dashboard' ? ' active' : ''}`} onClick={() => setCandView('dashboard')}>
                  Dashboard
                </button>
                <button className={`tab-btn${candView === 'jobs' ? ' active' : ''}`} onClick={() => { setCandView('jobs'); loadJobs() }}>
                  {t('Buscar trabajo', 'Find jobs')}
                </button>
                <button className={`tab-btn${candView === 'profile' ? ' active' : ''}`} onClick={() => setCandView('profile')}>
                  {t('Mi perfil', 'Profile')}
                </button>
              </>
            ) : (
              <>
                <button className={`tab-btn${compView === 'codashboard' ? ' active' : ''}`} onClick={() => setCompView('codashboard')}>
                  Dashboard
                </button>
                <button className={`tab-btn${compView === 'talent' ? ' active' : ''}`} onClick={() => { setCompView('talent'); loadCandidates() }}>
                  {t('Candidatos', 'Candidates')}
                </button>
                <button className={`tab-btn${compView === 'post' ? ' active' : ''}`} onClick={() => setCompView('post')}>
                  {t('Publicar vacante', 'Post listing')}
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
            <div
              className="user-ava"
              style={{ cursor: 'pointer' }}
              onClick={() => isC ? setCandView('profile') : undefined}
              title={name}
            >
              {name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </nav>

        <div className="app-shell">
          <aside className="sidebar">
            {isC ? (
              <>
                <span className="sidebar-lbl">{t('Mi espacio', 'My space')}</span>
                <button className={`nav-item${candView === 'dashboard' ? ' active' : ''}`} onClick={() => setCandView('dashboard')}>
                  Dashboard
                </button>
                <button className={`nav-item${candView === 'jobs' ? ' active' : ''}`} onClick={() => { setCandView('jobs'); loadJobs() }}>
                  {t('Buscar trabajo', 'Find jobs')}
                </button>
                <span className="sidebar-lbl" style={{ marginTop: '1.2rem' }}>{t('Mi cuenta', 'My account')}</span>
                <button className={`nav-item${candView === 'profile' ? ' active' : ''}`} onClick={() => setCandView('profile')}>
                  {t('Mi perfil', 'My profile')}
                </button>
                <button className={`nav-item${candView === 'settings' ? ' active' : ''}`} onClick={() => setCandView('settings')}>
                  {t('Configuración', 'Settings')}
                </button>
                <div className="sidebar-spacer"></div>
                <button className="nav-item nav-item-logout" onClick={logout}>{t('Salir', 'Log out')}</button>
              </>
            ) : (
              <>
                <span className="sidebar-lbl">{t('Mi empresa', 'My company')}</span>
                <button className={`nav-item${compView === 'codashboard' ? ' active' : ''}`} onClick={() => setCompView('codashboard')}>
                  Dashboard
                </button>
                <button className={`nav-item${compView === 'talent' ? ' active' : ''}`} onClick={() => { setCompView('talent'); loadCandidates() }}>
                  {t('Candidatos', 'Candidates')}
                </button>
                <button className={`nav-item${compView === 'post' ? ' active' : ''}`} onClick={() => setCompView('post')}>
                  {t('Publicar vacante', 'Post listing')}
                </button>
                <div className="sidebar-spacer"></div>
                <button className="nav-item nav-item-logout" onClick={logout}>{t('Salir', 'Log out')}</button>
              </>
            )}
          </aside>

          <main className="main">
            {isC ? (
              <CandidateView
                view={candView}
                firstName={firstName}
                skills={cSkills}
                user={currentUser}
                jobs={jobs}
                dataLoading={dataLoading}
                loadJobs={loadJobs}
                setView={setCandView}
                t={t}
              />
            ) : (
              <CompanyView
                view={compView}
                coName={coName}
                userEmail={currentUser?.email || ''}
                candidates={candidates}
                loadCandidates={loadCandidates}
                setView={setCompView}
                t={t}
              />
            )}
          </main>
        </div>

        {/* Mobile bottom nav — visible only on ≤900px */}
        {isC ? (
          <nav className="mobile-nav">
            <button className={`mobile-nav-btn${candView === 'dashboard' ? ' active' : ''}`} onClick={() => setCandView('dashboard')}>
              <span className="mobile-nav-ico">⊞</span>Dashboard
            </button>
            <button className={`mobile-nav-btn${candView === 'jobs' ? ' active' : ''}`} onClick={() => { setCandView('jobs'); loadJobs() }}>
              <span className="mobile-nav-ico">⌕</span>{t('Empleos', 'Jobs')}
            </button>
            <button className={`mobile-nav-btn${candView === 'profile' ? ' active' : ''}`} onClick={() => setCandView('profile')}>
              <span className="mobile-nav-ico">◯</span>{t('Perfil', 'Profile')}
            </button>
            <button className={`mobile-nav-btn${candView === 'settings' ? ' active' : ''}`} onClick={() => setCandView('settings')}>
              <span className="mobile-nav-ico">⚙</span>{t('Config.', 'Settings')}
            </button>
            <button className="mobile-nav-btn" onClick={logout}>
              <span className="mobile-nav-ico">←</span>{t('Salir', 'Out')}
            </button>
          </nav>
        ) : (
          <nav className="mobile-nav">
            <button className={`mobile-nav-btn${compView === 'codashboard' ? ' active' : ''}`} onClick={() => setCompView('codashboard')}>
              <span className="mobile-nav-ico">⊞</span>Dashboard
            </button>
            <button className={`mobile-nav-btn${compView === 'talent' ? ' active' : ''}`} onClick={() => { setCompView('talent'); loadCandidates() }}>
              <span className="mobile-nav-ico">◉</span>{t('Talentos', 'Talent')}
            </button>
            <button className={`mobile-nav-btn${compView === 'post' ? ' active' : ''}`} onClick={() => setCompView('post')}>
              <span className="mobile-nav-ico">＋</span>{t('Publicar', 'Post')}
            </button>
            <button className="mobile-nav-btn" onClick={logout}>
              <span className="mobile-nav-ico">←</span>{t('Salir', 'Out')}
            </button>
          </nav>
        )}

        <div className="status-bar">
          <span>
            {isC
              ? t('Tu perfil está activo · Recibirás matches por email', 'Your profile is active · You\'ll receive matches by email')
              : `${coName} · ${t('Vacante activa', 'Job listing active')}`}
          </span>
          <span className="sb-ai">
            {isC
              ? t(`IA analizando ${jobs.length || '…'} vacantes`, `AI analysing ${jobs.length || '…'} listings`)
              : t(`${candidates.length || '…'} candidatos en el pool`, `${candidates.length || '…'} candidates in pool`)}
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
  view, firstName, skills, user, jobs, dataLoading, loadJobs, setView, t,
}: {
  view: CandView
  firstName: string
  skills: string[]
  user: CurrentUser | null
  jobs: Job[]
  dataLoading: boolean
  loadJobs: (q?: string, area?: string, city?: string, mod?: string) => void
  setView: (v: CandView) => void
  t: (es: string, en: string) => string
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterMod, setFilterMod] = useState('')

  const doSearch = () => loadJobs(query, filterArea, filterCity, filterMod)

  if (view === 'dashboard')
    return (
      <>
        <div className="page-head">
          <div className="page-title">{t(`Hola, ${firstName}`, `Hi, ${firstName}`)}</div>
          <div className="page-sub">{t('Vacantes disponibles para tu perfil', 'Job listings available for your profile')}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-label">{t('Vacantes activas', 'Active listings')}</div>
            <div className="card-big-num">{jobs.length || '—'}</div>
            <button className="btn btn-forest btn-sm" style={{ marginTop: '.8rem' }} onClick={() => { setView('jobs'); loadJobs() }}>
              {t('Ver todas →', 'View all →')}
            </button>
          </div>
          <div className="card">
            <div className="card-label">{t('Tu perfil', 'Your profile')}</div>
            <div style={{ fontSize: '.82rem', color: 'var(--ink-70)', marginTop: '.4rem', lineHeight: 1.6 }}>
              <div><strong>{t('Nombre:', 'Name:')}</strong> {user?.name || '—'}</div>
              <div><strong>Email:</strong> {user?.email || '—'}</div>
              {skills.length > 0 && <div><strong>{t('Habilidades:', 'Skills:')}</strong> {skills.slice(0, 3).join(', ')}</div>}
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.8rem' }} onClick={() => setView('profile')}>
              {t('Ver perfil →', 'View profile →')}
            </button>
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="card">
            <div className="card-section-title">{t('Vacantes recientes', 'Recent listings')}</div>
            <div className="jobs-list" style={{ marginTop: '.75rem' }}>
              {jobs.slice(0, 5).map((j) => (
                <JobRow key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}

        {jobs.length === 0 && !dataLoading && (
          <div className="empty-state">
            <div className="empty-title">{t('Aún no hay vacantes publicadas', 'No job listings yet')}</div>
            <div className="empty-sub">{t('Las empresas que se registren podrán publicar sus vacantes aquí.', 'Companies that register will be able to post their listings here.')}</div>
          </div>
        )}
      </>
    )

  if (view === 'jobs')
    return (
      <>
        <div className="page-head">
          <div className="page-title">{t('Buscar trabajo', 'Find jobs')}</div>
          <div className="page-sub">{t(`${jobs.length} vacante${jobs.length !== 1 ? 's' : ''} disponible${jobs.length !== 1 ? 's' : ''}`, `${jobs.length} listing${jobs.length !== 1 ? 's' : ''} available`)}</div>
        </div>

        <div className="search-wrap" style={{ marginBottom: '1rem' }}>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder={t('Cargo o palabra clave…', 'Job title or keyword…')}
          />
          <select className="filter-select" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="">{t('Área', 'Area')}</option>
            <option>{t('Tecnología / IT', 'Technology / IT')}</option>
            <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
            <option>{t('Marketing y Comunicaciones', 'Marketing & Comms')}</option>
            <option>{t('Ventas y Comercial', 'Sales & Business Dev')}</option>
            <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
            <option>{t('Recursos Humanos', 'Human Resources')}</option>
            <option>{t('Operaciones', 'Operations')}</option>
          </select>
          <select className="filter-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="">{t('Ciudad', 'City')}</option>
            <option>Cali</option><option>Bogotá</option><option>Medellín</option><option>Barranquilla</option>
          </select>
          <select className="filter-select" value={filterMod} onChange={e => setFilterMod(e.target.value)}>
            <option value="">{t('Modalidad', 'Mode')}</option>
            <option>{t('Presencial', 'On-site')}</option>
            <option>{t('Remoto', 'Remote')}</option>
            <option>{t('Híbrido', 'Hybrid')}</option>
          </select>
          <button className="btn btn-forest btn-sm" onClick={doSearch} disabled={dataLoading}>
            {dataLoading ? t('Buscando…', 'Searching…') : t('Buscar', 'Search')}
          </button>
        </div>

        {dataLoading && <div className="loading-state">{t('Cargando vacantes…', 'Loading listings…')}</div>}

        {!dataLoading && jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">{t('Sin resultados', 'No results')}</div>
            <div className="empty-sub">{t('Intentá con otros filtros.', 'Try different filters.')}</div>
          </div>
        )}

        {!dataLoading && jobs.length > 0 && (
          <div className="jobs-list">
            {jobs.map(j => <JobRow key={j.id} job={j} />)}
          </div>
        )}
      </>
    )

  if (view === 'profile')
    return (
      <>
        <div className="page-head">
          <div className="page-title">{t('Mi perfil', 'My profile')}</div>
          <div className="page-sub">{t('Tu información registrada en Candidato', 'Your information registered with Candidato')}</div>
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="profile-row"><span className="profile-lbl">{t('Nombre', 'Name')}</span><span>{user?.name || '—'}</span></div>
          <div className="profile-row"><span className="profile-lbl">Email</span><span>{user?.email || '—'}</span></div>
          {skills.length > 0 && (
            <div className="profile-row" style={{ alignItems: 'flex-start' }}>
              <span className="profile-lbl">{t('Habilidades', 'Skills')}</span>
              <div className="sk-tags" style={{ margin: 0 }}>
                {skills.map(s => <span key={s} className="sk-tag">{s}</span>)}
              </div>
            </div>
          )}
          <p style={{ fontSize: '.75rem', color: 'var(--ink-45)', marginTop: '1.2rem' }}>
            {t('Para actualizar tu perfil o CV, escribinos a hola@candidato.com.co', 'To update your profile or CV, email us at hola@candidato.com.co')}
          </p>
        </div>
      </>
    )

  // settings
  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Configuración', 'Settings')}</div>
        <div className="page-sub">{t('Preferencias de tu cuenta', 'Account preferences')}</div>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="settings-section-title">{t('Cuenta', 'Account')}</div>
        <div className="profile-row"><span className="profile-lbl">Email</span><span>{user?.email || '—'}</span></div>
        <div className="profile-row"><span className="profile-lbl">{t('Nombre', 'Name')}</span><span>{user?.name || '—'}</span></div>
        <div className="settings-section-title" style={{ marginTop: '1.4rem' }}>{t('Notificaciones', 'Notifications')}</div>
        <div className="profile-row">
          <span className="profile-lbl">{t('Matches por email', 'Email matches')}</span>
          <span className="settings-badge on">{t('Activo', 'Active')}</span>
        </div>
        <div className="profile-row">
          <span className="profile-lbl">{t('Actualizaciones', 'Updates')}</span>
          <span className="settings-badge on">{t('Activo', 'Active')}</span>
        </div>
        <div className="settings-section-title" style={{ marginTop: '1.4rem' }}>{t('Privacidad', 'Privacy')}</div>
        <div className="profile-row">
          <span className="profile-lbl">{t('Perfil visible', 'Profile visible')}</span>
          <span className="settings-badge on">{t('Sí', 'Yes')}</span>
        </div>
        <p style={{ fontSize: '.74rem', color: 'var(--ink-45)', marginTop: '1.4rem', lineHeight: 1.6 }}>
          {t('Para modificar estas preferencias o eliminar tu cuenta, escribinos a', 'To modify these preferences or delete your account, email us at')}{' '}
          <a href="mailto:hola@candidato.com.co" style={{ color: 'var(--forest)' }}>hola@candidato.com.co</a>
        </p>
      </div>
    </>
  )
}

function JobRow({ job }: { job: Job }) {
  const coName = job.companies?.company_name || '—'
  const tags = [job.modality, job.city, job.salary_range].filter(Boolean)
  return (
    <div className="job-card">
      <div className="jc-ava">{initials(coName)}</div>
      <div className="jc-body">
        <div className="jc-title">{job.title}</div>
        <div className="jc-meta">{coName}{job.area ? ` · ${job.area}` : ''}</div>
        {tags.length > 0 && (
          <div className="jc-tags">
            {tags.map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
          </div>
        )}
      </div>
      <div className="jc-right">
        <span className="jc-time">{timeAgo(job.created_at)}</span>
      </div>
    </div>
  )
}

function CompanyView({
  view, coName, userEmail, candidates, loadCandidates, setView, t,
}: {
  view: CompView
  coName: string
  userEmail: string
  candidates: Candidate[]
  loadCandidates: (q?: string, area?: string) => void
  setView: (v: CompView) => void
  t: (es: string, en: string) => string
}) {
  if (view === 'codashboard')
    return (
      <>
        <div className="page-head">
          <div className="page-title">{coName}</div>
          <div className="page-sub">{t('Panel de reclutamiento', 'Recruitment dashboard')}</div>
          <div className="page-actions">
            <button className="btn btn-forest btn-sm" onClick={() => setView('post')}>
              {t('Publicar vacante', 'Post a listing')}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setView('talent'); loadCandidates() }}>
              {t('Ver candidatos →', 'View candidates →')}
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="card-label">{t('Candidatos en el pool', 'Candidates in pool')}</div>
            <div className="card-big-num">{candidates.length || '—'}</div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.8rem' }} onClick={() => { setView('talent'); loadCandidates() }}>
              {t('Ver todos →', 'View all →')}
            </button>
          </div>
          <div className="card">
            <div className="card-label">{t('Tu empresa', 'Your company')}</div>
            <div style={{ fontSize: '.82rem', color: 'var(--ink-70)', marginTop: '.4rem', lineHeight: 1.7 }}>
              <div><strong>{t('Empresa:', 'Company:')}</strong> {coName}</div>
              <div><strong>Email:</strong> {userEmail}</div>
            </div>
            <button className="btn btn-forest btn-sm" style={{ marginTop: '.8rem' }} onClick={() => setView('post')}>
              {t('Nueva vacante →', 'New listing →')}
            </button>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-section-title">{t('Candidatos recientes', 'Recent candidates')}</div>
            <div className="cand-list" style={{ marginTop: '.75rem' }}>
              {candidates.slice(0, 4).map(c => <CandRow key={c.id} c={c} />)}
            </div>
          </div>
        )}
      </>
    )

  if (view === 'talent')
    return <TalentView candidates={candidates} loadCandidates={loadCandidates} t={t} />

  if (view === 'post')
    return <PostJobView userEmail={userEmail} onSuccess={() => setView('codashboard')} t={t} />

  return null
}

function TalentView({ candidates, loadCandidates, t }: {
  candidates: Candidate[]
  loadCandidates: (q?: string, area?: string) => void
  t: (es: string, en: string) => string
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const doSearch = () => loadCandidates(query, filterArea)

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Candidatos', 'Candidates')}</div>
        <div className="page-sub">{t(`${candidates.length} perfil${candidates.length !== 1 ? 'es' : ''} disponible${candidates.length !== 1 ? 's' : ''}`, `${candidates.length} profile${candidates.length !== 1 ? 's' : ''} available`)}</div>
      </div>

      <div className="search-wrap" style={{ marginBottom: '1rem' }}>
        <input
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder={t('Nombre del candidato…', 'Candidate name…')}
        />
        <select className="filter-select" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">{t('Área', 'Area')}</option>
          <option>{t('Tecnología / IT', 'Technology / IT')}</option>
          <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
          <option>{t('Marketing y Comunicaciones', 'Marketing & Comms')}</option>
          <option>{t('Ventas y Comercial', 'Sales & Business Dev')}</option>
          <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
          <option>{t('Recursos Humanos', 'Human Resources')}</option>
          <option>{t('Operaciones', 'Operations')}</option>
        </select>
        <button className="btn btn-forest btn-sm" onClick={doSearch}>{t('Buscar', 'Search')}</button>
      </div>

      {candidates.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{t('Sin candidatos registrados', 'No candidates registered')}</div>
          <div className="empty-sub">{t('Los candidatos aparecerán aquí una vez se registren.', 'Candidates will appear here once they register.')}</div>
        </div>
      )}

      <div className="cand-list">
        {candidates.map(c => <CandRow key={c.id} c={c} />)}
      </div>
    </>
  )
}

function CandRow({ c }: { c: Candidate }) {
  const tags = [c.area, c.experience, c.city, c.modality].filter(Boolean)
  return (
    <div className="cand-card-row">
      <div className="jc-ava">{initials(c.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="jc-title">{c.name}</div>
        {tags.length > 0 && (
          <div className="jc-tags" style={{ marginTop: '.25rem' }}>
            {tags.map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
          </div>
        )}
        {c.skills && c.skills.length > 0 && (
          <div className="jc-tags" style={{ marginTop: '.2rem' }}>
            {c.skills.slice(0, 4).map(s => <span key={s} className="jc-tag jc-tag-skill">{s}</span>)}
          </div>
        )}
      </div>
      <div className="jc-right">
        <span className="jc-time">{timeAgo(c.created_at)}</span>
        {c.linkedin && (
          <a href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: '.3rem' }}>
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

function PostJobView({ userEmail, onSuccess, t }: {
  userEmail: string
  onSuccess: () => void
  t: (es: string, en: string) => string
}) {
  const [title, setTitle] = useState('')
  const [mod, setMod] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [sal, setSal] = useState('')
  const [desc, setDesc] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const addSk = () => {
    const v = skillInput.trim()
    if (v && !skills.includes(v)) setSkills([...skills, v])
    setSkillInput('')
  }

  async function submit() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const sb = createClient()
      const { data: co } = await sb.from('companies').select('id').eq('email', userEmail).maybeSingle()
      const jobPayload = {
        company_id: co?.id || null,
        title: title.trim(),
        modality: mod,
        city,
        area,
        salary_range: sal,
        description: desc.trim(),
        skills,
        active: true,
      }
      const { error } = await sb.from('jobs').insert([jobPayload])
      if (error) console.warn('[Supabase] jobs insert:', error.message)
    } catch (e) { console.warn(e) }
    setSaving(false)
    setDone(true)
    setTimeout(onSuccess, 1200)
  }

  if (done) return (
    <div className="empty-state" style={{ color: 'var(--forest)' }}>
      <div className="empty-title">{t('Vacante publicada', 'Listing published')}</div>
      <div className="empty-sub">{t('Redirigiendo…', 'Redirecting…')}</div>
    </div>
  )

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Publicar vacante', 'Post a listing')}</div>
        <div className="page-sub">{t('El algoritmo identificará los candidatos más compatibles automáticamente.', 'The algorithm will identify the most compatible candidates automatically.')}</div>
      </div>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="form-grid">
          <div className="fg fg-full">
            <label>{t('Cargo *', 'Job title *')}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior UX Designer" autoFocus />
          </div>
          <div className="fg">
            <label>{t('Modalidad', 'Work mode')}</label>
            <select value={mod} onChange={e => setMod(e.target.value)}>
              <option value="" disabled>{t('Seleccioná', 'Select')}</option>
              <option>{t('Presencial', 'On-site')}</option>
              <option>{t('Remoto', 'Remote')}</option>
              <option>{t('Híbrido', 'Hybrid')}</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Ciudad', 'City')}</label>
            <select value={city} onChange={e => setCity(e.target.value)}>
              <option value="" disabled>{t('Ciudad', 'City')}</option>
              <option>Cali</option><option>Bogotá</option><option>Medellín</option><option>Barranquilla</option><option>{t('Otra', 'Other')}</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Área', 'Area')}</label>
            <select value={area} onChange={e => setArea(e.target.value)}>
              <option value="" disabled>{t('Área', 'Area')}</option>
              <option>{t('Tecnología / IT', 'Technology / IT')}</option>
              <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
              <option>Marketing</option>
              <option>{t('Ventas y Comercial', 'Sales')}</option>
              <option>{t('Finanzas', 'Finance')}</option>
              <option>{t('Recursos Humanos', 'HR')}</option>
              <option>{t('Operaciones', 'Operations')}</option>
              <option>{t('Otra', 'Other')}</option>
            </select>
          </div>
          <div className="fg fg-full">
            <label>{t('Salario mensual', 'Monthly salary')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <select value={sal} onChange={e => setSal(e.target.value)}>
              <option value="" disabled>{t('Rango', 'Range')}</option>
              <option>Hasta $2M</option><option>$2M–$4M</option><option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
            </select>
          </div>
          <div className="fg fg-full">
            <label>{t('Habilidades requeridas', 'Required skills')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <div className="skill-row">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSk()} }} placeholder="Figma, React, Python…" />
              <button className="add-sk-btn" onClick={addSk}>+</button>
            </div>
            {skills.length > 0 && (
              <div className="sk-tags">
                {skills.map(s => <span key={s} className="sk-tag" onClick={() => setSkills(skills.filter(x=>x!==s))}>{s} ×</span>)}
              </div>
            )}
          </div>
          <div className="fg fg-full">
            <label>{t('Descripción', 'Description')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('¿Qué hace este rol? ¿Qué buscás en el candidato ideal?', 'What does this role do? What are you looking for?')} rows={4} />
          </div>
          <div className="fg fg-full">
            <button className="submit-btn" disabled={saving || !title.trim()} onClick={submit}>
              {saving ? t('Publicando…', 'Publishing…') : t('Publicar vacante →', 'Post listing →')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
