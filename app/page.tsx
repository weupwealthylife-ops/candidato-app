import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import TrustBar from '@/components/TrustBar'
import Process from '@/components/Process'
import Metrics from '@/components/Metrics'
import Curator from '@/components/Curator'
import Register from '@/components/Register'
import Pricing from '@/components/Pricing'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <TrustBar />
      <Process />
      <Metrics />
      <Curator />
      <Register />
      <Pricing />
      <Contact />
      <Footer />
    </>
  )
}
