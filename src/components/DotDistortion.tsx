import { CSSProperties, useEffect, useRef } from 'react'

interface DotDistortionProps {
  className?: string
  style?: CSSProperties
  gridGap?: number
  dotSize?: number
  influenceRadius?: number
  strength?: number
  damping?: number
  returnSpeed?: number
  dotColor?: string
  backgroundColor?: string
}

interface Dot {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
}

export default function DotDistortion({
  className = '',
  style,
  gridGap = 25,
  dotSize = 2,
  influenceRadius = 100,
  strength = 50,
  damping = 0.9,
  returnSpeed = 0.05,
  dotColor = 'rgba(255, 255, 255, 0.5)',
  backgroundColor = '#000',
}: DotDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: -1000, y: -1000 })
  const dots = useRef<Dot[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = 0
    let width = 0
    let height = 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const init = () => {
      const rect = container.getBoundingClientRect()
      const nextWidth = Math.max(1, Math.floor(rect.width))
      const nextHeight = Math.max(1, Math.floor(rect.height))
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      width = nextWidth
      height = nextHeight
      canvas.width = Math.floor(nextWidth * pixelRatio)
      canvas.height = Math.floor(nextHeight * pixelRatio)
      canvas.style.width = `${nextWidth}px`
      canvas.style.height = `${nextHeight}px`
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      dots.current = []
      const cols = Math.floor(nextWidth / gridGap)
      const rows = Math.floor(nextHeight / gridGap)
      const offsetX = (nextWidth - cols * gridGap) / 2
      const offsetY = (nextHeight - rows * gridGap) / 2

      for (let i = 0; i <= cols; i += 1) {
        for (let j = 0; j <= rows; j += 1) {
          const x = i * gridGap + offsetX
          const y = j * gridGap + offsetY
          dots.current.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 })
        }
      }
    }

    const updateDot = (dot: Dot) => {
      const dx = dot.x - mouse.current.x
      const dy = dot.y - mouse.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < influenceRadius) {
        const force = (influenceRadius - distance) / influenceRadius
        const angle = Math.atan2(dy, dx)
        dot.vx += Math.cos(angle) * force * strength
        dot.vy += Math.sin(angle) * force * strength
      }

      dot.vx += (dot.originX - dot.x) * returnSpeed
      dot.vy += (dot.originY - dot.y) * returnSpeed
      dot.vx *= damping
      dot.vy *= damping
      dot.x += dot.vx
      dot.y += dot.vy
    }

    const drawDot = (dot: Dot) => {
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2)
      ctx.fill()
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = dotColor

      for (const dot of dots.current) {
        if (!reduceMotion) updateDot(dot)
        drawDot(dot)
      }

      if (!reduceMotion) animationFrameId = requestAnimationFrame(render)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouse.current.x = -1000
        mouse.current.y = -1000
        return
      }

      mouse.current.x = x
      mouse.current.y = y
    }

    const handlePointerLeave = () => {
      mouse.current.x = -1000
      mouse.current.y = -1000
    }

    init()
    render()

    const resizeObserver = new ResizeObserver(() => {
      init()
      if (reduceMotion) render()
    })
    resizeObserver.observe(container)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
    }
  }, [gridGap, dotSize, influenceRadius, strength, damping, returnSpeed, dotColor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: backgroundColor,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
