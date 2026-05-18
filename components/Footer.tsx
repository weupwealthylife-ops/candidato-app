export default function Footer() {
  return (
    <footer>
      <div
        className="f-brand"
        style={{ display: 'flex', alignItems: 'center', gap: 7 }}
      >
        <span
          aria-hidden
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background:
              'linear-gradient(135deg,var(--forest) 0%,var(--coral) 100%)',
            display: 'inline-block',
          }}
        />
        Candidato®
      </div>
      <span className="f-copy">© 2026 Candidato® · Cali, Colombia</span>
      <div className="f-links">
        <a href="#process">Proceso</a>
        <a href="/app">Candidatos</a>
        <a href="#pricing">Empresas</a>
        <a href="#contact">Contacto</a>
      </div>
    </footer>
  )
}
