import { CSSProperties, useState } from 'react'

type Verdict = 'write' | 'merge' | 'supersede' | 'judge'

interface FactState {
  value: string
  status: 'active' | 'superseded'
  note?: string
}

interface Step {
  node: string
  date: string
  verdict: Verdict
  event: string
  answer: string
  source: string
  facts: FactState[]
}

const VERDICT_LABEL: Record<Verdict, string> = {
  write: 'WRITE',
  merge: 'MERGE',
  supersede: 'SUPERSEDE',
  judge: 'JUDGE',
}

const DEFAULT_QUESTION = 'What plan is Acme on, and who owns the account?'

const DEFAULT_STEPS: Step[] = [
  {
    node: 'Signup',
    date: 'Jan 14',
    verdict: 'write',
    event: 'A new fact arrives from the signup event.',
    answer: 'Acme is on the Starter plan. No account owner yet.',
    source: 'signup.event · Jan 14',
    facts: [{ value: 'Acme → Starter plan', status: 'active' }],
  },
  {
    node: 'CRM sync',
    date: 'Feb 02',
    verdict: 'write',
    event: 'Salesforce assigns an account owner.',
    answer: 'Acme is on Starter. Owner: Priya (AE).',
    source: 'crm.salesforce · Feb 02',
    facts: [
      { value: 'Acme → Starter plan', status: 'active' },
      { value: 'Owner → Priya (AE)', status: 'active' },
    ],
  },
  {
    node: 'Conflict',
    date: 'Mar 21',
    verdict: 'judge',
    event: 'Billing reports an upgrade — this conflicts with the stored plan.',
    answer: 'Two plan values seen. Judging which is current…',
    source: 'billing.stripe · Mar 21',
    facts: [
      { value: 'Acme → Starter plan', status: 'active', note: 'conflicts' },
      { value: 'Acme → Growth plan', status: 'active', note: 'newer' },
      { value: 'Owner → Priya (AE)', status: 'active' },
    ],
  },
  {
    node: 'Superseded',
    date: 'Mar 21',
    verdict: 'supersede',
    event: 'The judge keeps the newer, higher-trust billing fact and retires the old one.',
    answer: 'Acme is on the Growth plan. Owner: Priya (AE).',
    source: 'billing.stripe · Mar 21',
    facts: [
      { value: 'Acme → Starter plan', status: 'superseded', note: 'retired' },
      { value: 'Acme → Growth plan', status: 'active', note: 'current' },
      { value: 'Owner → Priya (AE)', status: 'active' },
    ],
  },
  {
    node: 'Today',
    date: 'now',
    verdict: 'merge',
    event: 'A handoff note is merged. The current answer stays traceable to its source.',
    answer: 'Acme is on Growth. Owner: Priya. Renewal flagged for August.',
    source: 'meeting.notes · Jul 27',
    facts: [
      { value: 'Acme → Growth plan', status: 'active', note: 'current' },
      { value: 'Owner → Priya (AE)', status: 'active' },
      { value: 'Renewal → August', status: 'active', note: 'new' },
    ],
  },
]

/**
 * Living Memory timeline — a single fact evolving over time. Scrub (drag the
 * slider, use arrow keys, or click a node) to watch new information arrive,
 * conflicts get judged, old facts get superseded, and the current answer stay
 * traceable to its source.
 */
export default function LivingMemoryTimeline({
  question = DEFAULT_QUESTION,
  steps = DEFAULT_STEPS,
}: {
  question?: string
  steps?: Step[]
}) {
  const [index, setIndex] = useState(0)
  const step = steps[index] ?? steps[0]
  const progress = steps.length > 1 ? (index / (steps.length - 1)) * 100 : 0

  return (
    <div className="living-timeline">
      <div className="living-timeline__query">
        <span className="living-timeline__q-label">Query</span>
        <p>{question}</p>
      </div>

      <div className="living-timeline__rail">
        <div className="living-timeline__track" aria-hidden="true">
          <span className="living-timeline__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="living-timeline__nodes">
          {steps.map((s, i) => (
            <button
              key={`${s.node}-${i}`}
              type="button"
              className={i <= index ? 'living-timeline__node is-reached' : 'living-timeline__node'}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <span className="living-timeline__dot" />
              <em>{s.node}</em>
              <small>{s.date}</small>
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="living-timeline-scrubber">
          Scrub the memory timeline
        </label>
        <input
          id="living-timeline-scrubber"
          className="living-timeline__scrubber"
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={`${step.node}, ${step.date}`}
        />
      </div>

      <div className="living-timeline__stage" key={index}>
        <div className="living-timeline__event">
          <span className={`living-timeline__verdict is-${step.verdict}`}>
            {VERDICT_LABEL[step.verdict]}
          </span>
          <p>{step.event}</p>
        </div>

        <div className="living-timeline__facts" aria-label="Stored facts">
          {step.facts.map((fact, i) => (
            <div
              key={fact.value}
              className={`living-timeline__fact is-${fact.status}`}
              style={{ '--i': i } as CSSProperties}
            >
              <span className="living-timeline__fact-dot" />
              <span className="living-timeline__fact-value">{fact.value}</span>
              {fact.note && <em className="living-timeline__fact-note">{fact.note}</em>}
            </div>
          ))}
        </div>

        <div className="living-timeline__answer">
          <span>Current answer</span>
          <strong>{step.answer}</strong>
          <a className="living-timeline__source" href="#source" onClick={(e) => e.preventDefault()}>
            traceable to <code>{step.source}</code>
          </a>
        </div>
      </div>
    </div>
  )
}
