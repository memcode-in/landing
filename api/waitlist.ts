import type { VercelRequest, VercelResponse } from '@vercel/node'
import { listWaitlist, submitWaitlist } from '../lib/waitlist.js'

function parseBody(body: unknown): unknown {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return body
    }
  }
  return body
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const result = await submitWaitlist(parseBody(req.body))
    return res.status(result.status).json({
      success: result.success,
      message: result.message,
      ...(result.errors ? { errors: result.errors } : {}),
    })
  }

  if (req.method === 'GET') {
    try {
      const entries = await listWaitlist()
      return res.status(200).json({ success: true, entries })
    } catch (err) {
      console.error('Failed to read waitlist:', err)
      return res.status(500).json({
        success: false,
        message: 'Failed to read waitlist',
      })
    }
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
