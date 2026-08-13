import { CSSProperties, useId } from 'react'

interface AnimatedBeamPathProps {
  className?: string
  pathD?: string
  duration?: number
  strokeColor?: string
  beamColors?: [string, string]
  glowColor?: string
  viewBox?: string
}

export default function AnimatedBeamPath({
  className = '',
  pathD = 'M 20,100 C 150,20 250,180 400,100 C 550,20 650,180 780,100',
  duration = 4,
  strokeColor = 'rgba(105, 167, 255, 0.18)',
  beamColors = ['#2f7dff', '#4ad7ff'],
  glowColor = '#4ad7ff',
  viewBox = '0 0 800 200',
}: AnimatedBeamPathProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradientId = `beam-gradient-${id}`
  const glowId = `beam-glow-${id}`

  return (
    <div
      className={`animated-beam-path ${className}`}
      style={{ '--beam-duration': `${duration}s` } as CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={beamColors[0]} stopOpacity="0" />
            <stop offset="30%" stopColor={beamColors[0]} stopOpacity="1" />
            <stop offset="70%" stopColor={beamColors[1]} stopOpacity="1" />
            <stop offset="100%" stopColor={beamColors[1]} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="animated-beam-path__track"
          d={pathD}
          stroke={strokeColor}
          strokeLinecap="round"
          pathLength={800}
        />
        <path
          className="animated-beam-path__glow"
          d={pathD}
          stroke={glowColor}
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          pathLength={800}
        />
        <path
          className="animated-beam-path__core"
          d={pathD}
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          pathLength={800}
        />
      </svg>
    </div>
  )
}
