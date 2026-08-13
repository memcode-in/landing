import { randomBytes, randomUUID, timingSafeEqual } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { decryptSecret, encryptSecret } from './crypto.js'
import {
  getRemotePairingStore,
  hasPersistentRemotePairingStore,
} from './store.js'
import {
  PAIRING_TTL_MS,
  relayEventsRequestSchema,
  relayInboxQuerySchema,
  remoteEventsQuerySchema,
  remoteMessageRequestSchema,
  remotePairRequestSchema,
  remotePermissionRequestSchema,
  type RelayCommand,
  type RemoteEvent,
  type RemotePairingRecord,
} from './types.js'
import {
  pollRemoteEvents,
  sendRemoteInterrupt,
  sendRemoteMessage,
  sendRemotePermission,
} from './upstream.js'

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function getWebOrigin(req?: VercelRequest): string {
  const configured =
    process.env.MEMCODE_WEB_ORIGIN || process.env.PUBLIC_MEMCODE_WEB_ORIGIN
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const host = req?.headers.host
  if (host) return `http://${host}`
  return 'http://localhost:5173'
}

const CORS_HEADERS = {
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-origin': '*',
}

function createPairingId(): string {
  return randomBytes(18).toString('base64url')
}

function createRelayCommandId(): string {
  return `cmd_${randomBytes(12).toString('base64url')}`
}

async function getPairing(pairingId: string): Promise<RemotePairingRecord | null> {
  const store = getRemotePairingStore()
  const record = await store.get(pairingId)
  if (!record) return null
  if (record.expiresAt <= Date.now()) {
    await store.delete(pairingId)
    return null
  }
  await store.touch(pairingId, Date.now())
  return record
}

type JsonResponder = (data: unknown, status?: number) => unknown

function requiresPersistentRemoteStore(): boolean {
  return (
    process.env.VERCEL === '1' ||
    process.env.MEMCODE_REQUIRE_PERSISTENT_REMOTE_STORE === '1'
  )
}

function bearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

function isWorkerAuthorized(
  record: RemotePairingRecord,
  authorization: string | undefined,
): boolean {
  const token = bearerToken(authorization)
  if (!token) return false
  const expected = decryptSecret(record.encryptedAccessToken)
  const tokenBuffer = Buffer.from(token)
  const expectedBuffer = Buffer.from(expected)
  return (
    tokenBuffer.length === expectedBuffer.length &&
    timingSafeEqual(tokenBuffer, expectedBuffer)
  )
}

function ensureRelay(record: RemotePairingRecord) {
  record.mode = 'relay'
  record.relay ??= {
    events: [],
    inbox: [],
    sessionStatus: 'connected',
  }
  return record.relay
}

function eventCursor(event: RemoteEvent, index: number): string {
  return String(event.id ?? event.uuid ?? `event_${index}`)
}

function normalizeRelayEvent(event: RemoteEvent, fallbackId: string): RemoteEvent {
  return {
    ...event,
    id: String(event.id ?? event.uuid ?? fallbackId),
  }
}

function mergeRelayEvents(
  existing: RemoteEvent[],
  incoming: RemoteEvent[],
): RemoteEvent[] {
  const merged = new Map<string, RemoteEvent>()
  for (const [index, event] of existing.entries()) {
    merged.set(eventCursor(event, index), normalizeRelayEvent(event, `old_${index}`))
  }
  for (const [index, event] of incoming.entries()) {
    merged.set(
      eventCursor(event, index),
      normalizeRelayEvent(event, `new_${Date.now()}_${index}`),
    )
  }
  return [...merged.values()].slice(-200)
}

function pollRelayEvents(
  record: RemotePairingRecord,
  afterId?: string,
): {
  events: RemoteEvent[]
  lastEventId: string | null
  sessionStatus?: string
} {
  const relay = ensureRelay(record)
  const allEvents = relay.events ?? []
  const startIndex = afterId
    ? allEvents.findIndex((event, index) => eventCursor(event, index) === afterId) + 1
    : 0
  const events = allEvents.slice(Math.max(0, startIndex))
  const lastEvent = events.at(-1) ?? allEvents.at(-1)
  const workerSeenRecently =
    relay.lastWorkerSeenAt !== undefined &&
    Date.now() - relay.lastWorkerSeenAt < 20_000
  return {
    events,
    lastEventId: lastEvent
      ? eventCursor(lastEvent, allEvents.indexOf(lastEvent))
      : afterId ?? null,
    sessionStatus:
      relay.sessionStatus ?? (workerSeenRecently ? 'connected' : 'waiting'),
  }
}

function pollRelayInbox(
  record: RemotePairingRecord,
  afterId?: string,
): { commands: RelayCommand[]; lastCommandId: string | null } {
  const relay = ensureRelay(record)
  const allCommands = relay.inbox ?? []
  const startIndex = afterId
    ? allCommands.findIndex(command => command.id === afterId) + 1
    : 0
  const commands = allCommands.slice(Math.max(0, startIndex))
  return {
    commands,
    lastCommandId: commands.at(-1)?.id ?? afterId ?? null,
  }
}

async function updateRelayRecord(
  pairingId: string,
  updater: (record: RemotePairingRecord) => void,
): Promise<RemotePairingRecord | null> {
  const store = getRemotePairingStore()
  const record = await store.get(pairingId)
  if (!record || record.expiresAt <= Date.now()) return null
  ensureRelay(record)
  updater(record)
  record.lastUsedAt = Date.now()
  await store.set(record)
  return record
}

async function appendRelayCommand(
  record: RemotePairingRecord,
  command: RelayCommand,
  event?: RemoteEvent,
): Promise<void> {
  await updateRelayRecord(record.pairingId, latest => {
    const relay = ensureRelay(latest)
    relay.inbox = [...(relay.inbox ?? []), command].slice(-200)
    if (event) {
      relay.events = mergeRelayEvents(relay.events ?? [], [event])
    }
  })
}

async function handleRemoteRequest(
  method: string,
  pathParts: string[],
  body: unknown,
  query: Record<string, string | undefined>,
  json: JsonResponder,
  authorization?: string,
  req?: VercelRequest,
): Promise<unknown> {
  if (method === 'OPTIONS') {
    return json({ success: true })
  }

  if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'pair') {
    const parsed = remotePairRequestSchema.safeParse(body)
    if (!parsed.success) {
      return json({ success: false, message: 'Invalid pairing request' }, 400)
    }

    const now = Date.now()
    const pairingId = createPairingId()
    const ttlMs = (parsed.data.ttlSeconds ?? PAIRING_TTL_MS / 1000) * 1000
    const mode = parsed.data.mode ?? 'upstream'
    if (
      mode === 'relay' &&
      requiresPersistentRemoteStore() &&
      !hasPersistentRemotePairingStore()
    ) {
      return json(
        {
          success: false,
          message:
            'Remote relay requires persistent pairing storage. Set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or GOOGLE_SHEET_ID/GOOGLE_SERVICE_ACCOUNT_KEY in production.',
        },
        503,
      )
    }
    const record: RemotePairingRecord = {
      pairingId,
      mode,
      sessionId: parsed.data.sessionId,
      environmentId: parsed.data.environmentId,
      organizationUuid: parsed.data.organizationUuid,
      encryptedAccessToken: encryptSecret(parsed.data.accessToken),
      upstreamBaseUrl:
        parsed.data.upstreamBaseUrl ?? 'https://api.anthropic.com',
      createdAt: now,
      expiresAt: now + ttlMs,
      lastUsedAt: now,
      relay:
        mode === 'relay'
          ? {
              events: [],
              inbox: [],
              sessionStatus: 'connected',
            }
          : undefined,
    }
    await getRemotePairingStore().set(record)

    const webOrigin = (parsed.data.webOrigin ?? getWebOrigin(req)).replace(/\/$/, '')

    return json({
      success: true,
      pairingId,
      webUrl: `${webOrigin}/code/${pairingId}`,
      expiresAt: new Date(record.expiresAt).toISOString(),
    })
  }

  const pairingId = pathParts[0]
  const action = pathParts[1]
  if (!pairingId || !action) {
    return json({ success: false, message: 'Not found' }, 404)
  }

  const record = await getPairing(pairingId)
  if (!record) {
    return json({ success: false, message: 'Pairing expired or not found' }, 404)
  }

  if (action === 'relay') {
    if (record.mode !== 'relay') {
      return json({ success: false, message: 'Pairing is not a relay' }, 400)
    }
    if (!isWorkerAuthorized(record, authorization)) {
      return json({ success: false, message: 'Unauthorized relay worker' }, 401)
    }

    const relayAction = pathParts[2]
    if (method === 'POST' && relayAction === 'events') {
      const parsed = relayEventsRequestSchema.safeParse(body)
      if (!parsed.success) {
        return json({ success: false, message: 'Invalid relay events' }, 400)
      }
      await updateRelayRecord(record.pairingId, latest => {
        const relay = ensureRelay(latest)
        relay.events = mergeRelayEvents(relay.events ?? [], parsed.data.events)
        relay.lastWorkerSeenAt = Date.now()
        relay.sessionStatus = parsed.data.sessionStatus ?? relay.sessionStatus
      })
      return json({ success: true })
    }

    if (method === 'GET' && relayAction === 'inbox') {
      const parsed = relayInboxQuerySchema.safeParse(query)
      if (!parsed.success) {
        return json({ success: false, message: 'Invalid relay inbox query' }, 400)
      }
      await updateRelayRecord(record.pairingId, latest => {
        const relay = ensureRelay(latest)
        relay.lastWorkerSeenAt = Date.now()
      })
      return json({ success: true, ...pollRelayInbox(record, parsed.data.after_id) })
    }

    return json({ success: false, message: 'Not found' }, 404)
  }

  if (method === 'GET' && action === 'events') {
    const parsed = remoteEventsQuerySchema.safeParse(query)
    if (!parsed.success) {
      return json({ success: false, message: 'Invalid events query' }, 400)
    }
    if (record.mode === 'relay') {
      return json({ success: true, ...pollRelayEvents(record, parsed.data.after_id) })
    }
    const result = await pollRemoteEvents(record, parsed.data.after_id)
    return json({ success: true, ...result })
  }

  if (method === 'POST' && action === 'message') {
    const parsed = remoteMessageRequestSchema.safeParse(body)
    if (!parsed.success) {
      return json({ success: false, message: 'Invalid message request' }, 400)
    }
    if (record.mode === 'relay') {
      const uuid = parsed.data.uuid ?? randomUUID()
      const commandId = createRelayCommandId()
      await appendRelayCommand(
        record,
        {
          id: commandId,
          type: 'message',
          content: parsed.data.content,
          uuid,
          createdAt: Date.now(),
        },
        {
          id: commandId,
          uuid,
          session_id: record.sessionId,
          type: 'user',
          message: { role: 'user', content: parsed.data.content },
        },
      )
      return json({ success: true })
    }
    await sendRemoteMessage(record, parsed.data.content, parsed.data.uuid)
    return json({ success: true })
  }

  if (method === 'POST' && action === 'permission') {
    const parsed = remotePermissionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return json({ success: false, message: 'Invalid permission request' }, 400)
    }
    if (record.mode === 'relay') {
      await appendRelayCommand(record, {
        id: createRelayCommandId(),
        type: 'permission',
        requestId: parsed.data.requestId,
        behavior: parsed.data.behavior,
        updatedInput: parsed.data.updatedInput,
        message: parsed.data.message,
        createdAt: Date.now(),
      })
      return json({ success: true })
    }
    await sendRemotePermission(record, parsed.data.requestId, {
      behavior: parsed.data.behavior,
      updatedInput: parsed.data.updatedInput,
      message: parsed.data.message,
    })
    return json({ success: true })
  }

  if (method === 'POST' && action === 'interrupt') {
    if (record.mode === 'relay') {
      await appendRelayCommand(record, {
        id: createRelayCommandId(),
        type: 'interrupt',
        createdAt: Date.now(),
      })
      return json({ success: true })
    }
    await sendRemoteInterrupt(record)
    return json({ success: true })
  }

  return json({ success: false, message: 'Not found' }, 404)
}

export async function handleRemoteVercelRequest(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value)
  }
  try {
    const queryPath = Array.isArray(req.query.path)
      ? req.query.path
      : typeof req.query.path === 'string'
        ? [req.query.path]
        : []
    const fallbackPath = (req.url ?? '')
      .split('?')[0]
      .replace(/^\/api\/remote\/?/, '')
      .split('/')
      .filter(Boolean)
    const path = queryPath.length > 0 ? queryPath : fallbackPath
    await handleRemoteRequest(
      req.method ?? 'GET',
      path,
      parseBody(req.body),
      Object.fromEntries(
        Object.entries(req.query)
          .filter(([key]) => key !== 'path')
          .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
      ),
      (data, status = 200) => res.status(status).json(data),
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization
        : undefined,
      req,
    )
  } catch (err) {
    console.error('Remote API failed:', err instanceof Error ? err.message : err)
    res.status(500).json({ success: false, message: 'Remote API failed' })
  }
}

export async function handleRemoteFetchRequest(
  request: Request,
  pathParts: string[],
): Promise<Response> {
  try {
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams.entries())
    const body =
      request.method === 'GET' ? undefined : await request.json().catch(() => undefined)
    const response = await handleRemoteRequest(
      request.method,
      pathParts,
      body,
      query,
      (data, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
        }),
      request.headers.get('authorization') ?? undefined,
    )
    return response instanceof Response ? response : new Response(null, { status: 204 })
  } catch (err) {
    console.error('Remote API failed:', err instanceof Error ? err.message : err)
    return new Response(
      JSON.stringify({ success: false, message: 'Remote API failed' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      },
    )
  }
}
