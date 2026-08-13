import { CSSProperties, useEffect, useRef, useState } from 'react'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import { ProductHero, SectionIntro, NumberedCardGrid } from '../components/marketing/primitives'
import RememberPromptCTA from '../components/marketing/RememberPromptCTA'
import ExpandingArrowLink from '../components/marketing/ExpandingArrowLink'
import ChatConversation from '../components/ChatConversation'
import { SITE_ORIGIN, useSeo } from '../lib/seo'

const problemConversations = [
  {
    title: 'Session reset',
    subtitle: 'Every new chat starts from zero — the last one may as well not have happened.',
    status: 'Amnesia',
    agentLabel: 'Cursor',
    agentLogo: 'Cu',
    agentLogoSrc: '/brands/cursor.png',
    agentLogoAlt: 'Cursor logo',
    messages: [
      { id: 's1', sender: 'You', avatar: 'Y', text: 'Pick up where we left off on the launch plan.', isMe: true },
      { id: 's2', sender: 'Cursor', avatar: 'Cu', avatarLogoSrc: '/brands/cursor.png', avatarLogoAlt: 'Cursor logo', text: 'I don’t have any memory of previous conversations. Can you recap the plan?' },
      { id: 's3', sender: 'You', avatar: 'Y', text: 'We agreed on a phased rollout and a mid-August date.', isMe: true },
      { id: 's4', sender: 'Cursor', avatar: 'Cu', avatarLogoSrc: '/brands/cursor.png', avatarLogoAlt: 'Cursor logo', text: 'Thanks. Remind me who owns each phase and any constraints?' },
    ],
  },
  {
    title: 'Knowledge trapped across tools',
    subtitle: 'The answer exists — just split across docs, chat, tickets, and someone’s head.',
    status: 'Siloed',
    agentLabel: 'ChatGPT',
    agentLogo: 'GPT',
    agentLogoSrc: '/brands/chatgpt.png',
    agentLogoAlt: 'ChatGPT logo',
    messages: [
      { id: 'k1', sender: 'You', avatar: 'Y', text: 'What did we decide about EU data residency?', isMe: true },
      { id: 'k2', sender: 'ChatGPT', avatar: 'GPT', avatarLogoSrc: '/brands/chatgpt.png', avatarLogoAlt: 'ChatGPT logo', text: 'I can only see this thread. That decision might be in a doc or a ticket I can’t access.' },
      { id: 'k3', sender: 'You', avatar: 'Y', text: 'It was in the security review and confirmed in a meeting.', isMe: true },
      { id: 'k4', sender: 'ChatGPT', avatar: 'GPT', avatarLogoSrc: '/brands/chatgpt.png', avatarLogoAlt: 'ChatGPT logo', text: 'Understood — please paste it so I can use it here.' },
    ],
  },
  {
    title: 'Stale or irrelevant context',
    subtitle: 'The agent recalls something — just not the right thing, or not the latest thing.',
    status: 'Drift',
    agentLabel: 'Claude',
    agentLogo: 'Cl',
    agentLogoSrc: '/brands/claude.png',
    agentLogoAlt: 'Claude logo',
    messages: [
      { id: 'd1', sender: 'You', avatar: 'Y', text: 'What plan is this customer on?', isMe: true },
      { id: 'd2', sender: 'Claude', avatar: 'Cl', avatarLogoSrc: '/brands/claude.png', avatarLogoAlt: 'Claude logo', text: 'My notes say Starter — though I’m pulling in a lot of unrelated history too.' },
      { id: 'd3', sender: 'You', avatar: 'Y', text: 'They upgraded to Growth back in March.', isMe: true },
      { id: 'd4', sender: 'Claude', avatar: 'Cl', avatarLogoSrc: '/brands/claude.png', avatarLogoAlt: 'Claude logo', text: 'I didn’t retire the old value. Which one should I trust?' },
    ],
  },
]

const solutionCards = [
  {
    title: 'Company Brain',
    copy: 'A living shared memory across every team, tool, and workflow — so knowledge stops resetting with each conversation.',
    meta: 'Explore Company Brain',
    href: '/company-brain',
  },
  {
    title: 'Coding Agent',
    copy: 'A terminal-first coding agent that remembers your repo: decisions, patterns, commands, and preferences across sessions.',
    meta: 'Explore Coding Agent',
    href: '/coding-agent',
  },
  {
    title: 'Memory Infrastructure',
    copy: 'One API to ingest, judge, store, retrieve, share, and govern memory for any AI system you build.',
    meta: 'Explore Memory',
    href: '/memory',
  },
  {
    title: 'Custom Memory Solution',
    copy: 'A support copilot, research assistant, or something we haven’t met yet. Tell us what it needs to remember — we deliver it end to end.',
    meta: 'Talk to us',
    booking: true,
  },
]

const lifecycleLayers = [
  { title: 'Sources', label: 'Sources', copy: 'Documents, chat, tickets, CRM, meetings, code, and tools connect once and stream in.', detail: 'any source', variant: 'top' },
  { title: 'Ingest and judge', label: 'Judge', copy: 'Every incoming fact is judged before it is written — merged, kept, skipped, or superseded.', detail: 'judge before write', variant: 'left' },
  { title: 'Durable memory', label: 'Memory', copy: 'Survivors become durable memory: profiles, decisions, and facts organized into domains.', detail: 'profiles & domains', variant: 'right' },
  { title: 'Retrieval and routing', label: 'Retrieval', copy: 'The right memories — semantic, temporal, multi-hop — are routed into context on demand.', detail: 'selective recall', variant: 'all' },
  { title: 'Control and delivery', label: 'Control', copy: 'Inspect, correct, and govern memory, then deliver it to any agent over API, MCP, or browser.', detail: 'inspect & deliver', variant: 'top' },
]

const benchmarkSets = [
  {
    eyebrow: 'Long-term memory',
    name: 'LongMemEval',
    score: '94.2',
    summary: 'Measures whether useful facts, preferences, sources, and temporal updates survive across long-running interactions.',
    rows: [
      ['Direct recall', 97.1, 'facts remain available'],
      ['Preference retention', 100, 'stable user context'],
      ['Source-linked recall', 91.8, 'grounded retrieval'],
      ['Temporal updates', 88.4, 'latest state wins'],
      ['Multi-session', 100, 'continuity across sessions'],
    ],
  },
  {
    eyebrow: 'Conversational memory',
    name: 'LoCoMo',
    score: '93.0',
    summary: 'Tests whether a memory system can recover connected context across long, multi-session conversations.',
    rows: [
      ['Single hop', 90.6, 'direct fact recall'],
      ['Multi-hop', 92.3, 'linked context'],
      ['Temporal', 91.9, 'current facts preferred'],
      ['Open domain', 91.2, 'broad memory Q&A'],
    ],
  },
]

function HomeMemoryBanner() {
  return (
    <section className="scale-banner" aria-label="MemCode memory highlights">
      <div className="scale-banner__cell scale-banner__lead">
        <span>Proven on the hardest memory tests</span>
        <strong>The best benchmarked memory.</strong>
      </div>
      <div className="scale-banner__cell">
        <strong>Go</strong>
        <span>First-ever memory system built in Go</span>
      </div>
      <div className="scale-banner__cell">
        <strong>&lt;300ms</strong>
        <span>Sub-300ms memory latency</span>
      </div>
      <div className="scale-banner__cell">
        <strong>Agentic</strong>
        <span>Memory for your use case</span>
      </div>
    </section>
  )
}

function GeneralMemoryProblem() {
  const [active, setActive] = useState(0)
  const current = problemConversations[active] ?? problemConversations[0]
  return (
    <section className="x-section x-section--paper problem-conversations" aria-labelledby="home-problem-title">
      <div className="container">
        <div className="x-heading problem-conversations__heading">
          <div>
            <span className="x-label x-label--dark">Problem</span>
            <h2 id="home-problem-title">AI systems don’t forget because they’re small. They forget because nothing keeps the memory.</h2>
          </div>
          <p>Chatbots, copilots, and agents can be brilliant inside one prompt — and then the context evaporates. The fix isn’t a bigger prompt. It’s selective, durable memory that survives the session.</p>
        </div>
        <div className="problem-conversations__shell">
          <div className="problem-conversations__tabs" role="tablist" aria-label="Memory problem examples">
            {problemConversations.map((conversation, index) => (
              <button
                id={`home-problem-tab-${index}`}
                key={conversation.title}
                type="button"
                role="tab"
                aria-controls="home-problem-conversation"
                aria-selected={index === active}
                className={index === active ? 'is-active' : ''}
                onClick={() => setActive(index)}
              >
                <span className="problem-conversations__status">
                  <img src={conversation.agentLogoSrc} alt="" aria-hidden="true" />
                  {conversation.status}
                </span>
                <small>{conversation.agentLabel}</small>
              </button>
            ))}
          </div>
          <div
            id="home-problem-conversation"
            className="problem-conversations__stage"
            role="tabpanel"
            aria-labelledby={`home-problem-tab-${active}`}
          >
            <ChatConversation
              key={current.title}
              {...current}
              status="Conversation"
              variant="paper"
              messageDelayMs={520}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function MemoryLifecycleStack() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const range = Math.max(rect.height - window.innerHeight, 1)
      const progress = Math.min(Math.max(-rect.top / range, 0), 1)
      setActive(Math.round(progress * (lifecycleLayers.length - 1)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section ref={sectionRef} className="x-section x-section--dark iso-section">
      <div className="container iso-grid">
        <div>
          <span className="x-label">Memory lifecycle</span>
          <h2>One path from raw source to governed recall.</h2>
          <p>Memory shouldn’t be a pile of vectors. MemCode moves every fact through the same lifecycle — ingested, judged, stored, retrieved, and controlled — so what an agent recalls is current, relevant, and accountable.</p>
          <div className="iso-tabs">
            {lifecycleLayers.map((layer, index) => (
              <button key={layer.title} type="button" className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{layer.title}</strong>
                <small>{layer.copy}</small>
                <em>{layer.detail}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="iso-visual" aria-label="Memory lifecycle stack">
          <div className="iso-stack">
            {lifecycleLayers.map((layer, index) => (
              <div
                key={layer.title}
                className={active === index ? `iso-stack-layer is-active is-${layer.variant}` : `iso-stack-layer is-${layer.variant}`}
                style={{ '--layer-offset': `${index * 108}px`, '--layer-z': String(8 - index) } as CSSProperties}
              >
                <svg width="300" height="188" viewBox="0 0 300 188" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path className="iso-face iso-face--left" d="M25 78L150 138L150 180L25 120Z" />
                  <path className="iso-line iso-line--left" d="M48 86L132 126" />
                  <path className="iso-face iso-face--right" d="M150 138L275 78L275 120L150 180Z" />
                  <path className="iso-face iso-face--top" d="M150 20L275 78L150 138L25 78Z" />
                  <path className="iso-glow" d="M150 20L275 78L150 138L25 78Z" />
                </svg>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{layer.label}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="iso-mobile-stack" aria-label="Memory lifecycle layers">
          {lifecycleLayers.map((layer, index) => (
            <article key={layer.title} className={active === index ? 'is-active' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{layer.title}</strong>
                <small>{layer.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function MemoryBenchmarkProof() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = benchmarkSets[activeIndex] ?? benchmarkSets[0]

  return (
    <section id="benchmarks" className="x-section x-section--dark benchmark-section">
      <div className="container">
        <div className="x-heading">
          <div>
            <span className="x-label">Proof</span>
            <h2>Why we call it the best memory system in the world.</h2>
          </div>
          <p>LongMemEval and LoCoMo measure the memory layer underneath every MemCode product: long-term recall, temporal accuracy, multi-hop retrieval, and continuity across sessions.</p>
        </div>
        <div className="benchmark-panel">
          <div className="benchmark-tabs">
            {benchmarkSets.map((benchmark, index) => (
              <button
                key={benchmark.name}
                type="button"
                className={activeIndex === index ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
              >
                <span>{benchmark.eyebrow}</span>
                <strong>{benchmark.name}</strong>
                <b>{benchmark.score}</b>
              </button>
            ))}
          </div>
          <div className="benchmark-table">
            <div className="benchmark-summary">
              <div>
                <span>{active.eyebrow}</span>
                <h3>{active.name}</h3>
                <p>{active.summary}</p>
              </div>
              <strong>{active.score}</strong>
            </div>
            {active.rows.map(([label, value, note]) => (
              <div key={label} className="benchmark-row">
                <span>{label}</span>
                <b>{value}</b>
                <i><em style={{ width: `${Number(value)}%` }} /></i>
                <small>{note}</small>
              </div>
            ))}
          </div>
          <div className="benchmark-panel__more">
            <span>Get to know more about the system behind these results.</span>
            <ExpandingArrowLink href="/memory">Explore Memory</ExpandingArrowLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  useSeo({
    title: 'MemCode — Memory for Every AI Product',
    description:
      'MemCode is the end-to-end memory layer for AI. Ingest any source, judge what matters, and give every agent, copilot, and team durable memory they can inspect and own.',
    path: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'MemCode',
        url: SITE_ORIGIN,
        description: 'End-to-end memory systems for AI: company brains, coding agents, copilots, and custom memory.',
        publisher: {
          '@type': 'Organization',
          name: 'MemCode',
          url: SITE_ORIGIN,
          logo: `${SITE_ORIGIN}/logo.jpeg`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'MemCode',
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/logo.jpeg`,
        description: 'MemCode builds the end-to-end memory layer for AI products and teams.',
      },
    ],
  })

  return (
    <div className="landing-shell memcode-look">
      <MarketingNav />
      <main>
        <ProductHero
          title={
            <>
              Memory for every
              <br />
              AI product.
            </>
          }
          subtitle="MemCode gives company brains, agents, copilots, research systems, support workflows — and whatever you build next — one memory layer they can ingest into, recall from, and trust."
          primary={{ label: 'Talk to us', booking: true }}
          backgroundImage="/landing_3.jpeg"
        />
        <HomeMemoryBanner />
        <GeneralMemoryProblem />
        <section className="x-section x-section--dark">
          <div className="container">
            <SectionIntro eyebrow="Solutions" title="One memory layer, four ways to use it.">
              Start with a finished product or build directly on the infrastructure. Everything runs
              on the same memory engine underneath.
            </SectionIntro>
            <NumberedCardGrid cards={solutionCards} columns={4} />
          </div>
        </section>
        <MemoryLifecycleStack />
        <MemoryBenchmarkProof />
        <RememberPromptCTA />
      </main>
      <MarketingFooter />
    </div>
  )
}
