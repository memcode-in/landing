import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRemoteVercelRequest } from '../../lib/remote/handler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleRemoteVercelRequest(req, res)
}
