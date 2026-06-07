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
  active?: boolean
  created_at?: string
  companies?: { company_name: string }
}

interface Candidate {
  id: string
  name: string
  email?: string
  whatsapp?: string
  area?: string
  experience?: string
  city?: string
  modality?: string
  salary_range?: string
  skills?: string[]
  linkedin?: string
  cv_url?: string
  created_at?: string
}

interface Application {
  id: string
  job_id: string
  candidate_id: string
  status: string
  applied_at: string
  candidates?: {
    id: string
    name: string
    email?: string
    whatsapp?: string
    area?: string
    experience?: string
    city?: string
    modality?: string
    skills?: string[]
    linkedin?: string
    cv_url?: string
  }
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
type CompView = 'codashboard' | 'matches' | 'post' | 'talent' | 'myjobs'

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
  const [candProfile, setCandProfile] = useState<Record<string, unknown> | null>(null)

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
  const [phase, setPhase] = useState<'gate' | 'register' | 'welcome' | 'verify' | 'magic-sent'>('gate')
  const [gateEmail, setGateEmail] = useState('')
  const [gateLoading, setGateLoading] = useState(false)
  const [foundName, setFoundName] = useState('')

  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvName, setCvName] = useState('')
  const [cvUploading, setCvUploading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlType = params.get('type')
    if (urlType === 'company') setUserType('company')

    // After email verification the callback route redirects here with ?verified=1
    // and a live Supabase session — auto-login without requiring the gate again.
    const sb = createClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email) return
      const email = session.user.email
      const { data: cand } = await sb.from('candidates').select('name,email').ilike('email', email).maybeSingle()
      if (cand?.name) {
        if (params.get('verified') === '1') showToast('¡Email verificado!', 'Tu cuenta está activa — bienvenido/a 🎉', '✅')
        enterApp({ name: cand.name, email: cand.email ?? email, type: 'candidate' })
        return
      }
      const { data: comp } = await sb.from('companies').select('name,email,company_name').ilike('email', email).maybeSingle()
      if (comp?.name) {
        if (params.get('verified') === '1') showToast('¡Email verificado!', 'Tu cuenta está activa — bienvenido/a 🎉', '✅')
        enterApp({ name: comp.name, email: comp.email ?? email, type: 'company', companyName: comp.company_name })
      }
    })

    if (params.get('error') === 'verification_failed') {
      showToast('Enlace inválido', 'El enlace expiró. Registrate de nuevo.', '❌')
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3800)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (title: string, sub: string, ico = '✅') =>
    setToast({ ico, title, sub })

  async function loadJobs(query = '', area = '', city = '', mod = '', sal = '') {
    setDataLoading(true)
    try {
      const sb = createClient()
      let q = sb.from('jobs').select('*, companies(company_name)').eq('active', true)
      if (query) q = q.ilike('title', `%${query}%`)
      if (area) q = q.eq('area', area)
      if (city) q = q.eq('city', city)
      if (mod) q = q.eq('modality', mod)
      if (sal) q = q.ilike('salary_range', `%${sal}%`)
      const { data } = await q.order('created_at', { ascending: false }).limit(50)
      setJobs(data || [])
    } catch (e) { console.warn('[Supabase] loadJobs:', e) }
    setDataLoading(false)
  }

  async function loadCandidates(query = '', area = '', city = '', modality = '', salary = '') {
    try {
      const sb = createClient()
      let q = sb.from('candidates').select('id,name,email,whatsapp,area,experience,city,modality,salary_range,skills,linkedin,cv_url,created_at')
      if (query) q = q.ilike('name', `%${query}%`)
      if (area) q = q.eq('area', area)
      if (city) q = q.eq('city', city)
      if (modality) q = q.eq('modality', modality)
      if (salary) q = q.eq('salary_range', salary)
      const { data } = await q.order('created_at', { ascending: false }).limit(100)
      setCandidates(data || [])
    } catch (e) { console.warn('[Supabase] loadCandidates:', e) }
  }

  async function loadProfile(email: string) {
    try {
      const sb = createClient()
      const { data } = await sb.from('candidates').select('*').ilike('email', email).maybeSingle()
      if (data) setCandProfile(data)
    } catch (e) { console.warn('[loadProfile]', e) }
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
    if (user.type === 'candidate') loadProfile(user.email)
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

  async function sendMagicLink() {
    const email = gateEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showToast(t('Email requerido', 'Email required'), t('Ingresá tu email arriba primero.', 'Enter your email above first.'), '⚠️')
      return
    }
    try {
      const sb = createClient()
      await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
      })
      setPhase('magic-sent')
    } catch {
      showToast(t('Error', 'Error'), t('No pudimos enviar el enlace. Intentá de nuevo.', 'Could not send the link. Please try again.'), '❌')
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
                    <button
                      type="button"
                      onClick={sendMagicLink}
                      style={{ background: 'none', border: 'none', color: 'var(--ink-45)', fontSize: '.75rem', cursor: 'pointer', marginTop: '.4rem', textDecoration: 'underline', padding: 0 }}
                    >
                      {t('¿Olvidaste tu acceso? Recibir enlace por email →', 'Forgot your access? Get a login link by email →')}
                    </button>
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

                {/* ── MAGIC LINK SENT ── */}
                {phase === 'magic-sent' && (
                  <div className="ob-gate ob-gate-center">
                    <div className="ob-verify-ico">✉</div>
                    <h2 className="ob-gate-title" style={{ textAlign: 'center', marginTop: '.6rem' }}>
                      {t('Revisá tu email', 'Check your inbox')}
                    </h2>
                    <p className="ob-gate-sub" style={{ textAlign: 'center' }}>
                      {t('Te enviamos un enlace de acceso a', 'We sent a login link to')}
                      <br /><strong>{gateEmail}</strong>
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
                        <span>{t('Hacé clic en "Acceder a mi cuenta"', 'Click "Access my account"')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPhase('gate'); setGateEmail('') }}
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '1.4rem' }}
                    >
                      {t('← Volver', '← Back')}
                    </button>
                    <p className="ob-gate-hint" style={{ marginTop: '.8rem' }}>
                      {t('¿No llegó? Revisá spam o intentá de nuevo.', "Didn't arrive? Check spam or try again.")}
                    </p>
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
          {/* Left zone — tabs */}
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
                <button className={`tab-btn${compView === 'myjobs' ? ' active' : ''}`} onClick={() => setCompView('myjobs')}>
                  {t('Mis vacantes', 'My listings')}
                </button>
                <button className={`tab-btn${compView === 'post' ? ' active' : ''}`} onClick={() => setCompView('post')}>
                  {t('Publicar vacante', 'Post listing')}
                </button>
              </>
            )}
          </div>

          {/* Center zone — logo absolutely centered */}
          <div className="topbar-logo-center">
            <Image
              src="/bird-logo.png"
              alt="Candidato"
              width={26}
              height={26}
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--head)',
                fontWeight: 700,
                fontSize: '.92rem',
                color: 'var(--forest)',
                letterSpacing: '-.02em',
              }}
            >
              Candidato<sup style={{ fontSize: '.55em', fontWeight: 600 }}>®</sup>
            </span>
          </div>

          {/* Right zone */}
          <div className="topbar-right">
            <div className="lang-pill">
              <button className={appLang === 'es' ? 'on' : ''} onClick={() => setAppLang('es')}>ES</button>
              <button className={appLang === 'en' ? 'on' : ''} onClick={() => setAppLang('en')}>EN</button>
            </div>
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
                <button className={`nav-item${compView === 'myjobs' ? ' active' : ''}`} onClick={() => setCompView('myjobs')}>
                  {t('Mis vacantes', 'My listings')}
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
                candProfile={candProfile}
                onProfileUpdate={setCandProfile}
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
  view, firstName, skills, user, candProfile, onProfileUpdate, jobs, dataLoading, loadJobs, setView, t,
}: {
  view: CandView
  firstName: string
  skills: string[]
  user: CurrentUser | null
  candProfile: Record<string, unknown> | null
  onProfileUpdate: (data: Record<string, unknown>) => void
  jobs: Job[]
  dataLoading: boolean
  loadJobs: (q?: string, area?: string, city?: string, mod?: string, sal?: string) => void
  setView: (v: CandView) => void
  t: (es: string, en: string) => string
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterMod, setFilterMod] = useState('')
  const [filterSal, setFilterSal] = useState('')

  // Applications state
  const [myApplied, setMyApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId) return
    createClient()
      .from('applications')
      .select('job_id')
      .eq('candidate_id', candidateId)
      .then(({ data }) => {
        if (data) setMyApplied(new Set(data.map((a: { job_id: string }) => a.job_id)))
      })
  }, [candProfile])

  async function applyToJob(jobId: string) {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId || applying) return
    setApplying(jobId)
    try {
      const sb = createClient()
      const { error } = await sb.from('applications').insert({ job_id: jobId, candidate_id: candidateId, status: 'pending' })
      if (!error) setMyApplied(prev => new Set([...prev, jobId]))
    } catch (e) { console.warn(e) }
    setApplying(null)
  }

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ email: '', phone: '', city: '', modality: '', area: '', experience: '', salary_range: '', linkedin: '', notes: '' })
  const [editSkills, setEditSkills] = useState<string[]>([])
  const [editSkInput, setEditSkInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvDeleting, setCvDeleting] = useState(false)

  const setEdit = (k: string, v: string) => setEditData(prev => ({ ...prev, [k]: v }))

  const doSearch = () => loadJobs(query, filterArea, filterCity, filterMod, filterSal)

  // ── DASHBOARD ──
  if (view === 'dashboard') {
    const newThisWeek = jobs.filter(j => {
      const d = j.created_at ? Date.now() - new Date(j.created_at).getTime() : Infinity
      return d < 7 * 24 * 3600000
    }).length
    const remoteCount = jobs.filter(j => j.modality?.toLowerCase().includes('remot')).length

    return (
      <>
        <div className="page-head">
          <div className="page-title">{t(`Hola, ${firstName}`, `Hi, ${firstName}`)}</div>
          <div className="page-sub">{t('Vacantes disponibles para tu perfil', 'Job listings matched to your profile')}</div>
        </div>

        {/* Stat chips */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.4rem' }}>
          <div className="stat-card">
            <div className="stat-tag">{t('Total vacantes', 'Total listings')}</div>
            <div className="stat-num">{jobs.length || '0'}</div>
            <div className="stat-label">{t('activas ahora', 'active now')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">{t('Nuevas esta semana', 'New this week')}</div>
            <div className="stat-num coral">{newThisWeek}</div>
            <div className="stat-label">{t('publicadas recientemente', 'recently posted')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">{t('Remotas', 'Remote')}</div>
            <div className="stat-num">{remoteCount}</div>
            <div className="stat-label">{t('trabaja desde casa', 'work from anywhere')}</div>
          </div>
        </div>

        {/* Job list */}
        {dataLoading && <div className="loading-state">{t('Cargando vacantes…', 'Loading listings…')}</div>}

        {!dataLoading && jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">{t('Aún no hay vacantes publicadas', 'No listings yet')}</div>
            <div className="empty-sub">{t('Las empresas que se registren podrán publicar sus vacantes aquí.', 'Companies that register will post their listings here.')}</div>
          </div>
        )}

        {!dataLoading && jobs.length > 0 && (
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1rem 1.1rem .5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="card-section-title">{t('Vacantes recientes', 'Recent listings')}</div>
              <button className="btn btn-outline btn-sm" onClick={() => { setView('jobs'); loadJobs() }}>
                {t('Ver todas →', 'View all →')}
              </button>
            </div>
            <div className="jobs-list" style={{ padding: '0 .7rem .7rem' }}>
              {jobs.slice(0, 8).map((j) => (
                <JobRow key={j.id} job={j} applied={myApplied.has(j.id)} onApply={applyToJob} t={t} />
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  // ── BUSCAR TRABAJO ──
  if (view === 'jobs')
    return (
      <>
        <div className="page-head">
          <div className="page-title">{t('Buscar trabajo', 'Find jobs')}</div>
          <div className="page-sub">{t(`${jobs.length} vacante${jobs.length !== 1 ? 's' : ''} disponible${jobs.length !== 1 ? 's' : ''}`, `${jobs.length} listing${jobs.length !== 1 ? 's' : ''} available`)}</div>
        </div>

        {/* Search + filters in one contained row */}
        <div style={{ background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '1rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.75rem' }}>
            <div className="search-wrap" style={{ flex: '0 1 320px', minWidth: 0, margin: 0, border: 'none', background: 'var(--off)', borderRadius: '8px', padding: '.55rem .9rem' }}>
              <input
                className="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder={t('Cargo o keyword…', 'Job title or keyword…')}
                style={{ background: 'transparent' }}
              />
            </div>
            <button className="btn btn-forest" onClick={doSearch} disabled={dataLoading} style={{ padding: '0 1.4rem', borderRadius: '8px', fontSize: '.82rem', flexShrink: 0 }}>
              {dataLoading ? t('Buscando…', 'Searching…') : t('Buscar', 'Search')}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="filter-select" value={filterArea} onChange={e => { setFilterArea(e.target.value); loadJobs(query, e.target.value, filterCity, filterMod, filterSal) }}>
              <option value="">{t('Área', 'Area')}</option>
              <option>{t('Tecnología / IT', 'Technology / IT')}</option>
              <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
              <option>{t('Marketing y Comunicaciones', 'Marketing & Comms')}</option>
              <option>{t('Ventas y Comercial', 'Sales & Business Dev')}</option>
              <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
              <option>{t('Recursos Humanos', 'Human Resources')}</option>
              <option>{t('Operaciones', 'Operations')}</option>
              <option>{t('Producto / Product', 'Product')}</option>
              <option>{t('Legal', 'Legal')}</option>
            </select>
            <select className="filter-select" value={filterCity} onChange={e => { setFilterCity(e.target.value); loadJobs(query, filterArea, e.target.value, filterMod, filterSal) }}>
              <option value="">{t('Ciudad', 'City')}</option>
              <option>Cali</option><option>Bogotá</option><option>Medellín</option>
              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
            </select>
            <select className="filter-select" value={filterMod} onChange={e => { setFilterMod(e.target.value); loadJobs(query, filterArea, filterCity, e.target.value, filterSal) }}>
              <option value="">{t('Modalidad', 'Mode')}</option>
              <option>{t('Presencial', 'On-site')}</option>
              <option>{t('Remoto', 'Remote')}</option>
              <option>{t('Híbrido', 'Hybrid')}</option>
            </select>
            <select className="filter-select" value={filterSal} onChange={e => { setFilterSal(e.target.value); loadJobs(query, filterArea, filterCity, filterMod, e.target.value) }}>
              <option value="">{t('Salario', 'Salary')}</option>
              <option>$1M – $2M</option>
              <option>$2M – $3M</option>
              <option>$3M – $5M</option>
              <option>$5M – $8M</option>
              <option>$8M – $12M</option>
              <option>+$12M</option>
            </select>
            {(filterArea || filterCity || filterMod || filterSal) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setFilterArea(''); setFilterCity(''); setFilterMod(''); setFilterSal(''); loadJobs(query) }}
              >
                {t('Limpiar', 'Clear')}
              </button>
            )}
          </div>
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
            {jobs.map((j) => (
              <JobRow key={j.id} job={j} applied={myApplied.has(j.id)} onApply={applyToJob} t={t} />
            ))}
          </div>
        )}
      </>
    )

  // ── MI PERFIL ──
  if (view === 'profile') {
    const p = candProfile
    const cvUrl = p?.cv_url as string | undefined
    const phone = (p?.whatsapp as string) || ''
    const city = (p?.city as string) || ''
    const modality = (p?.modality as string) || ''
    const area = (p?.area as string) || ''
    const experience = (p?.experience as string) || ''
    const salaryRange = (p?.salary_range as string) || ''
    const linkedin = (p?.linkedin as string) || ''
    const profileSkills = (p?.skills as string[]) || skills
    const notes = (p?.notes as string) || ''

    const startEdit = () => {
      setEditData({ email: user?.email || '', phone, city, modality, area, experience, salary_range: salaryRange, linkedin, notes })
      setEditSkills([...profileSkills])
      setIsEditing(true)
    }

    const cancelEdit = () => { setIsEditing(false); setEditSkInput('') }

    const saveProfile = async () => {
      setSaving(true)
      try {
        const sb = createClient()
        const updates: Record<string, unknown> = {}
        if (editData.phone) updates.whatsapp = editData.phone
        if (editData.city) updates.city = editData.city
        if (editData.modality) updates.modality = editData.modality
        if (editData.area) updates.area = editData.area
        if (editData.experience) updates.experience = editData.experience
        if (editData.salary_range) updates.salary_range = editData.salary_range
        if (editData.linkedin) updates.linkedin = editData.linkedin
        if (editData.notes) updates.notes = editData.notes
        if (editSkills.length > 0) updates.skills = editSkills
        const emailChanged = editData.email.trim() && editData.email.trim().toLowerCase() !== (user?.email || '').toLowerCase()
        if (emailChanged) updates.email = editData.email.trim().toLowerCase()
        const { data, error } = await sb.from('candidates').update(updates).ilike('email', user?.email || '').select().maybeSingle()
        if (error) { console.error('[saveProfile]', error.message) }
        else if (data) {
          onProfileUpdate(data)
          setIsEditing(false)
          if (emailChanged) {
            await sb.auth.updateUser({ email: editData.email.trim().toLowerCase() })
            // toast handled by parent re-render; show inline note
          }
        }
      } catch (e) { console.error(e) }
      setSaving(false)
    }

    const uploadCv = async (file: File) => {
      setCvUploading(true)
      try {
        const sb = createClient()
        const ext = file.name.split('.').pop()
        const path = `cvs/${Date.now()}-${(user?.email || '').replace(/[@.]/g, '_')}.${ext}`
        const { data: upData } = await sb.storage.from('candidatos').upload(path, file, { upsert: true })
        if (upData?.path) {
          const { data: urlData } = sb.storage.from('candidatos').getPublicUrl(upData.path)
          const newUrl = urlData?.publicUrl || ''
          const { data: updated } = await sb.from('candidates').update({ cv_url: newUrl }).ilike('email', user?.email || '').select().maybeSingle()
          if (updated) onProfileUpdate(updated)
        }
      } catch (e) { console.error(e) }
      setCvUploading(false)
    }

    const deleteCv = async () => {
      if (!cvUrl) return
      setCvDeleting(true)
      try {
        const sb = createClient()
        const match = cvUrl.match(/\/candidatos\/(.+)$/)
        if (match) await sb.storage.from('candidatos').remove([match[1]])
        const { data: updated } = await sb.from('candidates').update({ cv_url: null }).ilike('email', user?.email || '').select().maybeSingle()
        if (updated) onProfileUpdate(updated)
      } catch (e) { console.error(e) }
      setCvDeleting(false)
    }

    const addEditSkill = () => {
      const v = editSkInput.trim()
      if (v && !editSkills.includes(v)) setEditSkills(prev => [...prev, v])
      setEditSkInput('')
    }

    const sel: React.CSSProperties = { width: '100%', background: 'var(--off)', border: '1.5px solid transparent', borderRadius: '8px', padding: '8px 10px', color: 'var(--ink)', fontFamily: 'var(--body)', fontSize: '.83rem', outline: 'none' }
    const inp: React.CSSProperties = { ...sel }

    return (
      <>
        <div className="page-head">
          <div className="page-title">{t('Mi perfil', 'My profile')}</div>
          <div className="page-sub">{t('Tu información en Candidato', 'Your Candidato profile')}</div>
        </div>

        <div style={{ maxWidth: 860 }}>
          {/* Avatar + name + edit button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', padding: '1.1rem 1.2rem', background: 'var(--white)', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '1.05rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {(user?.name || '').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--head)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>{user?.name || '—'}</div>
              <div style={{ fontSize: '.76rem', color: 'var(--ink-45)', marginTop: '2px' }}>
                {[area, city].filter(Boolean).join(' · ') || user?.email}
              </div>
            </div>
            {!isEditing
              ? <button className="btn btn-outline btn-sm" onClick={startEdit}>{t('Editar perfil', 'Edit profile')}</button>
              : <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                  <button className="btn btn-outline btn-sm" onClick={cancelEdit}>{t('Cancelar', 'Cancel')}</button>
                  <button className="btn btn-forest btn-sm" onClick={saveProfile} disabled={saving}>{saving ? t('Guardando…', 'Saving…') : t('Guardar', 'Save')}</button>
                </div>
            }
          </div>

          {/* 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'start' }}>
            {/* Contact card */}
            <div className="card">
              <div className="card-label" style={{ marginBottom: '.75rem' }}>{t('Contacto', 'Contact')}</div>
              <div className="profile-row">
                <span className="profile-lbl">Email</span>
                {isEditing
                  ? <input style={inp} type="email" value={editData.email} onChange={e => setEdit('email', e.target.value)} placeholder="tu@email.com" />
                  : <span style={{ fontSize: '.82rem', wordBreak: 'break-all' }}>{user?.email || '—'}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Celular / WA', 'Phone')}</span>
                {isEditing
                  ? <input style={inp} value={editData.phone} onChange={e => setEdit('phone', e.target.value)} placeholder="+57 300 000 0000" />
                  : <span style={{ fontSize: '.82rem' }}>{phone || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">LinkedIn</span>
                {isEditing
                  ? <input style={inp} value={editData.linkedin} onChange={e => setEdit('linkedin', e.target.value)} placeholder="linkedin.com/in/tu-perfil" />
                  : linkedin
                      ? <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--forest)', fontSize: '.82rem' }}>Ver perfil →</a>
                      : <span style={{ color: 'var(--ink-45)', fontSize: '.82rem' }}>—</span>}
              </div>
            </div>

            {/* Professional card */}
            <div className="card">
              <div className="card-label" style={{ marginBottom: '.75rem' }}>{t('Información profesional', 'Professional info')}</div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Área', 'Area')}</span>
                {isEditing
                  ? <select style={sel} value={editData.area} onChange={e => setEdit('area', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['Tecnología / IT','Diseño UX/UI','Marketing y Comunicaciones','Ventas y Comercial','Finanzas y Contabilidad','Recursos Humanos','Operaciones','Producto / Product','Legal'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{area || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Experiencia', 'Exp.')}</span>
                {isEditing
                  ? <select style={sel} value={editData.experience} onChange={e => setEdit('experience', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['Sin experiencia','0-1 año','1-3 años','3-5 años','5-10 años','+10 años'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{experience || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Modalidad', 'Mode')}</span>
                {isEditing
                  ? <select style={sel} value={editData.modality} onChange={e => setEdit('modality', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {[t('Presencial','On-site'),t('Remoto','Remote'),t('Híbrido','Hybrid')].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{modality || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Ciudad', 'City')}</span>
                {isEditing
                  ? <select style={sel} value={editData.city} onChange={e => setEdit('city', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['Cali','Bogotá','Medellín','Barranquilla','Cartagena','Bucaramanga'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{city || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Pretensión', 'Salary')}</span>
                {isEditing
                  ? <select style={sel} value={editData.salary_range} onChange={e => setEdit('salary_range', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['$1M – $2M','$2M – $3M','$3M – $5M','$5M – $8M','$8M – $12M','+$12M'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{salaryRange || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
            </div>
          </div>

          {/* Skills + Notes — full width 2-col */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem' }}>
              <div>
                <div className="card-label" style={{ marginBottom: '.6rem' }}>{t('Habilidades', 'Skills')}</div>
                {isEditing && (
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.5rem' }}>
                    <input style={{ ...inp, flex: 1 }} value={editSkInput} onChange={e => setEditSkInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEditSkill() } }} placeholder={t('Agregar…', 'Add…')} />
                    <button type="button" className="add-btn" onClick={addEditSkill} style={{ width: 34, height: 34 }}>+</button>
                  </div>
                )}
                <div className="sk-tags" style={{ margin: 0 }}>
                  {(isEditing ? editSkills : profileSkills).map((s: string) => (
                    <span key={s} className="sk-tag" onClick={isEditing ? () => setEditSkills(prev => prev.filter(x => x !== s)) : undefined} style={isEditing ? { cursor: 'pointer' } : {}}>
                      {s}{isEditing ? ' ×' : ''}
                    </span>
                  ))}
                  {(isEditing ? editSkills : profileSkills).length === 0 && <span style={{ fontSize: '.78rem', color: 'var(--ink-45)' }}>—</span>}
                </div>
              </div>
              <div>
                <div className="card-label" style={{ marginBottom: '.6rem' }}>{t('Nota', 'Notes')}</div>
                {isEditing
                  ? <textarea style={{ ...inp, resize: 'none', minHeight: 80, lineHeight: 1.55 }} value={editData.notes} onChange={e => setEdit('notes', e.target.value)} placeholder={t('¿Qué tipo de empresa buscás?', 'What kind of role are you seeking?')} />
                  : <span style={{ fontSize: '.82rem', color: notes ? 'var(--ink-70)' : 'var(--ink-45)', lineHeight: 1.6 }}>{notes || '—'}</span>}
              </div>
            </div>
          </div>

          {/* CV card */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-label" style={{ marginBottom: '.75rem' }}>{t('Hoja de vida', 'CV / Resume')}</div>
            {cvUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ fontSize: '.82rem', color: 'var(--ink-70)', flex: 1 }}>📄 {t('CV adjunto', 'CV attached')}</span>
                <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">{t('Ver →', 'View →')}</a>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  {cvUploading ? t('Subiendo…', 'Uploading…') : t('Reemplazar', 'Replace')}
                  <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadCv(f) }} />
                </label>
                <button className="btn btn-sm" style={{ background: 'none', border: '1.5px solid var(--line)', color: 'var(--coral)', borderRadius: 7 }} onClick={deleteCv} disabled={cvDeleting}>
                  {cvDeleting ? '…' : t('Eliminar', 'Delete')}
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                <div style={{ flex: 1, fontSize: '.82rem', color: 'var(--ink-45)' }}>
                  {cvUploading ? t('Subiendo tu CV…', 'Uploading CV…') : t('Sin CV adjunto. Hacé clic para subir.', 'No CV attached. Click to upload.')}
                </div>
                <div className="btn btn-forest btn-sm" style={{ pointerEvents: 'none' }}>
                  {cvUploading ? '⏳' : t('Subir CV', 'Upload CV')}
                </div>
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadCv(f) }} />
              </label>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── CONFIGURACIÓN ──
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
      </div>
    </>
  )
}

function JobRow({ job, applied, onApply, t }: {
  job: Job
  applied?: boolean
  onApply?: (jobId: string) => void
  t?: (es: string, en: string) => string
}) {
  const tr = t || ((es: string) => es)
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
        {onApply && (
          <button
            className={`btn btn-sm${applied ? '' : ' btn-forest'}`}
            style={applied ? { background: 'var(--pale)', color: 'var(--forest)', border: '1.5px solid var(--mist)', borderRadius: 7, padding: '4px 12px', fontSize: '.76rem', marginTop: '.4rem', cursor: 'default' } : { marginTop: '.4rem', borderRadius: 7, padding: '4px 14px', fontSize: '.76rem' }}
            onClick={() => !applied && onApply(job.id)}
            disabled={applied}
          >
            {applied ? tr('Postulado ✓', 'Applied ✓') : tr('Postularme →', 'Apply →')}
          </button>
        )}
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
  loadCandidates: (q?: string, area?: string, city?: string, modality?: string, salary?: string) => void
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
              {candidates.slice(0, 4).map(c => <CandCard key={c.id} c={c} t={t} />)}
            </div>
          </div>
        )}
      </>
    )

  if (view === 'talent')
    return <TalentView candidates={candidates} loadCandidates={loadCandidates} t={t} />

  if (view === 'myjobs')
    return <MyJobsView userEmail={userEmail} onPost={() => setView('post')} t={t} />

  if (view === 'post')
    return <PostJobView userEmail={userEmail} onSuccess={() => setView('myjobs')} t={t} />

  return null
}

function TalentView({ candidates, loadCandidates, t }: {
  candidates: Candidate[]
  loadCandidates: (q?: string, area?: string, city?: string, modality?: string, salary?: string) => void
  t: (es: string, en: string) => string
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterMod, setFilterMod] = useState('')
  const [filterSal, setFilterSal] = useState('')
  const doSearch = () => loadCandidates(query, filterArea, filterCity, filterMod, filterSal)
  const clearFilters = () => { setFilterArea(''); setFilterCity(''); setFilterMod(''); setFilterSal(''); loadCandidates(query) }
  const hasFilters = filterArea || filterCity || filterMod || filterSal

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Candidatos', 'Candidates')}</div>
        <div className="page-sub">{t(`${candidates.length} perfil${candidates.length !== 1 ? 'es' : ''} disponible${candidates.length !== 1 ? 's' : ''}`, `${candidates.length} profile${candidates.length !== 1 ? 's' : ''} available`)}</div>
      </div>

      {/* Search + filters */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '1rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.6rem', marginBottom: '.75rem' }}>
          <div className="search-wrap" style={{ flex: '0 1 320px', minWidth: 0, margin: 0, border: 'none', background: 'var(--off)', borderRadius: '8px', padding: '.55rem .9rem' }}>
            <input
              className="search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder={t('Nombre o keyword…', 'Name or keyword…')}
              style={{ background: 'transparent' }}
            />
          </div>
          <button className="btn btn-forest" onClick={doSearch} style={{ padding: '0 1.4rem', borderRadius: '8px', fontSize: '.82rem', flexShrink: 0 }}>
            {t('Buscar', 'Search')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" value={filterArea} onChange={e => { setFilterArea(e.target.value); loadCandidates(query, e.target.value, filterCity, filterMod, filterSal) }}>
            <option value="">{t('Área', 'Area')}</option>
            <option>{t('Tecnología / IT', 'Technology / IT')}</option>
            <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
            <option>{t('Marketing y Comunicaciones', 'Marketing & Comms')}</option>
            <option>{t('Ventas y Comercial', 'Sales & Business Dev')}</option>
            <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
            <option>{t('Recursos Humanos', 'Human Resources')}</option>
            <option>{t('Operaciones', 'Operations')}</option>
            <option>{t('Producto / Product', 'Product')}</option>
            <option>{t('Legal', 'Legal')}</option>
          </select>
          <select className="filter-select" value={filterCity} onChange={e => { setFilterCity(e.target.value); loadCandidates(query, filterArea, e.target.value, filterMod, filterSal) }}>
            <option value="">{t('Ciudad', 'City')}</option>
            <option>Cali</option><option>Bogotá</option><option>Medellín</option>
            <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
          </select>
          <select className="filter-select" value={filterMod} onChange={e => { setFilterMod(e.target.value); loadCandidates(query, filterArea, filterCity, e.target.value, filterSal) }}>
            <option value="">{t('Modalidad', 'Mode')}</option>
            <option>{t('Presencial', 'On-site')}</option>
            <option>{t('Remoto', 'Remote')}</option>
            <option>{t('Híbrido', 'Hybrid')}</option>
          </select>
          <select className="filter-select" value={filterSal} onChange={e => { setFilterSal(e.target.value); loadCandidates(query, filterArea, filterCity, filterMod, e.target.value) }}>
            <option value="">{t('Pretensión salarial', 'Expected salary')}</option>
            <option>$1M – $2M</option>
            <option>$2M – $3M</option>
            <option>$3M – $5M</option>
            <option>$5M – $8M</option>
            <option>$8M – $12M</option>
            <option>+$12M</option>
          </select>
          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>{t('Limpiar', 'Clear')}</button>
          )}
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{t('Sin candidatos', 'No candidates')}</div>
          <div className="empty-sub">{t('Intentá con otros filtros.', 'Try different filters.')}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
        {candidates.map(c => <CandCard key={c.id} c={c} t={t} />)}
      </div>
    </>
  )
}

function CandCard({ c, t }: { c: Candidate; t: (es: string, en: string) => string }) {
  const [showContact, setShowContact] = useState(false)
  const tags = [c.experience, c.city, c.modality].filter(Boolean)
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '.85rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {initials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          {c.area && <div style={{ fontSize: '.74rem', color: 'var(--forest)', fontWeight: 600, marginTop: '1px' }}>{c.area}</div>}
        </div>
        <span style={{ fontSize: '.7rem', color: 'var(--ink-45)', flexShrink: 0 }}>{timeAgo(c.created_at)}</span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="jc-tags" style={{ margin: 0 }}>
          {tags.map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
          {c.salary_range && <span className="jc-tag" style={{ background: 'var(--pale)', color: 'var(--forest)' }}>{c.salary_range}</span>}
        </div>
      )}

      {/* Skills */}
      {c.skills && c.skills.length > 0 && (
        <div className="jc-tags" style={{ margin: 0 }}>
          {c.skills.slice(0, 4).map(s => <span key={s} className="jc-tag jc-tag-skill">{s}</span>)}
          {c.skills.length > 4 && <span className="jc-tag" style={{ color: 'var(--ink-45)' }}>+{c.skills.length - 4}</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '.5rem', borderTop: '1px solid var(--line)' }}>
        {c.linkedin && (
          <a href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            LinkedIn →
          </a>
        )}
        {c.cv_url && (
          <a href={c.cv_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            {t('Ver CV', 'View CV')}
          </a>
        )}
        <button
          className="btn btn-forest btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowContact(v => !v)}
        >
          {showContact ? t('Ocultar', 'Hide') : t('Contactar', 'Contact')}
        </button>
      </div>

      {/* Contact reveal */}
      {showContact && (
        <div style={{ background: 'var(--off)', borderRadius: '8px', padding: '.7rem .9rem', fontSize: '.8rem', lineHeight: 1.8 }}>
          {c.email && (
            <div><span style={{ color: 'var(--ink-45)', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Email</span><br />
              <a href={`mailto:${c.email}`} style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.email}</a>
            </div>
          )}
          {c.whatsapp && (
            <div style={{ marginTop: '.4rem' }}><span style={{ color: 'var(--ink-45)', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>WhatsApp</span><br />
              <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.whatsapp}</a>
            </div>
          )}
          {!c.email && !c.whatsapp && <span style={{ color: 'var(--ink-45)' }}>{t('Sin datos de contacto', 'No contact info')}</span>}
        </div>
      )}
    </div>
  )
}

function MyJobsView({ userEmail, onPost, t }: {
  userEmail: string
  onPost: () => void
  t: (es: string, en: string) => string
}) {
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSal, setEditSal] = useState('')
  const [editMod, setEditMod] = useState('')
  const [saving, setSaving] = useState(false)
  // applicant counts per job_id
  const [appCounts, setAppCounts] = useState<Record<string, number>>({})
  // which job's applicants are being viewed (null = show job list)
  const [viewingJobId, setViewingJobId] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)

  useEffect(() => { loadMyJobs() }, [])

  async function loadMyJobs() {
    setLoading(true)
    try {
      const sb = createClient()
      const { data: co } = await sb.from('companies').select('id').ilike('email', userEmail).maybeSingle()
      if (!co?.id) { setMyJobs([]); setLoading(false); return }
      const { data } = await sb.from('jobs').select('*').eq('company_id', co.id).order('created_at', { ascending: false })
      const jobs = data || []
      setMyJobs(jobs)
      // load application counts
      if (jobs.length > 0) {
        const ids = jobs.map((j: Job) => j.id)
        const { data: apps } = await sb.from('applications').select('job_id').in('job_id', ids)
        if (apps) {
          const counts: Record<string, number> = {}
          apps.forEach((a: { job_id: string }) => { counts[a.job_id] = (counts[a.job_id] || 0) + 1 })
          setAppCounts(counts)
        }
      }
    } catch (e) { console.warn(e) }
    setLoading(false)
  }

  async function viewApplicants(jobId: string) {
    setViewingJobId(jobId)
    setAppsLoading(true)
    try {
      const sb = createClient()
      const { data } = await sb
        .from('applications')
        .select('*, candidates(id,name,email,whatsapp,area,experience,city,modality,skills,linkedin,cv_url)')
        .eq('job_id', jobId)
        .order('applied_at', { ascending: false })
      setApplications(data || [])
    } catch (e) { console.warn(e) }
    setAppsLoading(false)
  }

  async function updateAppStatus(appId: string, status: string) {
    try {
      await createClient().from('applications').update({ status }).eq('id', appId)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    } catch (e) { console.warn(e) }
  }

  const startEdit = (j: Job) => {
    setEditingId(j.id)
    setEditTitle(j.title)
    setEditDesc(j.description || '')
    setEditSal(j.salary_range || '')
    setEditMod(j.modality || '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const sb = createClient()
      await sb.from('jobs').update({ title: editTitle, description: editDesc, salary_range: editSal, modality: editMod }).eq('id', id)
      setEditingId(null)
      await loadMyJobs()
    } catch (e) { console.warn(e) }
    setSaving(false)
  }

  async function deleteJob(id: string) {
    if (!confirm(t('¿Eliminar esta vacante?', 'Delete this listing?'))) return
    try {
      const sb = createClient()
      await sb.from('jobs').delete().eq('id', id)
      setMyJobs(prev => prev.filter(j => j.id !== id))
    } catch (e) { console.warn(e) }
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--off)', border: '1.5px solid transparent', borderRadius: '8px', padding: '8px 10px', color: 'var(--ink)', fontFamily: 'var(--body)', fontSize: '.83rem', outline: 'none' }

  const statusColor: Record<string, string> = { pending: 'var(--ink-45)', reviewed: 'var(--forest)', contacted: '#2A7E4E', rejected: 'var(--coral)' }

  // ── APPLICANTS PANEL ──
  if (viewingJobId) {
    const job = myJobs.find(j => j.id === viewingJobId)
    return (
      <>
        <div className="page-head">
          <button className="btn btn-outline btn-sm" onClick={() => setViewingJobId(null)}>← {t('Mis vacantes', 'My listings')}</button>
          <div className="page-title" style={{ marginTop: '.5rem' }}>{job?.title}</div>
          <div className="page-sub">{t(`${applications.length} postulante${applications.length !== 1 ? 's' : ''}`, `${applications.length} applicant${applications.length !== 1 ? 's' : ''}`)}</div>
        </div>
        {appsLoading && <div className="loading-state">{t('Cargando postulantes…', 'Loading applicants…')}</div>}
        {!appsLoading && applications.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">{t('Sin postulantes aún', 'No applicants yet')}</div>
            <div className="empty-sub">{t('Los candidatos que se postulen aparecerán aquí.', 'Candidates who apply will appear here.')}</div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const c = app.candidates
            if (!c) return null
            return (
              <div key={app.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '.85rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem' }}>{c.name}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--forest)', fontWeight: 600 }}>{c.area || ''}</div>
                  </div>
                  <select
                    value={app.status}
                    onChange={e => updateAppStatus(app.id, e.target.value)}
                    style={{ fontSize: '.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', border: '1.5px solid var(--line)', background: 'var(--off)', color: statusColor[app.status] || 'var(--ink)', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="pending">{t('Pendiente', 'Pending')}</option>
                    <option value="reviewed">{t('Revisado', 'Reviewed')}</option>
                    <option value="contacted">{t('Contactado', 'Contacted')}</option>
                    <option value="rejected">{t('Descartado', 'Rejected')}</option>
                  </select>
                </div>
                {[c.experience, c.city, c.modality].filter(Boolean).length > 0 && (
                  <div className="jc-tags" style={{ margin: '0 0 .65rem' }}>
                    {[c.experience, c.city, c.modality].filter(Boolean).map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
                  </div>
                )}
                {c.skills && c.skills.length > 0 && (
                  <div className="jc-tags" style={{ margin: '0 0 .65rem' }}>
                    {c.skills.slice(0, 5).map(s => <span key={s} className="jc-tag jc-tag-skill">{s}</span>)}
                  </div>
                )}
                <div style={{ background: 'var(--off)', borderRadius: '8px', padding: '.65rem .9rem', fontSize: '.8rem', lineHeight: 1.9, marginBottom: '.75rem' }}>
                  {c.email && <div><span style={{ color: 'var(--ink-45)', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Email</span><br /><a href={`mailto:${c.email}`} style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.email}</a></div>}
                  {c.whatsapp && <div style={{ marginTop: '.3rem' }}><span style={{ color: 'var(--ink-45)', fontSize: '.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>WhatsApp</span><br /><a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.whatsapp}</a></div>}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {c.linkedin && <a href={c.linkedin.startsWith('http') ? c.linkedin : `https://${c.linkedin}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">LinkedIn →</a>}
                  {c.cv_url && <a href={c.cv_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">{t('Descargar CV', 'Download CV')}</a>}
                  <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: 'var(--ink-45)', alignSelf: 'center' }}>{timeAgo(app.applied_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  // ── JOB LIST ──
  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Mis vacantes', 'My listings')}</div>
        <div className="page-sub">{t(`${myJobs.length} publicada${myJobs.length !== 1 ? 's' : ''}`, `${myJobs.length} published`)}</div>
        <div className="page-actions">
          <button className="btn btn-forest btn-sm" onClick={onPost}>{t('+ Nueva vacante', '+ New listing')}</button>
        </div>
      </div>

      {loading && <div className="loading-state">{t('Cargando…', 'Loading…')}</div>}

      {!loading && myJobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{t('Aún no publicaste vacantes', 'No listings yet')}</div>
          <div className="empty-sub">{t('Publicá tu primera vacante para encontrar candidatos.', 'Post your first listing to find candidates.')}</div>
          <button className="btn btn-forest" style={{ marginTop: '1rem' }} onClick={onPost}>{t('Publicar vacante →', 'Post a listing →')}</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {myJobs.map(j => (
          <div key={j.id} className="card">
            {editingId === j.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <input style={inp} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder={t('Cargo', 'Job title')} />
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <select style={{ ...inp, flex: 1 }} value={editMod} onChange={e => setEditMod(e.target.value)}>
                    <option value="">{t('Modalidad', 'Mode')}</option>
                    <option>{t('Presencial', 'On-site')}</option>
                    <option>{t('Remoto', 'Remote')}</option>
                    <option>{t('Híbrido', 'Hybrid')}</option>
                  </select>
                  <select style={{ ...inp, flex: 1 }} value={editSal} onChange={e => setEditSal(e.target.value)}>
                    <option value="">{t('Salario', 'Salary')}</option>
                    <option>Hasta $2M</option><option>$2M–$4M</option><option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
                  </select>
                </div>
                <textarea style={{ ...inp, resize: 'none', minHeight: 80, lineHeight: 1.55 }} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder={t('Descripción…', 'Description…')} />
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>{t('Cancelar', 'Cancel')}</button>
                  <button className="btn btn-forest btn-sm" onClick={() => saveEdit(j.id)} disabled={saving}>{saving ? t('Guardando…', 'Saving…') : t('Guardar', 'Save')}</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.6rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.95rem', color: 'var(--ink)' }}>{j.title}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--ink-45)', marginTop: '2px' }}>{timeAgo(j.created_at)}</div>
                  </div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: '50px', background: j.active ? 'var(--pale)' : 'var(--off)', color: j.active ? 'var(--forest)' : 'var(--ink-45)' }}>
                    {j.active ? t('Activa', 'Active') : t('Inactiva', 'Inactive')}
                  </span>
                </div>
                <div className="jc-tags" style={{ margin: '0 0 .8rem' }}>
                  {j.modality && <span className="jc-tag">{j.modality}</span>}
                  {j.city && <span className="jc-tag">{j.city}</span>}
                  {j.area && <span className="jc-tag">{j.area}</span>}
                  {j.salary_range && <span className="jc-tag" style={{ background: 'var(--pale)', color: 'var(--forest)' }}>{j.salary_range}</span>}
                </div>
                {j.description && <p style={{ fontSize: '.8rem', color: 'var(--ink-70)', lineHeight: 1.6, margin: '0 0 .8rem' }}>{j.description.slice(0, 160)}{j.description.length > 160 ? '…' : ''}</p>}
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', paddingTop: '.75rem', borderTop: '1px solid var(--line)' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(j)}>{t('Editar', 'Edit')}</button>
                  <button className="btn btn-sm" style={{ background: 'none', border: '1.5px solid var(--line)', color: 'var(--coral)', borderRadius: 7, padding: '4px 12px', fontSize: '.78rem', cursor: 'pointer' }} onClick={() => deleteJob(j.id)}>{t('Eliminar', 'Delete')}</button>
                  <button
                    className="btn btn-forest btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => viewApplicants(j.id)}
                  >
                    {t('Postulantes', 'Applicants')} {appCounts[j.id] ? `(${appCounts[j.id]})` : '(0)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
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
