import { getDashboardLoginUrl, getDashboardUrl } from '../../lib/dashboard-routing'
import BookingLink from './BookingLink'
import ExpandingArrowLink from './ExpandingArrowLink'

const FOOTER_GROUPS: { title: string; links: [label: string, href: string, external?: boolean][] }[] = [
  {
    title: 'Products',
    links: [
      ['Company Brain', '/company-brain'],
      ['Coding Agent', '/coding-agent'],
      ['Memory', '/memory'],
      ['Dashboard', getDashboardUrl()],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['Blog', '/blogs'],
      ['Research', '/research'],
      ['Benchmarks', '/#benchmarks'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Developers',
    links: [
      ['Coding agent CLI', '/coding-agent#cli'],
      ['Memory API', '/memory#control-plane'],
      ['MCP setup', '/memory#primitives'],
      ['Sign in', getDashboardLoginUrl(), true],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/privacy'],
    ],
  },
]

export default function MarketingFooter({
  conversion = 'founder',
}: {
  conversion?: 'founder' | 'waitlist'
}) {
  return (
    <footer className="x-footer mk-footer">
      <div className="x-footer__watermark" aria-hidden="true">
        MemCode
      </div>
      <div className="container x-footer__main">
        <div className="x-footer__brand">
          <a className="brand" href="/">
            <span className="brand__mark">
              <img src="/logo.jpeg" alt="" />
            </span>
            <span className="brand__name">memCode</span>
          </a>
          <p>
            MemCode is the end-to-end memory layer for AI. Ingest any source,
            judge what is worth keeping, and give every agent, copilot, and team
            durable memory they can inspect, correct, and carry anywhere.
          </p>
          <div className="mk-footer__cta">
            {conversion === 'waitlist' ? (
              <ExpandingArrowLink href="/coding-agent#waitlist">Join the Waitlist</ExpandingArrowLink>
            ) : (
              <ExpandingArrowLink booking>Talk to Founder</ExpandingArrowLink>
            )}
          </div>
          <nav className="x-footer__social" aria-label="MemCode social links">
            <a href="https://github.com/memcode-in" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://x.com/_memCode" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
          </nav>
        </div>
        <div className="x-footer__links">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([label, href, external]) =>
                external ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ) : (
                  <a key={label} href={href}>
                    {label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="x-footer__bottom">
        <div className="container">
          <p>&copy; 2026 MemCode. All rights reserved.</p>
          {conversion === 'waitlist' ? (
            <a href="/coding-agent#waitlist">Waitlist</a>
          ) : (
            <BookingLink variant="bare" ariaLabel="Contact MemCode">
              Contact
            </BookingLink>
          )}
        </div>
      </div>
    </footer>
  )
}
