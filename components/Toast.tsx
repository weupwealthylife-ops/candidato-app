'use client'
import { useState, useEffect } from 'react'

export interface ToastMessage { id: number; text: string; type: 'success' | 'error' | 'info' }

let toastId = 0
const listeners: Set<(t: ToastMessage) => void> = new Set()

export function showToast(text: string, type: ToastMessage['type'] = 'success') {
  const msg = { id: ++toastId, text, type }
  listeners.forEach(fn => fn(msg))
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  useEffect(() => {
    const fn = (t: ToastMessage) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000)
    }
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
  if (toasts.length === 0) return null
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? '#1B3B3E' : t.type === 'error' ? '#EA6440' : '#4a6a6a',
          color: 'white', borderRadius: 10, padding: '10px 18px', fontSize: '.83rem', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(14,30,32,.18)', animation: 'slideIn .2s ease',
          fontFamily: 'system-ui, sans-serif', maxWidth: 320,
        }}>
          {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.text}
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}
