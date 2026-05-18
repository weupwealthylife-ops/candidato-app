'use client'

import { useState, KeyboardEvent } from 'react'

export default function Register() {
  const [skills, setSkills] = useState<string[]>([])
  const [skInput, setSkInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  function addSk() {
    const v = skInput.trim()
    if (!v || skills.includes(v)) {
      setSkInput('')
      return
    }
    setSkills([...skills, v])
    setSkInput('')
  }

  function rmSk(s: string) {
    setSkills(skills.filter((x) => x !== s))
  }

  function onKeySk(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSk()
    }
  }

  function doSub() {
    if (!email || !firstName) return
    setSubmitted(true)
  }

  return (
    <section id="register">
      <div className="register-split">
        <div className="reg-left">
          <span className="sec-eye">Para candidatos · Gratis</span>
          <h2 className="sec-h2">
            Registrate.
            <br />
            La IA trabaja por vos.
          </h2>
          <p className="sec-sub" style={{ marginBottom: 0 }}>
            Completá tu perfil una vez. El algoritmo analiza y te notifica las
            mejores oportunidades en 24 horas.
          </p>
          <div className="reg-proof">
            <div className="proof-item in">
              <span className="proof-ico">✓</span>
              <span className="proof-txt">
                <strong>100% gratuito</strong>{' '}
                <span>para candidatos. Sin tarjeta de crédito.</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">⚡</span>
              <span className="proof-txt">
                <strong>Match en 24h</strong>{' '}
                <span>— tus primeras oportunidades al día siguiente.</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">🎯</span>
              <span className="proof-txt">
                <strong>Solo lo relevante</strong>{' '}
                <span>— sin spam, sin ofertas genéricas.</span>
              </span>
            </div>
            <div className="proof-item in">
              <span className="proof-ico">🔒</span>
              <span className="proof-txt">
                <strong>Perfil privado</strong>{' '}
                <span>— nunca compartimos tus datos sin permiso.</span>
              </span>
            </div>
          </div>
        </div>

        <div className="form-box" id="rformwrap">
          {!submitted ? (
            <div id="formbody">
              <div className="form-hd">
                <h3>Crear mi perfil</h3>
                <p>Gratis · Sin compromiso · 3 minutos</p>
              </div>
              <div className="frow">
                <div className="fg">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Daniela"
                  />
                </div>
                <div className="fg">
                  <label>Apellido</label>
                  <input type="text" placeholder="Martínez" />
                </div>
              </div>
              <div className="fg">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="daniela@email.com"
                />
              </div>
              <div className="fg">
                <label>WhatsApp (opcional)</label>
                <input type="tel" placeholder="+57 300 000 0000" />
              </div>
              <div className="frow">
                <div className="fg">
                  <label>Ciudad</label>
                  <select defaultValue="">
                    <option value="" disabled>
                      Seleccioná
                    </option>
                    <option>Cali</option>
                    <option>Bogotá</option>
                    <option>Medellín</option>
                    <option>Barranquilla</option>
                    <option>Bucaramanga</option>
                    <option>Otra</option>
                  </select>
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
              </div>
              <div className="fg">
                <label>Área profesional</label>
                <select defaultValue="">
                  <option value="" disabled>
                    Seleccioná tu área
                  </option>
                  <option>Tecnología / IT</option>
                  <option>Diseño UX/UI</option>
                  <option>Marketing y Comunicaciones</option>
                  <option>Ventas y Comercial</option>
                  <option>Finanzas y Contabilidad</option>
                  <option>Recursos Humanos</option>
                  <option>Operaciones</option>
                  <option>Otro</option>
                </select>
              </div>
              <div className="fg">
                <label>Años de experiencia</label>
                <select defaultValue="">
                  <option value="" disabled>
                    Seleccioná
                  </option>
                  <option>Sin experiencia</option>
                  <option>1–2 años</option>
                  <option>3–5 años</option>
                  <option>5–10 años</option>
                  <option>10+ años</option>
                </select>
              </div>
              <div className="fg">
                <label>Habilidades clave</label>
                <div className="skrow">
                  <input
                    type="text"
                    value={skInput}
                    onChange={(e) => setSkInput(e.target.value)}
                    onKeyDown={onKeySk}
                    placeholder="React, Excel, Photoshop…"
                  />
                  <button
                    type="button"
                    className="add-btn"
                    onClick={addSk}
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
                <div className="sk-tags">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="sk-tag"
                      onClick={() => rmSk(s)}
                    >
                      {s} ×
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className="sub-btn" onClick={doSub}>
                <span>Encontrar mis matches</span> →
              </button>
              <p className="form-note">
                Al registrarte aceptás los términos. Nunca enviamos spam.
              </p>
            </div>
          ) : (
            <div className="success-box" style={{ display: 'block' }}>
              <div className="success-ico">🎉</div>
              <div className="success-title">¡Perfil creado!</div>
              <p className="success-sub">
                Nuestro algoritmo ya está analizando tu perfil. En las próximas
                24 horas recibirás tus primeros matches por email.
              </p>
              <div className="success-note">
                📧 <span>Revisá tu bandeja de entrada — también el spam.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
