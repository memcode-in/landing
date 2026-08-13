import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { SITE_ORIGIN, useSeo } from '../lib/seo'
import ImpactSlider from '../components/ImpactSlider'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import CliTerminal from '../components/marketing/CliTerminal'
import '../styles/research.css'

type ConditionKey = 'withMemory' | 'withoutMemory'
type MetricMode = 'tokens' | 'time' | 'solve'

type TaskFamily = {
  name: string
  tasks: number
  solveRate: number
  withMemory: number
  withoutMemory: number
  timeWith: number
  timeWithout: number
}

const taskFamilies: TaskFamily[] = [
  { name: 'Bug fixes', tasks: 12, solveRate: 92, withMemory: 13.8, withoutMemory: 22.9, timeWith: 8.4, timeWithout: 13.2 },
  { name: 'Refactors', tasks: 10, solveRate: 88, withMemory: 19.4, withoutMemory: 31.8, timeWith: 12.1, timeWithout: 18.5 },
  { name: 'Test repair', tasks: 9, solveRate: 90, withMemory: 12.6, withoutMemory: 20.7, timeWith: 7.8, timeWithout: 11.4 },
  { name: 'Feature work', tasks: 11, solveRate: 84, withMemory: 24.9, withoutMemory: 40.2, timeWith: 15.2, timeWithout: 22.6 },
  { name: 'Migrations', tasks: 8, solveRate: 86, withMemory: 21.1, withoutMemory: 34.6, timeWith: 13.7, timeWithout: 20.1 },
]

const contextStages = [
  ['01', 'Prompt enters harness', 'A clean coding task is launched in the same repo under memory-on and memory-off conditions.'],
  ['02', 'Memory retrieval', 'The memory run receives relevant project facts, commands, decisions, and prior implementation patterns.'],
  ['03', 'Agent execution', 'The coding tool inspects files, edits code, runs checks, and stops when the task is solved or exhausted.'],
  ['04', 'Efficiency scoring', 'The harness records tokens, wall time, context hits, command count, and solution quality.'],
]

const leaderboard = [
  ['MemCode + project memory', '90.0%', '18.0k', '11.3m', '1.00x'],
  ['Same harness, no memory', '82.0%', '30.2k', '17.9m', '1.68x'],
  ['Naive full-context preload', '84.0%', '42.6k', '19.4m', '2.37x'],
  ['Manual notes in prompt', '78.0%', '28.9k', '16.8m', '1.61x'],
]

const retrievalRows = [
  ['Repo architecture', 96, 'loaded before file search'],
  ['Prior decisions', 91, 'avoids stale rewrites'],
  ['Test commands', 94, 'fewer failed verification loops'],
  ['User preferences', 89, 'style choices persist'],
  ['Recent changes', 87, 'latest state wins'],
]

const heroRuns = [
  ['context.loaded', '18 memories', 'project architecture, preferred commands'],
  ['tokens.saved', '40%', 'mean reduction across the benchmark'],
  ['solve.speed', '37%', 'less time from prompt to passing checks'],
]
const tokenEstimatorItems = [
  {
    id: 'small-fix',
    label: 'Small fix',
    eyebrow: 'Token savings estimator',
    title: 'A one-file bug fix starts with the right local facts.',
    description: 'Memory skips the warm-up where the agent rereads conventions, commands, and recent bug notes before making a small edit.',
    primaryValue: '28%',
    primaryLabel: 'estimated context saved',
    metrics: [
      { label: 'Repeated prompt reduction', value: '1.4k', note: 'fewer setup tokens' },
      { label: 'Memory recall benefit', value: 'test cmd', note: 'verification loaded early' },
      { label: 'Typical run', value: '6m', note: 'fast local loop' },
    ],
    tags: ['bug notes', 'test command', 'style preference'],
  },
  {
    id: 'feature-task',
    label: 'Feature task',
    eyebrow: 'Token savings estimator',
    title: 'Feature work benefits from remembered product and repo choices.',
    description: 'The agent can reuse prior layout decisions, API assumptions, and naming patterns instead of rediscovering them through extra searches.',
    primaryValue: '36%',
    primaryLabel: 'estimated context saved',
    metrics: [
      { label: 'Repeated prompt reduction', value: '5.8k', note: 'less recap per task' },
      { label: 'Memory recall benefit', value: 'patterns', note: 'component choices restored' },
      { label: 'Typical run', value: '15m', note: 'fewer false starts' },
    ],
    tags: ['API shape', 'component pattern', 'copy decisions'],
  },
  {
    id: 'refactor',
    label: 'Refactor',
    eyebrow: 'Token savings estimator',
    title: 'Refactors need architectural memory before broad edits.',
    description: 'Memory gives the agent constraints, risky files, and preferred abstractions before it plans a change across several modules.',
    primaryValue: '41%',
    primaryLabel: 'estimated context saved',
    metrics: [
      { label: 'Repeated prompt reduction', value: '9.7k', note: 'less repo rediscovery' },
      { label: 'Memory recall benefit', value: 'decisions', note: 'architecture carried forward' },
      { label: 'Typical run', value: '19m', note: 'safer plan first' },
    ],
    tags: ['architecture', 'risky files', 'review preferences'],
  },
  {
    id: 'multi-session',
    label: 'Multi-session project',
    eyebrow: 'Token savings estimator',
    title: 'Long-running work compounds when every session starts warm.',
    description: 'The biggest gain comes from not re-explaining the project state, open decisions, test failures, and handoff notes every time.',
    primaryValue: '47%',
    primaryLabel: 'estimated context saved',
    metrics: [
      { label: 'Repeated prompt reduction', value: '18.4k', note: 'saved across handoffs' },
      { label: 'Memory recall benefit', value: 'handoff', note: 'latest state wins' },
      { label: 'Typical run', value: '3+ sessions', note: 'continuity retained' },
    ],
    tags: ['handoff state', 'open decisions', 'latest changes'],
  },
]

const researchChapters = [
  { id: 'benchmark', label: 'Benchmark', title: 'Memory changes the coding loop' },
  { id: 'leaderboard', label: 'Leaderboard', title: 'Same agent, better context' },
  { id: 'harness', label: 'Harness design', title: 'A measured coding setup' },
]

function ResearchNavbar() {
  return <MarketingNav />
}

function ResearchFooter() {
  return <MarketingFooter />
}

function MetricTile({ value, label, note, delay = 0, featured = false }: { value: string; label: string; note: string; delay?: number; featured?: boolean }) {
  return (
    <article className={featured ? 'research-metric spotlight-card moving-border' : 'research-metric spotlight-card'} style={{ '--metric-delay': `${delay}ms` } as CSSProperties}>
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{note}</p>
    </article>
  )
}

function FamilyChart() {
  const [activeFamily, setActiveFamily] = useState(taskFamilies[0].name)
  const [condition, setCondition] = useState<ConditionKey>('withMemory')
  const [metric, setMetric] = useState<MetricMode>('tokens')
  const active = taskFamilies.find((family) => family.name === activeFamily) ?? taskFamilies[0]
  const tokenDelta = Math.round((1 - active.withMemory / active.withoutMemory) * 100)
  const timeDelta = Math.round((1 - active.timeWith / active.timeWithout) * 100)
  const conditionLabel = condition === 'withMemory' ? 'With memory' : 'No memory'
  const conditionValue = condition === 'withMemory' ? active.withMemory : active.withoutMemory
  const metricValue = metric === 'tokens'
    ? `${conditionValue}k`
    : metric === 'time'
      ? `${condition === 'withMemory' ? active.timeWith : active.timeWithout}m`
      : `${active.solveRate}%`
  const maxTokenValue = Math.max(...taskFamilies.map((family) => family.withoutMemory))
  const maxTimeValue = Math.max(...taskFamilies.map((family) => family.timeWithout))

  return (
    <div className="research-chart-grid">
      <div className="research-chart-controls" aria-label="Benchmark task families">
        {taskFamilies.map((family) => (
          <button
            type="button"
            key={family.name}
            className={family.name === activeFamily ? 'is-active' : ''}
            onClick={() => setActiveFamily(family.name)}
            onMouseEnter={() => setActiveFamily(family.name)}
          >
            <span>{family.tasks} tasks</span>
            <strong>{family.name}</strong>
            <small>{family.solveRate}% solved with memory</small>
            <i><em style={{ width: `${Math.round((family.withMemory / family.withoutMemory) * 100)}%` }} /></i>
          </button>
        ))}
      </div>
      <div className="research-chart-card spotlight-card">
        <div className="toggle-row">
          <div className="condition-toggle" aria-label="Displayed condition">
            <button type="button" className={condition === 'withMemory' ? 'is-active' : ''} onClick={() => setCondition('withMemory')}>With memory</button>
            <button type="button" className={condition === 'withoutMemory' ? 'is-active' : ''} onClick={() => setCondition('withoutMemory')}>No memory</button>
          </div>
          <div className="metric-toggle" aria-label="Displayed metric">
            {[
              ['tokens', 'Tokens'],
              ['time', 'Time'],
              ['solve', 'Solved'],
            ].map(([key, label]) => (
              <button key={key} type="button" className={metric === key ? 'is-active' : ''} onClick={() => setMetric(key as MetricMode)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-head">
          <div>
            <span>{active.name} - {conditionLabel}</span>
            <h3>{condition === 'withMemory' ? 'Memory gives the agent the right starting context.' : 'No-memory runs spend tokens rediscovering the repo.'}</h3>
          </div>
          <strong key={`${active.name}-${condition}-${metric}`}>{metricValue}</strong>
        </div>
        <div className="bar-compare" aria-label={`${active.name} token comparison`}>
          <div>
            <span>With memory</span>
            <i><em style={{ width: `${(active.withMemory / active.withoutMemory) * 100}%` }} /></i>
            <b>{active.withMemory}k tokens</b>
          </div>
          <div>
            <span>No memory</span>
            <i><em className="is-muted" style={{ width: '100%' }} /></i>
            <b>{active.withoutMemory}k tokens</b>
          </div>
        </div>
        <div className="family-bars" aria-label="Task family benchmark bars">
          {taskFamilies.map((family) => {
            const primary = metric === 'tokens'
              ? (condition === 'withMemory' ? family.withMemory : family.withoutMemory) / maxTokenValue
              : metric === 'time'
                ? (condition === 'withMemory' ? family.timeWith : family.timeWithout) / maxTimeValue
                : family.solveRate / 100
            const secondary = metric === 'tokens'
              ? family.withoutMemory / maxTokenValue
              : metric === 'time'
                ? family.timeWithout / maxTimeValue
                : 0.82
            return (
              <button
                type="button"
                key={family.name}
                className={family.name === activeFamily ? 'is-active' : ''}
                onClick={() => setActiveFamily(family.name)}
                onMouseEnter={() => setActiveFamily(family.name)}
                aria-label={`${family.name} ${metric} comparison`}
              >
                <span>
                  <i className="is-primary" style={{ height: `${Math.max(primary * 100, 10)}%` }} />
                  <i className="is-secondary" style={{ height: `${Math.max(secondary * 100, 10)}%` }} />
                </span>
                <small>{family.name}</small>
              </button>
            )
          })}
        </div>
        <div className="chart-insight">
          <div><strong>{tokenDelta}%</strong><span>token reduction</span></div>
          <div><strong>{timeDelta}%</strong><span>faster completion</span></div>
          <div><strong>{active.solveRate}%</strong><span>solve rate</span></div>
        </div>
      </div>
    </div>
  )
}

function TokenCurve() {
  const [activeIndex, setActiveIndex] = useState(4)
  const points = useMemo(() => [
    { label: '10', memory: 3.4, baseline: 5.7, time: 2.1 },
    { label: '20', memory: 6.8, baseline: 11.6, time: 4.4 },
    { label: '30', memory: 10.6, baseline: 18.4, time: 6.7 },
    { label: '40', memory: 14.1, baseline: 24.2, time: 8.9 },
    { label: '50', memory: 18.0, baseline: 30.2, time: 11.3 },
  ], [])
  const maxValue = 32
  const width = 720
  const height = 280
  const xFor = (index: number) => 42 + index * ((width - 84) / (points.length - 1))
  const yFor = (value: number) => height - 38 - (value / maxValue) * (height - 72)
  const memoryPath = points.map((point, index) => `${xFor(index)},${yFor(point.memory)}`).join(' ')
  const baselinePath = points.map((point, index) => `${xFor(index)},${yFor(point.baseline)}`).join(' ')
  const activePoint = points[activeIndex]
  const reduction = Math.round((1 - activePoint.memory / activePoint.baseline) * 100)

  return (
    <div className="curve-card spotlight-card">
      <div className="curve-card__head">
        <div><span>Cumulative tokens</span><h3>Efficiency compounds across the full benchmark.</h3></div>
        <p>Hover each checkpoint to see token and time savings move through the benchmark.</p>
      </div>
      <div className="curve-readout">
        <div><strong>{activePoint.label}</strong><span>tasks</span></div>
        <div><strong>{activePoint.memory}M</strong><span>memory tokens</span></div>
        <div><strong>{reduction}%</strong><span>reduction</span></div>
        <div><strong>{activePoint.time}m</strong><span>mean solve time</span></div>
      </div>
      <div className="curve-plot" aria-label="Cumulative token usage chart" onMouseLeave={() => setActiveIndex(4)}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative token line chart">
          <defs>
            <linearGradient id="memoryLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#2f7dff" />
              <stop offset="55%" stopColor="#69a7ff" />
              <stop offset="100%" stopColor="#4ad7ff" />
            </linearGradient>
            <linearGradient id="baselineLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7b8496" />
              <stop offset="100%" stopColor="#d6deea" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => (
            <line key={line} x1="28" x2={width - 28} y1={48 + line * 52} y2={48 + line * 52} />
          ))}
          <polyline className="baseline-line" points={baselinePath} />
          <polyline className="memory-line" points={memoryPath} />
          {points.map((point, index) => (
            <g key={point.label} className={index === activeIndex ? 'is-active' : ''} onMouseEnter={() => setActiveIndex(index)}>
              <circle className="baseline-dot" cx={xFor(index)} cy={yFor(point.baseline)} r="6" />
              <circle className="memory-dot" cx={xFor(index)} cy={yFor(point.memory)} r="7" />
              <rect x={xFor(index) - 32} y="0" width="64" height={height} fill="transparent" />
            </g>
          ))}
        </svg>
        {points.map((point, index) => (
          <button type="button" className={index === activeIndex ? 'curve-step is-active' : 'curve-step'} key={point.label} onMouseEnter={() => setActiveIndex(index)} onClick={() => setActiveIndex(index)}>
            <small>{point.label}</small>
            {index === points.length - 1 ? <b>40% less</b> : null}
          </button>
        ))}
      </div>
      <div className="curve-legend"><span><i />With memory</span><span><i className="is-muted" />No memory</span></div>
    </div>
  )
}
function ResearchTokenEstimator() {
  return (
    <ImpactSlider
      className="research-impact-estimator"
      title="Estimate how memory changes each task shape."
      summary="Slide from a small fix to a multi-session project to see where repeated context disappears."
      items={tokenEstimatorItems}
    />
  )
}

function HarnessFlow() {
  return (
    <div className="harness-flow">
      {contextStages.map(([step, title, copy]) => (
        <article key={step} className="spotlight-card">
          <span>{step}</span>
          <h3>{title}</h3>
          <p>{copy}</p>
        </article>
      ))}
    </div>
  )
}

function ContextDiagram() {
  return (
    <div className="context-diagram" aria-label="Memory context pipeline">
      <div className="context-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="context-node context-node--agent">
        <span>Agent</span>
        <strong>Coding task</strong>
        <small>edit, test, verify</small>
      </div>
      <div className="context-rail"><i /><i /><i /></div>
      <div className="context-node context-node--memory">
        <span>Memory system</span>
        <strong>Project context</strong>
        <small>facts, decisions, commands</small>
      </div>
      <div className="context-packets">
        {['auth flow', 'test script', 'style pref', 'last fix', 'repo map'].map((item, index) => (
          <em key={item} style={{ '--packet-delay': `${index * 120}ms` } as CSSProperties}>{item}</em>
        ))}
      </div>
    </div>
  )
}

function ResearchChapterRail({ activeChapter }: { activeChapter: string }) {
  const active = researchChapters.find((chapter) => chapter.id === activeChapter) ?? researchChapters[0]

  const scrollToChapter = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="research-chapter-rail" aria-label="Research sections">
      <div className="container research-chapter-rail__inner">
        <div className="chapter-focus" aria-live="polite">
          <span aria-hidden="true" />
          <strong>{active.label}</strong>
          <span aria-hidden="true" />
        </div>
        <p>{active.title}</p>
        <div className="chapter-track">
          {researchChapters.map((chapter, index) => (
            <button
              type="button"
              key={chapter.id}
              className={chapter.id === activeChapter ? 'is-active' : ''}
              onClick={() => scrollToChapter(chapter.id)}
              aria-current={chapter.id === activeChapter ? 'step' : undefined}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{chapter.label}</strong>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

function HeroTerminal() {
  return (
    <CliTerminal
      title="memcode harness"
      className="research-terminal"
      ariaLabel="Animated benchmark terminal"
      showCursor={false}
    >
      <p className="research-terminal__command"><b>$</b> memcode bench --suite coding-memory --runs 50</p>
      {heroRuns.map(([event, value, note], index) => (
        <div key={event} className="terminal-run" style={{ '--run-delay': `${index * 180}ms` } as CSSProperties}>
          <span>{event}</span>
          <strong>{value}</strong>
          <small>{note}</small>
        </div>
      ))}
      <div className="terminal-wave" aria-hidden="true">
        {[44, 58, 36, 72, 51, 84, 63, 92, 68, 76, 49, 88].map((height, index) => (
          <i key={index} style={{ '--wave-height': `${height}%`, '--run-delay': `${index * 55}ms` } as CSSProperties} />
        ))}
      </div>
    </CliTerminal>
  )
}

export default function ResearchPage() {
  const [activeChapter, setActiveChapter] = useState(researchChapters[0].id)

  useEffect(() => {
    let frame = 0

    const updateActiveChapter = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const viewportAnchor = window.innerHeight * 0.42
        let nextChapter = researchChapters[0].id
        let closestDistance = Number.POSITIVE_INFINITY

        researchChapters.forEach((chapter) => {
          const section = document.getElementById(chapter.id)
          if (!section) return

          const rect = section.getBoundingClientRect()
          const sectionAnchor = rect.top + Math.min(rect.height * 0.28, 220)
          const isNearViewport = rect.top < window.innerHeight * 0.78 && rect.bottom > window.innerHeight * 0.2
          const distance = Math.abs(sectionAnchor - viewportAnchor)

          if (isNearViewport && distance < closestDistance) {
            closestDistance = distance
            nextChapter = chapter.id
          }
        })

        setActiveChapter((current) => (current === nextChapter ? current : nextChapter))
      })
    }

    updateActiveChapter()
    window.addEventListener('scroll', updateActiveChapter, { passive: true })
    window.addEventListener('resize', updateActiveChapter)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveChapter)
      window.removeEventListener('resize', updateActiveChapter)
    }
  }, [])

  useSeo({
    title: 'MemCode Research - Coding Agent Memory Benchmark',
    description: 'A 50-task coding harness study showing how project memory reduces tokens and time for coding agents while improving context quality.',
    path: '/research',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'MemCode Research: Coding Agent Memory Benchmark',
      description: 'A 50-task coding harness study showing how project memory reduces token usage and time for coding agents.',
      publisher: {
        '@type': 'Organization',
        name: 'MemCode',
        url: SITE_ORIGIN,
      },
    },
  })

  return (
    <div className="landing-shell memcode-look research-shell">
      <ResearchNavbar />
      <main>
        <section id="summary" className="research-hero">
          <div className="research-hero__backdrop" aria-hidden="true" />
          <div className="container research-hero__inner">
            <div className="research-hero__copy">
              <h1>Benchmarking memory for coding agents.</h1>
              <p>We tested the MemCode coding harness on 50 realistic engineering tasks with and without project memory. The memory-enabled agent used 40% fewer tokens, solved faster, and started with context that normally takes several tool calls to rediscover.</p>
              <div className="research-hero__actions">
                <a className="btn btn--primary" href="#benchmark">Explore results</a>
                <a className="btn btn--ghost" href="#harness">View harness</a>
              </div>
              <HeroTerminal />
            </div>
            <div className="research-hero__panel" aria-label="Research highlights">
              <MetricTile value="50" label="coding tasks" note="bug fixes, refactors, tests, migrations, feature work" />
              <MetricTile value="40%" label="token reduction" note="mean reduction from memory-on vs no-memory runs" delay={120} featured />
              <MetricTile value="37%" label="faster solves" note="less repo rediscovery and fewer repeated searches" delay={240} />
              <MetricTile value="90%" label="solve rate" note="mocked benchmark outcome for the prototype page" delay={360} />
            </div>
          </div>
        </section>

        <section className="research-band" aria-label="Research summary">
          <div className="container research-band__grid">
            <strong>State-of-the-art memory for coding tools</strong>
            <span>50 problems</span>
            <span>5 task families</span>
            <span>2 isolated conditions</span>
            <span>tokens + time measured</span>
          </div>
        </section>

        <ResearchChapterRail activeChapter={activeChapter} />

        <section id="benchmark" className="research-section research-section--dark research-chapter-section">
          <div className="container">
            <div className="research-heading">
              <div>
                <div className="research-label">Benchmark</div>
                <h2>Memory changes the shape of the coding loop.</h2>
              </div>
              <p>The largest savings appear when the agent would otherwise spend time recovering architecture, previous decisions, project-specific commands, and user preferences.</p>
            </div>
            <FamilyChart />
            <ResearchTokenEstimator />
            <TokenCurve />
          </div>
        </section>

        <section id="leaderboard" className="research-section research-section--paper research-section--blue-paper research-chapter-section">
          <div className="container research-table-grid">
            <div>
              <div className="research-label research-label--dark">Leaderboard</div>
              <h2>Same problems. Same agent. Better context.</h2>
              <p>Mocked comparative results show how memory beats prompt stuffing: fewer tokens than full-context preload, higher solve rate than manual notes, and faster time-to-solve than no memory.</p>
            </div>
            <div className="leaderboard-table" aria-label="Benchmark leaderboard">
              <div><span>Condition</span><span>Solved</span><span>Tokens</span><span>Time</span><span>Cost</span></div>
              {leaderboard.map(([condition, solved, tokens, time, cost], index) => (
                <div key={condition} className={index === 0 ? 'is-best' : ''}>
                  <strong>{condition}</strong><span>{solved}</span><span>{tokens}</span><span>{time}</span><span>{cost}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="harness" className="research-section research-section--dark research-chapter-section">
          <div className="container">
            <div className="research-heading">
              <div>
                <div className="research-label">Harness design</div>
                <h2>A 50-problem setup for measuring coding efficiency.</h2>
              </div>
              <p>Each task runs twice: once with memory attached and once as a cold coding session. The harness records what context was retrieved, how many commands ran, whether tests passed, and how many tokens were consumed.</p>
            </div>
            <HarnessFlow />
            <div className="context-grid">
              <ContextDiagram />
              <div className="retrieval-card spotlight-card">
                <div><span>Context hit rate</span><h3>Agents get the right facts before they guess.</h3></div>
                {retrievalRows.map(([label, value, note]) => (
                  <div className="retrieval-row" key={label}>
                    <span>{label}</span>
                    <i><em style={{ width: `${value}%` }} /></i>
                    <b>{value}%</b>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="research-section research-section--paper research-section--blue-paper">
          <div className="container takeaway-grid">
            <article>
              <span>01</span>
              <h3>Lower token use is not just cheaper.</h3>
              <p>It shortens the agent's search loop, reduces repeated file reads, and makes room for higher-value reasoning inside the same context budget.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Memory improves user experience.</h3>
              <p>The agent remembers repo conventions, preferred commands, and previous decisions, so developers spend less time re-explaining the same background.</p>
            </article>
            <article>
              <span>03</span>
              <h3>The benchmark is built for coding work.</h3>
              <p>The suite covers practical software tasks, not only Q&A recall, and captures both correctness and efficiency.</p>
            </article>
          </div>
        </section>
      </main>
      <ResearchFooter />
    </div>
  )
}
