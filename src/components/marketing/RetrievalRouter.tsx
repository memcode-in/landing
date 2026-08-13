import { useState } from 'react'

interface Memory {
  id: string
  text: string
  domain: string
}

const MEMORIES: Memory[] = [
  { id: 'm1', text: 'Acme is on the Growth plan', domain: 'account' },
  { id: 'm2', text: 'prefers email over calls', domain: 'account' },
  { id: 'm3', text: 'renewal flagged for August', domain: 'account' },
  { id: 'm4', text: 'auth uses SSO (Okta)', domain: 'product' },
  { id: 'm5', text: 'refunds need manager approval', domain: 'policy' },
  { id: 'm6', text: 'Priya owns the account', domain: 'account' },
  { id: 'm7', text: 'v2 API shipped in March', domain: 'product' },
  { id: 'm8', text: 'ticket #4821 was a rate-limit bug', domain: 'support' },
  { id: 'm9', text: 'EU data stays in-region', domain: 'policy' },
  { id: 'm10', text: 'onboarding is a 3-step flow', domain: 'product' },
  { id: 'm11', text: 'status page: status.acme.io', domain: 'support' },
  { id: 'm12', text: 'Q3 roadmap approved', domain: 'product' },
]

interface Query {
  label: string
  q: string
  relevant: string[]
}

const QUERIES: Query[] = [
  {
    label: 'Support reply',
    q: 'Customer hit rate limits again — how do I respond?',
    relevant: ['m8', 'm11', 'm4'],
  },
  {
    label: 'Renewal prep',
    q: 'Prep the Acme renewal call',
    relevant: ['m1', 'm3', 'm6', 'm2'],
  },
  {
    label: 'Refund request',
    q: 'Customer is asking for a refund',
    relevant: ['m5', 'm6', 'm1'],
  },
]

/**
 * RetrievalRouter — shows that memory is selective. A query routes only the few
 * relevant memories into context (not the whole store), with a token comparison
 * that makes "durable memory, not a bigger prompt" concrete.
 */
export default function RetrievalRouter() {
  const [active, setActive] = useState(0)
  const query = QUERIES[active]
  const relevant = new Set(query.relevant)
  const routed = MEMORIES.filter((m) => relevant.has(m.id))

  const stuffedTokens = MEMORIES.length * 42
  const selectiveTokens = routed.length * 42
  const savedPct = Math.round((1 - selectiveTokens / stuffedTokens) * 100)

  return (
    <div className="retrieval-router">
      <div className="retrieval-router__queries" role="tablist" aria-label="Example queries">
        {QUERIES.map((qq, i) => (
          <button
            key={qq.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? 'is-active' : ''}
            onClick={() => setActive(i)}
          >
            {qq.label}
          </button>
        ))}
      </div>

      <div className="retrieval-router__query-bar">
        <span aria-hidden="true">❯</span>
        <p>{query.q}</p>
      </div>

      <div className="retrieval-router__body">
        <div className="retrieval-router__store" aria-label="Full memory store">
          <span className="retrieval-router__cap">Memory store · {MEMORIES.length}</span>
          <ol className="retrieval-router__records">
            {MEMORIES.map((m, index) => (
              <li
                key={m.id}
                className={relevant.has(m.id) ? 'retrieval-record is-routed' : 'retrieval-record'}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{m.text}</p>
                <small>{m.domain}</small>
              </li>
            ))}
          </ol>
        </div>

        <div className="retrieval-router__arrow" aria-hidden="true">
          <i />
          <em>route</em>
        </div>

        <div className="retrieval-router__context" aria-label="Assembled context">
          <span className="retrieval-router__cap">Context assembled · {routed.length}</span>
          <ol className="retrieval-router__records retrieval-router__records--selected">
            {routed.map((m, index) => (
              <li key={m.id} className="retrieval-record is-routed">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{m.text}</p>
                <small>{m.domain}</small>
              </li>
            ))}
          </ol>
          <div className="retrieval-router__tokens">
            <div className="retrieval-router__bar">
              <span>Prompt-stuff everything</span>
              <i className="is-stuffed"><em style={{ width: '100%' }} /></i>
              <b>{stuffedTokens} tok</b>
            </div>
            <div className="retrieval-router__bar">
              <span>Selective recall</span>
              <i className="is-selective">
                <em style={{ width: `${(selectiveTokens / stuffedTokens) * 100}%` }} />
              </i>
              <b>{selectiveTokens} tok</b>
            </div>
            <strong className="retrieval-router__saved">
              <b>{savedPct}%</b>
              less context loaded
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
