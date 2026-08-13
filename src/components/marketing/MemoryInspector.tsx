import { useState } from 'react'

interface Entry {
  id: string
  value: string
  domain: string
  source: string
  updated: string
  confidence: number
  trail: string[]
}

const ENTRIES: Entry[] = [
  {
    id: 'e1',
    value: 'Acme is on the Growth plan',
    domain: 'account',
    source: 'billing.stripe',
    updated: 'Mar 21',
    confidence: 0.98,
    trail: ['signup.event · Starter', 'billing.stripe · upgrade → Growth', 'superseded older plan fact'],
  },
  {
    id: 'e2',
    value: 'Auth uses SSO via Okta',
    domain: 'product',
    source: 'docs.security',
    updated: 'Feb 09',
    confidence: 0.95,
    trail: ['docs.security#sso', 'confirmed in eng-sync meeting'],
  },
  {
    id: 'e3',
    value: 'Refunds require manager approval',
    domain: 'policy',
    source: 'docs.support-policy',
    updated: 'Jan 30',
    confidence: 0.99,
    trail: ['docs.support-policy v3', 'linked from ticket #4820'],
  },
  {
    id: 'e4',
    value: 'Priya owns the Acme account',
    domain: 'account',
    source: 'crm.salesforce',
    updated: 'Feb 02',
    confidence: 0.92,
    trail: ['crm.salesforce · owner field', 'reassigned from unowned'],
  },
]

/**
 * MemoryInspector — a mock of the inspectable, portable memory surface. Every
 * entry carries a domain, source, freshness, and confidence, with a provenance
 * trail and correct/delete controls. Reinforces the governance story.
 */
export default function MemoryInspector() {
  const [selected, setSelected] = useState(ENTRIES[0].id)
  const entry = ENTRIES.find((e) => e.id === selected) ?? ENTRIES[0]

  return (
    <div className="mem-inspector">
      <div className="mem-inspector__bar">
        <span className="mem-inspector__dot" />
        <strong>memory · inspector</strong>
        <span className="mem-inspector__scope">workspace / acme</span>
      </div>
      <div className="mem-inspector__body">
        <ul className="mem-inspector__list" role="listbox" aria-label="Memory entries">
          {ENTRIES.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                role="option"
                aria-selected={e.id === selected}
                className={e.id === selected ? 'is-active' : ''}
                onClick={() => setSelected(e.id)}
              >
                <span className="mem-inspector__domain" data-domain={e.domain}>
                  {e.domain}
                </span>
                <span className="mem-inspector__value">{e.value}</span>
                <small>updated {e.updated}</small>
              </button>
            </li>
          ))}
        </ul>

        <div className="mem-inspector__detail" key={entry.id}>
          <span className="mem-inspector__domain" data-domain={entry.domain}>
            {entry.domain}
          </span>
          <h4>{entry.value}</h4>
          <dl className="mem-inspector__meta">
            <div>
              <dt>Source</dt>
              <dd><code>{entry.source}</code></dd>
            </div>
            <div>
              <dt>Freshness</dt>
              <dd>updated {entry.updated}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>
                <i className="mem-inspector__conf">
                  <em style={{ width: `${entry.confidence * 100}%` }} />
                </i>
                {Math.round(entry.confidence * 100)}%
              </dd>
            </div>
          </dl>
          <div className="mem-inspector__trail" aria-label="Provenance trail">
            <span>Provenance</span>
            <ol>
              {entry.trail.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>
          <div className="mem-inspector__actions">
            <button type="button" className="mem-inspector__act">Correct</button>
            <button type="button" className="mem-inspector__act">Export</button>
            <button type="button" className="mem-inspector__act is-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  )
}
