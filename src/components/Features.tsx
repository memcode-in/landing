const features = [
  {
    icon: '🧠',
    title: 'Multi-Model Support',
    description:
      'Switch between GPT, Gemini, Kimi, DeepSeek, and Llama via OpenRouter — pick the best model for each task.',
  },
  {
    icon: '✏️',
    title: 'Code Editing',
    description:
      'Understands your codebase and proposes precise edits. Every change requires your approval before applying.',
  },
  {
    icon: '⚡',
    title: 'Shell Execution',
    description:
      'Runs commands, installs dependencies, and executes tests — all from your terminal with full transparency.',
  },
  {
    icon: '🔌',
    title: 'MCP Integration',
    description:
      'Extend capabilities with Model Context Protocol servers for databases, APIs, and custom tooling.',
  },
  {
    icon: '💾',
    title: 'Project Memory',
    description:
      'Persistent project memory remembers context across sessions so you never repeat yourself.',
  },
  {
    icon: '🐙',
    title: 'GitHub Integration',
    description:
      'Review PRs, manage issues, and automate workflows directly from your terminal session.',
  },
]

export default function Features() {
  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header animate-fade-up">
          <h2 className="section-header__title">Built for developers</h2>
          <p className="section-header__subtitle">
            Everything you need to ship faster — without leaving your terminal.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature, i) => (
            <article
              key={feature.title}
              className={`feature-card animate-fade-up animate-delay-${(i % 3) + 1}`}
            >
              <span className="feature-card__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__description">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
