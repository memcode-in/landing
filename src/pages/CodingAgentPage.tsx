import { CSSProperties, useEffect, useRef, useState } from 'react'
import ChatConversation from '../components/ChatConversation'
import DotDistortion from '../components/DotDistortion'
import WaitlistForm from '../components/WaitlistForm'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import ExpandingArrowLink from '../components/marketing/ExpandingArrowLink'
import CliTerminal from '../components/marketing/CliTerminal'
import { SITE_ORIGIN, useSeo } from '../lib/seo'

const agentLogos = ['Terminal-first', 'Repo-aware', 'Memory-powered', 'Model-flexible', 'Remote-ready', 'CLI native']

const assistantLogoPaths = {
  chatgpt: '/brands/chatgpt.svg',
  gemini: '/brands/gemini.svg',
  claude: '/brands/claude.svg',
}

const agentComparisonRows = [
  ['Company brain for the repo', 'full', 'partial', 'partial', 'partial'],
  ['Memory-based token reduction', 'full', 'none', 'partial', 'partial'],
  ['50+ CLI skills', 'full', 'partial', 'partial', 'partial'],
  ['Terminal-first agent loop', 'full', 'partial', 'full', 'full'],
  ['Open model routing', 'full', 'partial', 'none', 'none'],
  ['Session resume across tasks', 'full', 'partial', 'partial', 'partial'],
  ['Remote approval surface', 'full', 'none', 'partial', 'partial'],
  ['Benchmarked memory layer', 'full', 'none', 'none', 'none'],
]

const modelRows = [
  ['DeepSeek V4 Pro', 'large refactors', 'memory-on'],
  ['Kimi 2.7', 'long context', 'memory-on'],
  ['GLM 5.2', 'fast edits', 'memory-on'],
  ['MiniMax M3', 'review loops', 'memory-on'],
  ['Qwen 3 Coder', 'agentic coding', 'free-ready'],
  ['Llama 4', 'open model runs', 'free-ready'],
]

const memcodeStackLayers = [
  {
    title: 'Agent runtime',
    label: 'Runtime',
    copy: 'The coding loop lives in the terminal: inspect the repo, plan the patch, edit files, run commands, and ask before risky actions.',
    detail: 'repo-aware loop',
    variant: 'top',
  },
  {
    title: 'Memory layer',
    label: 'Memory',
    copy: 'Project facts, decisions, test commands, style preferences, and recent changes are recalled before the model starts guessing.',
    detail: 'cross-session recall',
    variant: 'left',
  },
  {
    title: 'Subagent layer',
    label: 'Subagents',
    copy: 'Focused teammates can explore, verify, review, or summarize in parallel while the main agent keeps the coding thread moving.',
    detail: 'parallel helpers',
    variant: 'right',
  },
  {
    title: 'Terminal UI layer',
    label: 'Terminal UI',
    copy: 'A polished terminal surface brings command output, approvals, memory hits, diffs, and remote control into a coding-on-the-web feel.',
    detail: 'top-notch control',
    variant: 'all',
  },
]

const memoryProblemConversations = [
  {
    title: 'Single session drift',
    subtitle: 'The assistant cannot see the repo decisions you made last time.',
    status: 'No project memory',
    agentLabel: 'ChatGPT',
    agentLogo: 'GPT',
    agentLogoSrc: assistantLogoPaths.chatgpt,
    agentLogoAlt: 'ChatGPT logo',
    messages: [
      { id: 'single-1', sender: 'You', avatar: 'Y', text: 'Use the auth pattern we settled on yesterday.', isMe: true },
      { id: 'single-2', sender: 'ChatGPT', avatar: 'G', avatarLogoSrc: assistantLogoPaths.chatgpt, avatarLogoAlt: 'ChatGPT logo', text: 'I do not have that prior repo context. Can you paste the pattern?' },
      { id: 'single-3', sender: 'You', avatar: 'Y', text: 'It was in the refresh-token PR with early returns.', isMe: true },
      { id: 'single-4', sender: 'ChatGPT', avatar: 'G', avatarLogoSrc: assistantLogoPaths.chatgpt, avatarLogoAlt: 'ChatGPT logo', text: 'Got it. Please share the relevant files so I can infer it.' },
    ],
  },
  {
    title: 'Multi-session restart',
    subtitle: 'A new chat begins cold even when the work is halfway done.',
    status: 'Context missing',
    agentLabel: 'Gemini',
    agentLogo: 'Gem',
    agentLogoSrc: assistantLogoPaths.gemini,
    agentLogoAlt: 'Gemini logo',
    messages: [
      { id: 'multi-1', sender: 'You', avatar: 'Y', text: 'Continue the dashboard refactor from the last session.', isMe: true },
      { id: 'multi-2', sender: 'Gemini', avatar: 'Ge', avatarLogoSrc: assistantLogoPaths.gemini, avatarLogoAlt: 'Gemini logo', text: 'I cannot access previous sessions. Summarize the refactor and current blockers.' },
      { id: 'multi-3', sender: 'You', avatar: 'Y', text: 'We already chose the compact card layout and ran the build.', isMe: true },
      { id: 'multi-4', sender: 'Gemini', avatar: 'Ge', avatarLogoSrc: assistantLogoPaths.gemini, avatarLogoAlt: 'Gemini logo', text: 'Thanks. Which files changed and what should I avoid touching?' },
    ],
  },
  {
    title: 'Agent handoff amnesia',
    subtitle: 'Switching assistants loses test commands, preferences, and constraints.',
    status: 'Memory gap',
    agentLabel: 'Claude',
    agentLogo: 'Cl',
    agentLogoSrc: assistantLogoPaths.claude,
    agentLogoAlt: 'Claude logo',
    messages: [
      { id: 'handoff-1', sender: 'You', avatar: 'Y', text: 'Review this like last time: focus on auth regressions and tests.', isMe: true },
      { id: 'handoff-2', sender: 'Claude', avatar: 'C', avatarLogoSrc: assistantLogoPaths.claude, avatarLogoAlt: 'Claude logo', text: 'I can review it. What test command does this repo use?' },
      { id: 'handoff-3', sender: 'You', avatar: 'Y', text: 'Same as before: npm run build for landing changes.', isMe: true },
      { id: 'handoff-4', sender: 'Claude', avatar: 'C', avatarLogoSrc: assistantLogoPaths.claude, avatarLogoAlt: 'Claude logo', text: 'Understood. Please remind me of your style preferences too.' },
    ],
  },
]

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <div className={dark ? 'x-label x-label--dark' : 'x-label'}>{children}</div>
}

function CodingAgentHeroBackdrop() {
  return (
    <div className="hero__backdrop coding-hero__backdrop" aria-hidden="true">
      <DotDistortion
        className="hero__dots"
        style={{ position: 'absolute', inset: 0 }}
        gridGap={24}
        dotSize={1.45}
        influenceRadius={135}
        strength={18}
        damping={0.88}
        returnSpeed={0.035}
        dotColor="rgba(255, 255, 255, 0.32)"
        backgroundColor="transparent"
      />
      <div className="hero__horizon" />
    </div>
  )
}

function Hero() {
  return (
    <section id="top" className="hero x-hero coding-hero">
      <CodingAgentHeroBackdrop />
      <div className="container hero__content">
        <h1 className="hero__title">
          The coding agent
          <span>that remembers.</span>
        </h1>
        <p className="hero__subtitle">
          MemCode is a terminal-first AI coding agent powered by long-term project memory. Sign in once, get credits, and work across models without bringing your own API keys.
        </p>
        <div className="hero__actions">
          <ExpandingArrowLink href="#waitlist">Join the Waitlist</ExpandingArrowLink>
        </div>
        <div className="agent-strip" aria-label="Supported coding agents">
          <div className="agent-strip__track">
            {[...agentLogos, ...agentLogos].map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CodingAgentMemoryBanner() {
  return (
    <section className="scale-banner" aria-label="MemCode coding agent highlights">
      <div className="scale-banner__cell scale-banner__lead">
        <span>Built for real coding work</span>
        <strong>Built on the world’s best benchmarked memory.</strong>
      </div>
      <div className="scale-banner__cell">
        <strong>40%</strong>
        <span>Less repeated context</span>
      </div>
      <div className="scale-banner__cell">
        <strong>Free</strong>
        <span>Absolutely free to start</span>
      </div>
      <div className="scale-banner__cell">
        <strong>Rust</strong>
        <span>Built in Rust for speed</span>
      </div>
    </section>
  )
}

function UptimeGrid() {
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const data = Array.from({ length: 45 }, (_, index) => {
    const degraded = index === 9 || index === 18 || index === 34
    return {
      id: index,
      degraded,
      height: degraded ? 58 : 76 + (index % 5) * 4,
      label: degraded ? (index === 9 ? 'Partial outage' : 'Degraded') : 'Operational',
      uptime: degraded ? (index === 9 ? 92.1 : 98.4) : 100,
      date: `day ${index + 1}`,
    }
  })
  const hoveredDay = activeDay === null ? null : data[activeDay]

  return (
    <div className="uptime-card">
      <div className="uptime-card__top">
        <div>
          <strong>Agent uptime</strong>
          <span>{hoveredDay ? `${hoveredDay.date}: ${hoveredDay.label}` : '45-day coding memory service health'}</span>
        </div>
        <b>{hoveredDay ? `${hoveredDay.uptime}%` : '99.9%'}</b>
      </div>
      <div className={activeDay === null ? 'uptime-bars' : 'uptime-bars has-active'}>
        {data.map((day, index) => (
          <button
            type="button"
            key={index}
            className={`${day.degraded ? 'is-degraded' : ''} ${activeDay === index ? 'is-active' : ''}`}
            style={{ '--uptime-height': `${day.height}%` } as CSSProperties}
            aria-label={`${day.date}: ${day.label}, ${day.uptime}% uptime`}
            onMouseEnter={() => setActiveDay(index)}
            onMouseLeave={() => setActiveDay(null)}
            onFocus={() => setActiveDay(index)}
            onBlur={() => setActiveDay(null)}
          >
            <span />
          </button>
        ))}
      </div>
      <div className="uptime-card__bottom"><span>45 days ago</span><span>today</span></div>
    </div>
  )
}

function MemoryDashboardCard() {
  return (
    <article className="x-bento-card x-bento-card--wide x-bento-card--memory">
      <div className="x-card-head">
        <div><h3>Company brain for coding agents</h3><span>Memory that compounds</span></div>
      </div>
      <p>MemCode turns repo decisions, patterns, fixes, commands, and preferences into a shared brain the CLI can use every session, without making developers repeat the same context.</p>
      <div className="memory-panel">
        <div className="memory-panel__top">
          <div><span>Project memory activity</span><strong>live memory context</strong></div>
          <span className="live-pill">live</span>
        </div>
        <div className="memory-bars" aria-hidden="true">
          {[68, 82, 55, 91, 73, 88, 64, 95, 77, 83, 70, 92].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="memory-panel__grid">
          <span>auth uses JWT refresh rotation</span>
          <span>prefers small typed helpers</span>
          <span>tests run with npm build</span>
          <span>remote approvals enabled</span>
        </div>
        <div className="memory-stream" aria-label="Recent project memory recalls">
          <span><b>decision</b> reuse dashboard OAuth flow</span>
          <span><b>pattern</b> keep terminal UI dense and scannable</span>
          <span><b>handoff</b> last run changed landing bento layout</span>
        </div>
        <UptimeGrid />
      </div>
    </article>
  )
}

function ConnectorsCard() {
  const connectors = ['ChatGPT', 'Anthropic', 'Gemini', 'DeepSeek', 'Kimi', 'Qwen', 'Llama', 'OpenRouter', 'NVIDIA', 'OpenAI', 'Terminal', 'MCP']
  return (
    <article className="x-bento-card x-bento-card--models">
      <div className="x-card-head">
        <div><h3>Better model choice than Codex</h3><span>Bring the right model</span></div>
      </div>
      <p>Use ChatGPT/OpenAI, Anthropic models, Gemini, OpenRouter, NVIDIA, and open-source models like DeepSeek, Kimi, Qwen, and Llama while keeping the same memory layer underneath.</p>
      <div className="connector-grid">
        {connectors.map((name) => <span key={name}>{name}</span>)}
      </div>
    </article>
  )
}

function BrowserExtensionCard() {
  return (
    <article className="x-bento-card x-bento-card--tooling">
      <div className="x-card-head">
        <div><h3>Better CLI tooling than Claude Code</h3><span>Skills, memory, fewer tokens</span></div>
      </div>
      <p>MemCode gives the terminal agent a stronger working layer: 50+ skills, MCP tools, remote approvals, session resume, and memory-based context reduction before the model starts editing.</p>
      <div className="mini-browser">
        <div><span /><span /><span /><strong>memcode skills</strong><b>50+</b></div>
        <p>Token-light context loaded from project memory</p>
      </div>
    </article>
  )
}

function CodingAgentCard() {
  return (
    <article className="x-bento-card x-bento-card--cli">
      <div className="x-card-head">
        <div><h3>MemCode CLI agent</h3><span>Terminal-first coding</span></div>
      </div>
      <p>A terminal coding agent that inspects the repo, plans changes, patches files, runs commands, asks for approval, and carries lessons forward through memory.</p>
      <div className="mini-code">
        <span className="comment">memory: repo context loaded</span>
        <span>recall: auth uses JWT + refresh rotation</span>
        <span>recall: prefer early returns, no else</span>
        <b>Generating with full context...</b>
      </div>
    </article>
  )
}

function AgentsCard() {
  const agents = [
    ['Open model routing', 'DeepSeek, Kimi, Qwen, Llama'],
    ['Hosted providers', 'GPT, Anthropic, Gemini'],
    ['Proxy-backed models', 'OpenRouter and NIM'],
    ['Company brain', 'Decisions, commands, repo patterns'],
    ['Skill engine', '50+ workflows ready in the CLI'],
  ]
  const [active, setActive] = useState(0)
  return (
    <article className="x-bento-card x-bento-card--providers">
      <div className="x-card-head">
        <div><h3>Provider freedom with one memory</h3><span>No API keys required</span></div>
      </div>
      <p>Sign in, use your credits, and switch models for speed, cost, or reasoning quality without making the agent relearn the repo. The memory layer stays stable across providers and sessions.</p>
      <div className="agent-list">
        {agents.map(([name, desc], index) => (
          <button key={name} type="button" className={active === index ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onClick={() => setActive(index)}>
            <span>{name}</span><small>{desc}</small><i />
          </button>
        ))}
      </div>
    </article>
  )
}

function ProblemConversationSection() {
  const [activeConversationIndex, setActiveConversationIndex] = useState(0)
  const activeConversation = memoryProblemConversations[activeConversationIndex] ?? memoryProblemConversations[0]

  return (
    <section className="x-section x-section--paper problem-conversations" aria-labelledby="coding-problem-title">
      <div className="container">
        <div className="x-heading problem-conversations__heading">
          <div>
            <SectionLabel dark>Problem</SectionLabel>
            <h2 id="coding-problem-title">Most coding assistants forget the work between chats.</h2>
          </div>
          <p>ChatGPT, Gemini, and Claude can help inside one prompt, but they do not automatically carry your repo decisions, test commands, or multi-session handoffs forward. MemCode turns those repeated explanations into memory.</p>
        </div>
        <div className="problem-conversations__shell">
          <div className="problem-conversations__tabs" role="tablist" aria-label="Memory problem examples">
            {memoryProblemConversations.map((conversation, index) => (
              <button
                id={`coding-problem-tab-${index}`}
                key={conversation.title}
                type="button"
                role="tab"
                aria-controls="coding-problem-conversation"
                aria-selected={index === activeConversationIndex}
                className={index === activeConversationIndex ? 'is-active' : ''}
                onClick={() => setActiveConversationIndex(index)}
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
            id="coding-problem-conversation"
            className="problem-conversations__stage"
            role="tabpanel"
            aria-labelledby={`coding-problem-tab-${activeConversationIndex}`}
          >
            <ChatConversation
              key={activeConversation.title}
              {...activeConversation}
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

function AgentPlatformBento() {
  return (
    <section id="platform" className="x-section x-section--dark">
      <div className="container">
        <div className="x-heading x-heading--platform">
          <div>
            <SectionLabel>Agent platform</SectionLabel>
            <h2>Better infrastructure than <span className="brand-claude">Claude Code</span>. Better model freedom than <span className="brand-codex">Codex</span>.</h2>
          </div>
        </div>
        <div className="x-bento-grid">
          <MemoryDashboardCard />
          <ConnectorsCard />
          <BrowserExtensionCard />
          <CodingAgentCard />
          <AgentsCard />
        </div>
      </div>
    </section>
  )
}

function statusLabel(status: string) {
  if (status === 'full') return 'yes'
  if (status === 'partial') return 'partial'
  return 'no'
}

function StatusCell({ status, featured = false }: { status: string; featured?: boolean }) {
  const label = status === 'full' ? (featured ? 'Built in' : 'Yes') : status === 'partial' ? 'Partial' : 'No'
  return (
    <div className={featured ? `status-cell is-featured is-${status}` : `status-cell is-${status}`}>
      <span>{label}</span>
    </div>
  )
}

function AgentStackComparison() {
  return (
    <section id="stack" className="x-section x-section--dark">
      <div className="container stack-comparison">
        <div className="stack-comparison__intro">
          <SectionLabel>Agent stack</SectionLabel>
          <h2>Stop treating every coding session like the first one.</h2>
          <p>Generic assistants rediscover your repo again and again. MemCode is a CLI coding agent with memory built into the loop, so it starts each task with project history already loaded.</p>
        </div>
        <div className="agent-compare" aria-label="MemCode compared with Cursor, Codex, and Claude Code">
          <div className="agent-compare__head">
            <div>Feature</div>
            <div className="is-best"><span>Best</span>MemCode</div>
            <div>Cursor</div>
            <div>Codex</div>
            <div>Claude Code</div>
          </div>
          {agentComparisonRows.map(([feature, memcode, cursor, codex, claude]) => (
            <div className="agent-compare__row" key={feature}>
              <div>{feature}</div>
              <StatusCell status={memcode} featured />
              <StatusCell status={cursor} />
              <StatusCell status={codex} />
              <StatusCell status={claude} />
            </div>
          ))}
          <a className="research-note" href="/research">
            <span>Research paper under review</span>
            <strong>Read the research</strong>
          </a>
        </div>
        <div className="agent-compare-mobile" aria-label="MemCode feature comparison summary">
          {agentComparisonRows.map(([feature, memcode, cursor, codex, claude]) => (
            <article key={feature}>
              <strong>{feature}</strong>
              <div>
                <StatusCell status={memcode} featured />
                <span>MemCode</span>
              </div>
              <small>Cursor: {statusLabel(cursor)} / Codex: {statusLabel(codex)} / Claude Code: {statusLabel(claude)}</small>
            </article>
          ))}
          <a className="research-note" href="/research">
            <span>Research paper under review</span>
            <strong>Read the research</strong>
          </a>
        </div>
      </div>
    </section>
  )
}

function FeaturesIsometricSection() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const updateActiveLayer = () => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const scrollRange = Math.max(rect.height - window.innerHeight, 1)
      const progress = Math.min(Math.max(-rect.top / scrollRange, 0), 1)
      setActive(Math.round(progress * (memcodeStackLayers.length - 1)))
    }
    updateActiveLayer()
    window.addEventListener('scroll', updateActiveLayer, { passive: true })
    window.addEventListener('resize', updateActiveLayer)
    return () => {
      window.removeEventListener('scroll', updateActiveLayer)
      window.removeEventListener('resize', updateActiveLayer)
    }
  }, [])

  return (
    <section ref={sectionRef} className="x-section x-section--dark iso-section">
      <div className="container iso-grid">
        <div>
          <SectionLabel>Feature stack</SectionLabel>
          <h2>The layers behind a coding agent that remembers.</h2>
          <p>MemCode is built like a real developer workstation: an agent runtime in the terminal, persistent repo memory underneath, subagents around it, and a high-signal terminal UI above the loop.</p>
          <div className="iso-tabs">
            {memcodeStackLayers.map((feature, index) => (
              <button key={feature.title} type="button" className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{feature.title}</strong>
                <small>{feature.copy}</small>
                <em>{feature.detail}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="iso-visual" aria-label="Layered MemCode stack">
          <div className="iso-stack">
            {memcodeStackLayers.map((feature, index) => (
              <IsometricStackLayer key={feature.title} index={index} active={active === index} label={feature.label} variant={feature.variant} />
            ))}
          </div>
        </div>
        <div className="iso-mobile-stack" aria-label="MemCode stack layers">
          {memcodeStackLayers.map((feature, index) => (
            <article key={feature.title} className={active === index ? 'is-active' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{feature.title}</strong>
                <small>{feature.detail}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function IsometricStackLayer({ index, active, label, variant }: { index: number; active: boolean; label: string; variant: string }) {
  return (
    <div
      className={active ? `iso-stack-layer is-active is-${variant}` : `iso-stack-layer is-${variant}`}
      style={{ '--layer-offset': `${index * 128}px`, '--layer-z': String(8 - index) } as CSSProperties}
    >
      <svg width="300" height="188" viewBox="0 0 300 188" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path className="iso-face iso-face--left" d="M25 78L150 138L150 180L25 120Z" />
        <path className="iso-line iso-line--left" d="M48 86L132 126" />
        <path className="iso-face iso-face--right" d="M150 138L275 78L275 120L150 180Z" />
        <path className="iso-face iso-face--top" d="M150 20L275 78L150 138L25 78Z" />
        <path className="iso-glow" d="M150 20L275 78L150 138L25 78Z" />
      </svg>
      <span>{String(index + 1).padStart(2, '0')}</span>
      <strong>{label}</strong>
    </div>
  )
}

function CodingWorkflow() {
  const workflowCommands = [
    ['/model', 'Switch GPT, Gemini, Kimi, DeepSeek, Llama, or full provider models'],
    ['/skills', 'Use bundled and plugin skills like verify, simplify, batch, stuck, and remember'],
    ['memcode mcp', 'Connect project tools and servers with approval-aware MCP commands'],
    ['memcode -c', 'Continue work across sessions with memory and conversation history'],
  ]
  return (
    <section id="cli" className="x-section x-section--dark demo-section">
      <div className="container demo-grid">
        <div>
          <SectionLabel>CLI workflow</SectionLabel>
          <h2>Ask the agent to code. It brings models, skills, tools, and memory.</h2>
          <p>MemCode is built on the real memCode CLI surface: model routing, bundled skills, plugin marketplaces, MCP servers, permissions, remote control, and resume flows, all backed by project memory.</p>
          <div className="command-grid">
            {workflowCommands.map(([cmd, label]) => (
              <div key={cmd}><code>{cmd}</code><span>{label}</span></div>
            ))}
          </div>
        </div>
        <CliTerminal
          title="memcode — bash"
          ariaLabel="MemCode CLI workflow"
          commands={[
            {
              command: 'memcode --model deepseek "refactor the auth flow"',
              output: ['Model routed through OpenRouter', 'Plan ready: edit 4 files, run npm build'],
            },
            {
              command: 'memcode /skills verify',
              output: ['Running verification skill', 'Build, tests, and changed files checked'],
            },
            {
              command: 'memcode mcp add-json linear ./linear.json',
              output: ['MCP server saved for this project', 'Tools available after approval'],
            },
            {
              command: 'memcode -c "continue from the last session"',
              output: ['Conversation resumed', 'Memory and previous file context restored'],
            },
          ]}
        />
      </div>
    </section>
  )
}

function ModelRouting() {
  return (
    <section id="models" className="x-section x-section--paper">
      <div className="container models-grid">
        <div><SectionLabel dark>Model routing</SectionLabel><h2>Switch models freely. Project memory stays consistent.</h2><p className="section-copy">No API keys. Just sign in and use credits across any model — the agent changes engines without forgetting the repo.</p></div>
        <div className="models-panel"><div className="model-table">{modelRows.map(([model, use, status]) => <div key={model} className="model-row"><strong>{model}</strong><span>{use}</span><code>{status}</code></div>)}</div></div>
      </div>
    </section>
  )
}

function CodingAgentCTA() {
  return (
    <section className="final-cta">
      <div className="container final-cta__inner">
        <div><h2>Ship with a coding agent that remembers your codebase.</h2><p>Join the waitlist for early access to the terminal-first CLI coding agent powered by persistent project memory.</p></div>
        <div className="final-cta__actions">
          <ExpandingArrowLink href="#waitlist" tone="black">Join the Waitlist</ExpandingArrowLink>
        </div>
      </div>
    </section>
  )
}

export default function CodingAgentPage() {
  useSeo({
    title: 'MemCode Coding Agent — Terminal-First AI That Remembers Your Repo',
    description:
      'MemCode is a terminal-first AI coding agent with long-term project memory, open model routing, 50+ CLI skills, remote approvals, and session resume.',
    path: '/coding-agent',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'MemCode Coding Agent',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Windows, Linux',
        url: `${SITE_ORIGIN}/coding-agent`,
        description:
          'A terminal-first AI coding agent with persistent project memory, model routing, CLI skills, and remote approvals.',
      },
    ],
  })

  return (
    <div className="landing-shell memcode-look">
      <MarketingNav />
      <main>
        <Hero />
        <CodingAgentMemoryBanner />
        <ProblemConversationSection />
        <AgentPlatformBento />
        <AgentStackComparison />
        <FeaturesIsometricSection />
        <CodingWorkflow />
        <ModelRouting />
        <WaitlistForm />
        <CodingAgentCTA />
      </main>
      <MarketingFooter conversion="waitlist" />
    </div>
  )
}
