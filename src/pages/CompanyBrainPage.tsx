import { CSSProperties } from 'react'
import CompanyBrainPricing from '../components/CompanyBrainPricing'
import MarketingNav from '../components/marketing/MarketingNav'
import MarketingFooter from '../components/marketing/MarketingFooter'
import { SectionIntro, NumberedCardGrid, ProductCTA } from '../components/marketing/primitives'
import KnowledgeFlowGraph from '../components/marketing/KnowledgeFlowGraph'
import CompanyCrowdScene from '../components/marketing/CompanyCrowdScene'
import { COMPANY_BRAIN_DISCONNECTED_CONNECTORS } from '../components/marketing/companyBrainConnectors'
import { getDashboardUrl } from '../lib/dashboard-routing'
import { SITE_ORIGIN, useSeo } from '../lib/seo'
import '../components/company-brain-pricing.css'

const problemCosts = [
  { k: 'The same context, repeated', v: 'People explain decisions again in Slack, meetings, tickets, and every new agent session.' },
  { k: 'The “why” disappears', v: 'A decision survives in a document. The conversation, tradeoff, and owner do not.' },
  { k: 'Every agent starts partial', v: 'Claude, Codex, and Cursor each see a different fragment instead of the company’s full context.' },
  { k: 'Knowledge leaves with people', v: 'When ownership changes, the operating context behind the work has to be reconstructed.' },
]

const useCases = [
  { title: 'Employee onboarding', copy: 'New hires ask the brain instead of interrupting five people — and get the current, sourced answer.' },
  { title: 'Customer support continuity', copy: 'Every rep and copilot shares the same account history, so customers never re-explain themselves.' },
  { title: 'Research & decision history', copy: 'What we decided and why stays traceable long after the meeting ends.' },
  { title: 'Sales & account context', copy: 'Plan, owner, renewal, and open threads follow the account across every tool.' },
  { title: 'Engineering & product knowledge', copy: 'Patterns, tradeoffs, and “don’t touch this” live where agents and people can find them.' },
]

const governance = [
  { title: 'Workspace & domain boundaries', copy: 'Memory is scoped to workspaces and domains — nothing leaks across walls it shouldn’t cross.' },
  { title: 'Role-based access', copy: 'People and agents see only the memory their role allows, enforced at retrieval.' },
  { title: 'Source provenance', copy: 'Every fact carries where it came from, so any answer can be traced back to its origin.' },
  { title: 'Inspect, correct, delete', copy: 'Read the memory, fix what’s wrong, and remove what shouldn’t be there — on demand.' },
  { title: 'Freshness & contradiction control', copy: 'New facts supersede stale ones; conflicts are judged instead of silently coexisting.' },
]

function DisconnectedCompanyTools() {
  return (
    <div className="company-problem__tools" aria-label="Company knowledge fragmented across disconnected tools">
      {COMPANY_BRAIN_DISCONNECTED_CONNECTORS.map((connector, index) => (
        <figure
          key={connector.id}
          className="company-problem__tool"
          style={{ '--i': index } as CSSProperties}
        >
          <img src={connector.logo} alt="" data-channel={connector.id} />
          <figcaption>{connector.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export default function CompanyBrainPage() {
  useSeo({
    title: 'The Universal Brain Behind Your Company | MemCode',
    description:
      'Connect every person, tool, and AI agent to one living company memory with current, sourced, permission-aware context.',
    path: '/company-brain',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'MemCode Company Brain',
        url: `${SITE_ORIGIN}/company-brain`,
        brand: { '@type': 'Brand', name: 'MemCode' },
        description:
          'A universal company memory connecting people, tools, AI agents, and workflows with governed, sourced context.',
      },
    ],
  })

  const pricingHref = getDashboardUrl('/dashboard?section=pricing')

  return (
    <div className="landing-shell memcode-look">
      <MarketingNav />
      <main>
        <CompanyCrowdScene hero />

        <section className="x-section x-section--paper">
          <div className="container">
            <SectionIntro
              eyebrow="The disconnect"
              title="Your company already has a brain. It’s just split across every tool."
              dark={false}
            >
              Your company’s brain already lives in Slack, WhatsApp, and Telegram — it’s just fragmented.
              Notion knows the plan. Gmail knows the customer. Claude, Codex, and Cursor know the work
              they touched. MemCode connects it into one shared brain.
            </SectionIntro>
            <div className="company-problem">
              <DisconnectedCompanyTools />
              <div className="company-problem__costs">
                {problemCosts.map((cost, index) => (
                  <article
                    key={cost.k}
                    className="company-problem__cost"
                    style={{ '--i': index } as CSSProperties}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{cost.k}</strong>
                      <p>{cost.v}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="connections" className="x-section x-section--dark product-explainer">
          <div className="container">
            <SectionIntro eyebrow="Universal layer" title="Every part of your company connects to one brain.">
              Work keeps happening in the tools your company already uses. MemCode connects those
              fragments into one living memory, then delivers the right context to every approved
              person, agent, and workflow.
            </SectionIntro>
            <div className="product-explainer__visual">
              <KnowledgeFlowGraph />
            </div>
          </div>
        </section>

        <section className="x-section x-section--paper">
          <div className="container">
            <SectionIntro eyebrow="Use cases" title="Where a company brain earns its keep." dark={false} />
            <NumberedCardGrid cards={useCases} columns={3} />
          </div>
        </section>

        <section className="x-section x-section--dark">
          <div className="container">
            <SectionIntro eyebrow="Governance" title="Shared memory, under control.">
              A company brain is only useful if it’s trustworthy. Boundaries, access, provenance, and
              freshness are built in — not bolted on.
            </SectionIntro>
            <div className="gov-matrix">
              {governance.map((g, i) => (
                <article key={g.title} className="gov-matrix__cell" style={{ '--i': i } as CSSProperties}>
                  <span className="gov-matrix__check" aria-hidden="true" />
                  <strong>{g.title}</strong>
                  <p>{g.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="x-section x-section--dark company-brain-pricing--marketing"
          aria-labelledby="company-brain-public-pricing-title"
        >
          <div className="container">
            <SectionIntro
              eyebrow="Pricing"
              title="Choose the Company Brain plan that fits your team."
              align="center"
              id="company-brain-public-pricing-title"
            />
            <CompanyBrainPricing
              giftTitleId="company-brain-public-gift-title"
              renderPlanAction={(plan) => (
                <a className="dashboard-plan__button" href={pricingHref}>
                  Choose {plan.name}
                </a>
              )}
            />
          </div>
        </section>

        <ProductCTA
          eyebrow="Company Brain"
          title="Put one universal brain behind your company."
          copy="Connect the systems your company already runs on. Give every person, agent, and workflow the same current, accountable context."
          action={{ label: 'Talk to Founder', booking: true }}
          tone="dark"
          backgroundImage="/company_brain_1.jpeg"
        />
      </main>
      <MarketingFooter />
    </div>
  )
}
