import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { readUserFacingApiError, userFacingErrorMessage } from '../lib/user-facing-errors'

type RemoteEvent = {
  type: string
  request_id?: string
  request?: {
    subtype?: string
    tool_name?: string
    description?: string
    input?: unknown
  }
  message?: {
    role?: string
    content?: unknown
  }
  subtype?: string
  result?: string
  stdout?: string
  session_id?: string
}

type PermissionPrompt = {
  requestId: string
  toolName: string
  description: string
  input: unknown
}

const REMOTE_API_ORIGIN = (
  import.meta.env.VITE_MEMCODE_REMOTE_API_ORIGIN || ''
).replace(/\/$/, '')
const REMOTE_PAIRING_ERROR = 'Remote pairing expired. Reconnect from MemCode.'
const REMOTE_MESSAGE_ERROR = "Your message couldn't be sent. Please try again."

function remoteApiUrl(pairingId: string, path: string): string {
  return `${REMOTE_API_ORIGIN}/api/remote/${pairingId}${path}`
}

function textFromContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (
          block &&
          typeof block === 'object' &&
          'type' in block &&
          block.type === 'text' &&
          'text' in block &&
          typeof block.text === 'string'
        ) {
          return block.text
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function eventText(event: RemoteEvent): string {
  if (event.type === 'assistant' || event.type === 'user') {
    return textFromContent(event.message?.content)
  }
  if (event.type === 'result') {
    return event.result || 'Turn completed.'
  }
  if (event.type === 'system' && event.stdout) {
    return event.stdout
  }
  return ''
}

function isDisplayEvent(event: RemoteEvent): boolean {
  return (
    event.type === 'assistant' ||
    event.type === 'user' ||
    event.type === 'result' ||
    (event.type === 'system' && !!event.stdout)
  )
}

export default function RemoteSession({ pairingId }: { pairingId: string }) {
  const [events, setEvents] = useState<RemoteEvent[]>([])
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [status, setStatus] = useState('connecting')
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [permission, setPermission] = useState<PermissionPrompt | null>(null)
  const lastEventIdRef = useRef<string | null>(null)

  useEffect(() => {
    lastEventIdRef.current = lastEventId
  }, [lastEventId])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const cursor = lastEventIdRef.current
        const url = cursor
          ? remoteApiUrl(pairingId, `/events?after_id=${encodeURIComponent(cursor)}`)
          : remoteApiUrl(pairingId, '/events')
        const response = await fetch(url)
        if (!response.ok) {
          const details = await readUserFacingApiError(response, { fallback: REMOTE_PAIRING_ERROR })
          if (cancelled) return
          setError(details.message)
          setStatus('disconnected')
          return
        }
        const data = await response.json()
        if (cancelled) return
        if (!data.success) {
          setError(REMOTE_PAIRING_ERROR)
          setStatus('disconnected')
          return
        }
        const newEvents = (data.events ?? []) as RemoteEvent[]
        if (newEvents.length > 0) {
          setEvents((previous) => [...previous, ...newEvents])
          let prompt: RemoteEvent | undefined
          for (let i = newEvents.length - 1; i >= 0; i--) {
            const event = newEvents[i]
            if (
              event.type === 'control_request' &&
              event.request?.subtype === 'can_use_tool' &&
              event.request_id
            ) {
              prompt = event
              break
            }
          }
          if (prompt?.request_id) {
            setPermission({
              requestId: prompt.request_id,
              toolName: prompt.request?.tool_name || 'Tool',
              description:
                prompt.request?.description ||
                `${prompt.request?.tool_name || 'Tool'} requires permission`,
              input: prompt.request?.input,
            })
          }
        }
        setLastEventId(data.lastEventId ?? cursor ?? null)
        setStatus(data.sessionStatus || 'connected')
        setError(null)
      } catch {
        if (!cancelled) {
          setStatus('reconnecting')
        }
      }
    }

    void poll()
    const interval = window.setInterval(poll, 1500)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pairingId])

  const displayEvents = useMemo(() => events.filter(isDisplayEvent), [events])

  async function submitMessage(event: FormEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setIsSending(true)
    setInput('')
    try {
      const response = await fetch(remoteApiUrl(pairingId, '/message'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      if (!response.ok) {
        const details = await readUserFacingApiError(response, { fallback: REMOTE_MESSAGE_ERROR })
        throw new Error(details.message)
      }
      const data = await response.json().catch(() => ({}))
      if (!data.success) {
        throw new Error(REMOTE_MESSAGE_ERROR)
      }
    } catch (err) {
      setError(userFacingErrorMessage(err, REMOTE_MESSAGE_ERROR))
      setInput(trimmed)
    } finally {
      setIsSending(false)
    }
  }

  async function answerPermission(behavior: 'allow' | 'deny') {
    if (!permission) return
    const current = permission
    setPermission(null)
    try {
      const response = await fetch(remoteApiUrl(pairingId, '/permission'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestId: current.requestId,
          behavior,
          updatedInput: behavior === 'allow' ? current.input ?? {} : undefined,
          message: behavior === 'deny' ? 'Denied from memCode web' : undefined,
        }),
      })
      if (!response.ok) throw new Error('Permission response failed')
    } catch {
      setError('Could not answer permission request.')
      setPermission(current)
    }
  }

  async function interrupt() {
    try {
      const response = await fetch(remoteApiUrl(pairingId, '/interrupt'), { method: 'POST' })
      if (!response.ok) throw new Error('Interrupt request failed')
    } catch {
      setError('Could not stop the running turn.')
    }
  }

  return (
    <main className="remote-shell">
      <header className="remote-header">
        <div>
          <p className="remote-kicker">memCode web</p>
          <h1>Remote Control</h1>
        </div>
        <span className={`remote-status remote-status--${status}`}>
          {status}
        </span>
      </header>

      {error && <div className="remote-error">{error}</div>}

      <section className="remote-thread" aria-live="polite">
        {displayEvents.length === 0 ? (
          <div className="remote-empty">
            <h2>Connected to your memCode session</h2>
            <p>Send a message below and keep working from this browser.</p>
          </div>
        ) : (
          displayEvents.map((event, index) => (
            <article
              key={`${event.type}-${index}`}
              className={`remote-message remote-message--${event.type}`}
            >
              <div className="remote-message__role">{event.type}</div>
              <p>{eventText(event)}</p>
            </article>
          ))
        )}
      </section>

      {permission && (
        <section className="remote-permission">
          <div>
            <strong>{permission.toolName}</strong>
            <p>{permission.description}</p>
          </div>
          <div className="remote-permission__actions">
            <button type="button" onClick={() => answerPermission('deny')}>
              Deny
            </button>
            <button type="button" onClick={() => answerPermission('allow')}>
              Allow
            </button>
          </div>
        </section>
      )}

      <form className="remote-compose" onSubmit={submitMessage}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder="Ask memCode to keep going..."
          rows={2}
        />
        <div className="remote-compose__actions">
          <button type="button" className="remote-stop" onClick={interrupt}>
            Stop
          </button>
          <button type="submit" disabled={isSending || input.trim().length === 0}>
            Send
          </button>
        </div>
      </form>
    </main>
  )
}
