import { getDashboardUrl } from '../lib/dashboard-routing'

interface MemoryPlan {
  name: string
  price: string
  credits: string
  inputTokens: string
  outputTokens: string
  description: string
  featured?: boolean
  badge?: string
}

const MEMORY_PLANS: ReadonlyArray<MemoryPlan> = [
  {
    name: 'Free',
    price: '$0',
    credits: '1,000',
    inputTokens: '2M',
    outputTokens: '500K',
    description: 'Start building with production-grade memory before you spend anything.',
    badge: 'Free tier',
  },
  {
    name: 'Starter',
    price: '$2',
    credits: '1,500',
    inputTokens: '3M',
    outputTokens: '750K',
    description: 'A tiny step up for side projects, prototypes, and light production workloads.',
  },
  {
    name: 'Pro',
    price: '$5',
    credits: '3,750',
    inputTokens: '7.5M',
    outputTokens: '1.875M',
    description: 'The best value for agents and products that rely on memory every day.',
    featured: true,
    badge: 'Best value',
  },
]

function MemoryPlanCard({ plan }: { plan: MemoryPlan }) {
  const dashboardHref = getDashboardUrl()

  return (
    <article className={`memory-plan ${plan.featured ? 'memory-plan--featured' : ''}`}>
      <div className="memory-plan__topline">
        <span>{plan.name}</span>
        {plan.badge && <strong>{plan.badge}</strong>}
      </div>
      <div className="memory-plan__price">
        <strong>{plan.price}</strong>
        <span>plan</span>
      </div>
      <p>{plan.description}</p>

      <div className="memory-plan__credits">
        <span>Included</span>
        <strong>{plan.credits} credits</strong>
      </div>

      <dl className="memory-plan__workload">
        <div>
          <dt>Input</dt>
          <dd>{plan.inputTokens} tokens</dd>
        </div>
        <div>
          <dt>Output</dt>
          <dd>{plan.outputTokens} tokens</dd>
        </div>
      </dl>

      <a className="memory-plan__button" href={dashboardHref}>
        {plan.price === '$0' ? 'Start free' : `Choose ${plan.name}`}
      </a>
    </article>
  )
}

export default function MemoryPricing() {
  return (
    <>
      <div className="memory-pricing__grid">
        {MEMORY_PLANS.map((plan) => (
          <MemoryPlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      <p className="memory-pricing__assumption">
        Workload equivalents use a typical 4:1 input-to-output token mix. Actual credit usage varies with your workload mix.
      </p>

      <section className="memory-pricing__why" aria-labelledby="memory-pricing-why-title">
        <div className="memory-pricing__why-copy">
          <span>Why MemCode costs less</span>
          <h3 id="memory-pricing-why-title">The cheapest memory provider on the planet.</h3>
          <p>
            Memory should make every AI call more useful, not become the most expensive part of your stack.
            We keep the entry point at zero and publish the real workload behind every credit pack.
          </p>
        </div>
        <ol className="memory-pricing__reasons">
          <li><span>01</span><strong>1,000 credits free</strong><small>Build and test before paying.</small></li>
          <li><span>02</span><strong>Paid plans start at $2</strong><small>No enterprise-sized minimum.</small></li>
          <li><span>03</span><strong>Token equivalents shown</strong><small>See the 4:1 workload up front.</small></li>
        </ol>
      </section>
    </>
  )
}
