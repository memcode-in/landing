import { CSSProperties } from 'react'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import { ProductHero, SectionIntro, NumberedCardGrid, ProductCTA } from '../components/marketing/primitives'
import RetrievalRouter from '../components/marketing/RetrievalRouter'
import MemoryInspector from '../components/marketing/MemoryInspector'
import MemoryPricing from '../components/MemoryPricing'
import { SITE_ORIGIN, useSeo } from '../lib/seo'
import '../components/memory-pricing.css'

const primitives = [
  { title: 'Persistent Memory', copy: 'Durable, cross-session memory that outlives the context window — the default, not a workaround.' },
  { title: 'Judge Before Write', copy: 'A judgment pass decides what to keep, merge, skip, or supersede — so memory stays clean.' },
  { title: 'Codebase Scanner', copy: 'Point it at a repo and it extracts durable facts: patterns, decisions, commands, and structure.' },
  { title: 'Context Importer', copy: 'Backfill memory from existing docs, chats, tickets, and transcripts in one pass.' },
  { title: 'MCP Ready', copy: 'Expose ingest and recall as MCP tools, so any MCP-aware agent gets memory instantly.' },
  { title: 'Memory Domains', copy: 'Partition memory into scoped domains with their own boundaries, access, and lifecycle.' },
]

const diyStack = [
  'Vector DB you stitch together',
  'Session state in a second store',
  'Prompt-stuffing to fake recall',
  'Hand-rolled contradiction logic',
  'A separate integration per source',
  'No provenance, no way to inspect',
]

const memcodePlane = [
  'One ingest / recall API',
  'Domains with built-in boundaries',
  'Judgment on every write',
  'Importers for every source',
  'MCP + browser surfaces included',
  'Queryable, sourced profiles',
]

const pillars = [
  { title: 'State', copy: 'Live session and working state, kept coherent across turns and tools.' },
  { title: 'Memory', copy: 'Durable facts, decisions, and profiles that persist and evolve.' },
  { title: 'Retrieval', copy: 'Semantic, temporal, and multi-hop recall that returns only what’s relevant.' },
  { title: 'Connectors', copy: 'Sources in and surfaces out — API, MCP, importers, and the browser.' },
  { title: 'Control', copy: 'Inspection, correction, access, and governance across everything above.' },
]

const useCases = [
  { title: 'Coding agents', copy: 'Repo memory that survives sessions and model swaps.' },
  { title: 'Research assistants', copy: 'Sources, findings, and decisions that accumulate over time.' },
  { title: 'Support copilots', copy: 'Customer history and policy that every reply can rely on.' },
  { title: 'Personal AI stacks', copy: 'One memory your own tools and agents share, that you own.' },
]

const governance = ['Open source', 'Inspectable', 'Portable']

function MemoryApiVisual() {
  return (
    <div className="mem-api-visual" aria-label="Memory ingest and recall API">
      <div className="mem-api-visual__bar"><span /><span /><span /><strong>memory · api</strong></div>
      <pre className="mem-api-visual__code">
        <code>
          <span className="c">// one API for the whole lifecycle</span>{'\n'}
          <span className="k">await</span> memory.<span className="fn">ingest</span>({'{'}{'\n'}
          {'  '}source: <span className="s">&quot;docs&quot;</span>, domain: <span className="s">&quot;acme&quot;</span>,{'\n'}
          {'  '}text: <span className="s">&quot;Acme upgraded to Growth&quot;</span>,{'\n'}
          {'}'}) <span className="c">// judged before write</span>{'\n\n'}
          <span className="k">const</span> ctx = <span className="k">await</span> memory.<span className="fn">recall</span>({'{'}{'\n'}
          {'  '}query: <span className="s">&quot;what plan is acme on?&quot;</span>,{'\n'}
          {'  '}domain: <span className="s">&quot;acme&quot;</span>, k: <span className="n">4</span>,{'\n'}
          {'}'}) <span className="c">// selective, not the whole store</span>
        </code>
      </pre>
      <div className="mem-api-visual__surfaces">
        <span>REST</span><span>MCP</span><span>Browser</span><span>SDK</span>
      </div>
    </div>
  )
}

export default function MemoryInfraPage() {
  useSeo({
    title: 'Memory Infrastructure — The Memory Layer for AI | MemCode',
    description:
      'MemCode Memory is one system to ingest, judge, store, retrieve, share, and govern memory for any AI system — persistent memory, domains, importers, MCP, and queryable profiles.',
    path: '/memory',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'MemCode Memory',
        url: `${SITE_ORIGIN}/memory`,
        brand: { '@type': 'Brand', name: 'MemCode' },
        description:
          'A memory control plane for AI: ingest, judge, store, retrieve, share, and govern memory across agents, copilots, and workflows.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: 0,
          highPrice: 5,
          offerCount: 3,
        },
      },
    ],
  })

  return (
    <div className="landing-shell memcode-look memory-page">
      <MarketingNav />
      <main>
        <ProductHero
          title={<>Memory should be infrastructure,<br />not a prompt hack.</>}
          subtitle="MemCode Memory is one system for ingesting, judging, storing, retrieving, sharing, and governing memory — a control plane every agent, copilot, and workflow can build on."
          primary={{ label: 'Talk to Founder', booking: true }}
          backgroundImage="/landing_1.jpeg"
        />

        <section id="primitives" className="x-section x-section--dark">
          <div className="container">
            <SectionIntro eyebrow="Primitives" title="The building blocks of a real memory layer.">
              Six primitives cover the whole lifecycle, so you compose memory instead of reinventing it.
            </SectionIntro>
            <NumberedCardGrid cards={primitives} columns={3} />
          </div>
        </section>

        <section id="control-plane" className="x-section x-section--paper">
          <div className="container">
            <SectionIntro
              eyebrow="Control plane"
              title="Stop assembling a memory stack. Adopt one."
              dark={false}
            >
              The DIY path is a pile of parts you maintain forever. The memory plane is one system
              with the hard parts already solved.
            </SectionIntro>
            <div className="product-explainer__visual product-explainer__visual--api">
              <MemoryApiVisual />
            </div>
            <div className="control-plane">
              <div className="control-plane__col control-plane__col--before">
                <span className="control-plane__tag">Before · DIY stack</span>
                <ul>
                  {diyStack.map((item) => (
                    <li key={item}><i className="control-plane__x" aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="control-plane__arrow" aria-hidden="true"><i /></div>
              <div className="control-plane__col control-plane__col--after">
                <span className="control-plane__tag is-after">After · MemCode memory plane</span>
                <ul>
                  {memcodePlane.map((item) => (
                    <li key={item}><i className="control-plane__check" aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="x-section x-section--dark">
          <div className="container">
            <SectionIntro eyebrow="The plane" title="Five layers, one memory plane." />
            <div className="pillars">
              {pillars.map((p, i) => (
                <article key={p.title} className="pillars__cell" style={{ '--i': i } as CSSProperties}>
                  <span className="pillars__num">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{p.title}</strong>
                  <p>{p.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="x-section x-section--paper">
          <div className="container">
            <SectionIntro
              eyebrow="Selective by design"
              title="Recall the few facts that matter — not a bigger prompt."
              dark={false}
            >
              A query routes only the relevant memory into context. Pick an example to see what gets
              retrieved and how much context you save.
            </SectionIntro>
            <RetrievalRouter />
          </div>
        </section>

        <section className="x-section x-section--dark">
          <div className="container">
            <SectionIntro eyebrow="Use cases" title="One layer under every AI system you build." />
            <NumberedCardGrid cards={useCases} columns={4} />
          </div>
        </section>

        <section className="x-section x-section--paper memory-governance">
          <div className="container">
            <div className="memory-governance__header">
              <span className="x-label x-label--dark">Control</span>
              <h2>Know what your AI knows.</h2>
            </div>
            <div className="mem-gov">
              <ol className="mem-gov__principles" aria-label="Memory control principles">
                {governance.map((principle, index) => (
                  <li key={principle}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{principle}</strong>
                  </li>
                ))}
              </ol>
              <MemoryInspector />
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="x-section x-section--dark memory-pricing--marketing"
          aria-labelledby="memory-pricing-title"
        >
          <div className="container">
            <SectionIntro
              eyebrow="Pricing"
              title="More memory. Less money."
              align="center"
              id="memory-pricing-title"
            >
              Start free, then scale for less than a coffee. Every plan shows exactly how many credits
              you get and the workload those credits cover.
            </SectionIntro>
            <MemoryPricing />
          </div>
        </section>

        <ProductCTA
          eyebrow="Memory infrastructure"
          title="Build on a memory layer designed for your requirements."
          copy="Bring your sources, agents, and constraints. We deliver an ingest, recall, and governance layer tuned to what you’re building — end to end."
          action={{ label: 'See Company Brain', href: '/company-brain' }}
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
