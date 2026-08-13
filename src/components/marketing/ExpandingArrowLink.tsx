import type { ReactNode } from 'react'
import BookingLink from './BookingLink'

export default function ExpandingArrowLink({
  href,
  booking = false,
  children,
  tone = 'dark',
  className = '',
}: {
  href?: string
  booking?: boolean
  children: ReactNode
  tone?: 'dark' | 'light' | 'blue' | 'black'
  className?: string
}) {
  const linkClassName = `expanding-link expanding-link--${tone} ${className}`.trim()
  const content = (
    <>
      <span className="expanding-link__circle" aria-hidden="true">
        <span className="expanding-link__arrow" />
      </span>
      <span className="expanding-link__text">{children}</span>
    </>
  )

  if (booking) {
    return (
      <BookingLink variant="bare" className={linkClassName}>
        {content}
      </BookingLink>
    )
  }

  return (
    <a
      className={linkClassName}
      href={href ?? '#'}
    >
      {content}
    </a>
  )
}
