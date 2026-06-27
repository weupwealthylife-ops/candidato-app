import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';

function baseUrl(r: string) {
  try {
    const u = new URL(r);
    return `${u.protocol}//${u.host}`;
  } catch {
    return r;
  }
}

function getSupabase() {
  const url = baseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchJob(id: string) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from('jobs')
    .select('title, area, city, modality, salary_range, description, skills, closes_at, companies(company_name)')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();
  return data;
}

async function incrementViews(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  try { await supabase.rpc('increment_job_views', { job_id: id }) } catch { /* non-critical */ }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await fetchJob(params.id);

  if (!job) {
    return { title: 'Vacante — Candidato®' };
  }

  const title = `${job.title} — Candidato®`;
  const description =
    [job.area, job.city, job.modality, job.salary_range]
      .filter(Boolean)
      .join(' · ') + ' — Postulate gratis en Candidato®';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://candidato.com.co/jobs/${params.id}`,
      images: [
        {
          url: 'https://candidato.com.co/bird-logo.png',
          width: 512,
          height: 512,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  noStore();
  await incrementViews(params.id);
  const job = await fetchJob(params.id);

  const forest = '#1B3B3E';
  const coral = '#EA6440';
  const offWhite = '#FAFAF8';

  if (!job) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: offWhite,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: forest,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '32px',
            }}
          >
            Candidato® ✦
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: forest,
              marginBottom: '12px',
            }}
          >
            Vacante no disponible
          </h1>
          <p style={{ color: '#555', marginBottom: '32px', fontSize: '16px' }}>
            Esta vacante ya no está activa o no existe.
          </p>
          <a
            href="https://candidato.com.co/app"
            style={{
              background: forest,
              color: '#fff',
              borderRadius: '10px',
              padding: '14px 28px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '15px',
            }}
          >
            Ver otras vacantes →
          </a>
        </div>
      </div>
    );
  }

  const companyName =
    job.companies && typeof job.companies === 'object' && 'company_name' in job.companies
      ? (job.companies as { company_name: string }).company_name
      : null;

  const tags = [job.modality, job.city, job.area, job.salary_range].filter(Boolean) as string[];

  const skills: string[] = Array.isArray(job.skills)
    ? (job.skills as string[])
    : typeof job.skills === 'string' && job.skills
    ? [job.skills]
    : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: offWhite,
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '24px 16px 64px',
      }}
    >
      {/* Branding */}
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto 32px',
          textAlign: 'left',
        }}
      >
        <a
          href="https://candidato.com.co"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: forest,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Candidato® ✦
        </a>
      </div>

      {/* Card */}
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(27,59,62,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: forest,
            padding: '36px 32px 28px',
          }}
        >
          {companyName && (
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.65)',
                fontWeight: 500,
                marginBottom: '8px',
                letterSpacing: '0.02em',
              }}
            >
              {companyName}
            </div>
          )}
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 20px',
              lineHeight: 1.25,
            }}
          >
            {job.title}
          </h1>

          {/* Tag pills */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          {/* Description */}
          {job.description && (
            <section style={{ marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: coral,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 12px',
                }}
              >
                Descripción
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#2a2a2a',
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}
              >
                {job.description}
              </p>
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: coral,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  margin: '0 0 12px',
                }}
              >
                Habilidades
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: '#f0f4f4',
                      color: forest,
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Closing date */}
          {job.closes_at && (
            <div
              style={{
                fontSize: '13px',
                color: '#777',
                marginBottom: '32px',
                fontWeight: 500,
              }}
            >
              Cierra el {formatDate(job.closes_at)}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: '#eee',
              marginBottom: '28px',
            }}
          />

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <a
              href="https://candidato.com.co/app"
              style={{
                background: forest,
                color: '#fff',
                borderRadius: '10px',
                padding: '14px 28px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '16px',
                letterSpacing: '0.01em',
              }}
            >
              Postularme →
            </a>
            <div
              style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#aaa',
                fontWeight: 500,
              }}
            >
              100% gratis · Sin registro previo
            </div>
          </div>
        </div>
      </div>

      {/* Footer branding */}
      <div
        style={{
          maxWidth: '680px',
          margin: '32px auto 0',
          textAlign: 'center',
          fontSize: '12px',
          color: '#bbb',
        }}
      >
        Candidato® — Conectamos talento colombiano
      </div>
    </div>
  );
}
