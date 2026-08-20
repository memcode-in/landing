import { getDashboardUrl } from '../../lib/dashboard-routing'
import { COMPANY_BRAIN_CHANNELS } from './companyBrainConnectors'

const COMPANY_BRAIN_NAV_CHANNELS = [
  COMPANY_BRAIN_CHANNELS[1],
  COMPANY_BRAIN_CHANNELS[2],
  COMPANY_BRAIN_CHANNELS[0],
  COMPANY_BRAIN_CHANNELS[3],
] as const

const PRODUCT_LINKS = [
  {
    label: 'Company Brain',
    href: '/company-brain',
    description: 'Shared organizational memory',
    channels: COMPANY_BRAIN_NAV_CHANNELS,
  },
  { label: 'Coding Agent', href: '/coding-agent', description: 'A terminal agent that remembers' },
  { label: 'Memory', href: '/memory', description: 'Memory infrastructure for any agent' },
] as const

const CORE_LINKS = [
  { label: 'Docs', href: '/docs' },
  { label: 'Research', href: '/research' },
  { label: 'Blog', href: '/blogs' },
] as const

function currentPathname() {
  return typeof window === 'undefined' ? '/' : window.location.pathname
}

function isProductActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isSiteLinkActive(pathname: string, href: string) {
  if (href === '/docs' || href === '/research' || href === '/blogs') {
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  return false
}

function linksForPath(pathname: string) {
  const links: Array<{ label: string; href: string }> = []

  if (pathname === '/' || pathname === '/memory') {
    links.push({ label: 'Benchmarks', href: '/#benchmarks' })
  }

  links.push(...CORE_LINKS)

  if (pathname === '/coding-agent') {
    links.push({ label: 'Waitlist', href: '/coding-agent#waitlist' })
  }

  return links
}

function ProductMenu({ mobile = false }: { mobile?: boolean }) {
  const pathname = currentPathname()
  const productActive = PRODUCT_LINKS.some((link) => isProductActive(pathname, link.href))

  return (
    <details className={mobile ? 'mk-products mk-products--mobile' : 'mk-products'}>
      <summary className={productActive ? 'mk-nav__link is-active' : 'mk-nav__link'}>
        Products
        <span className="mk-products__chevron" aria-hidden="true" />
      </summary>
      <div className="mk-products__menu">
        {PRODUCT_LINKS.map((link) => {
          const active = isProductActive(pathname, link.href)
          const channels = 'channels' in link ? link.channels : undefined
          return (
            <a
              key={link.href}
              href={link.href}
              className={active ? 'mk-products__item is-active' : 'mk-products__item'}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mk-products__item-copy">
                <span className="mk-products__item-title">
                  <strong>{link.label}</strong>
                  {channels ? (
                    <span className="mk-products__channel-stack" aria-hidden="true">
                      {channels.map((channel) => (
                        <img
                          key={channel.id}
                          src={channel.logo}
                          alt=""
                          data-channel={channel.id}
                        />
                      ))}
                    </span>
                  ) : null}
                </span>
                <small>{link.description}</small>
              </span>
            </a>
          )
        })}
      </div>
    </details>
  )
}

function SiteLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = currentPathname()
  const links = linksForPath(pathname)

  return (
    <>
      {links.map((link) => {
        const active = isSiteLinkActive(pathname, link.href)
        return (
          <a
            key={link.href}
            href={link.href}
            className={mobile ? 'mk-mobile-menu__link' : active ? 'mk-nav__link is-active' : 'mk-nav__link'}
            aria-current={active ? 'page' : undefined}
          >
            {link.label}
          </a>
        )
      })}
    </>
  )
}

export default function MarketingNav() {
  const accountHref = getDashboardUrl()

  return (
    <header className="site-nav x-nav mk-nav">
      <div className="site-nav__inner mk-nav__inner">
        <a className="brand" href="/" aria-label="MemCode home">
          <span className="brand__mark">
            <img src="/logo.jpeg" alt="" />
          </span>
          <span className="brand__name">memCode</span>
        </a>

        <nav className="mk-nav__desktop" aria-label="Main navigation">
          <ProductMenu />
          <SiteLinks />
        </nav>

        <a className="nav-cta mk-nav__signin" href={accountHref}>
          Dashboard
        </a>

        <details className="mk-mobile-menu">
          <summary className="mk-mobile-menu__toggle">
            Menu
            <span aria-hidden="true" />
          </summary>
          <div className="mk-mobile-menu__panel">
            <ProductMenu mobile />
            <nav className="mk-mobile-menu__links" aria-label="Mobile navigation">
              <SiteLinks mobile />
            </nav>
            <a className="nav-cta mk-mobile-menu__signin" href={accountHref}>
              Dashboard
            </a>
          </div>
        </details>
      </div>
    </header>
  )
}
