'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Row { [key: string]: unknown }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.1rem 1.3rem' }}>
      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-45)', marginBottom: '.3rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--head)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--forest)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--ink-45)', marginTop: '.3rem' }}>{sub}</div>}
    </div>
  )
}

function DataTable({ rows, cols }: { rows: Row[]; cols: string[] }) {
  if (rows.length === 0) return <p style={{ color: 'var(--ink-45)', fontSize: '.82rem' }}>Sin datos</p>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.78rem' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ textAlign: 'left', padding: '7px 10px', background: 'var(--off)', fontWeight: 700, color: 'var(--ink-45)', fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
              {cols.map(c => (
                <td key={c} style={{ padding: '7px 10px', color: 'var(--ink-70)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {Array.isArray(r[c]) ? (r[c] as string[]).join(', ') : String(r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminPage() {
  const [candidates, setCandidates] = useState<Row[]>([])
  const [companies, setCompanies] = useState<Row[]>([])
  const [jobs, setJobs] = useState<Row[]>([])
  const [applications, setApplications] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'overview' | 'candidates' | 'companies' | 'jobs' | 'applications'>('overview')

  async function load() {
    setLoading(true)
    const sb = createClient()
    const [c, co, j, a] = await Promise.all([
      sb.from('candidates').select('id,name,email,area,city,modality,experience,skills,created_at').order('created_at', { ascending: false }).limit(200),
      sb.from('companies').select('id,company_name,email,industry,city,looking_for_areas,created_at').order('created_at', { ascending: false }).limit(200),
      sb.from('jobs').select('id,title,area,city,modality,salary_range,active,created_at,companies(company_name)').order('created_at', { ascending: false }).limit(200),
      sb.from('applications').select('id,status,applied_at,candidates(name,email),jobs(title)').order('applied_at', { ascending: false }).limit(200),
    ])
    setCandidates(c.data || [])
    setCompanies(co.data || [])
    setJobs((j.data || []).map((r: Row) => ({ ...r, company: (r.companies as { company_name?: string })?.company_name || '—' })))
    setApplications((a.data || []).map((r: Row) => ({
      ...r,
      candidate: (r.candidates as { name?: string; email?: string })?.name || '—',
      candidateEmail: (r.candidates as { email?: string })?.email || '—',
      job: (r.jobs as { title?: string })?.title || '—',
    })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function logout() {
    await fetch('/api/admin-auth', { method: 'DELETE' })
    window.location.href = '/admin/login'
  }

  const candWithCV = candidates.filter(c => c.cv_url).length
  const activeJobs = jobs.filter(j => j.active).length
  const pendingApps = applications.filter(a => a.status === 'pending').length

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'candidates', label: `Candidatos (${candidates.length})` },
    { id: 'companies', label: `Empresas (${companies.length})` },
    { id: 'jobs', label: `Vacantes (${jobs.length})` },
    { id: 'applications', label: `Postulaciones (${applications.length})` },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', fontFamily: 'var(--body)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--forest)', padding: '0 2rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontFamily: 'var(--head)', fontWeight: 700, fontSize: '.95rem' }}>Candidato® Admin</span>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '.78rem' }}>
          Salir
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: '.79rem', fontWeight: 600, cursor: 'pointer', background: tab === t.id ? 'var(--forest)' : 'white', color: tab === t.id ? 'white' : 'var(--ink-70)', transition: 'all .15s' }}
            >
              {t.label}
            </button>
          ))}
          <button onClick={load} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 7, border: '1px solid var(--line)', fontSize: '.79rem', cursor: 'pointer', background: 'white', color: 'var(--ink-45)' }}>
            {loading ? 'Cargando…' : '↻ Actualizar'}
          </button>
        </div>

        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard label="Candidatos" value={candidates.length} sub="registrados en total" />
              <StatCard label="Con CV" value={candWithCV} sub={`${candidates.length ? Math.round(candWithCV/candidates.length*100) : 0}% del total`} />
              <StatCard label="Empresas" value={companies.length} sub="registradas" />
              <StatCard label="Vacantes activas" value={activeJobs} sub={`de ${jobs.length} total`} />
              <StatCard label="Postulaciones" value={applications.length} sub={`${pendingApps} pendientes`} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--ink)' }}>Últimos candidatos</div>
                <DataTable rows={candidates.slice(0,5)} cols={['name','email','area','city','created_at']} />
              </div>
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--ink)' }}>Últimas postulaciones</div>
                <DataTable rows={applications.slice(0,5)} cols={['candidate','job','status','applied_at']} />
              </div>
            </div>
          </>
        )}

        {tab === 'candidates' && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.85rem', color: 'var(--ink)' }}>Todos los candidatos ({candidates.length})</div>
            <DataTable rows={candidates} cols={['name','email','area','city','modality','experience','skills','created_at']} />
          </div>
        )}

        {tab === 'companies' && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.85rem', color: 'var(--ink)' }}>Todas las empresas ({companies.length})</div>
            <DataTable rows={companies} cols={['company_name','email','industry','city','looking_for_areas','created_at']} />
          </div>
        )}

        {tab === 'jobs' && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.85rem', color: 'var(--ink)' }}>Todas las vacantes ({jobs.length})</div>
            <DataTable rows={jobs} cols={['title','company','area','city','modality','salary_range','active','created_at']} />
          </div>
        )}

        {tab === 'applications' && (
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 12, padding: '1.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.85rem', color: 'var(--ink)' }}>Todas las postulaciones ({applications.length})</div>
            <DataTable rows={applications} cols={['candidate','candidateEmail','job','status','applied_at']} />
          </div>
        )}
      </div>
    </div>
  )
}
