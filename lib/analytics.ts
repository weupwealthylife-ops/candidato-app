let _sid: string | null = null

function sessionId(): string {
  if (_sid) return _sid
  if (typeof window === 'undefined') return ''
  _sid = sessionStorage.getItem('_csid') ?? Math.random().toString(36).slice(2)
  sessionStorage.setItem('_csid', _sid)
  return _sid
}

export function track(event: string, properties?: Record<string, unknown>): void {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, session_id: sessionId() }),
    }).catch(() => {})
  } catch {
    // Ignore
  }
}
