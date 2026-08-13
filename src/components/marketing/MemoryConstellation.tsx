import { CSSProperties, useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  ox: number
  oy: number
  vx: number
  vy: number
  r: number
  label?: string
  recall: number // 0..1 eased "recalled" glow
  phase: number
}

interface MemoryConstellationProps {
  className?: string
  style?: CSSProperties
  /** Short fact labels that appear on the brighter nodes. */
  facts?: string[]
  density?: number
}

const DEFAULT_FACTS = [
  'customer prefers email',
  'Q3 roadmap approved',
  'API v2 shipped',
  'renewal in August',
  'owner: platform team',
  'ticket #4821 resolved',
  'prefers async updates',
  'decision: adopt SSO',
  'onboarding step 3',
  'contract tier: growth',
]

/**
 * Memory Constellation — an interactive field of memory "nodes" that drift and
 * wire themselves together. The pointer acts as a recall query: nearby memories
 * are pulled in, light up, and beam back to a pulsing central memory core.
 * Falls back to a calm static field under prefers-reduced-motion.
 */
export default function MemoryConstellation({
  className = '',
  style,
  facts = DEFAULT_FACTS,
  density = 1,
}: MemoryConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointer = useRef({ x: -9999, y: -9999, active: false })
  const nodesRef = useRef<Node[]>([])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let raf = 0
    let t = 0

    const build = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round(Math.min(58, Math.max(26, (width * height) / 16000)) * density)
      const nodes: Node[] = []
      for (let i = 0; i < count; i += 1) {
        const x = Math.random() * width
        const y = Math.random() * height
        const labelled = i < facts.length && Math.random() > 0.35
        nodes.push({
          x,
          y,
          ox: x,
          oy: y,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: labelled ? 3.1 : 1.5 + Math.random() * 1.2,
          label: labelled ? facts[i % facts.length] : undefined,
          recall: 0,
          phase: Math.random() * Math.PI * 2,
        })
      }
      nodesRef.current = nodes
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, width, height)
      const nodes = nodesRef.current
      const cx = width / 2
      const cy = height / 2
      const px = pointer.current.active ? pointer.current.x : cx
      const py = pointer.current.active ? pointer.current.y : cy
      const influence = Math.min(width, height) * 0.42

      // update
      for (const n of nodes) {
        if (!reduceMotion) {
          n.x += n.vx
          n.y += n.vy
          // gentle drift bounds
          if (n.x < 0 || n.x > width) n.vx *= -1
          if (n.y < 0 || n.y > height) n.vy *= -1
          // soft pull toward origin so field stays even
          n.vx += (n.ox - n.x) * 0.0006
          n.vy += (n.oy - n.y) * 0.0006
        }
        const dx = px - n.x
        const dy = py - n.y
        const dist = Math.hypot(dx, dy)
        const target = pointer.current.active && dist < influence ? 1 - dist / influence : 0
        n.recall += (target - n.recall) * 0.12
        if (!reduceMotion && n.recall > 0.05) {
          n.x += dx * 0.006 * n.recall
          n.y += dy * 0.006 * n.recall
        }
      }

      // connections
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 118) {
            const heat = Math.max(a.recall, b.recall)
            const alpha = (1 - d / 118) * (0.12 + heat * 0.5)
            ctx.strokeStyle = heat > 0.15
              ? `rgba(105, 167, 255, ${alpha})`
              : `rgba(120, 150, 200, ${alpha})`
            ctx.lineWidth = 0.6 + heat * 0.8
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // memory core (pulsing)
      const pulse = reduceMotion ? 0.5 : 0.5 + Math.sin(t * 0.03) * 0.5
      const coreR = 26 + pulse * 6
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.4)
      grad.addColorStop(0, `rgba(74, 215, 255, ${0.5 + pulse * 0.3})`)
      grad.addColorStop(0.4, 'rgba(47, 125, 255, 0.28)')
      grad.addColorStop(1, 'rgba(47, 125, 255, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(233, 245, 255, ${0.85})`
      ctx.beginPath()
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2)
      ctx.fill()

      // nodes + recall beams
      ctx.font = '600 11px "JetBrains Mono", monospace'
      ctx.textBaseline = 'middle'
      for (const n of nodes) {
        if (n.recall > 0.1) {
          ctx.strokeStyle = `rgba(74, 215, 255, ${n.recall * 0.5})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(n.x, n.y)
          ctx.stroke()
        }
        const twinkle = reduceMotion ? 0.6 : 0.5 + Math.sin(t * 0.05 + n.phase) * 0.5
        const base = 0.32 + twinkle * 0.28
        const lit = base + n.recall * 0.7
        ctx.fillStyle = n.recall > 0.2
          ? `rgba(160, 214, 255, ${Math.min(1, lit)})`
          : `rgba(120, 150, 200, ${base})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + n.recall * 2.4, 0, Math.PI * 2)
        ctx.fill()

        if (n.label && n.recall > 0.4) {
          ctx.fillStyle = `rgba(224, 240, 255, ${(n.recall - 0.4) / 0.6})`
          ctx.fillText(n.label, n.x + 10, n.y)
        }
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        pointer.current.active = false
        return
      }
      pointer.current = { x, y, active: true }
      if (reduceMotion) draw()
    }
    const onLeave = () => {
      pointer.current.active = false
      if (reduceMotion) draw()
    }

    build()
    draw()

    const ro = new ResizeObserver(() => {
      build()
      if (reduceMotion) draw()
    })
    ro.observe(container)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [facts, density])

  return (
    <div ref={containerRef} className={`memory-constellation ${className}`} style={style}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <p className="sr-only">
        An interactive visualization of memory nodes connecting to a central
        memory core as they are recalled.
      </p>
    </div>
  )
}
