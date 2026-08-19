import { useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from 'react'

type SourceMode = 'link' | 'file'
type RunState = 'idle' | 'working' | 'complete' | 'error'

interface ApiEnvelope<T> {
  status?: 'ok' | 'error'
  data?: T
  error?: string
  detail?: string | Array<{ msg?: string }>
}

interface MemoryItem {
  domain: string
  content: string
}

interface ContextPreview {
  total_pairs: number
  analyzed_pairs: number
  original_token_estimate: number
  reduced_token_estimate: number
  saved_token_estimate: number
  reduction_percent: number
  compression_ratio: number
  reduced_transcript: string
  memories: MemoryItem[]
}

interface ContextResult {
  foundPairs: number
  analyzedPairs: number
  rawTokens: number
  memoryTokens: number
  savedTokens: number
  savingsPercent: number
  compressionRatio: number
  reducedTranscript: string
  memories: MemoryItem[]
}

const MEMORY_API_URL = (import.meta.env.VITE_MEMORY_API_URL || 'https://memory.memcode.in').replace(/\/+$/, '')
const MAX_FILE_BYTES = 1_000_000
const ACCEPTED_FILE_PATTERN = /\.(txt|md|json|jsonl)$/i
const SUPPORTED_HOSTS = ['chatgpt.com', 'chat.openai.com', 'claude.ai', 'claude.com', 'gemini.google.com', 'g.co']
const SUPPORTED_PROVIDERS = [
  { name: 'ChatGPT', logo: '/brands/chatgpt.png' },
  { name: 'Claude', logo: '/brands/claude.png' },
  { name: 'Gemini', logo: '/brands/gemini.svg' },
]

function formatTokens(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function isSupportedShareLink(value: string) {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') return false
    const hostname = parsed.hostname.toLowerCase()
    return SUPPORTED_HOSTS.some((host) => hostname === host || hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

async function readApiEnvelope<T>(response: Response) {
  let body: ApiEnvelope<T> | null = null
  try {
    body = await response.json() as ApiEnvelope<T>
  } catch {
    body = null
  }

  if (!response.ok || body?.status === 'error') {
    const detail = Array.isArray(body?.detail)
      ? body.detail.map((item) => item.msg).filter(Boolean).join(' ')
      : body?.detail
    throw new Error(body?.error || detail || 'The Memory API could not complete this request.')
  }

  return body
}

function resultLabel(state: RunState) {
  if (state === 'working') return 'Working'
  if (state === 'complete') return 'Complete'
  if (state === 'error') return 'Needs attention'
  return null
}

export default function MemoryContextDemo() {
  const [mode, setMode] = useState<SourceMode>('link')
  const [shareUrl, setShareUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [runState, setRunState] = useState<RunState>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<ContextResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const linkTabRef = useRef<HTMLButtonElement>(null)
  const fileTabRef = useRef<HTMLButtonElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const baseId = useId()
  const linkTabId = baseId + '-link-tab'
  const fileTabId = baseId + '-file-tab'
  const linkPanelId = baseId + '-link-panel'
  const filePanelId = baseId + '-file-panel'
  const isWorking = runState === 'working'
  const statusLabel = resultLabel(runState)

  const rawTokens = result?.rawTokens || 0
  const memoryTokens = result?.memoryTokens || 0
  const savedTokens = result?.savedTokens || 0
  const savingsPercent = result?.savingsPercent || 0
  const compression = result?.compressionRatio || 0
  const memoryBarWidth = rawTokens > 0
    ? Math.min(100, Math.max(memoryTokens > 0 ? 2 : 0, (memoryTokens / rawTokens) * 100))
    : 0

  function resetPreview() {
    setRunState('idle')
    setResult(null)
  }

  function selectMode(nextMode: SourceMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setError('')
    resetPreview()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextMode: SourceMode | null = null
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'Home') nextMode = 'link'
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'End') nextMode = 'file'
    if (!nextMode) return
    event.preventDefault()
    selectMode(nextMode)
    const nextTab = nextMode === 'link' ? linkTabRef.current : fileTabRef.current
    nextTab?.focus()
  }

  function selectFile(nextFile: File | null) {
    setError('')
    resetPreview()
    if (!nextFile) {
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (!ACCEPTED_FILE_PATTERN.test(nextFile.name)) {
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setError('Upload a .txt, .md, .json, or .jsonl transcript.')
      return
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setError('Transcript files must be 1 MB or smaller.')
      return
    }
    setFile(nextFile)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] || null)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    if (isWorking) return
    if (fileInputRef.current) fileInputRef.current.value = ''
    selectFile(event.dataTransfer.files?.[0] || null)
  }

  function clearFile() {
    setFile(null)
    setError('')
    resetPreview()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isWorking) return

    if (mode === 'link' && !isSupportedShareLink(shareUrl.trim())) {
      setError('Paste a public ChatGPT, Claude, or Gemini HTTPS share link.')
      return
    }
    if (mode === 'file' && !file) {
      setError('Choose a transcript file to continue.')
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setError('')
    setResult(null)
    setRunState('working')

    try {
      const formData = new FormData()
      if (mode === 'link') {
        formData.append('url', shareUrl.trim())
      } else {
        formData.append('file', file as File)
      }

      const response = await fetch(MEMORY_API_URL + '/v2/memory/context-preview', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      const envelope = await readApiEnvelope<ContextPreview>(response)
      const preview = envelope?.data
      if (!preview) throw new Error('The Memory API returned an empty preview.')

      setResult({
        foundPairs: preview.total_pairs,
        analyzedPairs: preview.analyzed_pairs,
        rawTokens: preview.original_token_estimate,
        memoryTokens: preview.reduced_token_estimate,
        savedTokens: preview.saved_token_estimate,
        savingsPercent: preview.reduction_percent,
        compressionRatio: preview.compression_ratio,
        reducedTranscript: preview.reduced_transcript,
        memories: preview.memories,
      })

      setRunState('complete')
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setRunState('error')
      setError(caught instanceof Error ? caught.message : 'The Memory API could not complete this run.')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }

  return (
    <div className="context-demo">
      <div className="context-demo__workbench">
        <form className="context-demo__input" onSubmit={handleSubmit} aria-busy={isWorking}>
          <div className="context-demo__panel-head">
            <div><span>Live input</span><strong>Bring your own conversation</strong></div>
          </div>

          <div className="context-demo__tabs" role="tablist" aria-label="Context source">
            <button
              ref={linkTabRef}
              type="button"
              id={linkTabId}
              role="tab"
              aria-selected={mode === 'link'}
              aria-controls={linkPanelId}
              tabIndex={mode === 'link' ? 0 : -1}
              className={mode === 'link' ? 'is-active' : ''}
              onClick={() => selectMode('link')}
              onKeyDown={handleTabKeyDown}
              disabled={isWorking}
            >
              Public share link
            </button>
            <button
              ref={fileTabRef}
              type="button"
              id={fileTabId}
              role="tab"
              aria-selected={mode === 'file'}
              aria-controls={filePanelId}
              tabIndex={mode === 'file' ? 0 : -1}
              className={mode === 'file' ? 'is-active' : ''}
              onClick={() => selectMode('file')}
              onKeyDown={handleTabKeyDown}
              disabled={isWorking}
            >
              Upload transcript
            </button>
          </div>

          <div id={linkPanelId} role="tabpanel" aria-labelledby={linkTabId} hidden={mode !== 'link'} className="context-demo__source-panel">
            <label className="context-demo__field">
              <span>Public conversation URL</span>
              <input
                type="url"
                value={shareUrl}
                onChange={(event) => {
                  setShareUrl(event.target.value)
                  setError('')
                  resetPreview()
                }}
                placeholder="https://chatgpt.com/share/…"
                inputMode="url"
                autoComplete="url"
                disabled={isWorking}
              />
            </label>
            <ul className="context-demo__providers" aria-label="Supported providers">
              {SUPPORTED_PROVIDERS.map((provider) => (
                <li key={provider.name} title={provider.name}>
                  <img src={provider.logo} alt={provider.name} />
                </li>
              ))}
            </ul>
          </div>

          <div id={filePanelId} role="tabpanel" aria-labelledby={fileTabId} hidden={mode !== 'file'} className="context-demo__source-panel">
            <label
              className="context-demo__dropzone"
              htmlFor={baseId + '-file'}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id={baseId + '-file'}
                type="file"
                accept=".txt,.md,.json,.jsonl"
                onChange={handleFileChange}
                disabled={isWorking}
              />
              <span>{file ? 'Transcript ready' : 'Drop a transcript here'}</span>
              <strong>{file ? file.name : 'or choose a .txt, .md, .json, or .jsonl file'}</strong>
              <small>{file ? (file.size / 1024).toFixed(1) + ' KB' : 'Maximum file size · 1 MB'}</small>
            </label>
            {file ? <button type="button" className="context-demo__remove" onClick={clearFile} disabled={isWorking}>Remove file</button> : null}
          </div>

          {error ? <p className="context-demo__error" role="alert">{error}</p> : null}

          <button className="context-demo__submit expanding-link expanding-link--dark" type="submit" disabled={isWorking}>
            <span className="expanding-link__circle" aria-hidden="true">
              <span className="expanding-link__arrow" />
            </span>
            <span className="expanding-link__text">Go</span>
          </button>
        </form>

        <section className="context-demo__result" aria-labelledby={baseId + '-result-title'}>
          <div className="context-demo__panel-head">
            <div><span>Live result</span><strong id={baseId + '-result-title'}>Context after Memory</strong></div>
            {statusLabel ? (
              <small aria-live="polite" className={'context-demo__status context-demo__status--' + runState}>{statusLabel}</small>
            ) : null}
          </div>

          {result ? (
            <>
              <div className="context-demo__metrics">
                <div><span>Analyzed conversation</span><strong>{formatTokens(rawTokens)}</strong><small>est. tokens</small></div>
                <div><span>Memory</span><strong>{formatTokens(memoryTokens)}</strong><small>est. tokens</small></div>
                <div><span>Context saved</span><strong>{savingsPercent}%</strong><small>{formatTokens(savedTokens)} tokens</small></div>
                <div><span>Compression</span><strong>{compression > 0 ? compression.toFixed(1) + '×' : '—'}</strong><small>{result.analyzedPairs} of {result.foundPairs} pairs</small></div>
              </div>

              <div className="context-demo__comparison" aria-label="Estimated token comparison">
                <div><span>Raw conversation</span><i><em style={{ width: '100%' }} /></i><b>{formatTokens(rawTokens)}</b></div>
                <div><span>Usable memory</span><i><em style={{ width: memoryBarWidth + '%' }} /></i><b>{formatTokens(memoryTokens)}</b></div>
              </div>

              <div className="context-demo__memory-list context-demo__transcript">
                <div className="context-demo__memory-head"><span>Final reduced context</span><b>{result.memories.length} memories</b></div>
                {result.reducedTranscript ? (
                  <pre>{result.reducedTranscript}</pre>
                ) : (
                  <p className="context-demo__no-memory">
                    No durable memory was formed from this sample.
                  </p>
                )}
              </div>
            </>
          ) : isWorking ? (
            <div className="context-demo__processing">
              <div className="context-demo__empty-visual" aria-hidden="true"><i /><i /><i /><span /></div>
              <span>Reducing context</span>
              <strong>Keeping the details that matter…</strong>
              <p>Removing repetition and filler without losing facts, preferences, or decisions.</p>
              <div className="context-demo__progress context-demo__progress--indeterminate">
                <div><span>Preparing your result</span></div>
                <i role="progressbar" aria-label="Context reduction in progress"><em /></i>
              </div>
            </div>
          ) : runState === 'error' ? (
            <div className="context-demo__empty context-demo__empty--error">
              <div className="context-demo__empty-visual" aria-hidden="true"><i /><i /><i /><span /></div>
              <span>Preview interrupted</span>
              <strong>The run could not be completed.</strong>
              <p>{error || 'Check the source and try again.'}</p>
            </div>
          ) : (
            <div className="context-demo__empty">
              <div className="context-demo__empty-visual" aria-hidden="true"><i /><i /><i /><span /></div>
              <span>Waiting for context</span>
              <strong>Your real reduction appears here.</strong>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
