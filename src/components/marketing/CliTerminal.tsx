import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'

export interface CliCommand {
  command: ReactNode
  output?: ReactNode[]
}

export default function CliTerminal({
  title,
  commands,
  children,
  className = '',
  ariaLabel,
  decorative = false,
  showCursor = true,
}: {
  title?: string
  commands?: CliCommand[]
  children?: ReactNode
  className?: string
  ariaLabel?: string
  decorative?: boolean
  showCursor?: boolean
}) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const terminal = terminalRef.current
    if (!terminal) return

    if (!('IntersectionObserver' in window)) {
      setHasEntered(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setHasEntered(true)
        observer.disconnect()
      },
      { threshold: 0.24, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(terminal)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={terminalRef}
      className={`cli-terminal ${hasEntered ? 'is-running' : ''} ${className}`.trim()}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative || undefined}
    >
      <div className="cli-terminal__bar">
        <span />
        <span />
        <span />
        {title && <strong>{title}</strong>}
      </div>
      <div className="cli-terminal__body">
        {commands?.map((item, index) => (
          <div
            key={`${String(item.command)}-${index}`}
            className="cli-terminal__group"
            style={{ '--cli-index': index } as CSSProperties}
          >
            <p className="cli-terminal__command">
              <span className="cli-terminal__prompt"><b>dev</b>:<i>~</i>$</span>
              <span>{item.command}</span>
            </p>
            {item.output?.map((line, outputIndex) => (
              <small className="cli-terminal__output" key={`${String(line)}-${outputIndex}`}>
                {line}
              </small>
            ))}
          </div>
        ))}
        {children}
        {showCursor && (
          <p
            className="cli-terminal__cursor-line"
            style={{ '--cli-index': commands?.length ?? 0 } as CSSProperties}
            aria-hidden="true"
          >
            <span className="cli-terminal__prompt"><b>dev</b>:<i>~</i>$</span>
            <em className="cli-terminal__cursor" />
          </p>
        )}
      </div>
    </div>
  )
}
