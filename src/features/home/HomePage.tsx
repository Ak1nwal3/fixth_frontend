import ChainHandoff from './components/ChainHandoff'
import Faq from './components/Faq'
import ForCompanies from './components/ForCompanies'
import ForStudents from './components/ForStudents'
import HomeFooter from './components/HomeFooter'
import HomeHero from './components/HomeHero'
import HomeNavbar from './components/HomeNavbar'
import HowItWorks from './components/HowItWorks'
import TrustMarquee from './components/TrustMarquee'
import { ChainDefs } from './components/shared'

/**
 * Marketing home page.
 *
 * Light hero with the brand chain pattern, a trust band, the scroll-driven
 * "How it works" panel, the student and company pitches, FAQ and footer.
 * The previous landing page lives at `/old`.
 */
export default function HomePage() {
  return (
    <main className="home relative">
      <ChainDefs />
      <HomeNavbar />
      <HomeHero />
      <TrustMarquee />
      <HowItWorks />
      <ForStudents />
      <ForCompanies />
      <Faq />
      <HomeFooter />
      <ChainHandoff />
    </main>
  )
}
