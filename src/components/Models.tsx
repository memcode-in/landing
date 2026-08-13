const models = [
  { name: 'GPT-4o', provider: 'OpenAI', tag: 'Flagship' },
  { name: 'Gemini 2.0', provider: 'Google', tag: 'Multimodal' },
  { name: 'Kimi', provider: 'Moonshot', tag: 'Long context' },
  { name: 'DeepSeek', provider: 'DeepSeek', tag: 'Reasoning' },
  { name: 'Llama 3.3', provider: 'Meta', tag: 'Open source' },
]

export default function Models() {
  return (
    <section id="models" className="models">
      <div className="container">
        <div className="section-header animate-fade-up">
          <h2 className="section-header__title">Multi-model by design</h2>
          <p className="section-header__subtitle">
            Access leading AI models through OpenRouter — switch anytime, no lock-in.
          </p>
        </div>

        <div className="models__grid">
          {models.map((model, i) => (
            <div
              key={model.name}
              className={`model-card animate-fade-up animate-delay-${(i % 3) + 1}`}
            >
              <span className="model-card__tag">{model.tag}</span>
              <h3 className="model-card__name">{model.name}</h3>
              <p className="model-card__provider">{model.provider}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
