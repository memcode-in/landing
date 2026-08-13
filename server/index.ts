import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleRemoteFetchRequest } from '../lib/remote/handler.js'
import { listWaitlist, submitWaitlist } from '../lib/waitlist.js'

const PORT = Number(process.env.PORT) || 3456

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return origin
      }
      return null
    },
  }),
)

app.get('/health', (c) => c.json({ status: 'ok', storage: 'google-sheets' }))

app.post('/api/waitlist', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json(
      { success: false, message: 'Invalid JSON body', errors: [] },
      400,
    )
  }

  const result = await submitWaitlist(body)
  return c.json(
    {
      success: result.success,
      message: result.message,
      ...(result.errors ? { errors: result.errors } : {}),
    },
    result.status as 200 | 201 | 400 | 500,
  )
})

// Admin endpoint — add authentication before production use
app.get('/api/waitlist', async (c) => {
  try {
    const entries = await listWaitlist()
    return c.json({ success: true, entries })
  } catch (err) {
    console.error('Failed to read waitlist:', err)
    return c.json({ success: false, message: 'Failed to read waitlist' }, 500)
  }
})

app.all('/api/remote/*', async (c) => {
  const path = c.req.path.replace(/^\/api\/remote\/?/, '')
  const pathParts = path.split('/').filter(Boolean)
  return handleRemoteFetchRequest(c.req.raw, pathParts)
})

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Waitlist server running on http://localhost:${info.port}`)
    console.log('Storage: Google Sheets')
  },
)
