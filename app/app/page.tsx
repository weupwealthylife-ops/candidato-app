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
  required_experience?: string
  active?: boolean
  created_at?: string
  closes_at?: string
  views?: number
  push_sent_at?: string
  companies?: { company_name: string }
}

interface Suggestion {
  id: string
  job_id: string
  match_score: number
  status: string
  created_at: string
  jobs?: { id: string; title: string; area?: string; city?: string; modality?: string; companies?: { company_name: string } }
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
  open_to_work?: boolean
}

interface Application {
  id: string
  job_id: string
  candidate_id: string
  status: string
  applied_at: string
  match_score?: number
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
    notify_matches?: boolean
  }
}

interface CompanyProfile {
  id?: string
  name?: string
  email?: string
  company_name?: string
  industry?: string
  size?: string
  city?: string
  whatsapp?: string
  website?: string
  linkedin?: string
  description?: string
  mission?: string
  values?: string
  looking_for_areas?: string[]
  looking_for_experience?: string
  looking_for_modality?: string
  looking_for_skills?: string[]
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
  if (d < 7) return `Hace ${d}d`
  const w = Math.floor(d / 7)
  if (w < 5) return `Hace ${w} semana${w > 1 ? 's' : ''}`
  const m = Math.floor(d / 30)
  if (m < 12) return `Hace ${m} mes${m > 1 ? 'es' : ''}`
  return `Hace más de un año`
}

// Fixed-vocabulary DB values (area/experience/modality) translated for display in EN.
// Free text (job titles, descriptions, notes) is left as entered.
const VALUE_TRANSLATIONS: Record<string, string> = {
  'Tecnología / IT': 'Technology / IT',
  'Diseño UX/UI': 'UX/UI Design',
  'Marketing y Comunicaciones': 'Marketing & Communications',
  'Ventas y Comercial': 'Sales & Commercial',
  'Finanzas y Contabilidad': 'Finance & Accounting',
  'Recursos Humanos': 'Human Resources',
  'Operaciones': 'Operations',
  'Producto / Product': 'Product',
  'Legal': 'Legal',
  'Sin experiencia': 'No experience',
  '1–2 años': '1–2 years',
  '3–5 años': '3–5 years',
  '5–10 años': '5–10 years',
  '10+ años': '10+ years',
  'Presencial': 'On-site',
  'Remoto': 'Remote',
  'Híbrido': 'Hybrid',
}

function tv(value: string | undefined | null, t: (es: string, en: string) => string): string {
  if (!value) return ''
  return t(value, VALUE_TRANSLATIONS[value] || value)
}

function appliedAgo(ts: string, t: (es: string, en: string) => string) {
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return t('Hace un momento', 'Just now')
  if (h < 24) return t(`Hace ${h}h`, `${h}h ago`)
  const d = Math.floor(h / 24)
  if (d === 1) return t('Ayer', 'Yesterday')
  if (d < 7) return t(`Hace ${d} días`, `${d} days ago`)
  const w = Math.floor(d / 7)
  if (w < 5) return t(`Hace ${w} semana${w > 1 ? 's' : ''}`, `${w} week${w > 1 ? 's' : ''} ago`)
  const m = Math.floor(d / 30)
  if (m < 12) return t(`Hace ${m} mes${m > 1 ? 'es' : ''}`, `${m} month${m > 1 ? 's' : ''} ago`)
  return t('Hace más de un año', 'Over a year ago')
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

type CandView = 'dashboard' | 'jobs' | 'profile' | 'settings'
type CompView = 'codashboard' | 'matches' | 'post' | 'talent' | 'myjobs' | 'mycompany'

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
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifStatuses, setNotifStatuses] = useState<Map<string, { status: string; match_score?: number }>>(new Map())

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

    // Demo mode for UI auditing (no Supabase required)
    if (params.get('demo') === 'candidate') {
      enterApp({ email: 'demo@candidato.co', name: 'Ana García', type: 'candidate' })
      return
    }
    if (params.get('demo') === 'company') {
      enterApp({ email: 'empresa@demo.co', name: 'Carlos López', type: 'company', companyName: 'Tech Startup SA' })
      return
    }

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

  function markNotifsRead() {
    const seen: Record<string, string> = {}
    notifStatuses.forEach((v, jobId) => { seen[jobId] = v.status })
    localStorage.setItem('candidato_seen_statuses', JSON.stringify(seen))
    setUnreadCount(0)
    setNotifOpen(false)
  }

  async function loadJobs(query = '', area = '', city = '', mod = '', sal = '') {
    setDataLoading(true)
    try {
      const sb = createClient()
      const nowIso = new Date().toISOString()
      let q = sb.from('jobs').select('*, companies(company_name)').eq('active', true).or(`closes_at.is.null,closes_at.gte.${nowIso}`)
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

  async function loadCandidates(query = '', area = '', city = '', modality = '', salary = '', experience = '') {
    try {
      const sb = createClient()
      let q = sb.from('candidates').select('id,name,email,whatsapp,area,experience,city,modality,salary_range,skills,linkedin,cv_url,created_at,open_to_work')
        .neq('profile_visible', false)
      if (query) q = q.ilike('name', `%${query}%`)
      if (area) q = q.eq('area', area)
      if (city) q = q.eq('city', city)
      if (modality) q = q.eq('modality', modality)
      if (salary) q = q.eq('salary_range', salary)
      if (experience) q = q.eq('experience', experience)
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
    if (n > 1 && cStep === 1) {
      if (!cfn.trim())
        return showToast('Campo requerido', t('Ingresá tu nombre', 'Enter your first name'), '⚠️')
      if (!cln.trim())
        return showToast('Campo requerido', t('Ingresá tu apellido', 'Enter your last name'), '⚠️')
    }
    if (n > 2 && cStep === 2) {
      if (!car)
        return showToast(t('Campo requerido', 'Required field'), t('Seleccioná tu área profesional', 'Select your professional area'), '⚠️')
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

      // Duplicate check — email already registered?
      const { data: existing } = await sb.from('candidates').select('name,email').ilike('email', email).maybeSingle()
      if (existing?.name) {
        showToast(t('¡Bienvenido/a de vuelta!', 'Welcome back!'), t(`Hola ${existing.name}, ya tenés cuenta en Candidato®.`, `Hi ${existing.name}, you already have an account.`), '👋')
        setSubmitting(false)
        enterApp({ name: existing.name, email: existing.email ?? email, type: 'candidate' })
        return
      }

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

      // Duplicate check
      const { data: existingCo } = await sb.from('companies').select('name,email,company_name').ilike('email', email).maybeSingle()
      if (existingCo?.name) {
        showToast(t('¡Bienvenido/a de vuelta!', 'Welcome back!'), t(`Hola ${existingCo.name}, ya tenés cuenta en Candidato®.`, `Hi ${existingCo.name}, you already have an account.`), '👋')
        setSubmitting(false)
        enterApp({ name: existingCo.name, email: existingCo.email ?? email, type: 'company', companyName: existingCo.company_name })
        return
      }

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
    setUserType(user.type === 'company' ? 'company' : 'candidate')
    setView('app')
    loadJobs()
    loadCandidates()
    if (user.type === 'candidate') loadProfile(user.email)
  }

  const logout = async () => {
    try { await createClient().auth.signOut() } catch { /* non-blocking */ }
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
        setFoundName(cand.name)
        setUserType('candidate')
        setPhase('welcome')
        return
      }

      const { data: comp } = await sb
        .from('companies')
        .select('name,email,company_name')
        .ilike('email', email)
        .maybeSingle()
      if (comp?.name) {
        setGateLoading(false)
        setFoundName(comp.name)
        setUserType('company')
        // store company_name so welcome → enterApp can use it
        setConame(comp.company_name || '')
        setCoem(comp.email ?? email)
        setPhase('welcome')
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
                    <button className="submit-btn" onClick={() => enterApp({ name: foundName, email: gateEmail, type: userType, companyName: userType === 'company' ? coname : undefined })}>
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
                              <option>Bogotá</option><option>Medellín</option><option>Cali</option>
                              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
                              <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
                              <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
                              <option>Montería</option><option>Villavicencio</option>
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
                              <option>Hasta $2M</option><option>$2M – $4M</option>
                              <option>$4M – $7M</option><option>$7M – $12M</option><option>$12M+</option>
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
                              <option>Bogotá</option><option>Medellín</option><option>Cali</option>
                              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
                              <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
                              <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
                              <option>Montería</option><option>Villavicencio</option>
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
                              <option>Bogotá</option><option>Medellín</option><option>Cali</option>
                              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
                              <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
                              <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
                              <option>Montería</option><option>Villavicencio</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg">
                            <label>{t('Área', 'Area')}</label>
                            <select value={jobarea} onChange={(e) => setJobarea(e.target.value)}>
                              <option value="" disabled>{t('Área', 'Area')}</option>
                              <option>{t('Tecnología / IT', 'Technology / IT')}</option>
                              <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
                              <option>Marketing y Comunicaciones</option>
                              <option>{t('Ventas y Comercial', 'Sales')}</option>
                              <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
                              <option>{t('Recursos Humanos', 'Human Resources')}</option>
                              <option>{t('Operaciones', 'Operations')}</option>
                              <option>{t('Otra', 'Other')}</option>
                            </select>
                          </div>
                          <div className="fg fg-full">
                            <label>{t('Salario mensual', 'Monthly salary')} <span style={{color:'var(--ink-45)',fontWeight:400}}>{t('(opcional)', '(optional)')}</span></label>
                            <select value={jobsal} onChange={(e) => setJobsal(e.target.value)}>
                              <option value="" disabled>{t('Rango', 'Range')}</option>
                              <option>Hasta $2M</option><option>$2M – $4M</option>
                              <option>$4M – $7M</option><option>$7M – $12M</option><option>$12M+</option>
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
                <button className={`tab-btn${compView === 'mycompany' ? ' active' : ''}`} onClick={() => setCompView('mycompany')}>
                  {t('Mi empresa', 'My company')}
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
            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                className="user-ava"
                onClick={() => setAvatarOpen(v => !v)}
                title={name}
                style={{ overflow: 'hidden', padding: 0 }}
              >
                {(isC && candProfile?.photo_url) ? (
                  <img src={candProfile.photo_url as string} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  name.substring(0, 2).toUpperCase()
                )}
              </div>
              {avatarOpen && (
                <>
                  {/* backdrop to close on outside click */}
                  <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setAvatarOpen(false)} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200, background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: 12, boxShadow: '0 8px 32px rgba(14,30,32,.13)', minWidth: 200, overflow: 'hidden' }}>
                    {/* User info header */}
                    <div style={{ padding: '.75rem 1rem .6rem', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                      {(isC && candProfile?.photo_url) ? (
                        <img src={candProfile.photo_url as string} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.75rem', color: 'white', flexShrink: 0 }}>
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.83rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.email}</div>
                        {!isC && currentUser?.companyName && (
                          <div style={{ fontSize: '.72rem', color: 'var(--forest)', fontWeight: 600, marginTop: '2px' }}>{currentUser.companyName}</div>
                        )}
                      </div>
                    </div>
                    {/* Menu items */}
                    <div style={{ padding: '.35rem' }}>
                      {isC && (
                        <button
                          className="ava-menu-item"
                          onClick={() => { setCandView('profile'); setAvatarOpen(false) }}
                        >
                          👤 {t('Mi perfil', 'My profile')}
                        </button>
                      )}
                      {isC && (
                        <button
                          className="ava-menu-item"
                          onClick={() => { setCandView('settings'); setAvatarOpen(false) }}
                        >
                          ⚙️ {t('Configuración', 'Settings')}
                        </button>
                      )}
                      {!isC && (
                        <button
                          className="ava-menu-item"
                          onClick={() => { setCompView('mycompany'); setAvatarOpen(false) }}
                        >
                          🏢 {t('Mi empresa', 'My company')}
                        </button>
                      )}
                      <div style={{ borderTop: '1px solid var(--line)', margin: '.35rem 0' }} />
                      <button
                        className="ava-menu-item"
                        style={{ color: 'var(--coral)' }}
                        onClick={() => { setAvatarOpen(false); logout() }}
                      >
                        → {t('Cerrar sesión', 'Log out')}
                      </button>
                    </div>
                  </div>
                </>
              )}
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
                <div style={{ position: 'relative' }}>
                  <button
                    className={`nav-item`}
                    onClick={() => { setNotifOpen(o => !o); if (unreadCount > 0) markNotifsRead() }}
                    style={{ position: 'relative' }}
                  >
                    <span className="nav-ico">🔔</span>
                    <span>{t('Notificaciones', 'Notifications')}</span>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 6, right: 10, background: 'var(--coral)', color: 'white', borderRadius: '50%', width: 17, height: 17, fontSize: '.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div style={{ position: 'absolute', left: '105%', top: 0, background: 'white', border: '1.5px solid var(--line)', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,.1)', width: 280, zIndex: 200, padding: '.8rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--ink)', marginBottom: '.6rem' }}>{t('Notificaciones', 'Notifications')}</div>
                      {notifStatuses.size === 0 ? (
                        <div style={{ fontSize: '.78rem', color: 'var(--ink-45)' }}>{t('Sin notificaciones', 'No notifications')}</div>
                      ) : (
                        [...notifStatuses.entries()].filter(([, v]) => ['contacted','reviewed','rejected'].includes(v.status)).map(([jobId, v]) => {
                          const job = jobs.find(j => j.id === jobId)
                          const seen = JSON.parse(localStorage.getItem('candidato_seen_statuses') || '{}') as Record<string, string>
                          const isNew = seen[jobId] !== v.status
                          return (
                            <div key={jobId} style={{ padding: '.5rem .4rem', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: isNew ? '#f0fdf4' : 'transparent', borderRadius: 6, marginBottom: '.2rem' }}
                              onClick={() => { setCandView('jobs'); setNotifOpen(false) }}>
                              <div style={{ fontSize: '.78rem', fontWeight: isNew ? 700 : 400, color: 'var(--ink)' }}>{job?.title || t('Vacante', 'Job')}</div>
                              <div style={{ fontSize: '.72rem', color: v.status === 'contacted' ? '#15803d' : v.status === 'rejected' ? '#b91c1c' : '#1d4ed8', marginTop: '2px' }}>
                                {v.status === 'contacted' ? t('🚀 ¡La empresa quiere contactarte!', '🚀 Company wants to contact you!') :
                                 v.status === 'reviewed' ? t('👀 Tu postulación fue revisada', '👀 Application reviewed') :
                                 t('Tu postulación no avanzó', 'Application not selected')}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
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
                <button className={`nav-item${compView === 'mycompany' ? ' active' : ''}`} onClick={() => setCompView('mycompany')}>
                  {t('Mi empresa', 'My company')}
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
                onRetryProfile={() => currentUser && loadProfile(currentUser.email)}
                showToast={showToast}
                onAppStatusesLoaded={(statuses) => {
                  setNotifStatuses(statuses)
                  const seen = JSON.parse(localStorage.getItem('candidato_seen_statuses') || '{}') as Record<string, string>
                  let count = 0
                  statuses.forEach((v, jobId) => {
                    if (['contacted', 'reviewed', 'rejected'].includes(v.status) && seen[jobId] !== v.status) count++
                  })
                  setUnreadCount(count)
                }}
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
            <button className={`mobile-nav-btn`} onClick={() => { setNotifOpen(o => !o); if (unreadCount > 0) markNotifsRead() }} style={{ position: 'relative' }}>
              <span className="mobile-nav-ico">🔔</span>
              {t('Alerts', 'Alerts')}
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 8, background: 'var(--coral)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
              )}
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
            <button className={`mobile-nav-btn${compView === 'myjobs' ? ' active' : ''}`} onClick={() => setCompView('myjobs')}>
              <span className="mobile-nav-ico">📋</span>{t('Vacantes', 'Listings')}
            </button>
            <button className={`mobile-nav-btn${compView === 'mycompany' ? ' active' : ''}`} onClick={() => setCompView('mycompany')}>
              <span className="mobile-nav-ico">🏢</span>{t('Empresa', 'Company')}
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
              : coName}
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
  view, firstName, skills, user, candProfile, onProfileUpdate, jobs, dataLoading, loadJobs, setView, t, onRetryProfile, showToast, onAppStatusesLoaded,
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
  onRetryProfile: () => void
  showToast: (title: string, sub: string, ico?: string) => void
  t: (es: string, en: string) => string
  onAppStatusesLoaded?: (statuses: Map<string, { status: string; match_score?: number }>) => void
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterMod, setFilterMod] = useState('')
  const [filterSal, setFilterSal] = useState('')

  // Applications state — Map<jobId, applied_at>
  const [myApplied, setMyApplied] = useState<Map<string, string>>(new Map())
  const [myAppStatuses, setMyAppStatuses] = useState<Map<string, { status: string; match_score?: number }>>(new Map())
  const [applying, setApplying] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const [appliedJob, setAppliedJob] = useState<Job | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [mySavedJobs, setMySavedJobs] = useState<Map<string, string>>(new Map())
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [profileLoadFailed, setProfileLoadFailed] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [openToWorkSaving, setOpenToWorkSaving] = useState(false)
  // Settings toggles — must be at top level (no conditional hooks)
  const [notifMatches, setNotifMatches] = useState(true)
  const [notifUpdates, setNotifUpdates] = useState(true)
  const [profileVisible, setProfileVisible] = useState(true)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [acceptedMatches, setAcceptedMatches] = useState<Suggestion[]>([])
  const [respondingSugg, setRespondingSugg] = useState<string | null>(null)
  const [selectedJobScore, setSelectedJobScore] = useState<number | null>(null)
  const [extraJobs, setExtraJobs] = useState<Job[]>([])
  const [moreJobsLoading, setMoreJobsLoading] = useState(false)
  const [noMoreJobs, setNoMoreJobs] = useState(false)

  useEffect(() => {
    if (!selectedJob || !candProfile?.id) { setSelectedJobScore(null); return }
    createClient()
      .rpc('score_candidate_job', { p_candidate_id: candProfile.id as string, p_job_id: selectedJob.id })
      .then(({ data }) => setSelectedJobScore(typeof data === 'number' ? data : null))
  }, [selectedJob?.id, candProfile?.id])

  useEffect(() => {
    if (!candProfile?.id) return
    createClient()
      .from('suggestions')
      .select('id,job_id,match_score,status,created_at,jobs(id,title,area,city,modality,companies(company_name))')
      .eq('candidate_id', candProfile.id as string)
      .eq('status', 'pending')
      .order('match_score', { ascending: false })
      .then(({ data }) => setSuggestions((data as unknown as Suggestion[]) || []))
    createClient()
      .from('suggestions')
      .select('id,job_id,match_score,status,created_at,jobs(id,title,area,city,modality,companies(company_name))')
      .eq('candidate_id', candProfile.id as string)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .then(({ data }) => setAcceptedMatches((data as unknown as Suggestion[]) || []))
  }, [candProfile?.id])

  async function respondToSuggestion(suggId: string, jobId: string, accept: boolean) {
    if (respondingSugg) return
    setRespondingSugg(suggId)
    const sb = createClient()
    const status = accept ? 'accepted' : 'dismissed'
    await sb.from('suggestions').update({ status }).eq('id', suggId)
    const accepted = suggestions.find(s => s.id === suggId)
    setSuggestions(prev => prev.filter(s => s.id !== suggId))
    if (accept && accepted) setAcceptedMatches(prev => [{ ...accepted, status: 'accepted' }, ...prev])
    if (accept && candProfile?.id) {
      await sb.from('matches').upsert({ candidate_id: candProfile.id as string, job_id: jobId, path: 2 }, { onConflict: 'candidate_id,job_id', ignoreDuplicates: true })
      showToast(t('¡Match confirmado!', 'Match confirmed!'), t('La empresa recibirá tu perfil pronto.', 'The company will receive your profile soon.'), '🎉')
      // Notify the company
      const { data: job } = await sb.from('jobs').select('title,companies(company_name,email)').eq('id', jobId).single()
      if (job) {
        const coEmail = (job.companies as { email?: string })?.email
        const coName = (job.companies as { company_name?: string })?.company_name || ''
        if (coEmail) {
          const sugg = suggestions.find(s => s.id === suggId)
          fetch('/api/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'match_confirmed', to: coEmail, name: coName,
              extra: {
                jobTitle: job.title,
                candidateName: candProfile?.name as string || '',
                candidateArea: candProfile?.area as string || '',
                candidateExp: candProfile?.experience as string || '',
                candidateCity: candProfile?.city as string || '',
                candidateWhatsapp: candProfile?.whatsapp as string || '',
                candidateEmail: user?.email || '',
                candidateLinkedin: candProfile?.linkedin as string || '',
                cvUrl: candProfile?.cv_url as string || '',
                matchScore: String(sugg?.match_score || ''),
              }
            })
          }).catch(() => {})
        }
      }
    }
    setRespondingSugg(null)
  }

  useEffect(() => {
    if (candProfile?.notify_matches !== undefined)
      setNotifMatches(candProfile.notify_matches as boolean)
    if ((candProfile as Record<string,unknown>)?.notify_updates !== undefined)
      setNotifUpdates((candProfile as Record<string,unknown>).notify_updates as boolean)
    if ((candProfile as Record<string,unknown>)?.profile_visible !== undefined)
      setProfileVisible((candProfile as Record<string,unknown>).profile_visible as boolean)
  }, [candProfile])

  async function saveNotifMatches(val: boolean) {
    if (!user?.email) return
    await createClient().from('candidates').update({ notify_matches: val }).ilike('email', user.email)
  }

  async function saveNotifUpdates(val: boolean) {
    if (!user?.email) return
    await createClient().from('candidates').update({ notify_updates: val }).ilike('email', user.email)
  }

  async function saveProfileVisible(val: boolean) {
    if (!user?.email) return
    await createClient().from('candidates').update({ profile_visible: val }).ilike('email', user.email)
  }

  // Show a retry banner if profile still null after 5 seconds
  useEffect(() => {
    if (candProfile) { setProfileLoadFailed(false); return }
    const timer = setTimeout(() => { if (!candProfile) setProfileLoadFailed(true) }, 5000)
    return () => clearTimeout(timer)
  }, [candProfile])

  const ProfileErrorBanner = profileLoadFailed && !candProfile ? (
    <div style={{ background: '#fff8f0', border: '1.5px solid #f5c97a', borderRadius: 10, padding: '.7rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.8rem' }}>
      <span>⚠️</span>
      <span style={{ flex: 1, color: 'var(--ink-70)' }}>{t('No se pudo cargar tu perfil. Algunas funciones podrían no estar disponibles.', 'Could not load your profile. Some features may be unavailable.')}</span>
      <button className="btn btn-outline btn-sm" onClick={onRetryProfile}>{t('Reintentar', 'Retry')}</button>
    </div>
  ) : null

  useEffect(() => {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId) return
    createClient()
      .from('applications')
      .select('job_id, applied_at, status, match_score')
      .eq('candidate_id', candidateId)
      .then(({ data }) => {
        if (data) {
          const m = new Map(data.map((a: { job_id: string; applied_at: string }) => [a.job_id, a.applied_at] as [string, string]))
          setMyApplied(m)
          const s = new Map(data.map((a: { job_id: string; status: string; match_score?: number }) => [a.job_id, { status: a.status, match_score: a.match_score }] as [string, { status: string; match_score?: number }]))
          setMyAppStatuses(s)
        }
      })
  }, [candProfile])

  useEffect(() => {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId) return
    createClient().from('saved_jobs').select('job_id, created_at').eq('candidate_id', candidateId)
      .then(({ data }) => {
        if (data) setMySavedJobs(new Map(data.map((s: { job_id: string; created_at: string }) => [s.job_id, s.created_at] as [string, string])))
      })
  }, [candProfile])

  useEffect(() => {
    if (onAppStatusesLoaded) onAppStatusesLoaded(myAppStatuses)
  }, [myAppStatuses])

  useEffect(() => {
    if (!selectedJob?.id) return
    createClient().rpc('increment_job_views', { job_id: selectedJob.id }).then(() => {})
  }, [selectedJob?.id])

  async function saveJob(job: Job) {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId) return
    const { error } = await createClient().from('saved_jobs').insert({ job_id: job.id, candidate_id: candidateId })
    if (error) showToast(t('Error', 'Error'), t('No se pudo guardar la vacante', 'Could not save the listing'), '⚠️')
    else setMySavedJobs(prev => new Map([...prev, [job.id, new Date().toISOString()]]))
  }

  async function unsaveJob(job: Job) {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId) return
    const { error } = await createClient().from('saved_jobs').delete().eq('job_id', job.id).eq('candidate_id', candidateId)
    if (error) showToast(t('Error', 'Error'), t('No se pudo quitar la vacante guardada', 'Could not remove saved listing'), '⚠️')
    else setMySavedJobs(prev => { const m = new Map(prev); m.delete(job.id); return m })
  }

  async function applyToJob(job: Job) {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId || applying) return
    setApplying(job.id)
    try {
      const sb = createClient()
      const now = new Date().toISOString()
      const { error } = await sb.from('applications').insert({ job_id: job.id, candidate_id: candidateId, status: 'pending' })
      if (!error) {
        setMyApplied(prev => new Map([...prev, [job.id, now]]))
        setMyAppStatuses(prev => new Map([...prev, [job.id, { status: 'pending' }]]))
        setAppliedJob(job)
        setSelectedJob(null)
        // Score the application asynchronously
        sb.rpc('score_candidate_job', { p_candidate_id: candidateId, p_job_id: job.id })
          .then(({ data: score }) => {
            if (typeof score === 'number') {
              sb.from('applications').update({ match_score: score }).eq('job_id', job.id).eq('candidate_id', candidateId).then(() => {})
            }
          })
        if (user?.email && user?.name)
          fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'application_submitted', to: user.email, name: user.name.split(' ')[0], extra: { jobTitle: job.title, companyName: job.companies?.company_name || '' } }) }).catch(() => {})
      }
    } catch (e) { console.warn(e) }
    setApplying(null)
  }

  async function withdrawApplication(job: Job) {
    const candidateId = candProfile?.id as string | undefined
    if (!candidateId || withdrawing) return
    setWithdrawing(job.id)
    try {
      const sb = createClient()
      const { error } = await sb.from('applications').delete().eq('job_id', job.id).eq('candidate_id', candidateId)
      if (!error) {
        setMyApplied(prev => { const m = new Map(prev); m.delete(job.id); return m })
        setMyAppStatuses(prev => { const m = new Map(prev); m.delete(job.id); return m })
        setSelectedJob(null)
      }
    } catch (e) { console.warn(e) }
    setWithdrawing(null)
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

  const doSearch = () => { setExtraJobs([]); setNoMoreJobs(false); loadJobs(query, filterArea, filterCity, filterMod, filterSal) }

  async function loadMoreJobs() {
    if (moreJobsLoading || noMoreJobs) return
    setMoreJobsLoading(true)
    try {
      const sb = createClient()
      const nowIso = new Date().toISOString()
      let q = sb.from('jobs').select('*, companies(company_name)').eq('active', true).or(`closes_at.is.null,closes_at.gte.${nowIso}`)
      if (query) q = q.ilike('title', `%${query}%`)
      if (filterArea) q = q.eq('area', filterArea)
      if (filterCity) q = q.eq('city', filterCity)
      if (filterMod) q = q.eq('modality', filterMod)
      if (filterSal) q = q.ilike('salary_range', `%${filterSal}%`)
      const offset = jobs.length + extraJobs.length
      const { data } = await q.order('created_at', { ascending: false }).range(offset, offset + 49)
      if (!data || data.length === 0) { setNoMoreJobs(true) }
      else { setExtraJobs(prev => [...prev, ...data]) }
    } catch { /* ignore */ }
    setMoreJobsLoading(false)
  }

  // ── JOB DETAIL MODAL ──
  const jobDetailModal = selectedJob && (
    <div className="apply-overlay" onClick={() => setSelectedJob(null)}>
      <div className="apply-modal" style={{ maxWidth: 480, width: '92vw', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setSelectedJob(null)}
          style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--ink-45)', padding: '2px 6px', borderRadius: 6 }}
          aria-label="Cerrar"
        >✕</button>

        {/* Company avatar + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.1rem' }}>
          <div className="jc-ava" style={{ width: 48, height: 48, fontSize: '1rem', flexShrink: 0 }}>
            {initials(selectedJob.companies?.company_name || '—')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1.25 }}>{selectedJob.title}</div>
            <div style={{ fontSize: '.83rem', color: 'var(--ink-70)', marginTop: '.15rem' }}>{selectedJob.companies?.company_name || '—'}{selectedJob.area ? ` · ${tv(selectedJob.area, t)}` : ''}</div>
          </div>
          {selectedJobScore !== null && (
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--head)', color: selectedJobScore >= 70 ? 'var(--forest)' : selectedJobScore >= 50 ? '#b85c00' : 'var(--ink-45)', lineHeight: 1 }}>{selectedJobScore}%</div>
              <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink-45)', marginTop: '2px' }}>fit</div>
              {selectedJobScore >= 70 && <div style={{ fontSize: '.62rem', color: 'var(--forest)', fontWeight: 700 }}>✦ {t('Match', 'Match')}</div>}
            </div>
          )}
        </div>

        {/* Tags row */}
        {[selectedJob.modality ? tv(selectedJob.modality, t) : '', selectedJob.city, selectedJob.salary_range].filter(Boolean).length > 0 && (
          <div className="jc-tags" style={{ marginBottom: '1rem' }}>
            {[selectedJob.modality ? tv(selectedJob.modality, t) : '', selectedJob.city, selectedJob.salary_range].filter(Boolean).map(tag => (
              <span key={tag} className="jc-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Description */}
        {selectedJob.description && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.4rem' }}>
              {t('Descripción', 'Description')}
            </div>
            <div style={{ fontSize: '.84rem', color: 'var(--ink-70)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {selectedJob.description}
            </div>
          </div>
        )}

        {/* Skills */}
        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-45)', marginBottom: '.4rem' }}>
              {t('Habilidades requeridas', 'Required skills')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
              {selectedJob.skills.map(s => (
                <span key={s} style={{ background: 'var(--pale)', color: 'var(--forest)', fontSize: '.76rem', borderRadius: 6, padding: '3px 9px', border: '1px solid var(--mist)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Posted date */}
        <div style={{ fontSize: '.75rem', color: 'var(--ink-45)', marginBottom: '1.3rem' }}>
          {t('Publicado', 'Posted')} · {timeAgo(selectedJob.created_at)}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          {myApplied.has(selectedJob.id) ? (
            <>
              <div style={{ borderRadius: 8, padding: '.65rem .9rem', border: '1px solid var(--mist)', background: 'var(--pale)' }}>
                {(() => {
                  const st = myAppStatuses.get(selectedJob.id)?.status || 'pending'
                  const badge = st === 'contacted' ? { label: t('🚀 ¡La empresa quiere contactarte!', '🚀 Company wants to contact you!'), bg: '#dcfce7', color: '#15803d' }
                    : st === 'reviewed' ? { label: t('👀 Tu postulación fue revisada', '👀 Your application was reviewed'), bg: '#dbeafe', color: '#1d4ed8' }
                    : st === 'rejected' ? { label: t('Tu postulación no avanzó en esta oportunidad', 'Your application was not selected'), bg: '#fef2f2', color: '#b91c1c' }
                    : { label: t('⏳ Postulación enviada — en espera de revisión', '⏳ Application sent — awaiting review'), bg: 'var(--pale)', color: 'var(--forest)' }
                  return (
                    <div style={{ background: badge.bg, color: badge.color, borderRadius: 6, padding: '.45rem .7rem', fontSize: '.81rem', fontWeight: 600, marginBottom: '.4rem', textAlign: 'center' }}>{badge.label}</div>
                  )
                })()}
                <div style={{ fontSize: '.75rem', color: 'var(--ink-45)', textAlign: 'center' }}>{appliedAgo(myApplied.get(selectedJob.id)!, t)}</div>
              </div>
              <button
                className="btn btn-sm"
                style={{ borderRadius: 8, padding: '.65rem', fontSize: '.82rem', border: '1.5px solid #e8b0b0', color: '#c0392b', background: '#fff9f9', width: '100%' }}
                disabled={withdrawing === selectedJob.id}
                onClick={() => withdrawApplication(selectedJob)}
              >
                {withdrawing === selectedJob.id ? t('Retirando…', 'Withdrawing…') : t('Retirar mi postulación', 'Withdraw application')}
              </button>
            </>
          ) : (
            <button
              className="btn btn-forest"
              style={{ width: '100%', borderRadius: 9, padding: '.75rem', fontSize: '.88rem' }}
              disabled={applying === selectedJob.id}
              onClick={() => applyToJob(selectedJob)}
            >
              {applying === selectedJob.id ? t('Enviando…', 'Sending…') : t('Quiero postularme →', 'Apply now →')}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  // ── APPLY CONFIRMATION MODAL ──
  const applyModal = appliedJob && (
    <div className="apply-overlay" onClick={() => setAppliedJob(null)}>
      <div className="apply-modal" onClick={e => e.stopPropagation()}>
        <div className="apply-modal-ico">🎉</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '.35rem' }}>
            {t('¡Postulación enviada!', 'Application submitted!')}
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--ink-70)', lineHeight: 1.6 }}>
            {t('Te postulaste a', 'You applied for')}{' '}
            <strong style={{ color: 'var(--forest)' }}>{appliedJob.title}</strong>
            {appliedJob.companies?.company_name ? (
              <>{' '}{t('en', 'at')}{' '}<strong>{appliedJob.companies.company_name}</strong></>
            ) : null}.
          </div>
          {!!(candProfile?.cv_url) && (
            <div style={{ fontSize: '.78rem', color: 'var(--ink-45)', marginTop: '.4rem' }}>
              {t('Tu CV fue compartido con la empresa.', 'Your CV was shared with the company.')}
            </div>
          )}
        </div>
        <div className="apply-modal-steps">
          <div className="apply-modal-step">
            <span className="apply-modal-step-num">1</span>
            <span>{t('La empresa revisará tu perfil en los próximos días. Si tu experiencia encaja, se pondrán en contacto.', 'The company will review your profile in the coming days. If your experience is a match, they\'ll reach out.')}</span>
          </div>
          <div className="apply-modal-step">
            <span className="apply-modal-step-num">2</span>
            <span>{t('Si no tenés noticias en 2–3 semanas, podés seguir explorando otras oportunidades — ¡el match indicado siempre aparece!', 'If you don\'t hear back in 2–3 weeks, keep exploring other opportunities — the right match always comes!')}</span>
          </div>
        </div>
        <div style={{ marginTop: '.4rem', padding: '.75rem', background: 'var(--pale)', borderRadius: '9px', fontSize: '.76rem', color: 'var(--forest)', lineHeight: 1.55, textAlign: 'center' }}>
          {t('Mantené tu perfil actualizado y subí tu CV para aumentar tus chances. 💪', 'Keep your profile updated and upload your CV to boost your chances. 💪')}
        </div>
        <button
          className="btn btn-forest"
          style={{ width: '100%', marginTop: '1.2rem', borderRadius: '9px', padding: '.75rem' }}
          onClick={() => setAppliedJob(null)}
        >
          {t('Entendido, ¡gracias!', 'Got it, thanks!')}
        </button>
      </div>
    </div>
  )

  // ── DASHBOARD ──
  if (view === 'dashboard') {
    const now = Date.now()
    const oneWeek = 7 * 24 * 3600000
    const newThisWeek = jobs.filter(j => {
      const d = j.created_at ? now - new Date(j.created_at).getTime() : Infinity
      return d < oneWeek
    }).length
    const appliedThisWeek = [...myApplied.values()].filter(ts => {
      return ts && (now - new Date(ts).getTime()) < oneWeek
    }).length

    // Profile completeness (0–100)
    const p = candProfile
    const profileFields = [p?.whatsapp, p?.area, p?.city, p?.modality, p?.experience, p?.linkedin, (p?.skills as string[] | undefined)?.length ? true : false, !!p?.cv_url]
    const profilePct = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

    // Top job recommendations (scored, un-applied, not in suggestions)
    const suggJobIds = new Set(suggestions.map(s => s.job_id))
    const recommendedJobs = candProfile
      ? jobs
          .filter(j => !myApplied.has(j.id) && !suggJobIds.has(j.id))
          .map(j => ({ ...j, _score: scoreJobForCandidate(j, candProfile) }))
          .filter(j => j._score >= 40)
          .sort((a, b) => b._score - a._score)
          .slice(0, 4)
      : []

    // Recent applications (last 3)
    const recentApplied = jobs
      .filter(j => myApplied.has(j.id))
      .sort((a, b) => {
        const ta = myApplied.get(a.id) ? new Date(myApplied.get(a.id)!).getTime() : 0
        const tb = myApplied.get(b.id) ? new Date(myApplied.get(b.id)!).getTime() : 0
        return tb - ta
      })
      .slice(0, 3)

    return (
      <>
        {ProfileErrorBanner}
        <div className="page-head">
          <div className="page-title">{t(`Hola, ${firstName}`, `Hi, ${firstName}`)}</div>
          <div className="page-sub">{t('Vacantes disponibles para tu perfil', 'Job listings matched to your profile')}</div>
        </div>

        {/* Stat chips */}
        <div className="stats-row" style={{ marginBottom: '1.4rem' }}>
          <div className="stat-card">
            <div className="stat-tag">{t('Total vacantes', 'Total listings')}</div>
            <div className="stat-num">{jobs.length || '0'}</div>
            <div className="stat-label">{t('activas ahora', 'active now')}</div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setView('jobs'); setShowSavedOnly(false) }}>
            <div className="stat-tag">{t('Nuevas esta semana', 'New this week')}</div>
            <div className="stat-num coral">{newThisWeek}</div>
            <div className="stat-label">{t('publicadas recientemente', 'recently posted')}</div>
          </div>
          <div className="stat-card" style={{ cursor: mySavedJobs.size > 0 ? 'pointer' : 'default' }} onClick={mySavedJobs.size > 0 ? () => { setView('jobs'); setShowSavedOnly(true) } : undefined}>
            <div className="stat-tag">{t('Guardadas', 'Saved')}</div>
            <div className="stat-num" style={{ color: '#e6a817' }}>{mySavedJobs.size || '0'}</div>
            <div className="stat-label">{t('para revisar después', 'to review later')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-tag">{t('Postuladas (7 días)', 'Applied (7 days)')}</div>
            <div className="stat-num" style={{ color: 'var(--forest)' }}>{appliedThisWeek}</div>
            <div className="stat-label">{t('enviadas esta semana', 'sent this week')}</div>
          </div>
          <div className="stat-card" style={{ cursor: profilePct < 100 ? 'pointer' : 'default' }} onClick={profilePct < 100 ? () => setView('profile') : undefined}>
            <div className="stat-tag">{t('Perfil completo', 'Profile complete')}</div>
            <div className="stat-num" style={{ color: profilePct >= 80 ? 'var(--forest)' : profilePct >= 50 ? '#e6a817' : 'var(--coral)' }}>{profilePct}%</div>
            <div className="stat-label" style={{ color: profilePct < 100 ? 'var(--forest)' : undefined }}>{profilePct < 100 ? t('Completar →', 'Complete →') : t('Todo listo ✓', 'All set ✓')}</div>
          </div>
        </div>

        {/* Profile checklist — shown until 100% complete */}
        {profilePct < 100 && (() => {
          const p = candProfile
          const items: Array<{ label: string; labelEn: string; done: boolean }> = [
            { label: 'WhatsApp / Teléfono', labelEn: 'WhatsApp / Phone', done: !!p?.whatsapp },
            { label: 'Área profesional', labelEn: 'Professional area', done: !!p?.area },
            { label: 'Ciudad', labelEn: 'City', done: !!p?.city },
            { label: 'Modalidad de trabajo', labelEn: 'Work mode', done: !!p?.modality },
            { label: 'Años de experiencia', labelEn: 'Years of experience', done: !!p?.experience },
            { label: 'LinkedIn', labelEn: 'LinkedIn', done: !!p?.linkedin },
            { label: 'Habilidades', labelEn: 'Skills', done: !!((p?.skills as string[] | undefined)?.length) },
            { label: 'CV / Hoja de vida', labelEn: 'CV / Resume', done: !!p?.cv_url },
          ]
          const missing = items.filter(i => !i.done)
          return (
            <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--forest)', padding: '1rem 1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--ink)' }}>{t('Completá tu perfil', 'Complete your profile')}</div>
                  <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '2px' }}>{t(`${missing.length} campo${missing.length !== 1 ? 's' : ''} pendiente${missing.length !== 1 ? 's' : ''}`, `${missing.length} field${missing.length !== 1 ? 's' : ''} remaining`)}</div>
                </div>
                <button className="btn btn-forest btn-sm" onClick={() => setView('profile')}>{t('Completar →', 'Complete →')}</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {items.map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.78rem' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: item.done ? 'var(--forest)' : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.6rem', color: 'white', fontWeight: 700 }}>
                      {item.done ? '✓' : ''}
                    </span>
                    <span style={{ color: item.done ? 'var(--ink-45)' : 'var(--ink)', textDecoration: item.done ? 'line-through' : 'none' }}>
                      {t(item.label, item.labelEn)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Job Recommendations */}
        {recommendedJobs.length > 0 && (
          <div className="card" style={{ padding: '0', marginBottom: '1rem', borderLeft: '3px solid var(--forest)' }}>
            <div style={{ padding: '1rem 1.1rem .6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="card-section-title">✦ {t('Para vos', 'Top picks for you')}</div>
                <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '1px' }}>{t('Vacantes que encajan con tu perfil', 'Jobs matching your profile')}</div>
              </div>
              <span style={{ fontSize: '.72rem', background: 'var(--forest)', color: 'white', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>{recommendedJobs.length}</span>
            </div>
            <div style={{ padding: '0 .7rem .7rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {recommendedJobs.map(j => (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem .5rem', borderRadius: 8, background: 'var(--off)', cursor: 'pointer' }} onClick={() => setSelectedJob(j)}>
                  <div className="jc-ava" style={{ width: 36, height: 36, fontSize: '.7rem', flexShrink: 0 }}>
                    {initials(j.companies?.company_name || '—')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '1px' }}>
                      {j.companies?.company_name || '—'}{j.city ? ` · ${j.city}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '.72rem', background: '#E4F0F1', color: 'var(--forest)', borderRadius: 5, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>{j._score}% fit</span>
                  <button
                    className="btn btn-forest btn-sm"
                    style={{ borderRadius: 6, padding: '4px 12px', fontSize: '.75rem', flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); applyToJob(j) }}
                  >{t('Postular →', 'Apply →')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions (Path 2 — proactive matches) */}
        {suggestions.length > 0 && (
          <div className="card" style={{ padding: '0', marginBottom: '1rem', borderLeft: '3px solid var(--coral)' }}>
            <div style={{ padding: '1rem 1.1rem .6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="card-section-title" style={{ color: 'var(--coral)' }}>✦ {t('Sugerencias para vos', 'Suggested for you')}</div>
                <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '1px' }}>{t('El algoritmo encontró estas vacantes compatibles con tu perfil', 'The algorithm found these listings matching your profile')}</div>
              </div>
              <span style={{ fontSize: '.72rem', background: 'var(--coral)', color: 'white', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>{suggestions.length}</span>
            </div>
            <div style={{ padding: '0 .7rem .7rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {suggestions.map(s => {
                const j = s.jobs
                if (!j) return null
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem .5rem', borderRadius: 8, background: 'var(--off)' }}>
                    <div className="jc-ava" style={{ width: 36, height: 36, fontSize: '.7rem', flexShrink: 0 }}>
                      {initials((j.companies as { company_name?: string })?.company_name || '—')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '1px' }}>
                        {(j.companies as { company_name?: string })?.company_name || '—'}{j.city ? ` · ${j.city}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '.72rem', background: '#E4F0F1', color: 'var(--forest)', borderRadius: 5, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>{s.match_score}% fit</span>
                    <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                      <button
                        disabled={respondingSugg === s.id}
                        onClick={() => respondToSuggestion(s.id, s.job_id, true)}
                        style={{ background: 'var(--forest)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 600, fontSize: '.75rem', cursor: 'pointer', opacity: respondingSugg === s.id ? .6 : 1 }}
                      >{t('Me interesa', "I'm in")}</button>
                      <button
                        disabled={respondingSugg === s.id}
                        onClick={() => respondToSuggestion(s.id, s.job_id, false)}
                        style={{ background: 'transparent', color: 'var(--ink-45)', border: '1px solid var(--line)', borderRadius: 6, padding: '5px 10px', fontWeight: 600, fontSize: '.75rem', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent applications */}
        {recentApplied.length > 0 && (
          <div className="card" style={{ padding: '0', marginBottom: '1rem' }}>
            <div style={{ padding: '1rem 1.1rem .5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="card-section-title">{t('Mis postulaciones recientes', 'My recent applications')}</div>
              <span style={{ fontSize: '.74rem', color: 'var(--ink-45)' }}>{myApplied.size} {t('total', 'total')}</span>
            </div>
            <div style={{ padding: '0 .7rem .7rem' }}>
              {recentApplied.map(j => (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .4rem', borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => setSelectedJob(j)}>
                  <div className="jc-ava" style={{ width: 34, height: 34, fontSize: '.72rem', flexShrink: 0 }}>
                    {initials(j.companies?.company_name || '—')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '1px' }}>{j.companies?.company_name || '—'}{j.city ? ` · ${j.city}` : ''}</div>
                  </div>
                  <span style={{ fontSize: '.7rem', color: 'var(--ink-45)', flexShrink: 0 }}>{appliedAgo(myApplied.get(j.id)!, t)}</span>
                  {(() => {
                    const st = myAppStatuses.get(j.id)?.status || 'pending'
                    const badge = st === 'contacted' ? { label: t('🚀 Contactado', '🚀 Contacted'), bg: '#dcfce7', color: '#15803d' }
                      : st === 'reviewed' ? { label: t('👀 Vista', '👀 Reviewed'), bg: '#dbeafe', color: '#1d4ed8' }
                      : st === 'rejected' ? { label: t('No avanzó', 'Not selected'), bg: '#fef2f2', color: '#b91c1c' }
                      : { label: t('⏳ Enviada', '⏳ Sent'), bg: 'var(--pale)', color: 'var(--forest)' }
                    return <span style={{ fontSize: '.68rem', background: badge.bg, color: badge.color, borderRadius: 5, padding: '2px 7px', fontWeight: 600, flexShrink: 0 }}>{badge.label}</span>
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match history */}
        {acceptedMatches.length > 0 && (
          <div className="card" style={{ padding: '0', marginBottom: '1rem', borderLeft: '3px solid #16a34a' }}>
            <div style={{ padding: '1rem 1.1rem .6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="card-section-title" style={{ color: '#16a34a' }}>🤝 {t('Mis matches confirmados', 'My confirmed matches')}</div>
                <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '1px' }}>{t('Vacantes donde aceptaste el match — la empresa tiene tu contacto', 'Listings where you accepted — the company has your contact')}</div>
              </div>
              <span style={{ fontSize: '.72rem', background: '#16a34a', color: 'white', borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>{acceptedMatches.length}</span>
            </div>
            <div style={{ padding: '0 .7rem .7rem' }}>
              {acceptedMatches.map(s => {
                const job = s.jobs as { title?: string; area?: string; city?: string; modality?: string; companies?: { company_name?: string } } | undefined
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .4rem', borderBottom: '1px solid var(--line)' }}>
                    <div className="jc-ava" style={{ width: 34, height: 34, fontSize: '.72rem', flexShrink: 0, background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                      {initials(job?.companies?.company_name || '—')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job?.title || '—'}</div>
                      <div style={{ fontSize: '.73rem', color: 'var(--ink-45)', marginTop: '1px' }}>{job?.companies?.company_name || '—'}{job?.city ? ` · ${job.city}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span style={{ fontSize: '.68rem', background: '#dcfce7', color: '#16a34a', borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>✓ Match</span>
                      <span style={{ fontSize: '.65rem', color: 'var(--ink-45)' }}>{s.match_score}% fit</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Job list */}
        {dataLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton-card">
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                  <div className="skeleton skeleton-avatar" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    <div className="skeleton skeleton-line medium" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                </div>
                <div className="skeleton skeleton-line full" style={{ height: 10 }} />
              </div>
            ))}
          </div>
        )}

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
                <JobRow key={j.id} job={j} applied={myApplied.has(j.id)} appliedAt={myApplied.get(j.id)} appStatus={myAppStatuses.get(j.id)?.status} saved={mySavedJobs.has(j.id)} onApply={applyToJob} onWithdraw={withdrawApplication} onSave={saveJob} onUnsave={unsaveJob} onSelect={setSelectedJob} fitScore={candProfile ? scoreJobForCandidate(j, candProfile) : undefined} t={t} />
              ))}
            </div>
          </div>
        )}
        {jobDetailModal}
        {applyModal}
      </>
    )
  }

  // ── BUSCAR TRABAJO ──
  if (view === 'jobs')
    return (
      <>
        {ProfileErrorBanner}
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
            <select className="filter-select" value={filterArea} onChange={e => { setFilterArea(e.target.value); setExtraJobs([]); setNoMoreJobs(false); loadJobs(query, e.target.value, filterCity, filterMod, filterSal) }}>
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
            <select className="filter-select" value={filterCity} onChange={e => { setFilterCity(e.target.value); setExtraJobs([]); setNoMoreJobs(false); loadJobs(query, filterArea, e.target.value, filterMod, filterSal) }}>
              <option value="">{t('Ciudad', 'City')}</option>
              <option>Bogotá</option><option>Medellín</option><option>Cali</option>
              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
              <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
              <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
              <option>Montería</option><option>Villavicencio</option>
            </select>
            <select className="filter-select" value={filterMod} onChange={e => { setFilterMod(e.target.value); setExtraJobs([]); setNoMoreJobs(false); loadJobs(query, filterArea, filterCity, e.target.value, filterSal) }}>
              <option value="">{t('Modalidad', 'Mode')}</option>
              <option>{t('Presencial', 'On-site')}</option>
              <option>{t('Remoto', 'Remote')}</option>
              <option>{t('Híbrido', 'Hybrid')}</option>
            </select>
            <select className="filter-select" value={filterSal} onChange={e => { setFilterSal(e.target.value); setExtraJobs([]); setNoMoreJobs(false); loadJobs(query, filterArea, filterCity, filterMod, e.target.value) }}>
              <option value="">{t('Salario', 'Salary')}</option>
              <option>Hasta $2M</option>
              <option>$2M – $4M</option>
              <option>$4M – $7M</option>
              <option>$7M – $12M</option>
              <option>$12M+</option>
            </select>
            {(query || filterArea || filterCity || filterMod || filterSal) && (
              <button
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => { setQuery(''); setFilterArea(''); setFilterCity(''); setFilterMod(''); setFilterSal(''); setExtraJobs([]); setNoMoreJobs(false); loadJobs() }}
              >
                {t('Limpiar todo ✕', 'Clear all ✕')}
              </button>
            )}
          </div>
        </div>

        {/* Saved filter toggle */}
        {mySavedJobs.size > 0 && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem' }}>
            <button
              className={`btn btn-sm ${!showSavedOnly ? 'btn-forest' : 'btn-outline'}`}
              onClick={() => setShowSavedOnly(false)}
            >{t('Todas', 'All')}</button>
            <button
              className={`btn btn-sm ${showSavedOnly ? 'btn-forest' : 'btn-outline'}`}
              onClick={() => setShowSavedOnly(true)}
            >★ {t(`Guardadas (${mySavedJobs.size})`, `Saved (${mySavedJobs.size})`)}</button>
          </div>
        )}

        {dataLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton-card">
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                  <div className="skeleton skeleton-avatar" style={{ borderRadius: 8 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    <div className="skeleton skeleton-line medium" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                  <div className="skeleton skeleton-line" style={{ width: 52, height: 22, borderRadius: 20 }} />
                </div>
                <div className="skeleton skeleton-line" style={{ width: '80%', height: 10 }} />
              </div>
            ))}
          </div>
        )}

        {!dataLoading && (() => {
          const allJobs = showSavedOnly ? jobs.filter(j => mySavedJobs.has(j.id)) : [...jobs, ...extraJobs]
          if (allJobs.length === 0) return (
            <div className="empty-state">
              <div className="empty-title">{showSavedOnly ? t('Sin guardadas', 'No saved jobs') : t('Sin resultados', 'No results')}</div>
              <div className="empty-sub">{showSavedOnly ? t('Guardá vacantes con ★ para verlas aquí.', 'Bookmark jobs with ★ to see them here.') : t('Intentá con otros filtros.', 'Try different filters.')}</div>
            </div>
          )
          return (
            <>
              <div className="jobs-list">
                {allJobs.map((j) => (
                  <JobRow key={j.id} job={j} applied={myApplied.has(j.id)} appliedAt={myApplied.get(j.id)} appStatus={myAppStatuses.get(j.id)?.status} saved={mySavedJobs.has(j.id)} onApply={applyToJob} onWithdraw={withdrawApplication} onSave={saveJob} onUnsave={unsaveJob} onSelect={setSelectedJob} fitScore={candProfile ? scoreJobForCandidate(j, candProfile) : undefined} t={t} />
                ))}
              </div>
              {!showSavedOnly && !noMoreJobs && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <button
                    className="btn btn-outline"
                    onClick={loadMoreJobs}
                    disabled={moreJobsLoading}
                    style={{ borderRadius: 8, padding: '8px 24px', fontSize: '.82rem' }}
                  >
                    {moreJobsLoading ? t('Cargando…', 'Loading…') : t('Cargar más →', 'Load more →')}
                  </button>
                </div>
              )}
            </>
          )
        })()}
        {jobDetailModal}
        {applyModal}
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
        const updates: Record<string, unknown> = {
          whatsapp: editData.phone.trim() || null,
          city: editData.city || null,
          modality: editData.modality || null,
          area: editData.area || null,
          experience: editData.experience || null,
          salary_range: editData.salary_range || null,
          linkedin: editData.linkedin.trim() || null,
          notes: editData.notes.trim() || null,
          skills: editSkills.length > 0 ? editSkills : null,
        }
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
        const { data: upData, error: upErr } = await sb.storage.from('candidatos').upload(path, file, { upsert: true })
        if (upErr || !upData?.path) {
          showToast(t('Error al subir CV', 'CV upload failed'), t('Intentá de nuevo o usá un archivo más pequeño', 'Try again or use a smaller file'), '⚠️')
        } else {
          const { data: urlData } = sb.storage.from('candidatos').getPublicUrl(upData.path)
          const newUrl = urlData?.publicUrl || ''
          const { data: updated } = await sb.from('candidates').update({ cv_url: newUrl }).ilike('email', user?.email || '').select().maybeSingle()
          if (updated) onProfileUpdate(updated)
        }
      } catch (e) { console.error(e); showToast(t('Error al subir CV', 'CV upload failed'), t('Revisá tu conexión e intentá de nuevo', 'Check your connection and try again'), '⚠️') }
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

    const uploadPhoto = async (file: File) => {
      if (!user?.email) return
      setPhotoUploading(true)
      try {
        const sb = createClient()
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `photos/${user.email.replace(/[^a-z0-9]/gi, '_')}-photo.${ext}`
        // Remove old photo if exists
        const oldUrl = (candProfile?.photo_url as string | undefined)
        if (oldUrl) {
          const m = oldUrl.match(/\/candidatos\/(.+)$/)
          if (m) await sb.storage.from('candidatos').remove([m[1]])
        }
        const { data: upData } = await sb.storage.from('candidatos').upload(path, file, { upsert: true })
        if (upData) {
          const { data: urlData } = sb.storage.from('candidatos').getPublicUrl(upData.path)
          const newUrl = urlData?.publicUrl || ''
          const { data: updated } = await sb.from('candidates').update({ photo_url: newUrl }).ilike('email', user.email).select().maybeSingle()
          if (updated) onProfileUpdate(updated)
        }
      } catch (e) { console.error(e) }
      setPhotoUploading(false)
    }

    const addEditSkill = () => {
      const v = editSkInput.trim()
      if (v && !editSkills.includes(v)) setEditSkills(prev => [...prev, v])
      setEditSkInput('')
    }

    const openToWork = (p?.open_to_work as boolean | undefined) ?? true
    const toggleOpenToWork = async () => {
      if (!user?.email || openToWorkSaving) return
      setOpenToWorkSaving(true)
      try {
        const sb = createClient()
        const { data: updated } = await sb.from('candidates').update({ open_to_work: !openToWork }).ilike('email', user.email).select().maybeSingle()
        if (updated) onProfileUpdate(updated)
      } catch (e) { console.error(e) }
      setOpenToWorkSaving(false)
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
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {(candProfile?.photo_url as string | undefined) ? (
                <img src={candProfile?.photo_url as string} alt={user?.name || ''} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                  {(user?.name || '').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <label style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={t('Cambiar foto', 'Change photo')}>
                  <span style={{ fontSize: '.75rem', color: 'white', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{photoUploading ? '⏳' : '📷'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />
                </label>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'var(--head)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.02em' }}>{user?.name || '—'}</div>
                <button
                  onClick={toggleOpenToWork}
                  disabled={openToWorkSaving}
                  title={t('Click para cambiar tu estado', 'Click to change your status')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                    fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 50,
                    border: `1px solid ${openToWork ? 'var(--mist)' : 'var(--line)'}`,
                    background: openToWork ? 'var(--pale)' : 'var(--off)',
                    color: openToWork ? 'var(--forest)' : 'var(--ink-45)',
                    cursor: openToWorkSaving ? 'wait' : 'pointer',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: openToWork ? '#16a34a' : 'var(--ink-45)' }} />
                  {openToWork ? t('Abierto/a a oportunidades', 'Open to opportunities') : t('No buscando activamente', 'Not actively looking')}
                </button>
              </div>
              <div style={{ fontSize: '.76rem', color: 'var(--ink-45)', marginTop: '2px' }}>
                {[tv(area, t), city].filter(Boolean).join(' · ') || user?.email}
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
                  : <span style={{ fontSize: '.82rem' }}>{area ? tv(area, t) : <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Experiencia', 'Exp.')}</span>
                {isEditing
                  ? <select style={sel} value={editData.experience} onChange={e => setEdit('experience', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {[t('Sin experiencia','No experience'),t('1–2 años','1–2 years'),t('3–5 años','3–5 years'),t('5–10 años','5–10 years'),t('10+ años','10+ years')].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{experience ? tv(experience, t) : <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Modalidad', 'Mode')}</span>
                {isEditing
                  ? <select style={sel} value={editData.modality} onChange={e => setEdit('modality', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {[t('Presencial','On-site'),t('Remoto','Remote'),t('Híbrido','Hybrid')].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{modality ? tv(modality, t) : <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Ciudad', 'City')}</span>
                {isEditing
                  ? <select style={sel} value={editData.city} onChange={e => setEdit('city', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Cúcuta','Manizales','Pereira','Santa Marta','Ibagué','Pasto','Montería','Villavicencio'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  : <span style={{ fontSize: '.82rem' }}>{city || <span style={{ color: 'var(--ink-45)' }}>—</span>}</span>}
              </div>
              <div className="profile-row">
                <span className="profile-lbl">{t('Pretensión', 'Salary')}</span>
                {isEditing
                  ? <select style={sel} value={editData.salary_range} onChange={e => setEdit('salary_range', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      {['Hasta $2M','$2M – $4M','$4M – $7M','$7M – $12M','$12M+'].map(o => <option key={o}>{o}</option>)}
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
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      aria-checked={on}
      role="switch"
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? 'var(--forest)' : 'var(--line)',
        position: 'relative', transition: 'background .18s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: 'white',
        transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Configuración', 'Settings')}</div>
        <div className="page-sub">{t('Preferencias de tu cuenta', 'Account preferences')}</div>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="settings-section-title">{t('Cuenta', 'Account')}</div>
        <div className="profile-row"><span className="profile-lbl">Email</span><span style={{ fontSize: '.82rem' }}>{user?.email || '—'}</span></div>
        <div className="profile-row"><span className="profile-lbl">{t('Nombre', 'Name')}</span><span style={{ fontSize: '.82rem' }}>{user?.name || '—'}</span></div>
        <div className="settings-section-title" style={{ marginTop: '1.4rem' }}>{t('Notificaciones', 'Notifications')}</div>
        <div className="profile-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="profile-lbl" style={{ display: 'block' }}>{t('Matches por email', 'Email matches')}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--ink-45)' }}>{t('Recibir notificaciones cuando haya nuevos matches', 'Get notified when new matches are found')}</span>
          </div>
          <Toggle on={notifMatches} onToggle={() => { const v = !notifMatches; setNotifMatches(v); saveNotifMatches(v) }} />
        </div>
        <div className="profile-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="profile-lbl" style={{ display: 'block' }}>{t('Actualizaciones de plataforma', 'Platform updates')}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--ink-45)' }}>{t('Novedades y mejoras de Candidato®', 'News and improvements from Candidato®')}</span>
          </div>
          <Toggle on={notifUpdates} onToggle={() => { const v = !notifUpdates; setNotifUpdates(v); saveNotifUpdates(v) }} />
        </div>
        <div className="settings-section-title" style={{ marginTop: '1.4rem' }}>{t('Privacidad', 'Privacy')}</div>
        <div className="profile-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="profile-lbl" style={{ display: 'block' }}>{t('Perfil visible para empresas', 'Profile visible to companies')}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--ink-45)' }}>{t('Las empresas pueden encontrarte en búsquedas', 'Companies can discover you in searches')}</span>
          </div>
          <Toggle on={profileVisible} onToggle={() => { const v = !profileVisible; setProfileVisible(v); saveProfileVisible(v) }} />
        </div>
        <div className="settings-section-title" style={{ marginTop: '1.4rem' }}>{t('Referidos', 'Referrals')}</div>
        <div style={{ padding: '.75rem', background: 'var(--pale)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <div style={{ fontSize: '.82rem', color: 'var(--ink)', fontWeight: 600 }}>{t('Invitá a un amigo', 'Invite a friend')}</div>
          <div style={{ fontSize: '.74rem', color: 'var(--ink-45)', lineHeight: 1.5 }}>{t('Compartí tu link único. Cada candidato que se registre con tu link suma a tu red.', 'Share your unique link. Every candidate who signs up with it joins your network.')}</div>
          {user?.email && (() => {
            const refCode = btoa(user.email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)
            const refUrl = `https://candidato.com.co/app?ref=${refCode}`
            return (
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.25rem' }}>
                <input readOnly value={refUrl} style={{ flex: 1, fontSize: '.73rem', padding: '6px 9px', border: '1px solid var(--line)', borderRadius: 7, background: 'white', color: 'var(--ink-70)' }} onClick={e => (e.target as HTMLInputElement).select()} />
                <button className="btn btn-forest btn-sm" onClick={() => { navigator.clipboard.writeText(refUrl).then(() => {}) }}>{t('Copiar', 'Copy')}</button>
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}

function scoreJobForCandidate(job: Job, cand: Record<string, unknown>): number {
  let score = 0
  const expRank = (e: string) => {
    if (e === 'Sin experiencia') return 0
    if (e === '1-2 años' || e === '1–2 años') return 1
    if (e === '3-5 años' || e === '3–5 años') return 2
    if (['5-10 años','5–10 años','6+ años','10+ años'].includes(e)) return 3
    return -1
  }
  if (cand.area && job.area && cand.area === job.area) score += 40
  if (cand.modality && job.modality) {
    if (cand.modality === job.modality) score += 20
    else if (job.modality === 'Remoto' || cand.modality === 'Remoto') score += 12
    else if (job.modality === 'Híbrido' || cand.modality === 'Híbrido') score += 8
  }
  if (job.modality === 'Remoto') score += 15
  else if (cand.city && job.city && cand.city === job.city) score += 15
  if (!job.required_experience) score += 15
  else if (cand.experience) {
    const cr = expRank(cand.experience as string), jr = expRank(job.required_experience)
    if (cr >= jr) score += 15
    else if (cr === jr - 1) score += 8
  }
  const js = job.skills || [], cs = (cand.skills as string[]) || []
  if (!js.length) score += 10
  else if (cs.length) {
    const m = js.filter(s => cs.some(c => c.toLowerCase() === s.toLowerCase())).length
    score += Math.round((m / js.length) * 10)
  }
  return Math.min(score, 100)
}

function JobRow({ job, applied, appliedAt, appStatus, saved, onApply, onWithdraw, onSave, onUnsave, onSelect, fitScore, t }: {
  job: Job
  applied?: boolean
  appliedAt?: string
  appStatus?: string
  saved?: boolean
  onApply?: (job: Job) => void
  onWithdraw?: (job: Job) => void
  onSave?: (job: Job) => void
  onUnsave?: (job: Job) => void
  onSelect?: (job: Job) => void
  fitScore?: number
  t?: (es: string, en: string) => string
}) {
  const tr = t || ((es: string) => es)
  const coName = job.companies?.company_name || '—'
  const tags = [job.modality ? tv(job.modality, tr) : '', job.city, job.salary_range].filter(Boolean)
  const daysLeft = job.closes_at ? Math.ceil((new Date(job.closes_at.split('T')[0] + 'T00:00:00').getTime() - new Date(new Date().toISOString().split('T')[0] + 'T00:00:00').getTime()) / 86400000) : null
  return (
    <div
      className="job-card"
      style={{ cursor: onSelect ? 'pointer' : undefined }}
      onClick={() => onSelect?.(job)}
    >
      <div className="jc-ava">{initials(coName)}</div>
      <div className="jc-body">
        <div className="jc-title">{job.title}</div>
        <div className="jc-meta">{coName}{job.area ? ` · ${tv(job.area, tr)}` : ''}</div>
        {tags.length > 0 && (
          <div className="jc-tags">
            {tags.map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
            {daysLeft !== null && daysLeft <= 7 && (
              <span className="jc-tag" style={{ color: daysLeft <= 2 ? '#c0392b' : '#b85c00', borderColor: daysLeft <= 2 ? '#f5c0b0' : '#f5dcb0', background: daysLeft <= 2 ? '#fff5f3' : '#fffbf0' }}>
                {daysLeft <= 0 ? tr('Vence hoy', 'Closes today') : tr(`Cierra en ${daysLeft}d`, `Closes in ${daysLeft}d`)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="jc-right" onClick={e => e.stopPropagation()}>
        {fitScore !== undefined && (
          <span style={{ fontSize: '.7rem', background: fitScore >= 70 ? '#E4F0F1' : 'var(--off)', color: fitScore >= 70 ? 'var(--forest)' : 'var(--ink-45)', borderRadius: 5, padding: '2px 7px', fontWeight: 700, marginBottom: '.2rem', display: 'block', textAlign: 'right' }}>{fitScore}% fit</span>
        )}
        {(onSave || onUnsave) && (
          <button
            title={saved ? tr('Quitar guardado', 'Remove bookmark') : tr('Guardar para después', 'Save for later')}
            onClick={e => { e.stopPropagation(); saved ? onUnsave?.(job) : onSave?.(job) }}
            style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, color: saved ? '#e6a817' : 'var(--ink-45)', marginBottom: '.1rem' }}
          >
            {saved ? '★' : '☆'}
          </button>
        )}
        <span className="jc-time">{timeAgo(job.created_at)}</span>
        {applied ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.2rem', marginTop: '.35rem' }}>
            {(() => {
              const st = appStatus || 'pending'
              const badge = st === 'contacted' ? { label: tr('🚀 Contactado', '🚀 Contacted'), bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }
                : st === 'reviewed' ? { label: tr('👀 Vista', '👀 Reviewed'), bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' }
                : st === 'rejected' ? { label: tr('No avanzó', 'Not selected'), bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
                : { label: tr('⏳ Enviada', '⏳ Sent'), bg: 'var(--pale)', color: 'var(--forest)', border: 'var(--mist)' }
              return <span style={{ background: badge.bg, color: badge.color, border: `1.5px solid ${badge.border}`, borderRadius: 7, padding: '3px 10px', fontSize: '.75rem', fontWeight: 600 }}>{badge.label}</span>
            })()}
            {appliedAt && (
              <span style={{ fontSize: '.68rem', color: 'var(--ink-45)' }}>
                {appliedAgo(appliedAt, tr)}
              </span>
            )}
            {onWithdraw && (
              <button
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '.68rem', color: '#c0392b', cursor: 'pointer', textDecoration: 'underline', opacity: .8 }}
                onClick={() => onWithdraw(job)}
              >
                {tr('Retirar', 'Withdraw')}
              </button>
            )}
          </div>
        ) : onApply ? (
          <button
            className="btn btn-sm btn-forest"
            style={{ marginTop: '.4rem', borderRadius: 7, padding: '4px 14px', fontSize: '.76rem' }}
            onClick={() => onApply(job)}
          >
            {tr('Postularme →', 'Apply →')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function RecommendedCandCard({ c, coName, coIndustry, jobTitle, lookingForAreas, lookingForExperience, lookingForModality, t }: {
  c: Candidate & { score: number }
  coName: string
  coIndustry: string
  jobTitle: string
  lookingForAreas: string
  lookingForExperience: string
  lookingForModality: string
  t: (es: string, en: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [notified, setNotified] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleContact() {
    if (notified) { setOpen(o => !o); return }
    setSending(true)
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'company_contacted',
          to: c.email,
          name: c.name?.split(' ')[0] || c.name,
          extra: {
            companyName: coName,
            companyIndustry: coIndustry,
            candidateArea: c.area || '',
            jobTitle,
            lookingForAreas,
            lookingForExperience,
            lookingForModality,
          },
        }),
      })
    } catch { /* non-blocking */ }
    setNotified(true)
    setOpen(true)
    setSending(false)
  }

  return (
    <div style={{ background: 'var(--off)', borderRadius: 10, padding: '.9rem 1rem', border: '1.5px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.6rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '.78rem', fontWeight: 700, color: 'white' }}>
            {initials(c.name)}
          </div>
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#16a34a', border: '2px solid var(--off)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.83rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          {c.area && <div style={{ fontSize: '.72rem', color: 'var(--forest)', fontWeight: 600, marginTop: '1px' }}>{c.area}</div>}
        </div>
        <span style={{ background: 'var(--pale)', color: 'var(--forest)', border: '1px solid var(--mist)', borderRadius: 50, padding: '2px 8px', fontSize: '.67rem', fontWeight: 700, flexShrink: 0 }}>
          {c.score >= 5 ? '🔥' : c.score >= 3 ? '⭐' : '✓'} {t('Match', 'Match')}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.75rem' }}>
        {[c.experience, c.city, c.modality].filter(Boolean).map(tag => (
          <span key={tag} className="jc-tag" style={{ fontSize: '.68rem', padding: '2px 7px' }}>{tag}</span>
        ))}
      </div>
      <button
        className={`btn btn-sm${notified ? '' : ' btn-forest'}`}
        disabled={sending}
        style={{ width: '100%', justifyContent: 'center', fontSize: '.74rem', borderRadius: 7,
          ...(notified ? { background: 'var(--pale)', color: 'var(--forest)', border: '1.5px solid var(--mist)' } : {}) }}
        onClick={handleContact}
      >
        {sending ? t('Enviando…', 'Sending…') : notified ? t('✓ Notificado — Ver contacto', '✓ Notified — View contact') : t('Notificar interés →', 'Notify interest →')}
      </button>
      {notified && open && (
        <div style={{ background: 'var(--white)', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.81rem', lineHeight: 2, marginTop: '.6rem', border: '1px solid var(--line)' }}>
          {c.email && <div>📧 <a href={`mailto:${c.email}`} style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.email}</a></div>}
          {c.whatsapp && <div>📱 <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>{c.whatsapp}</a></div>}
          {c.linkedin && <div>🔗 <a href={c.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>LinkedIn</a></div>}
          {c.cv_url && <div>📄 <a href={c.cv_url} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)', fontWeight: 600 }}>{t('Ver CV', 'View CV')}</a></div>}
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '.72rem', color: 'var(--ink-45)', cursor: 'pointer', marginTop: '.2rem', padding: 0 }}>
            {t('Ocultar', 'Hide')}
          </button>
        </div>
      )}
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
  loadCandidates: (q?: string, area?: string, city?: string, modality?: string, salary?: string, experience?: string) => void
  setView: (v: CompView) => void
  t: (es: string, en: string) => string
}) {
  const [coProfile, setCoProfile] = useState<CompanyProfile | null>(null)
  const [coJobs, setCoJobs] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    if (!userEmail) return
    createClient().from('companies').select('*').ilike('email', userEmail).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCoProfile(data)
          createClient().from('jobs').select('id,title').eq('company_id', data.id).order('created_at', { ascending: false })
            .then(({ data: jobs }) => { if (jobs) setCoJobs(jobs) })
        }
      })
  }, [userEmail])

  // Simple skill/area-based candidate matching
  function getMatchedCandidates(): Array<Candidate & { score: number }> {
    const areas = coProfile?.looking_for_areas || []
    const exp = coProfile?.looking_for_experience || ''
    const mod = coProfile?.looking_for_modality || ''
    const skills = coProfile?.looking_for_skills || []
    return candidates
      .map(c => {
        let score = 0
        if (c.area && areas.includes(c.area)) score += 3
        if (exp && c.experience && c.experience.includes(exp.split(' ')[0])) score += 2
        if (mod && c.modality === mod) score += 2
        const cSkills = c.skills || []
        score += cSkills.filter(s => skills.some(sk => sk.toLowerCase() === s.toLowerCase())).length
        return { ...c, score }
      })
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }

  if (view === 'codashboard') {
    const matches = getMatchedCandidates()
    const hasProfile = !!(coProfile?.looking_for_areas?.length || coProfile?.looking_for_experience)
    return (
      <>
        <div className="page-head">
          <div className="page-title">{coName}</div>
          <div className="page-sub">{t('Panel de reclutamiento', 'Recruitment dashboard')}</div>
          <div className="page-actions">
            <button className="btn btn-forest btn-sm" onClick={() => setView('post')}>
              {t('+ Publicar vacante', '+ Post a listing')}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setView('talent'); loadCandidates() }}>
              {t('Ver todos →', 'View all →')}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.2rem' }}>
          <div className="card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.35rem' }}>{t('Candidatos en el pool', 'Candidates in pool')}</div>
            <div style={{ fontFamily: 'var(--head)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{candidates.length || '0'}</div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.7rem', fontSize: '.73rem' }} onClick={() => { setView('talent'); loadCandidates() }}>
              {t('Ver todos →', 'View all →')}
            </button>
          </div>
          <div className="card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.35rem' }}>{t('Mejores matches', 'Best matches')}</div>
            <div style={{ fontFamily: 'var(--head)', fontSize: '1.8rem', fontWeight: 800, color: hasProfile ? 'var(--forest)' : 'var(--ink-45)', lineHeight: 1 }}>{hasProfile ? matches.length : '—'}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '.45rem' }}>
              {hasProfile ? t('basado en tu perfil', 'based on your profile') : (
                <button className="btn btn-outline btn-sm" style={{ fontSize: '.7rem', marginTop: '.1rem' }} onClick={() => setView('mycompany')}>
                  {t('Completar perfil →', 'Complete profile →')}
                </button>
              )}
            </div>
          </div>
          <div className="card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.35rem' }}>{t('Tu empresa', 'Your company')}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-70)', lineHeight: 1.65, marginTop: '.2rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{coName}</div>
              {coProfile?.industry && <div>{coProfile.industry}</div>}
              {coProfile?.city && <div>📍 {coProfile.city}</div>}
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: '.7rem', fontSize: '.73rem' }} onClick={() => setView('mycompany')}>
              {t('Editar perfil →', 'Edit profile →')}
            </button>
          </div>
        </div>

        {/* Best match candidates */}
        {hasProfile && matches.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem', padding: '1.1rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.9rem', color: 'var(--ink)' }}>
                  ✨ {t('Candidatos recomendados', 'Recommended candidates')}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--ink-45)', marginTop: '2px' }}>
                  {t('Mejor match con el perfil de tu empresa', 'Best match with your company profile')}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ fontSize: '.73rem' }} onClick={() => { setView('talent'); loadCandidates() }}>
                {t('Ver todos →', 'View all →')}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '.85rem' }}>
              {matches.map(c => <RecommendedCandCard key={c.id} c={c} coName={(coProfile?.company_name as string) || coName} coIndustry={(coProfile?.industry as string) || ''} jobTitle={coJobs[0]?.title || ''} lookingForAreas={((coProfile?.looking_for_areas as string[]) || []).join(', ')} lookingForExperience={(coProfile?.looking_for_experience as string) || ''} lookingForModality={(coProfile?.looking_for_modality as string) || ''} t={t} />)}
            </div>
          </div>
        )}

        {/* Profile completion nudge */}
        {!hasProfile && (
          <div style={{ background: 'linear-gradient(135deg,var(--pale),#f0faf0)', border: '1.5px solid var(--mist)', borderRadius: 12, padding: '1.3rem 1.4rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.8rem' }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--ink)', marginBottom: '.2rem' }}>
                {t('Activá el matching inteligente', 'Activate smart matching')}
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--ink-70)', lineHeight: 1.6 }}>
                {t('Completá el perfil de tu empresa para que el algoritmo identifique los candidatos más compatibles automáticamente.', 'Complete your company profile so the algorithm identifies the most compatible candidates automatically.')}
              </div>
            </div>
            <button className="btn btn-forest btn-sm" style={{ flexShrink: 0 }} onClick={() => setView('mycompany')}>
              {t('Completar perfil →', 'Complete profile →')}
            </button>
          </div>
        )}

        {/* Recent candidates — only shown when no matching profile configured */}
        {!hasProfile && candidates.length > 0 && (
          <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
              <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.9rem', color: 'var(--ink)' }}>
                {t('Candidatos recientes', 'Recent candidates')}
              </div>
              <button className="btn btn-outline btn-sm" style={{ fontSize: '.73rem' }} onClick={() => { setView('talent'); loadCandidates() }}>
                {t('Ver todos →', 'View all →')}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '.85rem' }}>
              {candidates.slice(0, 4).map(c => <CandCard key={c.id} c={c} coName={(coProfile?.company_name as string) || ''} t={t} />)}
            </div>
          </div>
        )}
      </>
    )
  }

  if (view === 'mycompany')
    return <MyCompanyView userEmail={userEmail} coProfile={coProfile} onUpdate={setCoProfile} t={t} />

  if (view === 'talent')
    return <TalentView candidates={candidates} loadCandidates={loadCandidates} t={t} />

  if (view === 'myjobs')
    return <MyJobsView userEmail={userEmail} coName={(coProfile?.company_name as string) || ''} onPost={() => setView('post')} t={t} />

  if (view === 'post')
    return <PostJobView userEmail={userEmail} onSuccess={() => setView('myjobs')} t={t} />

  return null
}

function MyCompanyView({ userEmail, coProfile, onUpdate, t }: {
  userEmail: string
  coProfile: CompanyProfile | null
  onUpdate: (p: CompanyProfile) => void
  t: (es: string, en: string) => string
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [areaInput, setAreaInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    company_name: '',
    website: '',
    linkedin: '',
    city: '',
    industry: '',
    size: '',
    description: '',
    mission: '',
    values: '',
    looking_for_experience: '',
    looking_for_modality: '',
  })
  const [lookingAreas, setLookingAreas] = useState<string[]>([])
  const [lookingSkills, setLookingSkills] = useState<string[]>([])

  useEffect(() => {
    if (!coProfile) return
    setForm({
      company_name: (coProfile.company_name as string) || '',
      website: (coProfile.website as string) || '',
      linkedin: (coProfile.linkedin as string) || '',
      city: (coProfile.city as string) || '',
      industry: (coProfile.industry as string) || '',
      size: (coProfile.size as string) || '',
      description: (coProfile.description as string) || '',
      mission: (coProfile.mission as string) || '',
      values: (coProfile.values as string) || '',
      looking_for_experience: (coProfile.looking_for_experience as string) || '',
      looking_for_modality: (coProfile.looking_for_modality as string) || '',
    })
    setLookingAreas((coProfile.looking_for_areas as string[]) || [])
    setLookingSkills((coProfile.looking_for_skills as string[]) || [])
  }, [coProfile])

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  async function save() {
    setSaving(true)
    try {
      const sb = createClient()
      const payload: Record<string, unknown> = {
        company_name: form.company_name.trim() || null,
        website: form.website.trim() || null,
        linkedin: form.linkedin.trim() || null,
        city: form.city || null,
        industry: form.industry || null,
        size: form.size || null,
        description: form.description.trim() || null,
        mission: form.mission.trim() || null,
        values: form.values.trim() || null,
        looking_for_experience: form.looking_for_experience || null,
        looking_for_modality: form.looking_for_modality || null,
        looking_for_areas: lookingAreas.length > 0 ? lookingAreas : null,
        looking_for_skills: lookingSkills.length > 0 ? lookingSkills : null,
      }
      const { data } = await sb.from('companies').update(payload).ilike('email', userEmail).select().maybeSingle()
      if (data) { onUpdate(data); setEditing(false) }
    } catch (e) { console.warn(e) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', background: 'var(--off)', border: '1.5px solid transparent', borderRadius: 8, padding: '9px 11px', color: 'var(--ink)', fontFamily: 'var(--body)', fontSize: '.83rem', outline: 'none' }
  const inpFocus: React.CSSProperties = { ...inp, border: '1.5px solid var(--forest)' }
  const lbl: React.CSSProperties = { fontSize: '.65rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ink-45)', display: 'block', marginBottom: '.3rem' }
  const matchLbl: React.CSSProperties = { ...lbl, color: 'var(--forest)' }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--ink)', marginBottom: '.85rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--line)' }}>{children}</div>
  )

  const coCompleteness = (() => {
    if (!coProfile) return 0
    const fields = [coProfile.company_name, coProfile.industry, coProfile.size, coProfile.city, coProfile.description, coProfile.mission, coProfile.looking_for_areas?.length, coProfile.looking_for_modality]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  })()

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Mi empresa', 'My company')}</div>
        <div className="page-sub">{t('Perfil de tu empresa · Información de matching', 'Company profile · Matching info')}</div>
        {!editing && (
          <div className="page-actions">
            <button className="btn btn-forest btn-sm" onClick={() => setEditing(true)}>{t('Editar perfil', 'Edit profile')}</button>
          </div>
        )}
      </div>

      {!editing && coCompleteness < 80 && (
        <div style={{ background: '#fffbf0', border: '1.5px solid #f5dcb0', borderRadius: 10, padding: '.75rem 1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '.83rem', color: '#7a5c00', marginBottom: '.2rem' }}>
              {t(`Perfil ${coCompleteness}% completo`, `Profile ${coCompleteness}% complete`)}
            </div>
            <div style={{ fontSize: '.75rem', color: '#9a7a30', lineHeight: 1.5 }}>
              {t('Un perfil completo mejora la calidad de los matches con candidatos.', 'A complete profile improves the quality of candidate matches.')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexShrink: 0 }}>
            <div style={{ width: 80, height: 6, borderRadius: 4, background: '#f5e0a0', overflow: 'hidden' }}>
              <div style={{ width: `${coCompleteness}%`, height: '100%', background: '#e6ac00', borderRadius: 4 }} />
            </div>
            <button className="btn btn-sm" style={{ background: '#e6ac00', color: '#fff', border: 'none' }} onClick={() => setEditing(true)}>
              {t('Completar →', 'Complete →')}
            </button>
          </div>
        </div>
      )}

      {!editing ? (
        // ── VIEW MODE ──
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Left col — company info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <SectionTitle>🏢 {t('Información general', 'General info')}</SectionTitle>
              <div className="profile-row"><span className="profile-lbl">{t('Empresa', 'Company')}</span><span>{coProfile?.company_name || '—'}</span></div>
              <div className="profile-row"><span className="profile-lbl">Email</span><span>{userEmail}</span></div>
              <div className="profile-row"><span className="profile-lbl">{t('Industria', 'Industry')}</span><span>{(coProfile?.industry as string) || '—'}</span></div>
              <div className="profile-row"><span className="profile-lbl">{t('Tamaño', 'Size')}</span><span>{(coProfile?.size as string) || '—'}</span></div>
              <div className="profile-row"><span className="profile-lbl">{t('Ciudad', 'City')}</span><span>{(coProfile?.city as string) || '—'}</span></div>
              {(coProfile?.website) && (
                <div className="profile-row"><span className="profile-lbl">Web</span><a href={String(coProfile.website).startsWith('http') ? String(coProfile.website) : `https://${String(coProfile.website)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)' }}>{String(coProfile.website)}</a></div>
              )}
              {(coProfile?.linkedin) && (
                <div className="profile-row"><span className="profile-lbl">LinkedIn</span><a href={String(coProfile.linkedin).startsWith('http') ? String(coProfile.linkedin) : `https://${String(coProfile.linkedin)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--forest)' }}>Ver perfil →</a></div>
              )}
            </div>

            <div className="card">
              <SectionTitle>📖 {t('Sobre nosotros', 'About us')}</SectionTitle>
              {(coProfile?.description as string) ? (
                <p style={{ fontSize: '.83rem', color: 'var(--ink-70)', lineHeight: 1.7 }}>{coProfile?.description as string}</p>
              ) : <p style={{ fontSize: '.8rem', color: 'var(--ink-45)' }}>{t('Sin descripción aún.', 'No description yet.')}</p>}

              {(coProfile?.mission as string) && (
                <div style={{ marginTop: '.9rem' }}>
                  <div style={{ ...lbl, marginBottom: '.3rem' }}>{t('Misión', 'Mission')}</div>
                  <p style={{ fontSize: '.83rem', color: 'var(--ink-70)', lineHeight: 1.65 }}>{coProfile?.mission as string}</p>
                </div>
              )}
              {(coProfile?.values as string) && (
                <div style={{ marginTop: '.9rem' }}>
                  <div style={{ ...lbl, marginBottom: '.3rem' }}>{t('Valores', 'Values')}</div>
                  <p style={{ fontSize: '.83rem', color: 'var(--ink-70)', lineHeight: 1.65 }}>{coProfile?.values as string}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right col — matching config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ border: '2px solid var(--mist)', background: 'linear-gradient(135deg,#f8fdfd,var(--white))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <div>
                  <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--forest)' }}>{t('Perfil de matching', 'Matching profile')}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--ink-45)', marginTop: '1px' }}>{t('Estos datos alimentan el algoritmo de matching', 'These fields power the matching algorithm')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                <div>
                  <div style={matchLbl}>{t('Áreas buscadas', 'Target areas')}</div>
                  {((coProfile?.looking_for_areas as string[]) || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                      {((coProfile?.looking_for_areas as string[]) || []).map(a => (
                        <span key={a} style={{ background: 'var(--pale)', color: 'var(--forest)', border: '1px solid var(--mist)', borderRadius: 6, padding: '3px 9px', fontSize: '.76rem', fontWeight: 600 }}>{a}</span>
                      ))}
                    </div>
                  ) : <span style={{ fontSize: '.78rem', color: 'var(--ink-45)' }}>{t('Sin definir', 'Not set')}</span>}
                </div>

                <div>
                  <div style={matchLbl}>{t('Experiencia requerida', 'Required experience')}</div>
                  <span style={{ fontSize: '.83rem', color: (coProfile?.looking_for_experience as string) ? 'var(--ink)' : 'var(--ink-45)' }}>
                    {(coProfile?.looking_for_experience as string) || t('Sin definir', 'Not set')}
                  </span>
                </div>

                <div>
                  <div style={matchLbl}>{t('Modalidad preferida', 'Preferred mode')}</div>
                  <span style={{ fontSize: '.83rem', color: (coProfile?.looking_for_modality as string) ? 'var(--ink)' : 'var(--ink-45)' }}>
                    {(coProfile?.looking_for_modality as string) || t('Sin definir', 'Not set')}
                  </span>
                </div>

                <div>
                  <div style={matchLbl}>{t('Skills clave', 'Key skills')}</div>
                  {((coProfile?.looking_for_skills as string[]) || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                      {((coProfile?.looking_for_skills as string[]) || []).map(s => (
                        <span key={s} className="jc-tag jc-tag-skill">{s}</span>
                      ))}
                    </div>
                  ) : <span style={{ fontSize: '.78rem', color: 'var(--ink-45)' }}>{t('Sin definir', 'Not set')}</span>}
                </div>
              </div>

              <button className="btn btn-forest btn-sm" style={{ width: '100%', marginTop: '1.1rem', justifyContent: 'center', borderRadius: 8 }} onClick={() => setEditing(true)}>
                {t('Actualizar perfil de matching →', 'Update matching profile →')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // ── EDIT MODE ──
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Left — General info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <SectionTitle>🏢 {t('Información general', 'General info')}</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                <div><label style={lbl}>{t('Nombre de la empresa', 'Company name')}</label><input style={inp} value={form.company_name} onChange={e => f('company_name', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
                  <div><label style={lbl}>{t('Industria', 'Industry')}</label>
                    <select style={inp} value={form.industry} onChange={e => f('industry', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      <option>{t('Tecnología', 'Technology')}</option>
                      <option>{t('Finanzas', 'Finance')}</option>
                      <option>Retail</option>
                      <option>{t('Salud', 'Healthcare')}</option>
                      <option>{t('Educación', 'Education')}</option>
                      <option>{t('Manufactura', 'Manufacturing')}</option>
                      <option>{t('Consultoría', 'Consulting')}</option>
                      <option>{t('Otra', 'Other')}</option>
                    </select>
                  </div>
                  <div><label style={lbl}>{t('Tamaño', 'Size')}</label>
                    <select style={inp} value={form.size} onChange={e => f('size', e.target.value)}>
                      <option value="">{t('Seleccioná', 'Select')}</option>
                      <option>1–10</option><option>11–50</option><option>51–200</option><option>201–500</option><option>500+</option>
                    </select>
                  </div>
                </div>
                <div><label style={lbl}>{t('Ciudad', 'City')}</label>
                  <select style={inp} value={form.city} onChange={e => f('city', e.target.value)}>
                    <option value="">{t('Seleccioná', 'Select')}</option>
                    <option>Bogotá</option><option>Medellín</option><option>Cali</option>
                    <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
                    <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
                    <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
                    <option>Montería</option><option>Villavicencio</option>
                    <option>{t('Otra', 'Other')}</option>
                  </select>
                </div>
                <div><label style={lbl}>Website</label><input style={inp} value={form.website} onChange={e => f('website', e.target.value)} placeholder="www.tuempresa.com" /></div>
                <div><label style={lbl}>LinkedIn</label><input style={inp} value={form.linkedin} onChange={e => f('linkedin', e.target.value)} placeholder="linkedin.com/company/..." /></div>
              </div>
            </div>

            <div className="card">
              <SectionTitle>📖 {t('Sobre nosotros', 'About us')}</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                <div><label style={lbl}>{t('Descripción', 'Description')}</label><textarea style={{ ...inp, resize: 'none', minHeight: 80, lineHeight: 1.6 }} value={form.description} onChange={e => f('description', e.target.value)} placeholder={t('¿Qué hace tu empresa?', 'What does your company do?')} /></div>
                <div><label style={lbl}>{t('Misión', 'Mission')}</label><textarea style={{ ...inp, resize: 'none', minHeight: 65, lineHeight: 1.6 }} value={form.mission} onChange={e => f('mission', e.target.value)} placeholder={t('¿Cuál es tu misión?', 'What is your mission?')} /></div>
                <div><label style={lbl}>{t('Valores', 'Values')}</label><textarea style={{ ...inp, resize: 'none', minHeight: 65, lineHeight: 1.6 }} value={form.values} onChange={e => f('values', e.target.value)} placeholder={t('Ej: Innovación, Respeto, Excelencia', 'E.g. Innovation, Respect, Excellence')} /></div>
              </div>
            </div>
          </div>

          {/* Right — Matching profile */}
          <div>
            <div className="card" style={{ border: '2px solid var(--forest)', background: 'linear-gradient(135deg,#f8fdfd,var(--white))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', paddingBottom: '.6rem', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: '1.1rem' }}>🎯</span>
                <div>
                  <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem', color: 'var(--forest)' }}>{t('Perfil de matching', 'Matching profile')}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--ink-45)', marginTop: '1px' }}>{t('Completá estos campos para activar el matching', 'Complete these fields to activate matching')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {/* Areas */}
                <div>
                  <label style={matchLbl}>🏷 {t('Áreas que buscás contratar', 'Areas you\'re hiring for')}</label>
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.4rem' }}>
                    <select style={{ ...inp, flex: 1 }} value={areaInput} onChange={e => setAreaInput(e.target.value)}>
                      <option value="">{t('Seleccioná un área', 'Select an area')}</option>
                      {[t('Tecnología / IT','Technology / IT'),t('Diseño UX/UI','UX/UI Design'),t('Marketing y Comunicaciones','Marketing & Comms'),t('Ventas y Comercial','Sales'),t('Finanzas y Contabilidad','Finance & Accounting'),t('Recursos Humanos','Human Resources'),t('Operaciones','Operations'),t('Producto / Product','Product'),t('Legal','Legal')].map(a => <option key={a}>{a}</option>)}
                    </select>
                    <button className="btn btn-forest btn-sm" style={{ flexShrink: 0 }} onClick={() => { if (areaInput && !lookingAreas.includes(areaInput)) { setLookingAreas([...lookingAreas, areaInput]); setAreaInput('') } }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                    {lookingAreas.map(a => (
                      <span key={a} style={{ background: 'var(--pale)', color: 'var(--forest)', border: '1px solid var(--mist)', borderRadius: 6, padding: '3px 8px 3px 10px', fontSize: '.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        {a}
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest)', fontSize: '.75rem', padding: 0, lineHeight: 1 }} onClick={() => setLookingAreas(lookingAreas.filter(x => x !== a))}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label style={matchLbl}>📊 {t('Nivel de experiencia requerido', 'Required experience level')}</label>
                  <select style={inp} value={form.looking_for_experience} onChange={e => f('looking_for_experience', e.target.value)}>
                    <option value="">{t('Cualquiera', 'Any')}</option>
                    <option>{t('Sin experiencia', 'No experience')}</option>
                    <option>{t('1–2 años', '1–2 years')}</option>
                    <option>{t('3–5 años', '3–5 years')}</option>
                    <option>{t('5–10 años', '5–10 years')}</option>
                    <option>{t('10+ años', '10+ years')}</option>
                  </select>
                </div>

                {/* Modality */}
                <div>
                  <label style={matchLbl}>🏠 {t('Modalidad de trabajo', 'Work mode')}</label>
                  <select style={inp} value={form.looking_for_modality} onChange={e => f('looking_for_modality', e.target.value)}>
                    <option value="">{t('Cualquiera', 'Any')}</option>
                    <option>{t('Presencial', 'On-site')}</option>
                    <option>{t('Remoto', 'Remote')}</option>
                    <option>{t('Híbrido', 'Hybrid')}</option>
                  </select>
                </div>

                {/* Skills */}
                <div>
                  <label style={matchLbl}>⚡ {t('Skills clave que buscás', 'Key skills you\'re looking for')}</label>
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.4rem' }}>
                    <input style={{ ...inp, flex: 1 }} value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !lookingSkills.includes(skillInput.trim())) { setLookingSkills([...lookingSkills, skillInput.trim()]); setSkillInput('') } } }} placeholder="React, Excel, SQL…" />
                    <button className="btn btn-forest btn-sm" style={{ flexShrink: 0 }} onClick={() => { const v = skillInput.trim(); if (v && !lookingSkills.includes(v)) { setLookingSkills([...lookingSkills, v]); setSkillInput('') } }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                    {lookingSkills.map(s => (
                      <span key={s} className="jc-tag jc-tag-skill" style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        {s}
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forest)', fontSize: '.75rem', padding: 0, lineHeight: 1 }} onClick={() => setLookingSkills(lookingSkills.filter(x => x !== s))}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save / Cancel bar */}
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '.7rem', paddingTop: '.5rem' }}>
            <button className="btn btn-outline" onClick={() => setEditing(false)}>{t('Cancelar', 'Cancel')}</button>
            <button className="btn btn-forest" onClick={save} disabled={saving}>{saving ? t('Guardando…', 'Saving…') : t('Guardar cambios', 'Save changes')}</button>
          </div>
        </div>
      )}
    </>
  )
}

function TalentView({ candidates, loadCandidates, t }: {
  candidates: Candidate[]
  loadCandidates: (q?: string, area?: string, city?: string, modality?: string, salary?: string, experience?: string) => void
  t: (es: string, en: string) => string
}) {
  const [query, setQuery] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterMod, setFilterMod] = useState('')
  const [filterSal, setFilterSal] = useState('')
  const [filterExp, setFilterExp] = useState('')
  const [searchErr, setSearchErr] = useState('')

  const doSearch = () => {
    if (!query.trim() && !filterArea && !filterCity && !filterMod && !filterSal && !filterExp) {
      setSearchErr(t('Ingresá un nombre o seleccioná al menos un filtro para buscar.', 'Enter a name or select at least one filter to search.'))
      return
    }
    setSearchErr('')
    loadCandidates(query, filterArea, filterCity, filterMod, filterSal, filterExp)
  }
  const clearAll = () => { setQuery(''); setFilterArea(''); setFilterCity(''); setFilterMod(''); setFilterSal(''); setFilterExp(''); setSearchErr(''); loadCandidates() }
  const hasAny = query || filterArea || filterCity || filterMod || filterSal || filterExp

  return (
    <>
      <div className="page-head">
        <div className="page-title">{t('Candidatos', 'Candidates')}</div>
        <div className="page-sub">{t(`${candidates.length} perfil${candidates.length !== 1 ? 'es' : ''} disponible${candidates.length !== 1 ? 's' : ''}`, `${candidates.length} profile${candidates.length !== 1 ? 's' : ''} available`)}</div>
      </div>

      {/* Search + filters */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '1.1rem 1.2rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', gap: '.6rem', marginBottom: searchErr ? '.4rem' : '.75rem' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 0, margin: 0, border: searchErr ? '1.5px solid var(--coral)' : 'none', background: 'var(--off)', borderRadius: '8px', padding: '.55rem .9rem' }}>
            <input
              className="search-input"
              value={query}
              onChange={e => { setQuery(e.target.value); if (searchErr) setSearchErr('') }}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder={t('Nombre o keyword…', 'Name or keyword…')}
              style={{ background: 'transparent' }}
            />
          </div>
          <button className="btn btn-forest" onClick={doSearch} style={{ padding: '0 1.4rem', borderRadius: '8px', fontSize: '.82rem', flexShrink: 0 }}>
            {t('Buscar', 'Search')}
          </button>
          {hasAny && (
            <button className="btn btn-outline" onClick={clearAll} style={{ padding: '0 1rem', borderRadius: '8px', fontSize: '.8rem', flexShrink: 0 }}>
              {t('Limpiar ✕', 'Clear ✕')}
            </button>
          )}
        </div>
        {searchErr && (
          <div style={{ fontSize: '.75rem', color: 'var(--coral)', marginBottom: '.6rem', paddingLeft: '.2rem' }}>
            ⚠ {searchErr}
          </div>
        )}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="filter-select" value={filterArea} onChange={e => { setFilterArea(e.target.value); setSearchErr(''); loadCandidates(query, e.target.value, filterCity, filterMod, filterSal) }}>
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
          <select className="filter-select" value={filterCity} onChange={e => { setFilterCity(e.target.value); setSearchErr(''); loadCandidates(query, filterArea, e.target.value, filterMod, filterSal) }}>
            <option value="">{t('Ciudad', 'City')}</option>
            <option>Bogotá</option><option>Medellín</option><option>Cali</option>
            <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
            <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
            <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
            <option>Montería</option><option>Villavicencio</option>
          </select>
          <select className="filter-select" value={filterMod} onChange={e => { setFilterMod(e.target.value); setSearchErr(''); loadCandidates(query, filterArea, filterCity, e.target.value, filterSal, filterExp) }}>
            <option value="">{t('Modalidad', 'Mode')}</option>
            <option>{t('Presencial', 'On-site')}</option>
            <option>{t('Remoto', 'Remote')}</option>
            <option>{t('Híbrido', 'Hybrid')}</option>
          </select>
          <select className="filter-select" value={filterExp} onChange={e => { setFilterExp(e.target.value); setSearchErr(''); loadCandidates(query, filterArea, filterCity, filterMod, filterSal, e.target.value) }}>
            <option value="">{t('Experiencia', 'Experience')}</option>
            <option>{t('Sin experiencia', 'No experience')}</option>
            <option>{t('1–2 años', '1–2 years')}</option>
            <option>{t('3–5 años', '3–5 years')}</option>
            <option>{t('5–10 años', '5–10 years')}</option>
            <option>{t('10+ años', '10+ years')}</option>
          </select>
          <select className="filter-select" value={filterSal} onChange={e => { setFilterSal(e.target.value); setSearchErr(''); loadCandidates(query, filterArea, filterCity, filterMod, e.target.value, filterExp) }}>
            <option value="">{t('Pretensión salarial', 'Expected salary')}</option>
            <option>Hasta $2M</option>
            <option>$2M – $4M</option>
            <option>$4M – $7M</option>
            <option>$7M – $12M</option>
            <option>$12M+</option>
          </select>
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{t('Sin candidatos', 'No candidates')}</div>
          <div className="empty-sub">{t('Intentá con otros filtros.', 'Try different filters.')}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: '1rem' }}>
        {candidates.map(c => <CandCard key={c.id} c={c} t={t} />)}
      </div>
    </>
  )
}

function CandCard({ c, coName, t }: { c: Candidate; coName?: string; t: (es: string, en: string) => string }) {
  const [showContact, setShowContact] = useState(false)
  const [notified, setNotified] = useState(false)
  const tags = [tv(c.experience, t), c.city, tv(c.modality, t)].filter(Boolean)
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', padding: '1.2rem 1.3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,var(--forest),var(--forest-lt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--head)', fontSize: '.9rem', fontWeight: 700, color: 'white' }}>
            {initials(c.name)}
          </div>
          {/* Green "available" dot */}
          <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#16a34a', border: '2px solid white' }} title={t('Disponible', 'Available')} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.9rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          {c.area && <div style={{ fontSize: '.75rem', color: 'var(--forest)', fontWeight: 600, marginTop: '2px' }}>{tv(c.area, t)}</div>}
        </div>
        <span style={{ fontSize: '.7rem', color: 'var(--ink-45)', flexShrink: 0, marginTop: '2px' }}>{timeAgo(c.created_at)}</span>
      </div>

      {(c.open_to_work ?? true) && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', alignSelf: 'flex-start', fontSize: '.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 50, border: '1px solid var(--mist)', background: 'var(--pale)', color: 'var(--forest)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
          {t('Abierto/a a oportunidades', 'Open to opportunities')}
        </span>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="jc-tags" style={{ margin: 0 }}>
          {tags.map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
          {c.salary_range && <span className="jc-tag" style={{ background: 'var(--pale)', color: 'var(--forest)', fontWeight: 600 }}>{c.salary_range}</span>}
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
          onClick={() => {
            const next = !showContact
            setShowContact(next)
            if (next && !notified && c.email && c.name) {
              setNotified(true)
              fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'company_contacted', to: c.email, name: c.name.split(' ')[0], extra: { companyName: coName || 'Una empresa' } }) }).catch(() => {})
            }
          }}
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

function MyJobsView({ userEmail, coName, onPost, t }: {
  userEmail: string
  coName?: string
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
  const [editCity, setEditCity] = useState('')
  const [editArea, setEditArea] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  // applicant counts per job_id
  const [appCounts, setAppCounts] = useState<Record<string, number>>({})
  const [firstApplyAt, setFirstApplyAt] = useState<Record<string, string>>({})
  // which job's applicants are being viewed (null = show job list)
  const [viewingJobId, setViewingJobId] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [pushingJobId, setPushingJobId] = useState<string | null>(null)
  const [pushResult, setPushResult] = useState<Record<string, number>>({})
  const [savedCounts, setSavedCounts] = useState<Record<string, number>>({})

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
      // load application counts + first apply timestamps
      if (jobs.length > 0) {
        const ids = jobs.map((j: Job) => j.id)
        const { data: apps } = await sb.from('applications').select('job_id, applied_at').in('job_id', ids)
        if (apps) {
          const counts: Record<string, number> = {}
          const firstApply: Record<string, string> = {}
          apps.forEach((a: { job_id: string; applied_at: string }) => {
            counts[a.job_id] = (counts[a.job_id] || 0) + 1
            if (!firstApply[a.job_id] || a.applied_at < firstApply[a.job_id]) firstApply[a.job_id] = a.applied_at
          })
          setAppCounts(counts)
          setFirstApplyAt(firstApply)
        }
        const { data: saves } = await sb.from('saved_jobs').select('job_id').in('job_id', ids)
        if (saves) {
          const sc: Record<string, number> = {}
          saves.forEach((s: { job_id: string }) => { sc[s.job_id] = (sc[s.job_id] || 0) + 1 })
          setSavedCounts(sc)
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
        .select('*, candidates(id,name,email,whatsapp,area,experience,city,modality,skills,linkedin,cv_url,notify_matches)')
        .eq('job_id', jobId)
        .order('match_score', { ascending: false, nullsFirst: false })
      setApplications(data || [])
    } catch (e) { console.warn(e) }
    setAppsLoading(false)
  }

  async function updateAppStatus(appId: string, status: string) {
    // Capture before async/state-update to avoid stale closure
    const app = applications.find(a => a.id === appId)
    try {
      const sb = createClient()
      await sb.from('applications').update({ status }).eq('id', appId)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      const jobTitle = myJobs.find(j => j.id === app?.job_id)?.title || ''
      // Notify candidate of status change
      if ((status === 'contacted' || status === 'rejected') && app?.candidates?.email && app?.candidates?.name && app?.candidates?.notify_matches !== false) {
        fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'application_status_changed', to: app.candidates.email, name: app.candidates.name.split(' ')[0], extra: { status, jobTitle, companyName: coName || '' } }) }).catch(() => {})
      }
      // On "contacted": record the match + email the company with candidate card
      if (status === 'contacted' && app?.candidate_id && app?.job_id) {
        await sb.from('matches').upsert({ candidate_id: app.candidate_id, job_id: app.job_id, path: 1 }, { onConflict: 'candidate_id,job_id', ignoreDuplicates: true })
        const { data: coData } = await sb.from('companies').select('email').ilike('email', userEmail).maybeSingle()
        if (coData?.email && app.candidates) {
          fetch('/api/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'match_confirmed', to: coData.email, name: coName || '',
              extra: {
                jobTitle,
                candidateName: app.candidates.name || '',
                candidateArea: app.candidates.area || '',
                candidateExp: app.candidates.experience || '',
                candidateCity: app.candidates.city || '',
                candidateWhatsapp: app.candidates.whatsapp || '',
                candidateEmail: app.candidates.email || '',
                candidateLinkedin: app.candidates.linkedin || '',
                cvUrl: app.candidates.cv_url || '',
                matchScore: String(app.match_score || ''),
              }
            })
          }).catch(() => {})
        }
      }
    } catch (e) { console.warn(e) }
  }

  const startEdit = (j: Job) => {
    setEditingId(j.id)
    setEditTitle(j.title)
    setEditDesc(j.description || '')
    setEditSal(j.salary_range || '')
    setEditMod(j.modality || '')
    setEditCity(j.city || '')
    setEditArea(j.area || '')
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await createClient().from('jobs').update({ active: !current }).eq('id', id)
      setMyJobs(prev => prev.map(j => j.id === id ? { ...j, active: !current } : j))
    } catch (e) { console.warn(e) }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const sb = createClient()
      await sb.from('jobs').update({ title: editTitle, description: editDesc, salary_range: editSal, modality: editMod, city: editCity, area: editArea }).eq('id', id)
      setEditingId(null)
      await loadMyJobs()
    } catch (e) { console.warn(e) }
    setSaving(false)
  }

  async function deleteJob(id: string) {
    try {
      const sb = createClient()
      await sb.from('jobs').delete().eq('id', id)
      setMyJobs(prev => prev.filter(j => j.id !== id))
      setConfirmDeleteId(null)
    } catch (e) { console.warn(e) }
  }

  async function pushMatches(jobId: string) {
    if (pushingJobId) return
    setPushingJobId(jobId)
    try {
      const res = await fetch('/api/match-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      })
      const data = await res.json()
      setPushResult(prev => ({ ...prev, [jobId]: data.count ?? 0 }))
      setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, push_sent_at: new Date().toISOString() } : j))
    } catch (e) { console.warn(e) }
    setPushingJobId(null)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.88rem' }}>{c.name}</div>
                      {app.match_score != null && (
                        <span style={{ fontSize: '.68rem', fontWeight: 700, borderRadius: 5, padding: '2px 7px', background: app.match_score >= 70 ? '#E4F0F1' : 'var(--off)', color: app.match_score >= 70 ? 'var(--forest)' : 'var(--ink-45)' }}>
                          {app.match_score >= 70 ? '✦ ' : ''}{app.match_score}% fit
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '.74rem', color: 'var(--forest)', fontWeight: 600 }}>{tv(c.area, t)}</div>
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
                {[tv(c.experience, t), c.city, tv(c.modality, t)].filter(Boolean).length > 0 && (
                  <div className="jc-tags" style={{ margin: '0 0 .65rem' }}>
                    {[tv(c.experience, t), c.city, tv(c.modality, t)].filter(Boolean).map(tag => <span key={tag} className="jc-tag">{tag}</span>)}
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
                  <select style={{ ...inp, flex: 1 }} value={editCity} onChange={e => setEditCity(e.target.value)}>
                    <option value="">{t('Ciudad', 'City')}</option>
                    <option>Bogotá</option><option>Medellín</option><option>Cali</option>
                    <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
                    <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
                    <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
                    <option>Montería</option><option>Villavicencio</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <select style={{ ...inp, flex: 1 }} value={editArea} onChange={e => setEditArea(e.target.value)}>
                    <option value="">{t('Área', 'Area')}</option>
                    <option>{t('Tecnología / IT', 'Technology / IT')}</option>
                    <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
                    <option>Marketing y Comunicaciones</option>
                    <option>{t('Ventas y Comercial', 'Sales')}</option>
                    <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
                    <option>{t('Recursos Humanos', 'Human Resources')}</option>
                    <option>{t('Operaciones', 'Operations')}</option>
                  </select>
                  <select style={{ ...inp, flex: 1 }} value={editSal} onChange={e => setEditSal(e.target.value)}>
                    <option value="">{t('Salario', 'Salary')}</option>
                    <option>Hasta $2M</option><option>$2M – $4M</option><option>$4M – $7M</option><option>$7M – $12M</option><option>$12M+</option>
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
                  <button
                    onClick={() => toggleActive(j.id, j.active ?? false)}
                    title={j.active ? t('Pausar vacante', 'Pause listing') : t('Activar vacante', 'Activate listing')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.72rem', fontWeight: 700, padding: '4px 10px 4px 8px', borderRadius: '50px', background: j.active ? '#dcfce7' : 'var(--off)', color: j.active ? '#15803d' : 'var(--ink-45)', border: j.active ? '1px solid #bbf7d0' : '1px solid var(--line)', cursor: 'pointer' }}>
                    {j.active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', flexShrink: 0 }} />}
                    {j.active ? t('Activa', 'Active') : t('Inactiva', 'Inactive')}
                  </button>
                </div>
                <div className="jc-tags" style={{ margin: '0 0 .8rem' }}>
                  {j.modality && <span className="jc-tag">{j.modality}</span>}
                  {j.city && <span className="jc-tag">{j.city}</span>}
                  {j.area && <span className="jc-tag">{j.area}</span>}
                  {j.salary_range && <span className="jc-tag" style={{ background: 'var(--pale)', color: 'var(--forest)' }}>{j.salary_range}</span>}
                </div>
                {j.description && <p style={{ fontSize: '.8rem', color: 'var(--ink-70)', lineHeight: 1.6, margin: '0 0 .8rem' }}>{j.description.slice(0, 160)}{j.description.length > 160 ? '…' : ''}</p>}
                {/* Analytics row */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '.8rem', fontSize: '.74rem', color: 'var(--ink-45)' }}>
                  <span title={t('Vistas por candidatos', 'Views by candidates')}>👁 {j.views || 0} {t('vistas', 'views')}</span>
                  <span title={t('Postulaciones recibidas', 'Applications received')}>📋 {appCounts[j.id] || 0} {t('postulaciones', 'applications')}</span>
                  {savedCounts[j.id] ? <span title={t('Candidatos que guardaron esta vacante', 'Candidates who saved this listing')}>★ {savedCounts[j.id]} {t('guardadas', 'saved')}</span> : null}
                  {(j.views || 0) > 0 && <span title={t('Tasa de conversión', 'Conversion rate')}>⚡ {Math.round(((appCounts[j.id] || 0) / (j.views || 1)) * 100)}% {t('conversión', 'conversion')}</span>}
                  {firstApplyAt[j.id] && <span title={t('Primera postulación', 'First application')}>🕐 {t('1ra en', '1st in')} {Math.round((Date.now() - new Date(j.created_at || 0).getTime()) > 0 ? (new Date(firstApplyAt[j.id]).getTime() - new Date(j.created_at || 0).getTime()) / 3600000 : 0)}h</span>}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', paddingTop: '.75rem', borderTop: '1px solid var(--line)', alignItems: 'center' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(j)}>{t('Editar', 'Edit')}</button>
                  {confirmDeleteId === j.id ? (
                    <>
                      <span style={{ fontSize: '.76rem', color: 'var(--coral)', fontWeight: 600 }}>{t('¿Confirmar?', 'Confirm delete?')}</span>
                      <button className="btn btn-sm" style={{ background: 'var(--coral)', border: 'none', color: 'white', borderRadius: 7, padding: '4px 12px', fontSize: '.76rem', cursor: 'pointer' }} onClick={() => deleteJob(j.id)}>{t('Sí, eliminar', 'Yes, delete')}</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setConfirmDeleteId(null)}>{t('Cancelar', 'Cancel')}</button>
                    </>
                  ) : (
                    <button className="btn btn-sm" style={{ background: 'none', border: '1.5px solid var(--line)', color: 'var(--coral)', borderRadius: 7, padding: '4px 12px', fontSize: '.78rem', cursor: 'pointer' }} onClick={() => setConfirmDeleteId(j.id)}>{t('Eliminar', 'Delete')}</button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                    {pushResult[j.id] !== undefined && (
                      <span style={{ fontSize: '.72rem', color: 'var(--forest)', fontWeight: 600 }}>
                        ✦ {pushResult[j.id]} {t('matches enviados', 'matches sent')}
                      </span>
                    )}
                    {pushResult[j.id] === undefined && j.push_sent_at && (
                      <span style={{ fontSize: '.71rem', color: 'var(--ink-45)' }}>
                        ✓ {t('Push enviado', 'Push sent')}
                      </span>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--coral)', border: 'none', color: 'white', borderRadius: 7, padding: '5px 12px', fontSize: '.77rem', fontWeight: 600, cursor: pushingJobId === j.id ? 'not-allowed' : 'pointer', opacity: pushingJobId === j.id ? .7 : 1 }}
                      disabled={pushingJobId === j.id}
                      onClick={() => pushMatches(j.id)}
                      title={t('Encontrar y notificar candidatos compatibles', 'Find and notify compatible candidates')}
                    >
                      {pushingJobId === j.id ? t('Buscando…', 'Searching…') : '✦ ' + t('Buscar matches', 'Find matches')}
                    </button>
                    <button
                      className="btn btn-forest btn-sm"
                      onClick={() => viewApplicants(j.id)}
                    >
                      {t('Postulantes', 'Applicants')} {appCounts[j.id] ? `(${appCounts[j.id]})` : '(0)'}
                    </button>
                  </div>
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
  const [reqExp, setReqExp] = useState('')
  const [desc, setDesc] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [closesAt, setClosesAt] = useState('')
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
      const { data: co } = await sb.from('companies').select('id').ilike('email', userEmail).maybeSingle()
      const jobPayload = {
        company_id: co?.id || null,
        title: title.trim(),
        modality: mod,
        city,
        area,
        salary_range: sal,
        description: desc.trim(),
        skills,
        required_experience: reqExp || null,
        active: true,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
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
      <div className="card" style={{ maxWidth: 800 }}>
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
              <option>Bogotá</option><option>Medellín</option><option>Cali</option>
              <option>Barranquilla</option><option>Cartagena</option><option>Bucaramanga</option>
              <option>Cúcuta</option><option>Manizales</option><option>Pereira</option>
              <option>Santa Marta</option><option>Ibagué</option><option>Pasto</option>
              <option>Montería</option><option>Villavicencio</option>
              <option>{t('Otra', 'Other')}</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Área', 'Area')}</label>
            <select value={area} onChange={e => setArea(e.target.value)}>
              <option value="" disabled>{t('Área', 'Area')}</option>
              <option>{t('Tecnología / IT', 'Technology / IT')}</option>
              <option>{t('Diseño UX/UI', 'UX/UI Design')}</option>
              <option>Marketing y Comunicaciones</option>
              <option>{t('Ventas y Comercial', 'Sales')}</option>
              <option>{t('Finanzas y Contabilidad', 'Finance & Accounting')}</option>
              <option>{t('Recursos Humanos', 'Human Resources')}</option>
              <option>{t('Operaciones', 'Operations')}</option>
              <option>{t('Otra', 'Other')}</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Salario mensual', 'Monthly salary')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <select value={sal} onChange={e => setSal(e.target.value)}>
              <option value="" disabled>{t('Rango', 'Range')}</option>
              <option>Hasta $2M</option><option>$2M–$4M</option><option>$4M–$7M</option><option>$7M–$12M</option><option>$12M+</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Experiencia requerida', 'Required experience')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <select value={reqExp} onChange={e => setReqExp(e.target.value)}>
              <option value="">{t('Cualquier nivel', 'Any level')}</option>
              <option>{t('Sin experiencia', 'No experience')}</option>
              <option>1-2 años</option>
              <option>3-5 años</option>
              <option>6+ años</option>
            </select>
          </div>
          <div className="fg">
            <label>{t('Fecha de cierre', 'Closing date')} <span style={{color:'var(--ink-45)',fontWeight:400,textTransform:'none',letterSpacing:0}}>{t('(opcional)', '(optional)')}</span></label>
            <input type="date" value={closesAt} onChange={e => setClosesAt(e.target.value)} min={new Date().toISOString().split('T')[0]} />
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
