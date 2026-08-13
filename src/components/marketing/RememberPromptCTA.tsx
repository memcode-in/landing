import ExpandingArrowLink from './ExpandingArrowLink'

/**
 * RememberPromptCTA — the closing "Tell us what needs to remember" moment.
 */
export default function RememberPromptCTA({
  eyebrow = 'Custom memory',
  title = 'Tell us what needs to remember.',
  copy = 'Company brains, agents, copilots, support flows, or something we haven’t met yet. Describe what your AI should never forget — we deliver the memory layer end to end.',
}: {
  eyebrow?: string
  title?: string
  copy?: string
}) {
  return (
    <section className="remember-cta">
      <div className="remember-cta__background" aria-hidden="true">
        <img src="/landing_2.jpeg" alt="" loading="lazy" decoding="async" />
      </div>

      <div className="container remember-cta__inner">
        <div className="remember-cta__copy">
          <span className="remember-cta__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>

        <div className="remember-cta__actions">
          <ExpandingArrowLink href="/memory" tone="blue">
            Explore the memory layer
          </ExpandingArrowLink>
        </div>
      </div>
    </section>
  )
}
