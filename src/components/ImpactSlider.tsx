import { CSSProperties, useMemo, useState } from 'react'

export interface ImpactSliderMetric {
  label: string
  value: string
  note?: string
}

export interface ImpactSliderItem {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  primaryValue: string
  primaryLabel: string
  metrics: ImpactSliderMetric[]
  tags?: string[]
}

interface ImpactSliderProps {
  title: string
  summary?: string
  items: ImpactSliderItem[]
  className?: string
  variant?: 'dark' | 'paper'
}

export default function ImpactSlider({
  title,
  summary,
  items,
  className = '',
  variant = 'dark',
}: ImpactSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = items[activeIndex] ?? items[0]
  const progress = useMemo(
    () => (items.length <= 1 ? 0 : (activeIndex / (items.length - 1)) * 100),
    [activeIndex, items.length],
  )
  const controlStyle = {
    '--impact-progress': `${progress}%`,
    '--impact-step-count': items.length,
  } as CSSProperties

  if (!active) return null

  return (
    <div className={`impact-slider impact-slider--${variant} ${className}`}>
      <div className="impact-slider__head">
        <div>
          <span>{active.eyebrow}</span>
          <h3>{title}</h3>
        </div>
        {summary && <p>{summary}</p>}
      </div>

      <div className="impact-slider__stage">
        <div className="impact-slider__main" key={active.id}>
          <div>
            <span>{active.label}</span>
            <h4>{active.title}</h4>
            <p>{active.description}</p>
          </div>
          <strong>{active.primaryValue}<small>{active.primaryLabel}</small></strong>
        </div>

        <div className="impact-slider__metrics">
          {active.metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              {metric.note && <small>{metric.note}</small>}
            </div>
          ))}
        </div>

        {active.tags && (
          <div className="impact-slider__tags">
            {active.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        )}
      </div>

      <div className="impact-slider__control" style={controlStyle}>
        <div className="impact-slider__scrubber" aria-hidden="true">
          <span className="impact-slider__scrubber-fill" />
          {items.map((item) => (
            <i key={item.id} />
          ))}
          <b />
        </div>
        <input
          type="range"
          min={0}
          max={items.length - 1}
          value={activeIndex}
          onChange={(event) => setActiveIndex(Number(event.target.value))}
          aria-label={`${title} scenario`}

        />
        <div className="impact-slider__steps" aria-label={`${title} scenarios`}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <i />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
