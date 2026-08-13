import { google } from 'googleapis'
import type { RemotePairingRecord } from './types.js'

const GOOGLE_REMOTE_PAIRINGS_SHEET_NAME =
  process.env.GOOGLE_REMOTE_PAIRINGS_SHEET_NAME ?? 'RemotePairings'
const GOOGLE_HEADERS = [
  'Pairing ID',
  'Record JSON',
  'Expires At',
  'Last Used At',
  'Updated At',
]

export interface RemotePairingStore {
  set(record: RemotePairingRecord): Promise<void>
  get(pairingId: string): Promise<RemotePairingRecord | null>
  touch(pairingId: string, lastUsedAt: number): Promise<void>
  delete(pairingId: string): Promise<void>
  readonly persistent: boolean
}

function hasGoogleSheetsConfig(): boolean {
  return Boolean(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
}

function getGoogleSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id) throw new Error('GOOGLE_SHEET_ID is not configured')
  return id
}

function getGoogleSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured')
  }

  const credentials = JSON.parse(raw) as {
    client_email: string
    private_key: string
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

class MemoryRemotePairingStore implements RemotePairingStore {
  readonly persistent = false

  private readonly records = new Map<string, RemotePairingRecord>()

  async set(record: RemotePairingRecord): Promise<void> {
    this.records.set(record.pairingId, record)
  }

  async get(pairingId: string): Promise<RemotePairingRecord | null> {
    const record = this.records.get(pairingId)
    if (!record) return null
    if (record.expiresAt <= Date.now()) {
      this.records.delete(pairingId)
      return null
    }
    return record
  }

  async touch(pairingId: string, lastUsedAt: number): Promise<void> {
    const record = this.records.get(pairingId)
    if (!record) return
    this.records.set(pairingId, { ...record, lastUsedAt })
  }

  async delete(pairingId: string): Promise<void> {
    this.records.delete(pairingId)
  }
}

class UpstashRemotePairingStore implements RemotePairingStore {
  readonly persistent = true

  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private key(pairingId: string): string {
    return `memcode:remote-pairing:${pairingId}`
  }

  private async command<T>(body: unknown[]): Promise<T> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`Remote pairing store failed: ${response.status}`)
    }
    const data = (await response.json()) as { result: T }
    return data.result
  }

  async set(record: RemotePairingRecord): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.ceil((record.expiresAt - Date.now()) / 1000),
    )
    await this.command(['SET', this.key(record.pairingId), JSON.stringify(record), 'EX', ttlSeconds])
  }

  async get(pairingId: string): Promise<RemotePairingRecord | null> {
    const raw = await this.command<string | null>(['GET', this.key(pairingId)])
    if (!raw) return null
    const record = JSON.parse(raw) as RemotePairingRecord
    if (record.expiresAt <= Date.now()) {
      await this.delete(pairingId)
      return null
    }
    return record
  }

  async touch(pairingId: string, lastUsedAt: number): Promise<void> {
    const record = await this.get(pairingId)
    if (!record) return
    await this.set({ ...record, lastUsedAt })
  }

  async delete(pairingId: string): Promise<void> {
    await this.command(['DEL', this.key(pairingId)])
  }
}

class GoogleSheetsRemotePairingStore implements RemotePairingStore {
  readonly persistent = true

  private sheetId: number | undefined

  private async ensureSheet(): Promise<void> {
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = getGoogleSheetId()
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const existing = spreadsheet.data.sheets?.find(
      sheet => sheet.properties?.title === GOOGLE_REMOTE_PAIRINGS_SHEET_NAME,
    )

    if (existing?.properties?.sheetId != null) {
      this.sheetId = existing.properties.sheetId
    } else {
      const created = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: GOOGLE_REMOTE_PAIRINGS_SHEET_NAME },
              },
            },
          ],
        },
      })
      this.sheetId =
        created.data.replies?.[0]?.addSheet?.properties?.sheetId ?? undefined
    }

    const headerRange = `${GOOGLE_REMOTE_PAIRINGS_SHEET_NAME}!A1:E1`
    const header = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    })
    if (!header.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: headerRange,
        valueInputOption: 'RAW',
        requestBody: { values: [GOOGLE_HEADERS] },
      })
    }
  }

  private async readRows(): Promise<string[][]> {
    await this.ensureSheet()
    const sheets = getGoogleSheetsClient()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getGoogleSheetId(),
      range: `${GOOGLE_REMOTE_PAIRINGS_SHEET_NAME}!A2:E`,
    })
    return (response.data.values ?? []) as string[][]
  }

  private rowForRecord(record: RemotePairingRecord): string[] {
    return [
      record.pairingId,
      JSON.stringify(record),
      new Date(record.expiresAt).toISOString(),
      new Date(record.lastUsedAt).toISOString(),
      new Date().toISOString(),
    ]
  }

  async set(record: RemotePairingRecord): Promise<void> {
    const rows = await this.readRows()
    const rowIndex = rows.findIndex(row => row[0] === record.pairingId)
    const sheets = getGoogleSheetsClient()
    const spreadsheetId = getGoogleSheetId()
    if (rowIndex >= 0) {
      const rowNumber = rowIndex + 2
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${GOOGLE_REMOTE_PAIRINGS_SHEET_NAME}!A${rowNumber}:E${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [this.rowForRecord(record)] },
      })
      return
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${GOOGLE_REMOTE_PAIRINGS_SHEET_NAME}!A:E`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [this.rowForRecord(record)] },
    })
  }

  async get(pairingId: string): Promise<RemotePairingRecord | null> {
    const rows = await this.readRows()
    const row = rows.find(candidate => candidate[0] === pairingId)
    if (!row?.[1]) return null
    const record = JSON.parse(row[1]) as RemotePairingRecord
    if (record.expiresAt <= Date.now()) return null
    return record
  }

  async touch(_pairingId: string, _lastUsedAt: number): Promise<void> {
    // Avoid one write per browser poll. The record is still updated whenever
    // relay events or commands change.
  }

  async delete(pairingId: string): Promise<void> {
    const rows = await this.readRows()
    const rowIndex = rows.findIndex(row => row[0] === pairingId)
    if (rowIndex < 0 || this.sheetId === undefined) return
    await getGoogleSheetsClient().spreadsheets.batchUpdate({
      spreadsheetId: getGoogleSheetId(),
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: this.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    })
  }
}

let store: RemotePairingStore | undefined

export function getRemotePairingStore(): RemotePairingStore {
  if (store) return store
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  store =
    upstashUrl && upstashToken
      ? new UpstashRemotePairingStore(upstashUrl, upstashToken)
      : hasGoogleSheetsConfig()
        ? new GoogleSheetsRemotePairingStore()
        : new MemoryRemotePairingStore()
  return store
}

export function hasPersistentRemotePairingStore(): boolean {
  return getRemotePairingStore().persistent
}
