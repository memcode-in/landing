import { google } from 'googleapis'

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? 'Waitlist'
const HEADERS = ['ID', 'Name', 'Email', 'Role', 'Company', 'Message', 'Created At']

export interface SheetWaitlistEntry {
  id: string
  name: string
  email: string
  role?: string
  company?: string
  message?: string
  createdAt: string
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id) {
    throw new Error('GOOGLE_SHEET_ID is not configured')
  }
  return id
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured')
  }

  const credentials = JSON.parse(raw) as {
    client_email: string
    private_key: string
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

function rowToEntry(row: string[]): SheetWaitlistEntry | null {
  const [id, name, email, role, company, message, createdAt] = row
  if (!email?.trim()) return null

  return {
    id: id ?? '',
    name: name ?? '',
    email: email ?? '',
    createdAt: createdAt ?? '',
    ...(role?.trim() ? { role: role.trim() } : {}),
    ...(company?.trim() ? { company: company.trim() } : {}),
    ...(message?.trim() ? { message: message.trim() } : {}),
  }
}

function entryToRow(entry: SheetWaitlistEntry): string[] {
  return [
    entry.id,
    entry.name,
    entry.email,
    entry.role ?? '',
    entry.company ?? '',
    entry.message ?? '',
    entry.createdAt,
  ]
}

export async function ensureHeaders(): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:G1`,
  })

  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:G1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADERS] },
    })
  }
}

export async function readWaitlist(): Promise<SheetWaitlistEntry[]> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()

  await ensureHeaders()

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A2:G`,
  })

  const rows = response.data.values ?? []
  return rows
    .map((row) => rowToEntry(row as string[]))
    .filter((entry): entry is SheetWaitlistEntry => entry !== null)
}

export async function appendWaitlistEntry(
  entry: SheetWaitlistEntry,
): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = getSheetId()

  await ensureHeaders()

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [entryToRow(entry)],
    },
  })
}
