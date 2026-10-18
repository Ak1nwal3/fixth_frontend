import CtaBand from './components/CtaBand'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import PlatformBand from './components/PlatformBand'
import TrustSection from './components/TrustSection'

/**
 * Marketing landing page.
 *
 * Six full-bleed bands: floating navbar over the glow hero, the trust band,
 * the royal-blue platform band, the CTA, and the footer.
 */
export default function LandingPage() {
  return (
    <main>
      <div id="top" className="glow-hero pt-3">
        <Navbar />
        <Hero />
      </div>
      <TrustSection />
      <PlatformBand />
      <CtaBand />
      <Footer />
    </main>
  )
}
