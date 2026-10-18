import { InstagramIcon, LinkedInIcon, XIcon } from '@/components/common/BrandIcons'
import Container from '@/components/common/Container'
import Logo, { FixthWordmark } from '@/components/common/Logo'
import { footerColumns, legalLinks, socials, type SocialLink } from '@/features/landing/data'

const socialIcons: Record<SocialLink['icon'], typeof XIcon> = {
  x: XIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
}

/** Fixed by the design (the mockup is dated 2025). */
const currentYear = 2025

export default function Footer() {
  return (
    <footer className="bg-surface">
      <Container>
        {/* Brand bar: blue wordmark left, cyan social squares right. */}
        <div className="flex h-[60px] items-center justify-between border-b border-white/20">
          <Logo tone="brand" />
          <ul className="flex items-center gap-2">
            {socials.map((social) => {
              const Icon = socialIcons[social.icon]
              return (
                <li key={social.icon}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="grid size-8 place-items-center rounded-md bg-cyan text-navy transition hover:bg-cyan-soft"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Link columns — a centred block, not pinned to the brand column. */}
        <div className="flex flex-wrap justify-center gap-x-[60px] gap-y-10 pt-[120px]">
          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h2 className="text-sm font-medium tracking-[-0.05em] text-cream">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm tracking-[-0.05em] text-cream transition hover:text-cyan"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Oversized wordmark watermark. */}
      <div className="px-5 pt-[120px] sm:px-8" aria-hidden>
        <FixthWordmark className="mx-auto h-auto w-full max-w-[1310px] text-cream/5" />
      </div>

      <div className="px-5 py-7 sm:px-8 lg:px-[105px]">
        <div className="mx-auto flex max-w-[1230px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xs font-medium tracking-[-0.05em] text-cream">
            © {currentYear} Fixth. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-7">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-display text-xs font-medium tracking-[-0.05em] text-cream transition hover:text-cyan"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
