import { z } from 'zod'

export const PAIRING_TTL_MS = 15 * 60 * 1000

export const remotePairRequestSchema = z.object({
  mode: z.enum(['upstream', 'relay']).optional(),
  sessionId: z.string().min(1),
  environmentId: z.string().min(1).optional(),
  organizationUuid: z.string().min(1),
  accessToken: z.string().min(1),
  upstreamBaseUrl: z.string().url().optional(),
  webOrigin: z.string().url().optional(),
  ttlSeconds: z.number().int().positive().max(60 * 60).optional(),
})

export const remoteEventsQuerySchema = z.object({
  after_id: z.string().min(1).optional(),
})

export const remoteMessageRequestSchema = z.object({
  content: z.union([
    z.string(),
    z.array(z.object({ type: z.string() }).catchall(z.unknown())),
  ]),
  uuid: z.string().min(1).optional(),
})

export const remotePermissionRequestSchema = z.object({
  requestId: z.string().min(1),
  behavior: z.enum(['allow', 'deny']),
  updatedInput: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
})

export const relayEventsRequestSchema = z.object({
  events: z.array(z.object({ type: z.string() }).catchall(z.unknown())),
  sessionStatus: z.string().optional(),
})

export const relayInboxQuerySchema = z.object({
  after_id: z.string().min(1).optional(),
})

export type RemotePairRequest = z.infer<typeof remotePairRequestSchema>

export type RelayCommand =
  | {
      id: string
      type: 'message'
      content: unknown
      uuid?: string
      createdAt: number
    }
  | {
      id: string
      type: 'permission'
      requestId: string
      behavior: 'allow' | 'deny'
      updatedInput?: Record<string, unknown>
      message?: string
      createdAt: number
    }
  | {
      id: string
      type: 'interrupt'
      createdAt: number
    }

export type RelayState = {
  events: RemoteEvent[]
  inbox: RelayCommand[]
  lastWorkerSeenAt?: number
  sessionStatus?: string
}

export type RemotePairingRecord = {
  pairingId: string
  mode?: 'upstream' | 'relay'
  sessionId: string
  environmentId?: string
  organizationUuid: string
  encryptedAccessToken: string
  upstreamBaseUrl: string
  createdAt: number
  expiresAt: number
  lastUsedAt: number
  relay?: RelayState
}

export type RemoteEvent = {
  id?: string
  uuid?: string
  type: string
  [key: string]: unknown
}
