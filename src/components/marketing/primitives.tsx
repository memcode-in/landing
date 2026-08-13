import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import BookingLink from './BookingLink'
import ExpandingArrowLink from './ExpandingArrowLink'

/* --------------------------------------------------------------------------
 * SectionIntro — eyebrow label + heading + supporting copy.
 * Mirrors the existing .x-heading / .x-label treatment.
 * ------------------------------------------------------------------------ */
export function SectionIntro({
  eyebrow,
  title,
  children,
  dark = true,
  align = 'split',
  id,
}: {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
  dark?: boolean
  align?: 'split' | 'center' | 'stack'
  id?: string
}) {
  return (
    <div className={`mk-intro mk-intro--${align}`}>
      <div>
        <span className={dark ? 'x-label' : 'x-label x-label--dark'}>{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {children && <p>{children}</p>}
    </div>
  )
}

/* --------------------------------------------------------------------------
 * ProductHero — the top of every product page.
 * ------------------------------------------------------------------------ */
export function ProductHero({
  title,
  subtitle,
  primary,
  visual,
  backgroundImage,
  tone = 'dark',
}: {
  title: ReactNode
  subtitle: ReactNode
  primary?: { label: string; booking?: boolean; href?: string }
  visual?: ReactNode
  backgroundImage?: string
  tone?: 'dark' | 'paper'
}) {
  return (
    <section
      className={`mk-hero mk-hero--${tone} ${visual ? 'mk-hero--split' : ''} ${backgroundImage ? 'mk-hero--with-background' : ''}`}
      id="top"
    >
      {backgroundImage && (
        <div className="mk-hero__background" aria-hidden="true">
          <img src={backgroundImage} alt="" decoding="async" fetchPriority="high" />
        </div>
      )}
      <div className="mk-hero__glow" aria-hidden="true" />
      <div className="container mk-hero__inner">
        <div className="mk-hero__copy">
          <h1 className="mk-hero__title">{title}</h1>
          <p className="mk-hero__subtitle">{subtitle}</p>
          <div className="mk-hero__actions">
            {primary && (
              <ExpandingArrowLink
                href={primary.href}
                booking={primary.booking}
                tone={tone === 'paper' ? 'light' : 'dark'}
              >
                {primary.label}
              </ExpandingArrowLink>
            )}
          </div>
        </div>
        {visual && <div className="mk-hero__visual">{visual}</div>}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
 * NumberedCardGrid — 01/02/03 outcome cards, each optionally a link.
 * ------------------------------------------------------------------------ */
export interface NumberedCard {
  title: string
  copy: string
  meta?: string
  href?: string
  booking?: boolean
}

export function NumberedCardGrid({
  cards,
  columns = 3,
}: {
  cards: NumberedCard[]
  columns?: 2 | 3 | 4
}) {
  return (
    <div className={`mk-cards mk-cards--${columns}`}>
      {cards.map((card, index) => {
        const inner = (
          <>
            <span className="mk-card__num">{String(index + 1).padStart(2, '0')}</span>
            <strong className="mk-card__title">{card.title}</strong>
            <p className="mk-card__copy">{card.copy}</p>
            {card.meta && <em className="mk-card__meta">{card.meta}</em>}
            {(card.href || card.booking) && <i className="mk-card__arrow" aria-hidden="true" />}
          </>
        )
        if (card.booking) {
          return (
            <BookingLink key={card.title} variant="bare" className="mk-card mk-card--link">
              {inner}
            </BookingLink>
          )
        }
        if (card.href) {
          return (
            <a key={card.title} className="mk-card mk-card--link" href={card.href}>
              {inner}
            </a>
          )
        }
        return (
          <article key={card.title} className="mk-card">
            {inner}
          </article>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------------------
 * TabbedShowcase — accessible tablist + panel. Arrow-key navigation, roving
 * focus, aria-selected/aria-controls wiring.
 * ------------------------------------------------------------------------ */
export interface ShowcaseTab {
  id: string
  label: string
  hint?: string
  render: () => ReactNode
}

export function TabbedShowcase({
  tabs,
  ariaLabel,
  initial = 0,
}: {
  tabs: ShowcaseTab[]
  ariaLabel: string
  initial?: number
}) {
  const [active, setActive] = useState(initial)
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let next = active
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (active + 1) % tabs.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (active - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const current = tabs[active] ?? tabs[0]

  return (
    <div className="mk-showcase">
      <div className="mk-showcase__tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const selected = index === active
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'mk-showcase__tab is-active' : 'mk-showcase__tab'}
              onClick={() => setActive(index)}
              onKeyDown={onKeyDown}
            >
              <strong>{tab.label}</strong>
              {tab.hint && <small>{tab.hint}</small>}
            </button>
          )
        })}
      </div>
      <div
        className="mk-showcase__panel"
        role="tabpanel"
        id={`${baseId}-panel-${current.id}`}
        aria-labelledby={`${baseId}-tab-${current.id}`}
        tabIndex={0}
      >
        {current.render()}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
 * ProductCTA — closing band with one clear primary action.
 * ------------------------------------------------------------------------ */
export function ProductCTA({
  eyebrow,
  title,
  copy,
  action,
  tone = 'blue',
}: {
  eyebrow?: string
  title: ReactNode
  copy?: ReactNode
  action: { label: string; href?: string; booking?: boolean; tone?: 'dark' | 'light' | 'blue' | 'black' }
  tone?: 'blue' | 'dark' | 'paper'
}) {
  return (
    <section className={`mk-cta mk-cta--${tone}`}>
      <div className="mk-cta__grid" aria-hidden="true" />
      <div className="container mk-cta__inner">
        <div>
          {eyebrow && <span className="mk-cta__eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {copy && <p>{copy}</p>}
        </div>
        <div className="mk-cta__actions">
          <ExpandingArrowLink
            href={action.href}
            booking={action.booking}
            tone={action.tone ?? (tone === 'paper' ? 'light' : tone === 'blue' ? 'blue' : 'dark')}
          >
            {action.label}
          </ExpandingArrowLink>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------------
 * useInView — small helper for reveal-on-scroll used by a few primitives.
 * ------------------------------------------------------------------------ */
export function useInView<T extends HTMLElement>(rootMargin = '-60px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])
  return { ref, inView }
}
