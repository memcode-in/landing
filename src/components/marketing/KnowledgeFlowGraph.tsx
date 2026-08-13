import { useEffect, useState } from 'react'
import { COMPANY_BRAIN_CONNECTORS } from './companyBrainConnectors'

const VB_W = 960
const VB_H = 520

const SOURCES = COMPANY_BRAIN_CONNECTORS.map((connector, index) => ({
  ...connector,
  y: 42 + index * 72.5,
}))

const CONSUMERS = [
  {
    id: 'people',
    label: 'People',
    y: 90,
    sources: ['slack', 'gmail', 'notion'],
    memories: ['current decisions', 'ownership', 'customer context'],
  },
  {
    id: 'agents',
    label: 'AI agents',
    y: 205,
    sources: ['claude', 'codex', 'cursor', 'notion'],
    memories: ['project memory', 'prior work', 'approved knowledge'],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    y: 320,
    sources: ['gmail', 'slack', 'linkedin'],
    memories: ['live state', 'signals', 'next actions'],
  },
  {
    id: 'leadership',
    label: 'Leadership',
    y: 435,
    sources: ['slack', 'gmail', 'notion', 'linkedin'],
    memories: ['company priorities', 'risks', 'market signals'],
  },
] as const

const SRC_X = 150
const HUB_X = 480
const HUB_Y = 260
const CON_X = 810

function curve(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
}

function pct(v: number, axis: 'x' | 'y') {
  return `${(v / (axis === 'x' ? VB_W : VB_H)) * 100}%`
}

/**
 * KnowledgeFlowGraph — three stages: company sources feed one shared memory
 * layer, which routes the right memories out to agents, employees, copilots and
 * workflows. Pick a consumer to watch exactly which memories route to it as
 * facts travel the beams. Static (no travelling dots) under reduced motion.
 */
export default function KnowledgeFlowGraph() {
  const [active, setActive] = useState<string>('agents')
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const activeConsumer = CONSUMERS.find((c) => c.id === active) ?? CONSUMERS[0]
  const activeSources = new Set(activeConsumer.sources)
  const activeSourceLabels = activeConsumer.sources.map(
    (sourceId) => SOURCES.find((source) => source.id === sourceId)?.label ?? sourceId,
  )

  return (
    <div className="flow-graph">
      <div className="flow-graph__stagelabels" aria-hidden="true">
        <span>Where work happens</span>
        <span>Universal brain</span>
        <span>Where context works</span>
      </div>

      <div className="flow-graph__canvas">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="flowBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2f7dff" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#69a7ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4ad7ff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* source -> hub */}
          {SOURCES.map((s) => {
            const lit = activeSources.has(s.id)
            const d = curve(SRC_X, s.y, HUB_X, HUB_Y)
            return (
              <g key={s.id}>
                <path
                  d={d}
                  className={lit ? 'flow-edge is-lit' : 'flow-edge'}
                  fill="none"
                />
                {lit && !reduceMotion && (
                  <circle r="3.2" className="flow-bead">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            )
          })}

          {/* hub -> consumer */}
          {CONSUMERS.map((c) => {
            const lit = c.id === active
            const d = curve(HUB_X, HUB_Y, CON_X, c.y)
            return (
              <g key={c.id}>
                <path d={d} className={lit ? 'flow-edge is-lit' : 'flow-edge'} fill="none" />
                {lit && !reduceMotion && (
                  <>
                    <circle r="3.4" className="flow-bead">
                      <animateMotion dur="1.9s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="3.4" className="flow-bead">
                      <animateMotion dur="1.9s" begin="0.95s" repeatCount="indefinite" path={d} />
                    </circle>
                  </>
                )}
              </g>
            )
          })}
        </svg>

        {/* HTML node overlay, aligned to the SVG viewBox */}
        <div className="flow-graph__nodes">
          {SOURCES.map((s) => (
            <div
              key={s.id}
              className={[
                'flow-node flow-node--src',
                activeSources.has(s.id) ? 'is-lit' : '',
                s.invertOnDark ? 'needs-dark-contrast' : '',
              ].filter(Boolean).join(' ')}
              style={{ left: pct(SRC_X, 'x'), top: pct(s.y, 'y') }}
            >
              <img src={s.logo} alt="" />
              <span>{s.label}</span>
            </div>
          ))}

          <div className="flow-node flow-node--hub" style={{ left: pct(HUB_X, 'x'), top: pct(HUB_Y, 'y') }}>
            <span className="flow-node__pulse" aria-hidden="true" />
            <span className="flow-node__hub-image">
              <img src="/logo.jpeg" alt="MemCode" />
            </span>
          </div>

          {CONSUMERS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === active ? 'flow-node flow-node--con is-active' : 'flow-node flow-node--con'}
              style={{ left: pct(CON_X, 'x'), top: pct(c.y, 'y') }}
              aria-pressed={c.id === active}
              onMouseEnter={() => setActive(c.id)}
              onFocus={() => setActive(c.id)}
              onClick={() => setActive(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <dl className="flow-graph__ledger" aria-live="polite">
        <div>
          <dt>Destination</dt>
          <dd>{activeConsumer.label}</dd>
        </div>
        <div>
          <dt>Context selected</dt>
          <dd>{activeConsumer.memories.join(' · ')}</dd>
        </div>
        <div>
          <dt>Sources consulted</dt>
          <dd>{activeSourceLabels.join(' · ')}</dd>
        </div>
      </dl>
    </div>
  )
}
