import { CSSProperties, useEffect, useRef, useState } from 'react'

/**
 * RecallGauge — a radial gauge that sweeps and counts up to `value` when it
 * scrolls into view. Shows the final value immediately under reduced motion.
 */
export default function RecallGauge({
  value,
  label,
  caption,
}: {
  value: number
  label: string
  caption: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        setSwept(true)
        if (reduce) {
          setDisplay(value)
          return
        }
        const start = performance.now()
        const duration = 1100
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(eased * value * 10) / 10)
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { rootMargin: '-40px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [value])

  const R = 52
  const C = 2 * Math.PI * R
  const pct = Math.min(Math.max(value, 0), 100) / 100

  return (
    <div className="recall-gauge" ref={ref}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={R} className="recall-gauge__track" />
        <circle
          cx="70"
          cy="70"
          r={R}
          className="recall-gauge__arc"
          style={
            {
              strokeDasharray: C,
              strokeDashoffset: swept ? C * (1 - pct) : C,
            } as CSSProperties
          }
        />
      </svg>
      <div className="recall-gauge__value">
        <strong>{display.toFixed(1)}</strong>
        <span>/ 100</span>
      </div>
      <div className="recall-gauge__meta">
        <b>{label}</b>
        <small>{caption}</small>
      </div>
    </div>
  )
}
