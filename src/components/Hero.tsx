export default function Hero() {
  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero">
      <div className="container hero__inner">
        <h1 className="hero__title animate-fade-up">
          AI Coding Agent for{' '}
          <span className="hero__title-accent">Your Terminal</span>
        </h1>

        <p className="hero__subtitle animate-fade-up animate-delay-1">
          A coding agent with built-in memory that remembers your codebase, decisions,
          and context across sessions — up to 40% fewer tokens, every time.
        </p>

        <p className="hero__tagline animate-fade-up animate-delay-2">
          DeepSeek V4 Pro · Kimi 2.7 · GLM 5.1 · MiniMax M3 & more — smarter model
          picks than Codex, better economics than Claude Code, memory that actually sticks.
        </p>

        <div className="hero__actions animate-fade-up animate-delay-3">
          <button type="button" className="btn btn--primary" onClick={scrollToWaitlist}>
            Join the Waitlist
          </button>
        </div>
      </div>

      <div className="hero__glow" aria-hidden="true" />
    </section>
  )
}
