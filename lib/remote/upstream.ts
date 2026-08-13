import { randomUUID } from 'crypto'
import { decryptSecret } from './crypto.js'
import type { RemoteEvent, RemotePairingRecord } from './types.js'

const CCR_BETA = 'ccr-byoc-2025-07-29'

type EventsResponse = {
  data?: unknown[]
  has_more?: boolean
  last_id?: string | null
}

function upstreamHeaders(record: RemotePairingRecord): Record<string, string> {
  return {
    authorization: `Bearer ${decryptSecret(record.encryptedAccessToken)}`,
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-beta': CCR_BETA,
    'x-organization-uuid': record.organizationUuid,
  }
}

async function upstreamFetch(
  record: RemotePairingRecord,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = record.upstreamBaseUrl.replace(/\/$/, '')
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...upstreamHeaders(record),
      ...(init?.headers ?? {}),
    },
  })
}

export async function pollRemoteEvents(
  record: RemotePairingRecord,
  afterId?: string,
): Promise<{
  events: RemoteEvent[]
  lastEventId: string | null
  sessionStatus?: string
}> {
  const events: RemoteEvent[] = []
  let cursor = afterId

  for (let page = 0; page < 20; page++) {
    const params = cursor ? `?after_id=${encodeURIComponent(cursor)}` : ''
    const response = await upstreamFetch(
      record,
      `/v1/sessions/${encodeURIComponent(record.sessionId)}/events${params}`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`)
    }
    const data = (await response.json()) as EventsResponse
    for (const event of data.data ?? []) {
      if (!event || typeof event !== 'object' || !('type' in event)) continue
      const typed = event as RemoteEvent
      if (typed.type === 'env_manager_log' || typed.type === 'control_response') {
        continue
      }
      events.push(typed)
    }
    if (!data.last_id) break
    cursor = data.last_id
    if (!data.has_more) break
  }

  let sessionStatus: string | undefined
  try {
    const response = await upstreamFetch(
      record,
      `/v1/sessions/${encodeURIComponent(record.sessionId)}`,
    )
    if (response.ok) {
      const session = (await response.json()) as { session_status?: string }
      sessionStatus = session.session_status
    }
  } catch {
    // Metadata is useful but not required for the event stream.
  }

  return { events, lastEventId: cursor ?? null, sessionStatus }
}

export async function sendRemoteMessage(
  record: RemotePairingRecord,
  content: unknown,
  uuid?: string,
): Promise<void> {
  const response = await upstreamFetch(
    record,
    `/v1/sessions/${encodeURIComponent(record.sessionId)}/events`,
    {
      method: 'POST',
      body: JSON.stringify({
        events: [
          {
            uuid: uuid ?? randomUUID(),
            session_id: record.sessionId,
            type: 'user',
            parent_tool_use_id: null,
            message: { role: 'user', content },
          },
        ],
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`)
  }
}

export async function sendRemotePermission(
  record: RemotePairingRecord,
  requestId: string,
  result:
    | { behavior: 'allow'; updatedInput?: Record<string, unknown> }
    | { behavior: 'deny'; message?: string },
): Promise<void> {
  const response = await upstreamFetch(
    record,
    `/v1/sessions/${encodeURIComponent(record.sessionId)}/events`,
    {
      method: 'POST',
      body: JSON.stringify({
        events: [
          {
            uuid: randomUUID(),
            session_id: record.sessionId,
            type: 'control_response',
            response: {
              subtype: 'success',
              request_id: requestId,
              response:
                result.behavior === 'allow'
                  ? {
                      behavior: 'allow',
                      updatedInput: result.updatedInput ?? {},
                    }
                  : {
                      behavior: 'deny',
                      message: result.message ?? 'Denied from memCode web',
                    },
            },
          },
        ],
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to answer permission request: ${response.status}`)
  }
}

export async function sendRemoteInterrupt(
  record: RemotePairingRecord,
): Promise<void> {
  const response = await upstreamFetch(
    record,
    `/v1/sessions/${encodeURIComponent(record.sessionId)}/events`,
    {
      method: 'POST',
      body: JSON.stringify({
        events: [
          {
            uuid: randomUUID(),
            session_id: record.sessionId,
            type: 'control_request',
            request_id: randomUUID(),
            request: { subtype: 'interrupt' },
          },
        ],
      }),
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to interrupt session: ${response.status}`)
  }
}
