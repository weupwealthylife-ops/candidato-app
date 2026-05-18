'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Lang = 'es' | 'en'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (es: string, en: string) => string
}

const LangContext = createContext<LangCtx>({
  lang: 'es',
  setLang: () => {},
  t: (es) => es,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')
  const t = (es: string, en: string) => (lang === 'es' ? es : en)
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
