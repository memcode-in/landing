import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import {
  appendWaitlistEntry,
  readWaitlist,
  type SheetWaitlistEntry,
} from './googleSheets.js'

export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email is too long'),
  role: z.string().trim().max(50).optional(),
  company: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>

export interface WaitlistResult {
  success: boolean
  message: string
  status: number
  errors?: { path: string; message: string }[]
}

export async function listWaitlist(): Promise<SheetWaitlistEntry[]> {
  return readWaitlist()
}

export async function submitWaitlist(body: unknown): Promise<WaitlistResult> {
  const parsed = waitlistSchema.safeParse(body)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return {
      success: false,
      message: errors[0]?.message ?? 'Please check your details and try again.',
      status: 400,
      errors,
    }
  }

  const { name, email, role, company, message } = parsed.data
  const normalizedEmail = email.toLowerCase()

  let entries: Awaited<ReturnType<typeof readWaitlist>>
  try {
    entries = await readWaitlist()
  } catch (err) {
    console.error('Failed to read waitlist:', err)
    return {
      success: false,
      message: 'Unable to reach the waitlist right now. Please try again shortly.',
      status: 500,
    }
  }
  const duplicate = entries.some(
    (entry) => entry.email.toLowerCase() === normalizedEmail,
  )
  if (duplicate) {
    return {
      success: true,
      message: "You're already on the waitlist! We'll be in touch soon.",
      status: 200,
    }
  }

  const entry: SheetWaitlistEntry = {
    id: uuidv4(),
    name,
    email,
    createdAt: new Date().toISOString(),
    ...(role !== undefined ? { role } : {}),
    ...(company !== undefined ? { company } : {}),
    ...(message !== undefined ? { message } : {}),
  }

  try {
    await appendWaitlistEntry(entry)
  } catch (err) {
    console.error('Failed to save waitlist entry:', err)
    return {
      success: false,
      message: 'Failed to save waitlist entry',
      status: 500,
    }
  }

  return {
    success: true,
    message: "You're on the waitlist!",
    status: 201,
  }
}
