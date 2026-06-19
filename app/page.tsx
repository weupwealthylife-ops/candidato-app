'use client'

import { LangProvider } from '@/lib/LangContext'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import TrustBar from '@/components/TrustBar'
import Process from '@/components/Process'
import Metrics from '@/components/Metrics'
import ForCompanies from '@/components/ForCompanies'
import Testimonials from '@/components/Testimonials'
import Curator from '@/components/Curator'
import Register from '@/components/Register'
import Pricing from '@/components/Pricing'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <LangProvider>
      <Nav />
      <Hero />
      <TrustBar />
      <Process />
      <Metrics />
      <ForCompanies />
      <Testimonials />
      <Curator />
      <Register />
      <Pricing />
      <Contact />
      <Footer />
    </LangProvider>
  )
}
